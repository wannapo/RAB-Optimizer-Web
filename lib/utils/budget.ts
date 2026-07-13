export function calculateSavingsTarget(currentTotal: number, desiredTotal: number): number {
  if (!Number.isFinite(desiredTotal) || desiredTotal <= 0) return 0;
  return Math.max(0, currentTotal - desiredTotal);
}
