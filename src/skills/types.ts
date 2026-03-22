import { z } from 'zod';
import type { CartItem, Warning } from '../types';

// Re-export domain types for use across skill files
export type { CartItem, Warning };

/**
 * Zod schema for a single cart item.
 * Mirrors cartItemSchema in src/routes/schemas/pricing.schema.ts.
 * Defined here so skills do not import from the routes layer.
 */
export const skillCartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Skill interface
// ---------------------------------------------------------------------------

/**
 * A skill is a named, typed, invocable unit of backend capability.
 * TInput is the validated input type; TOutput is the return type.
 */
export interface Skill<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  handler: (input: TInput) => TOutput;
}

// ---------------------------------------------------------------------------
// get_cart
// ---------------------------------------------------------------------------

export interface GetCartInput {
  items: CartItem[];
}

export interface GetCartOutput {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

// ---------------------------------------------------------------------------
// validate_coupon
// ---------------------------------------------------------------------------

export interface ValidateCouponInput {
  couponCode: string;
}

export interface ValidateCouponOutput {
  isValid: boolean;
  couponCode: string;
  discountDescription?: string;
}

// ---------------------------------------------------------------------------
// apply_coupon
// ---------------------------------------------------------------------------

export interface ApplyCouponInput {
  items: CartItem[];
  couponCode: string;
}

export interface ApplyCouponOutput {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
  warnings?: Warning[];
}

// ---------------------------------------------------------------------------
// simulate_checkout
// ---------------------------------------------------------------------------

export interface SimulateCheckoutInput {
  items: CartItem[];
  couponCode?: string;
}

export interface SimulateCheckoutOutput {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
  warnings?: Warning[];
}
