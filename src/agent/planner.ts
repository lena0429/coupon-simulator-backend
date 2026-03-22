import type { AgentRequest, AgentIntent, ExecutionPlan } from './types';

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: { intent: AgentIntent; keywords: string[][] }[] = [
  {
    intent: 'apply_best_coupon_and_simulate_checkout',
    // All groups must match (AND logic); each group is an OR of alternatives
    keywords: [['best coupon'], ['checkout', 'simulate']],
  },
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesAllGroups(text: string, groups: string[][]): boolean {
  return groups.every((group) => group.some((keyword) => text.includes(keyword)));
}

function detectIntent(userRequest: string): AgentIntent {
  const text = normalise(userRequest);

  for (const { intent, keywords } of INTENT_PATTERNS) {
    if (matchesAllGroups(text, keywords)) return intent;
  }

  throw new Error(`Unsupported request: "${userRequest}"`);
}

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

export function createPlan(request: AgentRequest): ExecutionPlan {
  const intent = detectIntent(request.userRequest);

  return {
    intent,
    steps: [...PLANS[intent]],
  };
}