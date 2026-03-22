import { z } from 'zod';
import { roundMoney } from '../engine/pricing/money';
import type { Skill, GetCartInput, GetCartOutput } from './types';
import { skillCartItemSchema } from './types';

/**
 * Skill: get_cart
 *
 * Returns a structured cart summary — items, total unit count, and subtotal —
 * without applying any coupon. Delegates subtotal rounding to roundMoney()
 * from src/engine/pricing/money.ts rather than a full simulatePricing call.
 */
export const getCartSkill: Skill<GetCartInput, GetCartOutput> = {
  name: 'get_cart',

  description:
    'Accepts a list of cart items and returns a cart summary including ' +
    'all line items, total unit count (itemCount), and computed subtotal. ' +
    'Does not apply a coupon or return a discount.',

  inputSchema: z.object({
    items: z.array(skillCartItemSchema),
  }),

  handler(input: GetCartInput): GetCartOutput {
    const subtotal = roundMoney(
      input.items.reduce((acc, item) => acc + item.price * item.qty, 0),
    );
    const itemCount = input.items.reduce((acc, item) => acc + item.qty, 0);

    return {
      items: input.items,
      itemCount,
      subtotal,
    };
  },
};
