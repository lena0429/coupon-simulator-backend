import { describe, it, expect } from 'vitest';
import { runAgent } from '../index';
import { fakeLLMPlannerModel } from '../fakeLLMPlannerModel';
import type { AgentRequest } from '../types';
import type { CartItem } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const item = (id: string, price: number, qty = 1): CartItem => ({
  id,
  name: `Item ${id}`,
  price,
  qty,
});

const baseRequest = (overrides: Partial<AgentRequest> = {}): AgentRequest => ({
  userRequest: 'Apply the best coupon and simulate checkout',
  cartItems: [item('A', 100)],
  availableCoupons: ['SAVE10'],
  ...overrides,
});

// All tests inject fakeLLMPlannerModel explicitly to avoid live network calls
const run = (request: AgentRequest) => runAgent(request, fakeLLMPlannerModel);

// ---------------------------------------------------------------------------
// Case 1 — Best coupon is selected
// ---------------------------------------------------------------------------

describe('Case 1: best coupon is selected', () => {
  it('selects the valid coupon from a mixed list', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['BOGUS', 'SAVE10'] }),
    );

    expect(response.chosenCoupon).toBe('SAVE10');
  });

  it('finalResult reflects the discount applied by SAVE10 (10% off)', async () => {
    // cart: $100 → 10% off → discount $10 → total $90
    const response = await run(
      baseRequest({ cartItems: [item('A', 100)], availableCoupons: ['SAVE10'] }),
    );

    expect(response.finalResult).toMatchObject({
      subtotal: 100,
      discount: 10,
      total: 90,
      appliedCoupon: 'SAVE10',
    });
  });

  it('correctly computes totals for a multi-item cart', async () => {
    // 2 × $40 + 1 × $20 = subtotal $100 → SAVE10 → total $90
    const response = await run(
      baseRequest({
        cartItems: [item('A', 40, 2), item('B', 20, 1)],
        availableCoupons: ['SAVE10'],
      }),
    );

    expect(response.finalResult?.subtotal).toBe(100);
    expect(response.finalResult?.discount).toBe(10);
    expect(response.finalResult?.total).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// Case 2 — Invalid coupons are skipped
// ---------------------------------------------------------------------------

describe('Case 2: invalid coupons are skipped', () => {
  it('records invalid coupons with status skipped in trace', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['FAKE1', 'SAVE10', 'FAKE2'] }),
    );

    const validationSteps = response.trace.steps.filter(
      (s) => s.skill === 'validate_coupon',
    );

    const skipped = validationSteps.filter((s) => s.status === 'skipped');
    expect(skipped).toHaveLength(2);

    const skippedInputs = skipped.map((s) => (s.input as { couponCode: string }).couponCode);
    expect(skippedInputs).toContain('FAKE1');
    expect(skippedInputs).toContain('FAKE2');
  });

  it('does not choose an invalid coupon', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['FAKE1', 'SAVE10'] }),
    );

    expect(response.chosenCoupon).toBe('SAVE10');
    expect(response.chosenCoupon).not.toBe('FAKE1');
  });

  it('does not call apply_coupon or simulate_checkout for skipped coupons', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['FAKE1', 'FAKE2'] }),
    );

    const applySteps = response.trace.steps.filter((s) => s.skill === 'apply_coupon');
    const checkoutSteps = response.trace.steps.filter((s) => s.skill === 'simulate_checkout');

    expect(applySteps).toHaveLength(0);
    expect(checkoutSteps).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Case 3 — No valid coupon
// ---------------------------------------------------------------------------

describe('Case 3: no valid coupon', () => {
  it('returns chosenCoupon = null', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['NOPE', 'INVALID'] }),
    );

    expect(response.chosenCoupon).toBeNull();
  });

  it('returns finalResult = null', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['NOPE', 'INVALID'] }),
    );

    expect(response.finalResult).toBeNull();
  });

  it('still records validation attempts in trace', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['NOPE', 'INVALID'] }),
    );

    const validationSteps = response.trace.steps.filter(
      (s) => s.skill === 'validate_coupon',
    );

    expect(validationSteps).toHaveLength(2);
    expect(validationSteps.every((s) => s.status === 'skipped')).toBe(true);
  });

  it('returns the correct intent even when no coupon applies', async () => {
    const response = await run(
      baseRequest({ availableCoupons: [] }),
    );

    expect(response.intent).toBe('apply_best_coupon_and_simulate_checkout');
  });
});

// ---------------------------------------------------------------------------
// Case 4 — Trace correctness
// ---------------------------------------------------------------------------

describe('Case 4: trace correctness', () => {
  it('trace starts with a successful get_cart step', async () => {
    const response = await run(baseRequest());

    const first = response.trace.steps[0];
    expect(first.skill).toBe('get_cart');
    expect(first.status).toBe('success');
  });

  it('trace includes validate_coupon, apply_coupon, and simulate_checkout for a valid coupon', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['SAVE10'] }),
    );

    const skills = response.trace.steps.map((s) => s.skill);
    expect(skills).toContain('validate_coupon');
    expect(skills).toContain('apply_coupon');
    expect(skills).toContain('simulate_checkout');
  });

  it('all completed steps have status success', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['SAVE10'] }),
    );

    const completed = response.trace.steps.filter((s) => s.skill !== 'validate_coupon');
    expect(completed.every((s) => s.status === 'success')).toBe(true);
  });

  it('trace step outputs are non-null for successful steps', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['SAVE10'] }),
    );

    const successSteps = response.trace.steps.filter((s) => s.status === 'success');
    expect(successSteps.every((s) => s.output !== null)).toBe(true);
  });

  it('trace step order is: get_cart → validate_coupon → apply_coupon → simulate_checkout', async () => {
    const response = await run(
      baseRequest({ availableCoupons: ['SAVE10'] }),
    );

    const skills = response.trace.steps.map((s) => s.skill);
    expect(skills).toEqual(['get_cart', 'validate_coupon', 'apply_coupon', 'simulate_checkout']);
  });
});

// ---------------------------------------------------------------------------
// Case 5 — Unsupported user request
// ---------------------------------------------------------------------------

describe('Case 5: unsupported user request', () => {
  it('throws for an unrecognized request string', async () => {
    await expect(
      run(baseRequest({ userRequest: 'do something random' })),
    ).rejects.toThrow('Unsupported request');
  });
});
