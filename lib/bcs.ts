/**
 * Shared BCS (Body Condition Score) color utilities.
 * Single source of truth for score→color mapping used across the app.
 */

/**
 * Returns the severity level for a given BCS score.
 *
 * @param score - The BCS score (1-9).
 * @returns 'ideal' | 'warning' | 'danger' | 'unknown'
 */
export function getBcsSeverity(score: number | null | undefined): 'ideal' | 'warning' | 'danger' | 'unknown' {
  if (!score || score < 1 || score > 9) return 'unknown';
  if (score === 5) return 'ideal';
  if (score <= 2 || score >= 8) return 'danger';
  return 'warning';
}

/**
 * Returns a NativeWind text color class for a BCS score.
 * - Score 5: green (ideal)
 * - Scores 3,4,6,7: yellow/warning
 * - Scores 1,2,8,9: red (danger)
 *
 * @param score - The BCS score (1-9).
 * @returns A Tailwind/NativeWind text color class string.
 */
export function getBcsTextColor(score: number | null | undefined): string {
  const severity = getBcsSeverity(score);
  switch (severity) {
    case 'ideal': return 'text-success-dark';
    case 'warning': return 'text-warning-dark';
    case 'danger': return 'text-error-dark';
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
    case 'warning': return 'bg-warning-light';
    case 'danger': return 'bg-error-light';
    default: return 'bg-surface-secondary';
  }
}
