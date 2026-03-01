import { Router, Request, Response } from 'express';
import { simulatePricing } from '../engine/pricing';
import { simulateSchema } from './schemas/pricing.schema';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

// POST /pricing/simulate - requires authentication + admin role
router.post(
  '/simulate',
  authenticate,
  requireRoles(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { items, couponCode } = simulateSchema.parse(req.body);
    const result = simulatePricing(items, couponCode);
    return res.status(200).json(result);
  })
);

export default router;
