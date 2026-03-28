import { calculatePercentage } from '../money';

export const SUPPORTED_COUPONS = ['SAVE10', 'SAVE5'] as const;

export type SupportedCoupon = (typeof SUPPORTED_COUPONS)[number];

export function isSupportedCoupon(code: string): code is SupportedCoupon {
  return (SUPPORTED_COUPONS as readonly string[]).includes(code);
}

export interface CouponResult {
  discount: number;
  appliedCoupon?: SupportedCoupon;
}

/**
 * Apply percent-off discount based on coupon code
 * v1: Only supports SAVE10 (10% off)
 * Returns discount amount and applied coupon code (if recognized)
 *
 * @param normalizedCode - Already normalized coupon code (uppercase, trimmed)
 * @param subtotal - Cart subtotal to calculate discount from
 */
export function applyPercentOff(normalizedCode: string | undefined, subtotal: number): CouponResult {
  if (!normalizedCode || normalizedCode === '') {
    return { discount: 0 };
  }

  if (normalizedCode === 'SAVE10') {
    const discount = calculatePercentage(subtotal, 10);
    return {
      discount,
      appliedCoupon: discount > 0 ? 'SAVE10' : undefined,
    };
  }

  if (normalizedCode === 'SAVE5') {
    const discount = calculatePercentage(subtotal, 5);
    return {
      discount,
      appliedCoupon: discount > 0 ? 'SAVE5' : undefined,
    };
  }

  return { discount: 0 };
}
