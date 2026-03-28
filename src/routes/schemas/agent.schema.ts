import { z } from 'zod';
import { cartItemSchema } from './pricing.schema';

const agentIntentSchema = z.enum([
  'apply_best_coupon_and_simulate_checkout',
  'simulate_checkout_without_coupon',
  'explain_best_coupon',
  'compare_coupons',
]);

export const agentRunSchema = z.object({
  intent: agentIntentSchema,
  cartItems: z.array(cartItemSchema),
  couponCodes: z.array(z.string()),
});
