/**
 * Round to 2 decimal places
 * Handles floating-point arithmetic errors
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate percentage of amount and round to 2 decimals
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return roundMoney(amount * (percentage / 100));
}
