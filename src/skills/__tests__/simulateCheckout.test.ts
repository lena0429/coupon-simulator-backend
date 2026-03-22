import { describe, it, expect } from 'vitest';
import { simulateCheckoutSkill } from '../simulateCheckout';
import type { CartItem } from '../../types';

const singleItem = (price = 100, qty = 1): CartItem[] => [
  { id: '1', name: 'Item A', price, qty },
];

describe('simulateCheckoutSkill', () => {
  describe('handler', () => {
    describe('no coupon', () => {
      it('returns subtotal equal to total with no discount', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(50) });
        expect(result.subtotal).toBe(50);
        expect(result.discount).toBe(0);
        expect(result.total).toBe(50);
      });

      it('returns no appliedCoupon when couponCode is omitted', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(50) });
        expect(result.appliedCoupon).toBeUndefined();
      });

      it('returns no warnings when couponCode is omitted', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(50) });
        expect(result.warnings).toBeUndefined();
      });

      it('handles an empty cart', () => {
        const result = simulateCheckoutSkill.handler({ items: [] });
        expect(result).toEqual({
          subtotal: 0,
          discount: 0,
          total: 0,
          appliedCoupon: undefined,
        });
      });
    });

    describe('with a valid coupon', () => {
      it('applies SAVE10 discount correctly', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(100), couponCode: 'SAVE10' });
        expect(result.subtotal).toBe(100);
        expect(result.discount).toBe(10);
        expect(result.total).toBe(90);
        expect(result.appliedCoupon).toBe('SAVE10');
        expect(result.warnings).toBeUndefined();
      });

      it('accepts lowercase coupon code', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(100), couponCode: 'save10' });
        expect(result.discount).toBe(10);
        expect(result.appliedCoupon).toBe('SAVE10');
      });

      it('accepts whitespace-padded coupon code', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(100), couponCode: '  SAVE10  ' });
        expect(result.discount).toBe(10);
        expect(result.appliedCoupon).toBe('SAVE10');
      });
    });

    describe('with an invalid coupon', () => {
      it('returns discount of 0', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(100), couponCode: 'NOPE' });
        expect(result.discount).toBe(0);
        expect(result.total).toBe(result.subtotal);
      });

      it('includes a COUPON_UNKNOWN warning', () => {
        const result = simulateCheckoutSkill.handler({ items: singleItem(100), couponCode: 'NOPE' });
        expect(result.warnings).toEqual([
          { code: 'COUPON_UNKNOWN', message: 'Coupon code is not recognized' },
        ]);
      });
    });

    describe('multi-item cart', () => {
      it('sums line items and applies coupon correctly', () => {
        const items: CartItem[] = [
          { id: '1', name: 'A', price: 40, qty: 2 },
          { id: '2', name: 'B', price: 20, qty: 1 },
        ];
        // subtotal = 80 + 20 = 100, discount = 10
        const result = simulateCheckoutSkill.handler({ items, couponCode: 'SAVE10' });
        expect(result.subtotal).toBe(100);
        expect(result.discount).toBe(10);
        expect(result.total).toBe(90);
      });
    });
  });

  describe('inputSchema', () => {
    it('accepts items without couponCode', () => {
      const result = simulateCheckoutSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 10, qty: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it('accepts items with couponCode', () => {
      const result = simulateCheckoutSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 10, qty: 1 }],
        couponCode: 'SAVE10',
      });
      expect(result.success).toBe(true);
    });

    it('accepts an empty items array', () => {
      const result = simulateCheckoutSkill.inputSchema.safeParse({ items: [] });
      expect(result.success).toBe(true);
    });

    it('rejects missing items', () => {
      const result = simulateCheckoutSkill.inputSchema.safeParse({ couponCode: 'SAVE10' });
      expect(result.success).toBe(false);
    });
  });
});
