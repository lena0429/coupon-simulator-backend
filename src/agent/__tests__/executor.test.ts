import { describe, it, expect } from 'vitest';
import { executeBestCouponAndCheckout } from '../executor';
import type { AgentRequest } from '../types';
import type { CartItem } from '../../types';
import type { StepTrace } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const item = (id: string, price: number, qty = 1): CartItem => ({
  id,
  name: `Item ${id}`,
  price,
  qty,
});

const makeRequest = (
  coupons: string[],
  cartItems: CartItem[] = [item('A', 100)],
): AgentRequest => ({
  userRequest: 'test',
  cartItems,
  availableCoupons: coupons,
});

// ---------------------------------------------------------------------------
// Per-coupon result collection
// ---------------------------------------------------------------------------

describe('executeBestCouponAndCheckout: per-coupon result collection', () => {
  it('collects a result entry for each coupon attempted', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(
      makeRequest(['SAVE10', 'BOGUS']),
      steps,
    );

    expect(couponResults).toHaveLength(2);
    expect(couponResults.map((r) => r.couponCode)).toEqual(['SAVE10', 'BOGUS']);
  });

  it('marks invalid coupons as isValid: false with no discount or finalPrice', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(
      makeRequest(['BOGUS', 'FAKE']),
      steps,
    );

    expect(couponResults).toHaveLength(2);
    expect(couponResults.every((r) => r.isValid === false)).toBe(true);
    expect(couponResults.every((r) => r.discount === undefined)).toBe(true);
    expect(couponResults.every((r) => r.finalPrice === undefined)).toBe(true);
  });

  it('marks valid coupons as isValid: true with discount and finalPrice populated', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(
      makeRequest(['SAVE10']),
      steps,
    );

    const result = couponResults.find((r) => r.couponCode === 'SAVE10');
    expect(result?.isValid).toBe(true);
    expect(result?.discount).toBe(10);
    expect(result?.finalPrice).toBe(90);
  });

  it('collects results for both valid and invalid coupons in a mixed list', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(
      makeRequest(['BOGUS', 'SAVE10', 'FAKE']),
      steps,
    );

    expect(couponResults).toHaveLength(3);

    const bogus = couponResults.find((r) => r.couponCode === 'BOGUS');
    expect(bogus?.isValid).toBe(false);

    const save10 = couponResults.find((r) => r.couponCode === 'SAVE10');
    expect(save10?.isValid).toBe(true);
    expect(save10?.finalPrice).toBe(90);

    const fake = couponResults.find((r) => r.couponCode === 'FAKE');
    expect(fake?.isValid).toBe(false);
  });

  it('collects a result entry for a valid coupon followed by an invalid one', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(
      makeRequest(['SAVE10', 'BOGUS']),
      steps,
    );

    expect(couponResults).toHaveLength(2);

    const save10 = couponResults.find((r) => r.couponCode === 'SAVE10');
    expect(save10?.isValid).toBe(true);
    expect(save10?.finalPrice).toBe(90);

    const bogus = couponResults.find((r) => r.couponCode === 'BOGUS');
    expect(bogus?.isValid).toBe(false);
  });

  it('returns an empty couponResults array when no coupons are provided', () => {
    const steps: StepTrace[] = [];
    const { couponResults } = executeBestCouponAndCheckout(makeRequest([]), steps);

    expect(couponResults).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Best coupon selection is unaffected
// ---------------------------------------------------------------------------

describe('executeBestCouponAndCheckout: best coupon selection still correct', () => {
  it('chosenCoupon is the valid coupon when mixed with invalid ones', () => {
    const steps: StepTrace[] = [];
    const { chosenCoupon } = executeBestCouponAndCheckout(
      makeRequest(['BOGUS', 'SAVE10']),
      steps,
    );

    expect(chosenCoupon).toBe('SAVE10');
  });

  it('chosenCoupon is null when all coupons are invalid', () => {
    const steps: StepTrace[] = [];
    const { chosenCoupon, finalResult } = executeBestCouponAndCheckout(
      makeRequest(['BOGUS']),
      steps,
    );

    expect(chosenCoupon).toBeNull();
    expect(finalResult).toBeNull();
  });
});
