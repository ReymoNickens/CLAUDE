/**
 * Format a numeric amount as Ghana Cedis.
 * e.g. formatCurrency(1234.5) → "GH₵ 1,234.50"
 */
export function formatCurrency(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate platform commission (10%) as a rounded 2-decimal value.
 */
export function calculateCommission(fareAmount: number): number {
  return Math.round(fareAmount * 0.1 * 100) / 100;
}

/**
 * Calculate driver net earnings (90%) as a rounded 2-decimal value.
 */
export function calculateDriverEarnings(fareAmount: number): number {
  return Math.round(fareAmount * 0.9 * 100) / 100;
}
