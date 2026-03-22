import { z } from 'zod';
import { isSupportedCoupon } from '../engine/pricing/rules/percentOff';
import type { Skill, ValidateCouponInput, ValidateCouponOutput } from './types';

/**
 * Agent-facing labels for each supported coupon code.
 * These are presentation strings, not business logic.
 * Must be updated when new coupons are added to the engine.
 */
const COUPON_DESCRIPTIONS: Record<string, string> = {
  SAVE10: '10% off',
};

/**
 * Skill: validate_coupon
 *
 * Checks whether a coupon code is recognized by the pricing engine.
 * Delegates to isSupportedCoupon() from src/engine/pricing/rules/percentOff.ts.
 * Input is normalized (trimmed + uppercased) before validation, matching the
 * normalization that simulatePricing() applies internally.
 */
export const validateCouponSkill: Skill<ValidateCouponInput, ValidateCouponOutput> = {
  name: 'validate_coupon',

  description:
    'Checks whether a coupon code is valid and supported. Returns isValid, ' +
    'the normalized code, and a human-readable discount description when valid. ' +
    'Does not require cart items and applies no discount.',

  inputSchema: z.object({
    couponCode: z.string().min(1),
  }),

  handler(input: ValidateCouponInput): ValidateCouponOutput {
    const normalized = input.couponCode.trim().toUpperCase();
    const isValid = isSupportedCoupon(normalized);

    return {
      isValid,
      couponCode: normalized,
      ...(isValid && { discountDescription: COUPON_DESCRIPTIONS[normalized] }),
    };
  },
};
