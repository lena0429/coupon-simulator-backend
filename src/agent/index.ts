import { createPlan } from './planner';
import { executePlan } from './executor';
import type { AgentRequest, AgentResponse, PlannerModel } from './types';

export async function runAgent(
  request: AgentRequest,
  model?: PlannerModel,
): Promise<AgentResponse> {
  const plan = await createPlan(request, model);
  return executePlan(plan, request);
}

export type { AgentRequest, AgentResponse };
