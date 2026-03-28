import { getSkill } from './registry';
import type {
  AgentIntent,
  AgentRequest,
  AgentResponse,
  CompareResult,
  Explanation,
  ExecutionPlan,
  SkillName,
  StepTrace,
} from './types';
import type {
  GetCartInput,
  GetCartOutput,
  ValidateCouponInput,
  ValidateCouponOutput,
  ApplyCouponInput,
  ApplyCouponOutput,
  SimulateCheckoutInput,
  SimulateCheckoutOutput,
} from '../skills/types';

// ---------------------------------------------------------------------------
// Executor-internal types (not part of the public agent contract)
// ---------------------------------------------------------------------------

interface CouponResult {
  couponCode: string;
  isValid: boolean;
  discount?: number;
  finalPrice?: number;
  message?: string;
}

interface BestCouponResult {
  chosenCoupon: string | null;
  finalResult: SimulateCheckoutOutput | null;
  couponResults: CouponResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSkill(name: SkillName) {
  const skill = getSkill(name);
  if (!skill) throw new Error(`Skill not found in registry: "${name}"`);
  return skill;
}

/** Executes a skill and records a success/failed trace step automatically. */
function callSkillWithTrace<TInput, TOutput>(
  name: SkillName,
  input: TInput,
  steps: StepTrace[],
): TOutput {
  const skill = resolveSkill(name);
  try {
    const output = skill.handler(input as never) as TOutput;
    steps.push({ skill: name, input, output, status: 'success' });
    return output;
  } catch (err) {
    steps.push({ skill: name, input, output: null, status: 'failed' });
    throw err;
  }
}

/** Executes a skill without touching the trace (caller records the step). */
function callSkill<TInput, TOutput>(name: SkillName, input: TInput): TOutput {
  return resolveSkill(name).handler(input as never) as TOutput;
}

function isBetterResult(
  candidate: SimulateCheckoutOutput,
  current: SimulateCheckoutOutput | null,
): boolean {
  return current === null || candidate.total < current.total;
}

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

/**
 * @internal Exported only for unit testing — not part of the public agent API.
 * Use executePlan for all production code paths.
 */
export function executeBestCouponAndCheckout(
  request: AgentRequest,
  steps: StepTrace[],
): BestCouponResult {
  const cartInput: GetCartInput = { items: request.cartItems };
  const cart = callSkillWithTrace<GetCartInput, GetCartOutput>('get_cart', cartInput, steps);

  let chosenCoupon: string | null = null;
  let finalResult: SimulateCheckoutOutput | null = null;
  const couponResults: CouponResult[] = [];

  for (const coupon of request.availableCoupons) {
    const validateInput: ValidateCouponInput = { couponCode: coupon };
    // validate_coupon is traced manually: status depends on the result value
    const validation = callSkill<ValidateCouponInput, ValidateCouponOutput>(
      'validate_coupon',
      validateInput,
    );
    steps.push({
      skill: 'validate_coupon',
      input: validateInput,
      output: validation,
      status: validation.isValid ? 'success' : 'skipped',
    });

    if (!validation.isValid) {
      couponResults.push({ couponCode: coupon, isValid: false, message: validation.message });
      continue;
    }

    const applyInput: ApplyCouponInput = {
      items: cart.items,
      couponCode: validation.couponCode,
    };
    callSkillWithTrace<ApplyCouponInput, ApplyCouponOutput>('apply_coupon', applyInput, steps);

    const checkoutInput: SimulateCheckoutInput = {
      items: cart.items,
      couponCode: validation.couponCode,
    };
    const checkout = callSkillWithTrace<SimulateCheckoutInput, SimulateCheckoutOutput>(
      'simulate_checkout',
      checkoutInput,
      steps,
    );
    couponResults.push({
      couponCode: validation.couponCode,
      isValid: true,
      discount: checkout.discount,
      finalPrice: checkout.total,
    });

    if (isBetterResult(checkout, finalResult)) {
      chosenCoupon = validation.couponCode;
      finalResult = checkout;
    }
  }

  return { chosenCoupon, finalResult, couponResults };
}

function executeCheckoutWithoutCoupon(
  request: AgentRequest,
  steps: StepTrace[],
): Pick<AgentResponse, 'chosenCoupon' | 'finalResult'> {
  const cartInput: GetCartInput = { items: request.cartItems };
  const cart = callSkillWithTrace<GetCartInput, GetCartOutput>('get_cart', cartInput, steps);

  const checkoutInput: SimulateCheckoutInput = { items: cart.items };
  const finalResult = callSkillWithTrace<SimulateCheckoutInput, SimulateCheckoutOutput>(
    'simulate_checkout',
    checkoutInput,
    steps,
  );

  return { chosenCoupon: null, finalResult };
}

// ---------------------------------------------------------------------------
// Explanation generation (deterministic — derived from execution results)
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function generateExplanation(
  intent: AgentIntent,
  chosenCoupon: string | null,
  finalResult: SimulateCheckoutOutput | null,
): Explanation | null {
  switch (intent) {
    case 'simulate_checkout_without_coupon':
      if (!finalResult) return null;
      return {
        code: 'no_coupon_requested',
        summary: `No coupon applied. Cart total: ${fmt(finalResult.total)}.`,
        details: [
          { type: 'money', key: 'total', label: 'Cart total', value: finalResult.total },
        ],
      };

    case 'apply_best_coupon_and_simulate_checkout':
      if (!chosenCoupon || !finalResult) {
        return { code: 'no_valid_coupon', summary: 'No valid coupon found.' };
      }
      return {
        code: 'best_coupon_applied',
        summary: `Applied ${chosenCoupon}: saved ${fmt(finalResult.discount)}. Total: ${fmt(finalResult.total)}.`,
        details: [
          { type: 'coupon', key: 'appliedCoupon', label: 'Applied coupon', couponCode: chosenCoupon },
          { type: 'money', key: 'discount', label: 'Saved', value: finalResult.discount },
          { type: 'money', key: 'total', label: 'Total', value: finalResult.total },
        ],
      };

    case 'explain_best_coupon':
      if (!chosenCoupon || !finalResult) {
        return { code: 'no_valid_coupon', summary: 'No valid coupon found.' };
      }
      return {
        code: 'best_coupon_applied',
        summary:
          `Best coupon: ${chosenCoupon}. ` +
          `Subtotal: ${fmt(finalResult.subtotal)}, ` +
          `discount: ${fmt(finalResult.discount)}, ` +
          `final total: ${fmt(finalResult.total)}.`,
        details: [
          { type: 'coupon', key: 'bestCoupon', label: 'Best coupon', couponCode: chosenCoupon },
          { type: 'money', key: 'subtotal', label: 'Subtotal', value: finalResult.subtotal },
          { type: 'money', key: 'discount', label: 'Discount', value: finalResult.discount },
          { type: 'money', key: 'total', label: 'Final total', value: finalResult.total },
        ],
      };

    case 'compare_coupons':
      if (!chosenCoupon || !finalResult) {
        return { code: 'compare_summary', summary: 'No valid coupon found.' };
      }
      return {
        code: 'compare_summary',
        summary: `Best coupon: ${chosenCoupon}. Final price: ${fmt(finalResult.total)}.`,
        details: [
          { type: 'coupon', key: 'bestCoupon', label: 'Best coupon', couponCode: chosenCoupon },
          { type: 'money', key: 'total', label: 'Final price', value: finalResult.total },
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function executePlan(plan: ExecutionPlan, request: AgentRequest): AgentResponse {
  const steps: StepTrace[] = [];
  let result: Pick<AgentResponse, 'chosenCoupon' | 'finalResult'>;
  let compare: CompareResult | undefined;

  switch (plan.intent) {
    case 'compare_coupons': {
      const { chosenCoupon, finalResult, couponResults } = executeBestCouponAndCheckout(
        request,
        steps,
      );
      result = { chosenCoupon, finalResult };
      compare = {
        bestCouponCode: chosenCoupon,
        comparisons: couponResults.map(({ couponCode, isValid, discount, finalPrice, message }) => ({
          couponCode,
          isValid,
          ...(discount !== undefined && { discount }),
          ...(finalPrice !== undefined && { finalPrice }),
          ...(message !== undefined && { message }),
        })),
      };
      break;
    }
    case 'apply_best_coupon_and_simulate_checkout':
    case 'explain_best_coupon': {
      const { chosenCoupon, finalResult } = executeBestCouponAndCheckout(request, steps);
      result = { chosenCoupon, finalResult };
      break;
    }
    case 'simulate_checkout_without_coupon':
      result = executeCheckoutWithoutCoupon(request, steps);
      break;
    default:
      throw new Error(`Unsupported plan intent: "${plan.intent}"`);
  }

  return {
    intent: plan.intent,
    chosenCoupon: result.chosenCoupon,
    finalResult: result.finalResult,
    explanation: generateExplanation(plan.intent, result.chosenCoupon, result.finalResult),
    trace: { steps },
    ...(compare !== undefined && { compare }),
  };
}
