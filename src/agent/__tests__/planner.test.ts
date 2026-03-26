import { describe, it, expect } from 'vitest';
import { createPlan } from '../planner';
import { fakeLLMPlannerModel } from '../fakeLLMPlannerModel';
import type { AgentRequest } from '../types';
import type { CartItem } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const item = (id: string, price: number): CartItem => ({ id, name: `Item ${id}`, price, qty: 1 });

const request = (userRequest: string): AgentRequest => ({
  userRequest,
  cartItems: [item('A', 100)],
  availableCoupons: ['SAVE10'],
});

const plan = (userRequest: string) => createPlan(request(userRequest), fakeLLMPlannerModel);

// ---------------------------------------------------------------------------
// compare_coupons intent recognition
// ---------------------------------------------------------------------------

describe('compare_coupons: intent recognition', () => {
  it('resolves "compare coupons" phrasing', async () => {
    const result = await plan('Compare coupons for my cart');
    expect(result.intent).toBe('compare_coupons');
  });

  it('resolves "comparison" phrasing', async () => {
    const result = await plan('Show me a coupon comparison');
    expect(result.intent).toBe('compare_coupons');
  });

  it('resolves "compare discounts" phrasing', async () => {
    const result = await plan('Compare discounts available for my order');
    expect(result.intent).toBe('compare_coupons');
  });

  it('resolves "comparison of discounts" phrasing', async () => {
    const result = await plan('Give me a comparison of discounts');
    expect(result.intent).toBe('compare_coupons');
  });
});

// ---------------------------------------------------------------------------
// compare_coupons plan steps
// ---------------------------------------------------------------------------

describe('compare_coupons: plan steps', () => {
  it('maps to predefined steps only — no model-generated steps', async () => {
    const result = await plan('Compare coupons for my cart');
    expect(result.steps.length).toBeGreaterThan(0);
    const skills = result.steps.map((s) => s.skill);
    // All skills must be known registered skills — no arbitrary model output
    for (const skill of skills) {
      expect(['get_cart', 'validate_coupon', 'apply_coupon', 'simulate_checkout']).toContain(skill);
    }
  });

  it('includes the full coupon evaluation pipeline', async () => {
    const result = await plan('Compare coupons for my cart');
    const skills = result.steps.map((s) => s.skill);
    expect(skills).toContain('get_cart');
    expect(skills).toContain('validate_coupon');
    expect(skills).toContain('apply_coupon');
    expect(skills).toContain('simulate_checkout');
  });
});

// ---------------------------------------------------------------------------
// Existing intents unaffected
// ---------------------------------------------------------------------------

describe('existing intents still resolve correctly', () => {
  it('apply_best_coupon_and_simulate_checkout', async () => {
    const result = await plan('Apply the best coupon and simulate checkout');
    expect(result.intent).toBe('apply_best_coupon_and_simulate_checkout');
  });

  it('simulate_checkout_without_coupon', async () => {
    const result = await plan('Simulate checkout without coupon');
    expect(result.intent).toBe('simulate_checkout_without_coupon');
  });

  it('explain_best_coupon', async () => {
    const result = await plan('Explain why this coupon is the best discount');
    expect(result.intent).toBe('explain_best_coupon');
  });
});
