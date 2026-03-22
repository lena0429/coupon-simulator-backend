import { z } from 'zod';
import { simulatePricing } from '../engine/pricing';
import type { Skill, SimulateCheckoutInput, SimulateCheckoutOutput } from './types';
import { skillCartItemSchema } from './types';

/**
 * Skill: simulate_checkout
 *
 * Runs a full checkout simulation: computes cart subtotal, applies an optional
 * coupon, and returns a complete pricing breakdown. Delegates entirely to
 * simulatePricing() from src/engine/pricing/index.ts.
 *
 * This is the agent-facing equivalent of POST /pricing/simulate.
 * No order is created and no side effects occur — this is a pure computation.
 */
export const simulateCheckoutSkill: Skill<SimulateCheckoutInput, SimulateCheckoutOutput> = {
  name: 'simulate_checkout',

  description:
    'Runs a full checkout simulation for a cart with an optional coupon code. ' +
    'Returns subtotal, discount, total, the applied coupon (if valid), and any warnings. ' +
    'No order is created. Use this for a complete end-to-end pricing result in one call.',

  inputSchema: z.object({
    items: z.array(skillCartItemSchema),
    couponCode: z.string().optional(),
  }),

  handler(input: SimulateCheckoutInput): SimulateCheckoutOutput {
    return simulatePricing(input.items, input.couponCode);
  },
};
