import { CartItem, PricingResult, Warning } from '../../types';
import { roundMoney } from './money';
import { applyPercentOff, isSupportedCoupon } from './rules/percentOff';

/**
 * Simulate pricing calculation for a cart with optional coupon
 * Calculates subtotal, discount, and total
 */
export function simulatePricing(items: CartItem[], couponCode?: string): PricingResult {
  // Calculate subtotal: sum(price * qty) for all items
  const subtotal = calculateSubtotal(items);

  // Normalize coupon code once (trim + uppercase)
  const normalizedCode = couponCode?.trim().toUpperCase() || undefined;

  // Apply discount if coupon provided
  const { discount, appliedCoupon } = applyPercentOff(normalizedCode, subtotal);

  // Calculate total
  const total = roundMoney(subtotal - discount);

  // Track warnings
  const warnings: Warning[] = [];

  // Check if coupon code was provided but not recognized
  if (normalizedCode && !isSupportedCoupon(normalizedCode)) {
    warnings.push({
      code: 'COUPON_UNKNOWN',
      message: 'Coupon code is not recognized',
    });
  }

  // Return result
  return {
    subtotal,
    discount,
    total,
    appliedCoupon,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate cart subtotal with proper rounding
 */
function calculateSubtotal(items: CartItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return roundMoney(sum);
}
