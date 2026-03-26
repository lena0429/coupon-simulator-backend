import type { AgentRequest, AgentIntent, ExecutionPlan, PlannerModel } from './types';
import { fakeLLMPlannerModel } from './fakeLLMPlannerModel';

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
  simulate_checkout_without_coupon: [
    { skill: 'get_cart', description: 'Retrieve cart summary' },
    { skill: 'simulate_checkout', description: 'Simulate checkout without a coupon' },
  ],
  explain_best_coupon: [
    { skill: 'get_cart', description: 'Retrieve cart summary' },
    { skill: 'validate_coupon', description: 'Validate each available coupon' },
    { skill: 'apply_coupon', description: 'Apply each valid coupon to the cart' },
    { skill: 'simulate_checkout', description: 'Simulate checkout with each valid coupon' },
  ],
  compare_coupons: [
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
 * Delegates intent resolution to the provided model (defaults to fakeLLMPlannerModel).
 * Swap `model` for a real LLM-backed implementation without touching executor or skills.
 */
export async function createPlan(
  request: AgentRequest,
  model: PlannerModel = fakeLLMPlannerModel,
): Promise<ExecutionPlan> {
  const { intent } = await model.resolve(request.userRequest);

  return {
    intent,
    steps: [...PLANS[intent]],
  };
}
