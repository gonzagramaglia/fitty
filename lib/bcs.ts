/**
 * Shared BCS (Body Condition Score) color utilities.
 * Single source of truth for score→color mapping used across the app.
 */

/**
 * Returns the severity level for a given BCS score.
 *
 * @param score - The BCS score (1-9).
 * @returns 'ideal' | 'underweight' | 'overweight' | 'unknown'
 */
export function getBcsSeverity(score: number | null | undefined): 'ideal' | 'underweight' | 'overweight' | 'unknown' {
  if (!score || score < 1 || score > 9) return 'unknown';
  if (score >= 4 && score <= 5) return 'ideal';
  if (score <= 3) return 'underweight';
  return 'overweight';
}

/**
 * Returns a NativeWind text color class for a BCS score.
 * Used in dashboard, history cards, and detail views.
 *
 * @param score - The BCS score (1-9).
 * @returns A Tailwind/NativeWind text color class string.
 */
export function getBcsTextColor(score: number | null | undefined): string {
  const severity = getBcsSeverity(score);
  switch (severity) {
    case 'ideal': return 'text-success-dark';
    case 'underweight': return 'text-primary-cool';
    case 'overweight': return 'text-warning-dark';
    default: return 'text-text-secondary';
  }
}

/**
 * Returns a NativeWind background color class for a BCS score badge.
 *
 * @param score - The BCS score (1-9).
 * @returns A Tailwind/NativeWind background color class string.
 */
export function getBcsBgColor(score: number | null | undefined): string {
  const severity = getBcsSeverity(score);
  switch (severity) {
    case 'ideal': return 'bg-success-light';
    case 'underweight': return 'bg-primary-cool-light';
    case 'overweight': return 'bg-warning-light';
    default: return 'bg-surface-secondary';
  }
}
