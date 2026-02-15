import { CartItem, PricingResult } from '../../types';
import { roundMoney } from './money';
import { applyPercentOff } from './rules/percentOff';

/**
 * Simulate pricing calculation for a cart with optional coupon
 * Calculates subtotal, discount, and total
 */
export function simulatePricing(items: CartItem[], couponCode?: string): PricingResult {
  // Calculate subtotal: sum(price * qty) for all items
  const subtotal = calculateSubtotal(items);

  // Apply discount if coupon provided
  const discount = applyPercentOff(couponCode, subtotal);

  // Calculate total
  const total = roundMoney(subtotal - discount);

  // Return result with appliedCoupon if discount was applied
  return {
    subtotal,
    discount,
    total,
    appliedCoupon: discount > 0 ? 'SAVE10' : undefined,
  };
}

/**
 * Calculate cart subtotal with proper rounding
 */
function calculateSubtotal(items: CartItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return roundMoney(sum);
}
