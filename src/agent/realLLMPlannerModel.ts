import Anthropic from '@anthropic-ai/sdk';
import type { AgentIntent, PlannerModel, PlannerModelOutput } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Haiku is sufficient for simple intent classification; override via env if needed
const MODEL = process.env.PLANNER_MODEL ?? 'claude-haiku-4-5';

// Lazy singleton — client is created only on first resolve() call
let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic(); // reads ANTHROPIC_API_KEY from environment
  return client;
}

const SUPPORTED_INTENTS: AgentIntent[] = ['apply_best_coupon_and_simulate_checkout'];

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

// Classifier instructions stay in the system prompt; userRequest goes in the user turn
const SYSTEM_PROMPT = [
  'You are a request classifier for a coupon simulator system.',
  'Identify the intent of the user request and return valid JSON only — no other text.',
  '',
  'Supported intents:',
  ...SUPPORTED_INTENTS.map((i) => `  - "${i}"`),
  '',
  'If the request matches a supported intent, respond with:',
  '{"intent": "<intent>"}',
  '',
  'If the request does not match any supported intent, respond with:',
  '{"intent": null}',
].join('\n');

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

function isAgentIntent(value: unknown): value is AgentIntent {
  return SUPPORTED_INTENTS.includes(value as AgentIntent);
}

function parseResponse(raw: string, userRequest: string): PlannerModelOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw.trim());
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
 * Real LLM-backed planner model using the Anthropic API.
 * Requires ANTHROPIC_API_KEY in the environment.
 * Override the model via PLANNER_MODEL env var (default: claude-haiku-4-5).
 */
export const realLLMPlannerModel: PlannerModel = {
  async resolve(userRequest: string): Promise<PlannerModelOutput> {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userRequest }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) {
      throw new Error('PlannerModel returned no text content');
    }

    return parseResponse(textBlock.text, userRequest);
  },
};
