import type { AgentIntent, PlannerModel, PlannerModelOutput } from './types';

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const SUPPORTED_INTENTS: AgentIntent[] = ['apply_best_coupon_and_simulate_checkout'];

function buildPrompt(userRequest: string): string {
  return [
    'You are a coupon assistant. Given a user request, identify the intent.',
    '',
    'Supported intents:',
    ...SUPPORTED_INTENTS.map((i) => `  - "${i}"`),
    '',
    `User request: "${userRequest}"`,
    '',
    'Respond with valid JSON only:',
    '{"intent": "<intent>"}',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Fake LLM response (deterministic — simulates structured model output)
// ---------------------------------------------------------------------------

// Keyword rules that mirror what a real model would be trained to recognise
const INTENT_PATTERNS: { intent: AgentIntent; keywords: string[][] }[] = [
  {
    intent: 'apply_best_coupon_and_simulate_checkout',
    keywords: [['best coupon'], ['checkout', 'simulate']],
  },
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesAllGroups(text: string, groups: string[][]): boolean {
  return groups.every((group) => group.some((kw) => text.includes(kw)));
}

/** Produces a JSON string as if returned by an LLM, based solely on userRequest. */
function simulateResponse(userRequest: string): string {
  const text = normalise(userRequest);

  for (const { intent, keywords } of INTENT_PATTERNS) {
    if (matchesAllGroups(text, keywords)) {
      return JSON.stringify({ intent });
    }
  }

  // Simulate a model declining an unrecognised request
  return JSON.stringify({ intent: null });
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

function isAgentIntent(value: unknown): value is AgentIntent {
  return SUPPORTED_INTENTS.includes(value as AgentIntent);
}

function parseResponse(raw: string, userRequest: string): PlannerModelOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`PlannerModel returned invalid JSON: ${raw}`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !isAgentIntent((parsed as Record<string, unknown>).intent)
  ) {
    throw new Error(`Unsupported request: "${userRequest}"`);
  }

  return { intent: (parsed as { intent: AgentIntent }).intent };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Fake LLM planner model.
 * Practices the full prompt → JSON-response → parse pipeline locally.
 * Replace with a real LLM-backed implementation when ready.
 */
export const fakeLLMPlannerModel: PlannerModel = {
  resolve(userRequest: string): PlannerModelOutput {
    void buildPrompt(userRequest);              // represents what a real LLM would receive
    const raw = simulateResponse(userRequest);  // fake response derived from original request only
    return parseResponse(raw, userRequest);
  },
};
