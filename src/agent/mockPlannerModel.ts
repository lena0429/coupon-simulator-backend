import type { AgentIntent, PlannerModel, PlannerModelOutput } from './types';

// ---------------------------------------------------------------------------
// Rule-based intent detection (mirrors original planner logic)
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: { intent: AgentIntent; keywords: string[][] }[] = [
  {
    intent: 'apply_best_coupon_and_simulate_checkout',
    // All groups must match (AND); each group is an OR of alternatives
    keywords: [['best coupon'], ['checkout', 'simulate']],
  },
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesAllGroups(text: string, groups: string[][]): boolean {
  return groups.every((group) => group.some((keyword) => text.includes(keyword)));
}

// ---------------------------------------------------------------------------
// MockPlannerModel
// ---------------------------------------------------------------------------

/**
 * Deterministic, rule-based implementation of PlannerModel.
 * Reproduces the original keyword-matching behavior.
 * Replace with a real LLM implementation to enable AI-driven planning.
 */
export const mockPlannerModel: PlannerModel = {
  resolve(userRequest: string): PlannerModelOutput {
    const text = normalise(userRequest);

    for (const { intent, keywords } of INTENT_PATTERNS) {
      if (matchesAllGroups(text, keywords)) return { intent };
    }

    throw new Error(`Unsupported request: "${userRequest}"`);
  },
};
