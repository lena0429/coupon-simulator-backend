import { z } from 'zod';
import { simulatePricing } from '../engine/pricing';
import type { Skill, ApplyCouponInput, ApplyCouponOutput } from './types';
import { skillCartItemSchema } from './types';

/**
 * Skill: apply_coupon
 *
 * Applies a coupon code to a cart and returns the pricing breakdown including
 * the computed discount. Delegates entirely to simulatePricing() from
 * src/engine/pricing/index.ts — no pricing logic lives here.
 *
 * Use this skill when the agent's goal is specifically to evaluate a coupon
 * against a cart. For a full end-to-end checkout simulation, prefer simulate_checkout.
 */
export const applyCouponSkill: Skill<ApplyCouponInput, ApplyCouponOutput> = {
  name: 'apply_coupon',

  description:
    'Applies a coupon code to a list of cart items and returns the computed ' +
    'subtotal, discount, and total. If the coupon is unrecognized, discount is 0 ' +
    'and a warning is included. Does not modify any stored state.',

  inputSchema: z.object({
    items: z.array(skillCartItemSchema),
    couponCode: z.string().min(1),
  }),

  handler(input: ApplyCouponInput): ApplyCouponOutput {
    return simulatePricing(input.items, input.couponCode);
  },
};
