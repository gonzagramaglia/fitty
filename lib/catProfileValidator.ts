/**
 * Cat Profile Validator
 * Pure utility functions for validating the cat profile form before saving to Supabase.
 * These functions are the testable core of the Profile feature's data integrity layer.
 */

export type CatProfileInput = {
  name: string;
  breed?: string;
  age_years: number | null;
  base_weight_kg: number | null;
};

export type FieldError = { field: keyof CatProfileInput; message: string };

export type ProfileValidationResult =
  | { valid: true }
  | { valid: false; errors: FieldError[] };

/**
 * Validates the cat profile form data before submission.
 * Returns all field-level errors at once so the UI can display them all.
 */
export function validateCatProfile(input: CatProfileInput): ProfileValidationResult {
  const errors: FieldError[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push({ field: "name", message: "Cat name is required." });
  } else if (input.name.trim().length > 50) {
    errors.push({ field: "name", message: "Cat name must be 50 characters or fewer." });
  }

  if (input.age_years === null || input.age_years === undefined) {
    errors.push({ field: "age_years", message: "Age is required." });
  } else if (!Number.isInteger(input.age_years) || input.age_years < 0) {
    errors.push({ field: "age_years", message: "Age must be a non-negative whole number." });
  } else if (input.age_years > 30) {
    errors.push({ field: "age_years", message: "Age seems too high. Please verify (max 30 years)." });
  }

  if (input.base_weight_kg === null || input.base_weight_kg === undefined) {
    errors.push({ field: "base_weight_kg", message: "Base weight is required." });
  } else if (input.base_weight_kg <= 0) {
    errors.push({ field: "base_weight_kg", message: "Weight must be greater than 0 kg." });
  } else if (input.base_weight_kg > 25) {
    errors.push({ field: "base_weight_kg", message: "Weight seems too high. Please verify (max 25 kg)." });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Checks if a cat profile has all the required fields to run a health check.
 * Used to conditionally render the "Incomplete Profile" banner on the Dashboard.
 */
export function isProfileComplete(input: Partial<CatProfileInput>): boolean {
  return (
    !!input.name &&
    input.name.trim().length > 0 &&
    input.age_years !== null &&
    input.age_years !== undefined &&
    input.base_weight_kg !== null &&
    input.base_weight_kg !== undefined &&
    input.base_weight_kg > 0
  );
}
