import { calculatePercentage } from '../money';

/**
 * Apply percent-off discount based on coupon code
 * v1: Only supports SAVE10 (10% off)
 * Returns discount amount or 0 if code is unknown
 */
export function applyPercentOff(code: string | undefined, subtotal: number): number {
  if (!code || code.trim() === '') {
    return 0;
  }

  const normalizedCode = code.toUpperCase().trim();

  if (normalizedCode === 'SAVE10') {
    return calculatePercentage(subtotal, 10);
  }

  return 0;
}
