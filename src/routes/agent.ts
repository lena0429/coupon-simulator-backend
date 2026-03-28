import { Router, Request, Response } from 'express';
import { runAgent } from '../agent';
import type { AgentIntent, PlannerModel } from '../agent/types';
import { agentRunSchema } from './schemas/agent.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// POST /agent/run
router.post(
  '/run',
  asyncHandler(async (req: Request, res: Response) => {
    const { intent, cartItems, couponCodes } = agentRunSchema.parse(req.body);

    // The UI sends a validated AgentIntent directly — skip NL classification.
    // Without this, fakeLLMPlannerModel's keyword patterns fail on underscore-delimited
    // intent strings (e.g. 'best coupon' pattern never matches 'best_coupon').
    const directModel: PlannerModel = {
      resolve: async (): Promise<{ intent: AgentIntent }> => ({ intent }),
    };

    const result = await runAgent(
      { userRequest: intent, cartItems, availableCoupons: couponCodes },
      directModel,
    );

    return res.status(200).json(result);
  }),
);

export default router;
