import { Router, Request, Response } from 'express';
import { simulatePricing } from '../engine/pricing';
import { simulateSchema } from './schemas/pricing.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const { items, couponCode } = simulateSchema.parse(req.body);
    const result = simulatePricing(items, couponCode);
    return res.status(200).json(result);
  })
);

export default router;
