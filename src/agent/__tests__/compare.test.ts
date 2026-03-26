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

const compareRequest = (overrides: Partial<AgentRequest> = {}): AgentRequest => ({
  userRequest: 'Compare coupons for my cart',
  cartItems: [item('A', 100)],
  availableCoupons: ['SAVE10'],
  ...overrides,
});

const run = (request: AgentRequest) => runAgent(request, fakeLLMPlannerModel);

// ---------------------------------------------------------------------------
// compare field shape
// ---------------------------------------------------------------------------

describe('compare_coupons: compare field', () => {
  it('response includes a compare field', async () => {
    const response = await run(compareRequest());
    expect(response.compare).toBeDefined();
  });

  it('compare.bestCouponCode matches the chosen best coupon', async () => {
    const response = await run(compareRequest({ availableCoupons: ['SAVE10'] }));
    expect(response.compare?.bestCouponCode).toBe('SAVE10');
    expect(response.compare?.bestCouponCode).toBe(response.chosenCoupon);
  });

  it('compare.bestCouponCode is null when no valid coupons', async () => {
    const response = await run(compareRequest({ availableCoupons: ['BOGUS'] }));
    expect(response.compare?.bestCouponCode).toBeNull();
  });

  it('compare.comparisons contains one entry per coupon attempted', async () => {
    const response = await run(
      compareRequest({ availableCoupons: ['BOGUS', 'SAVE10'] }),
    );
    expect(response.compare?.comparisons).toHaveLength(2);
  });

  it('compare.comparisons preserves coupon order', async () => {
    const response = await run(
      compareRequest({ availableCoupons: ['BOGUS', 'SAVE10'] }),
    );
    const codes = response.compare?.comparisons.map((c) => c.couponCode);
    expect(codes).toEqual(['BOGUS', 'SAVE10']);
  });
});

// ---------------------------------------------------------------------------
// compare.comparisons entry correctness
// ---------------------------------------------------------------------------

describe('compare_coupons: comparison entries', () => {
  it('invalid coupon entry has isValid: false and no discount or finalPrice', async () => {
    const response = await run(compareRequest({ availableCoupons: ['BOGUS'] }));
    const entry = response.compare?.comparisons[0];
    expect(entry?.isValid).toBe(false);
    expect(entry?.discount).toBeUndefined();
    expect(entry?.finalPrice).toBeUndefined();
  });

  it('valid coupon entry has isValid: true with discount and finalPrice', async () => {
    const response = await run(
      compareRequest({ cartItems: [item('A', 100)], availableCoupons: ['SAVE10'] }),
    );
    const entry = response.compare?.comparisons.find((c) => c.couponCode === 'SAVE10');
    expect(entry?.isValid).toBe(true);
    expect(entry?.discount).toBe(10);
    expect(entry?.finalPrice).toBe(90);
  });

  it('mixed list produces correct valid and invalid entries', async () => {
    const response = await run(
      compareRequest({ availableCoupons: ['BOGUS', 'SAVE10'] }),
    );
    const bogus = response.compare?.comparisons.find((c) => c.couponCode === 'BOGUS');
    const save10 = response.compare?.comparisons.find((c) => c.couponCode === 'SAVE10');

    expect(bogus?.isValid).toBe(false);
    expect(save10?.isValid).toBe(true);
    expect(save10?.finalPrice).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// Full pipeline coherence
// ---------------------------------------------------------------------------

describe('compare_coupons: full pipeline coherence', () => {
  it('resolves intent correctly from a natural compare request', async () => {
    const response = await run(compareRequest({ userRequest: 'Compare available coupons' }));
    expect(response.intent).toBe('compare_coupons');
  });

  it('full pipeline: request -> intent -> execution -> structured response', async () => {
    // Validates that all layers (planner, executor, response shaping) work end-to-end
    const response = await run({
      userRequest: 'Compare available coupons',
      cartItems: [item('A', 100)],
      availableCoupons: ['SAVE10', 'BOGUS'],
    });

    expect(response.intent).toBe('compare_coupons');
    expect(response.chosenCoupon).toBe('SAVE10');
    expect(response.finalResult).toMatchObject({ subtotal: 100, discount: 10, total: 90 });
    expect(response.compare?.bestCouponCode).toBe('SAVE10');
    expect(response.compare?.comparisons).toHaveLength(2);
  });

  it('chosenCoupon and finalResult are populated alongside compare for a valid coupon', async () => {
    const response = await run(compareRequest({ availableCoupons: ['SAVE10'] }));
    expect(response.chosenCoupon).toBe('SAVE10');
    expect(response.finalResult).not.toBeNull();
    expect(response.finalResult?.total).toBe(90);
  });

  it('chosenCoupon and finalResult are null when no valid coupons', async () => {
    const response = await run(compareRequest({ availableCoupons: ['BOGUS'] }));
    expect(response.chosenCoupon).toBeNull();
    expect(response.finalResult).toBeNull();
  });

  it('compare field is derived from execution results, not a passthrough of internal state', async () => {
    const response = await run(compareRequest({ availableCoupons: ['SAVE10', 'BOGUS'] }));
    // compare.comparisons must only contain public-contract fields
    const entry = response.compare?.comparisons.find((c) => c.couponCode === 'SAVE10');
    expect(Object.keys(entry!)).toEqual(
      expect.arrayContaining(['couponCode', 'isValid', 'discount', 'finalPrice']),
    );
    expect(Object.keys(entry!).length).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Non-compare intents are unaffected
// ---------------------------------------------------------------------------

describe('non-compare intents: no compare field', () => {
  it('apply_best_coupon_and_simulate_checkout does not include compare', async () => {
    const response = await run({
      userRequest: 'Apply the best coupon and simulate checkout',
      cartItems: [item('A', 100)],
      availableCoupons: ['SAVE10'],
    });
    expect(response.compare).toBeUndefined();
  });

  it('simulate_checkout_without_coupon does not include compare', async () => {
    const response = await run({
      userRequest: 'Simulate checkout without coupon',
      cartItems: [item('A', 100)],
      availableCoupons: [],
    });
    expect(response.compare).toBeUndefined();
  });

  it('explain_best_coupon does not include compare', async () => {
    const response = await run({
      userRequest: 'Explain why this coupon is the best discount',
      cartItems: [item('A', 100)],
      availableCoupons: ['SAVE10'],
    });
    expect(response.compare).toBeUndefined();
  });
});
