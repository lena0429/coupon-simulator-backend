import { describe, it, expect } from 'vitest';
import { applyCouponSkill } from '../applyCoupon';
import type { CartItem } from '../../types';

const singleItem = (price = 100, qty = 1): CartItem[] => [
  { id: '1', name: 'Item A', price, qty },
];

describe('applyCouponSkill', () => {
  describe('handler', () => {
    describe('valid coupon: SAVE10', () => {
      it('applies a 10% discount', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'SAVE10' });
        expect(result.discount).toBe(10);
        expect(result.total).toBe(90);
      });

      it('sets appliedCoupon to the normalized code', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'SAVE10' });
        expect(result.appliedCoupon).toBe('SAVE10');
      });

      it('returns correct subtotal', () => {
        const result = applyCouponSkill.handler({ items: singleItem(50, 2), couponCode: 'SAVE10' });
        expect(result.subtotal).toBe(100);
        expect(result.discount).toBe(10);
        expect(result.total).toBe(90);
      });

      it('returns no warnings for a valid coupon', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'SAVE10' });
        expect(result.warnings).toBeUndefined();
      });

      it('accepts lowercase coupon code', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'save10' });
        expect(result.discount).toBe(10);
        expect(result.appliedCoupon).toBe('SAVE10');
      });

      it('accepts whitespace-padded coupon code', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: '  SAVE10  ' });
        expect(result.discount).toBe(10);
        expect(result.appliedCoupon).toBe('SAVE10');
      });
    });

    describe('invalid coupon', () => {
      it('returns discount of 0 for an unknown coupon', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'BOGUS' });
        expect(result.discount).toBe(0);
        expect(result.total).toBe(result.subtotal);
      });

      it('does not set appliedCoupon for an unknown coupon', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'BOGUS' });
        expect(result.appliedCoupon).toBeUndefined();
      });

      it('includes a COUPON_UNKNOWN warning for an unknown coupon', () => {
        const result = applyCouponSkill.handler({ items: singleItem(100), couponCode: 'BOGUS' });
        expect(result.warnings).toEqual([
          { code: 'COUPON_UNKNOWN', message: 'Coupon code is not recognized' },
        ]);
      });
    });

    describe('edge cases', () => {
      it('zero-price cart yields no discount even with a valid coupon', () => {
        const result = applyCouponSkill.handler({
          items: [{ id: '1', name: 'Free', price: 0, qty: 1 }],
          couponCode: 'SAVE10',
        });
        expect(result.subtotal).toBe(0);
        expect(result.discount).toBe(0);
        expect(result.total).toBe(0);
        expect(result.appliedCoupon).toBeUndefined();
      });

      it('rounds discount correctly on non-round prices', () => {
        // 10% of 33.33 = 3.333 → rounds to 3.33
        const result = applyCouponSkill.handler({ items: singleItem(33.33), couponCode: 'SAVE10' });
        expect(result.discount).toBe(3.33);
        expect(result.total).toBe(30);
      });
    });
  });

  describe('inputSchema', () => {
    it('accepts valid items and couponCode', () => {
      const result = applyCouponSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 10, qty: 1 }],
        couponCode: 'SAVE10',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing items', () => {
      const result = applyCouponSkill.inputSchema.safeParse({ couponCode: 'SAVE10' });
      expect(result.success).toBe(false);
    });

    it('rejects missing couponCode', () => {
      const result = applyCouponSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 10, qty: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty couponCode', () => {
      const result = applyCouponSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 10, qty: 1 }],
        couponCode: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
