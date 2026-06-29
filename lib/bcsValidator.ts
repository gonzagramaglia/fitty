/**
 * BCS (Body Condition Score) Validator
 * Pure utility functions for validating and interpreting BCS scores.
 * These functions are the testable core of Fitty's AI output validation layer.
 */

export type BcsClassification = "underweight" | "healthy" | "overweight";

export type BcsValidationResult =
  | { valid: true; score: number; classification: BcsClassification }
  | { valid: false; error: string };

/**
 * Validates a raw BCS score received from the AI model.
 * The BCS scale is 1-9 per standard veterinary guidelines.
 */
export function validateBcsScore(raw: unknown): BcsValidationResult {
  if (typeof raw !== "number") {
    return { valid: false, error: "BCS score must be a number." };
  }

  if (!Number.isInteger(raw)) {
    return { valid: false, error: "BCS score must be a whole number (1-9)." };
  }

  if (raw < 1 || raw > 9) {
    return {
      valid: false,
      error: `BCS score ${raw} is out of range. Must be between 1 and 9.`,
    };
  }

  return { valid: true, score: raw, classification: classifyBcs(raw) };
}

/**
 * Classifies a valid BCS score into a human-readable category.
 * Standard veterinary BCS classification:
 * - 1-3: Underweight
 * - 4-5: Healthy
 * - 6-9: Overweight
 */
export function classifyBcs(score: number): BcsClassification {
  if (score <= 3) return "underweight";
  if (score <= 5) return "healthy";
  return "overweight";
}
