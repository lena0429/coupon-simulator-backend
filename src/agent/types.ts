import type { CartItem } from '../types';
import type { SimulateCheckoutOutput } from '../skills/types';

export type AgentIntent = 'apply_best_coupon_and_simulate_checkout';

export type SkillName =
  | 'get_cart'
  | 'validate_coupon'
  | 'apply_coupon'
  | 'simulate_checkout';

export type StepStatus = 'success' | 'skipped' | 'failed';

export interface AgentRequest {
  userRequest: string;
  cartItems: CartItem[];
  availableCoupons: string[];
}

export interface PlanStep {
  skill: SkillName;
  description: string;
}

export interface ExecutionPlan {
  intent: AgentIntent;
  steps: PlanStep[];
}

export interface StepTrace {
  skill: SkillName;
  input: unknown;
  output: unknown;
  status: StepStatus;
}

export interface ExecutionTrace {
  steps: StepTrace[];
}

export interface AgentResponse {
  intent: AgentIntent;
  chosenCoupon: string | null;
  finalResult: SimulateCheckoutOutput | null;
  trace: ExecutionTrace;
}