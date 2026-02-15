import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

export const simulateSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().optional(),
});
