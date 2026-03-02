import { describe, it, expect } from 'vitest';
import { simulatePricing } from '../index';
import { CartItem } from '../../../types';

describe('simulatePricing', () => {
  describe('Basic calculations', () => {
    it('should handle empty items array', () => {
      const result = simulatePricing([]);
      expect(result).toEqual({
        subtotal: 0,
        discount: 0,
        total: 0,
        appliedCoupon: undefined,
      });
    });

    it('should calculate subtotal for single item with quantity', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 10.99, qty: 1 },
      ];
      const result = simulatePricing(items);
      expect(result.subtotal).toBe(10.99);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(10.99);
      expect(result.appliedCoupon).toBeUndefined();
    });

    it('should calculate subtotal with quantity > 1', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 10, qty: 3 },
      ];
      const result = simulatePricing(items);
      expect(result.subtotal).toBe(30);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(30);
    });

    it('should calculate subtotal for multiple items with quantities', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 10.99, qty: 2 },
        { id: '2', name: 'Item B', price: 5.50, qty: 1 },
        { id: '3', name: 'Item C', price: 3.25, qty: 3 },
      ];
      const result = simulatePricing(items);
      // (10.99 * 2) + (5.50 * 1) + (3.25 * 3) = 21.98 + 5.50 + 9.75 = 37.23
      expect(result.subtotal).toBe(37.23);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(37.23);
    });
  });

  describe('SAVE10 coupon', () => {
    it('should apply SAVE10 discount correctly', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 100, qty: 1 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(10);
      expect(result.total).toBe(90);
      expect(result.appliedCoupon).toBe('SAVE10');
      expect(result.warnings).toBeUndefined();
    });

    it('should be case-insensitive for coupon codes', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 50, qty: 1 },
      ];

      const resultLower = simulatePricing(items, 'save10');
      expect(resultLower.discount).toBe(5);
      expect(resultLower.appliedCoupon).toBe('SAVE10');

      const resultMixed = simulatePricing(items, 'SaVe10');
      expect(resultMixed.discount).toBe(5);
      expect(resultMixed.appliedCoupon).toBe('SAVE10');
    });

    it('should apply discount with quantity > 1', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 25, qty: 4 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      // subtotal = 25 * 4 = 100
      // discount = 10% of 100 = 10
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(10);
      expect(result.total).toBe(90);
      expect(result.appliedCoupon).toBe('SAVE10');
    });
  });

  describe('Unknown coupons', () => {
    it('should return zero discount and warning for unknown coupon code', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 100, qty: 1 },
      ];
      const result = simulatePricing(items, 'INVALID');
      expect(result.discount).toBe(0);
      expect(result.appliedCoupon).toBeUndefined();
      expect(result.warnings).toEqual([
        {
          code: 'COUPON_UNKNOWN',
          message: 'Coupon code is not recognized',
        },
      ]);
    });

    it('should handle empty string coupon code', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 100, qty: 1 },
      ];
      const result = simulatePricing(items, '');
      expect(result.discount).toBe(0);
      expect(result.appliedCoupon).toBeUndefined();
    });

    it('should handle undefined coupon code', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 100, qty: 1 },
      ];
      const result = simulatePricing(items);
      expect(result.discount).toBe(1);
      expect(result.appliedCoupon).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('Rounding edge cases', () => {
    it('should round discount and total to 2 decimal places', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 33.33, qty: 1 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      expect(result.subtotal).toBe(33.33);
      expect(result.discount).toBe(3.33); // 10% of 33.33 = 3.333 → rounds to 3.33
      expect(result.total).toBe(30);
    });

    it('should handle rounding when items sum has floating point errors', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 0.1, qty: 1 },
        { id: '2', name: 'Item B', price: 0.2, qty: 1 },
      ];
      const result = simulatePricing(items);
      // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
      expect(result.subtotal).toBe(0.3);
      expect(result.total).toBe(0.3);
    });

    it('should handle complex rounding with quantities', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 10.99, qty: 3 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      // subtotal = 10.99 * 3 = 32.97
      // discount = 10% of 32.97 = 3.297 → rounds to 3.30
      // total = 32.97 - 3.30 = 29.67
      expect(result.subtotal).toBe(32.97);
      expect(result.discount).toBe(3.30);
      expect(result.total).toBe(29.67);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero price items', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Free Item', price: 0, qty: 5 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      expect(result.subtotal).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(0);
      expect(result.appliedCoupon).toBeUndefined();
    });

    it('should handle mixed free and paid items', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Free Item', price: 0, qty: 1 },
        { id: '2', name: 'Paid Item', price: 50, qty: 1 },
      ];
      const result = simulatePricing(items, 'SAVE10');
      expect(result.subtotal).toBe(50);
      expect(result.discount).toBe(5);
      expect(result.total).toBe(45);
      expect(result.appliedCoupon).toBe('SAVE10');
    });

    it('should handle whitespace in coupon code', () => {
      const items: CartItem[] = [
        { id: '1', name: 'Item A', price: 100, qty: 1 },
      ];
      const result = simulatePricing(items, '  SAVE10  ');
      expect(result.discount).toBe(10);
      expect(result.appliedCoupon).toBe('SAVE10');
    });
  });
});
