import type { Skill } from '../skills/types';
import { getCartSkill } from '../skills/getCart';
import { validateCouponSkill } from '../skills/validateCoupon';
import { applyCouponSkill } from '../skills/applyCoupon';
import { simulateCheckoutSkill } from '../skills/simulateCheckout';

/**
 * The skill registry collects all v0.1 skills into a single list.
 *
 * This is the integration point for any future AI SDK or agent framework.
 * To add a new skill: implement it in src/skills/, import it here, and
 * add it to the array. No other file needs to change.
 *
 * The registry does not contain skill logic or make routing decisions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const skillRegistry: Skill<any, any>[] = [
  getCartSkill,
  validateCouponSkill,
  applyCouponSkill,
  simulateCheckoutSkill,
];

/**
 * Look up a skill by name. Returns undefined if no match is found.
 */
export function getSkill(name: string): Skill<unknown, unknown> | undefined {
  return skillRegistry.find((skill) => skill.name === name);
}

/**
 * Returns the names and descriptions of all registered skills.
 * Useful for presenting available tools to an agent.
 */
export function listSkills(): { name: string; description: string }[] {
  return skillRegistry.map(({ name, description }) => ({ name, description }));
}
