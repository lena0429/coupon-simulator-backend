import { describe, it, expect } from 'vitest';
import { validateCouponSkill } from '../validateCoupon';

describe('validateCouponSkill', () => {
  describe('handler', () => {
    describe('valid coupon: SAVE10', () => {
      it('returns isValid: true', () => {
        const result = validateCouponSkill.handler({ couponCode: 'SAVE10' });
        expect(result.isValid).toBe(true);
      });

      it('returns the normalized coupon code', () => {
        const result = validateCouponSkill.handler({ couponCode: 'SAVE10' });
        expect(result.couponCode).toBe('SAVE10');
      });

      it('returns a discountDescription', () => {
        const result = validateCouponSkill.handler({ couponCode: 'SAVE10' });
        expect(result.discountDescription).toBe('10% off');
      });
    });

    describe('normalization', () => {
      it('accepts lowercase coupon code', () => {
        const result = validateCouponSkill.handler({ couponCode: 'save10' });
        expect(result.isValid).toBe(true);
        expect(result.couponCode).toBe('SAVE10');
      });

      it('accepts mixed-case coupon code', () => {
        const result = validateCouponSkill.handler({ couponCode: 'SaVe10' });
        expect(result.isValid).toBe(true);
        expect(result.couponCode).toBe('SAVE10');
      });

      it('trims leading and trailing whitespace', () => {
        const result = validateCouponSkill.handler({ couponCode: '  SAVE10  ' });
        expect(result.isValid).toBe(true);
        expect(result.couponCode).toBe('SAVE10');
      });

      it('normalizes before returning couponCode even for invalid input', () => {
        const result = validateCouponSkill.handler({ couponCode: '  bogus  ' });
        expect(result.couponCode).toBe('BOGUS');
      });
    });

    describe('invalid coupon', () => {
      it('returns isValid: false for an unknown code', () => {
        const result = validateCouponSkill.handler({ couponCode: 'INVALID' });
        expect(result.isValid).toBe(false);
      });

      it('does not include discountDescription for unknown code', () => {
        const result = validateCouponSkill.handler({ couponCode: 'INVALID' });
        expect(result.discountDescription).toBeUndefined();
      });

      it('returns isValid: false for a code that is a partial match', () => {
        const result = validateCouponSkill.handler({ couponCode: 'SAVE' });
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('inputSchema', () => {
    it('accepts a valid coupon code string', () => {
      const result = validateCouponSkill.inputSchema.safeParse({ couponCode: 'SAVE10' });
      expect(result.success).toBe(true);
    });

    it('rejects missing couponCode', () => {
      const result = validateCouponSkill.inputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects empty string couponCode', () => {
      const result = validateCouponSkill.inputSchema.safeParse({ couponCode: '' });
      expect(result.success).toBe(false);
    });
  });
});
