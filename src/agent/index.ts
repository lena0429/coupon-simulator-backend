import { createPlan } from './planner';
import { executePlan } from './executor';
import type { AgentRequest, AgentResponse } from './types';

export function runAgent(request: AgentRequest): AgentResponse {
  const plan = createPlan(request);
  return executePlan(plan, request);
}

export type { AgentRequest, AgentResponse };
