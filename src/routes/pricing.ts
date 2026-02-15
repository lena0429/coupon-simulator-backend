import { Router, Request, Response } from 'express';
import { SimulateRequest, SimulateResponse } from '../types';
import { simulatePricing } from '../engine/pricing';

const router = Router();

/**
 * POST /pricing/simulate
 * Simulate checkout with optional coupon code
 */
router.post('/simulate', (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { items, couponCode } = req.body as SimulateRequest;

    // Execute simulation via engine
    const result = simulatePricing(items, couponCode);

    // Return response
    const response: SimulateResponse = {
      subtotal: result.subtotal,
      discount: result.discount,
      total: result.total,
      appliedCoupon: result.appliedCoupon,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Validate simulation request
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  // Check items exists
  if (!body || !body.items) {
    return { valid: false, error: 'Missing required field: items' };
  }

  // Check items is array
  if (!Array.isArray(body.items)) {
    return { valid: false, error: 'Field "items" must be an array' };
  }

  // Validate each item
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];

    if (!item.id || typeof item.id !== 'string') {
      return { valid: false, error: `Item at index ${i} missing valid "id"` };
    }

    if (!item.name || typeof item.name !== 'string') {
      return { valid: false, error: `Item at index ${i} missing valid "name"` };
    }

    if (typeof item.price !== 'number' || isNaN(item.price)) {
      return { valid: false, error: `Item at index ${i} missing valid "price"` };
    }

    if (typeof item.qty !== 'number' || isNaN(item.qty) || item.qty <= 0 || !Number.isInteger(item.qty)) {
      return { valid: false, error: `Item at index ${i} must have positive integer "qty"` };
    }
  }

  // Validate couponCode if provided
  if (body.couponCode !== undefined && typeof body.couponCode !== 'string') {
    return { valid: false, error: 'Field "couponCode" must be a string' };
  }

  return { valid: true };
}

export default router;
