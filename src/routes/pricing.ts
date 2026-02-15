import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { simulatePricing } from '../engine/pricing';
import { simulateSchema } from './schemas/pricing.schema';

const router = Router();

router.post('/simulate', (req: Request, res: Response) => {
  try {
    const parsed = simulateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: z.treeifyError(parsed.error),
      });
    }

    const { items, couponCode } = parsed.data;
    const result = simulatePricing(items, couponCode);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
