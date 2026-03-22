import { describe, it, expect } from 'vitest';
import { getCartSkill } from '../getCart';
import type { CartItem } from '../../types';

const item = (overrides?: Partial<CartItem>): CartItem => ({
  id: '1',
  name: 'Item A',
  price: 10,
  qty: 1,
  ...overrides,
});

describe('getCartSkill', () => {
  describe('handler', () => {
    it('returns zero subtotal and itemCount for an empty cart', () => {
      const result = getCartSkill.handler({ items: [] });
      expect(result).toEqual({ items: [], itemCount: 0, subtotal: 0 });
    });

    it('returns correct subtotal and itemCount for a single item', () => {
      const result = getCartSkill.handler({ items: [item({ price: 9.99, qty: 1 })] });
      expect(result.subtotal).toBe(9.99);
      expect(result.itemCount).toBe(1);
    });

    it('multiplies price by qty per line item', () => {
      const result = getCartSkill.handler({ items: [item({ price: 5, qty: 4 })] });
      expect(result.subtotal).toBe(20);
      expect(result.itemCount).toBe(4);
    });

    it('itemCount is the sum of all qty values, not distinct line count', () => {
      const items = [item({ id: '1', qty: 3 }), item({ id: '2', qty: 2 })];
      const result = getCartSkill.handler({ items });
      expect(result.itemCount).toBe(5);
    });

    it('sums subtotals across multiple items', () => {
      const items: CartItem[] = [
        item({ id: '1', price: 10.99, qty: 2 }),
        item({ id: '2', price: 5.50, qty: 1 }),
        item({ id: '3', price: 3.25, qty: 3 }),
      ];
      // (10.99 * 2) + (5.50 * 1) + (3.25 * 3) = 21.98 + 5.50 + 9.75 = 37.23
      const result = getCartSkill.handler({ items });
      expect(result.subtotal).toBe(37.23);
      expect(result.itemCount).toBe(6);
    });

    it('rounds subtotal to 2 decimal places', () => {
      const items: CartItem[] = [item({ price: 10.99, qty: 3 })];
      // 10.99 * 3 = 32.97 (exact)
      const result = getCartSkill.handler({ items });
      expect(result.subtotal).toBe(32.97);
    });

    it('handles floating-point arithmetic without precision errors', () => {
      const items: CartItem[] = [
        item({ id: '1', price: 0.1, qty: 1 }),
        item({ id: '2', price: 0.2, qty: 1 }),
      ];
      // 0.1 + 0.2 = 0.30000000000000004 in raw JS; must round to 0.3
      const result = getCartSkill.handler({ items });
      expect(result.subtotal).toBe(0.3);
    });

    it('zero-price items contribute 0 to subtotal', () => {
      const items: CartItem[] = [
        item({ id: '1', price: 0, qty: 5 }),
        item({ id: '2', price: 20, qty: 1 }),
      ];
      const result = getCartSkill.handler({ items });
      expect(result.subtotal).toBe(20);
      expect(result.itemCount).toBe(6);
    });

    it('returns the original items array unchanged', () => {
      const items: CartItem[] = [item({ id: 'x', name: 'Widget', price: 3, qty: 2 })];
      const result = getCartSkill.handler({ items });
      expect(result.items).toEqual(items);
    });
  });

  describe('inputSchema', () => {
    it('accepts a valid items array', () => {
      const result = getCartSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 5, qty: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it('accepts an empty items array', () => {
      const result = getCartSkill.inputSchema.safeParse({ items: [] });
      expect(result.success).toBe(true);
    });

    it('rejects missing items field', () => {
      const result = getCartSkill.inputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects negative price', () => {
      const result = getCartSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: -1, qty: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero qty', () => {
      const result = getCartSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 5, qty: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer qty', () => {
      const result = getCartSkill.inputSchema.safeParse({
        items: [{ id: '1', name: 'A', price: 5, qty: 1.5 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
      const result = getCartSkill.inputSchema.safeParse({
        items: [{ id: '', name: 'A', price: 5, qty: 1 }],
      });
      expect(result.success).toBe(false);
    });
  });
});
