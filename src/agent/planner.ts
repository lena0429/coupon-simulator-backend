import type { AgentRequest, AgentIntent, ExecutionPlan, PlannerModel } from './types';
import { mockPlannerModel } from './mockPlannerModel';

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

const PLANS: Record<AgentIntent, ExecutionPlan['steps']> = {
  apply_best_coupon_and_simulate_checkout: [
    { skill: 'get_cart', description: 'Retrieve cart summary' },
    { skill: 'validate_coupon', description: 'Validate each available coupon' },
    { skill: 'apply_coupon', description: 'Apply each valid coupon to the cart' },
    { skill: 'simulate_checkout', description: 'Simulate checkout with each valid coupon' },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produces an ExecutionPlan from a natural language request.
 * Delegates intent resolution to the provided model (defaults to mock).
 * Swap `model` for a real LLM implementation without touching executor or skills.
 */
export function createPlan(request: AgentRequest, model: PlannerModel = mockPlannerModel): ExecutionPlan {
  const { intent } = model.resolve(request.userRequest);

  return {
    intent,
    steps: [...PLANS[intent]],
  };
}
