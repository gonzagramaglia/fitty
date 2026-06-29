/**
 * Supabase Error Helpers
 * Pure utility functions for wrapping and interpreting Supabase error responses.
 * These abstractions ensure consistent error handling across all DB and Storage operations.
 */

export type SupabaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wraps a Supabase query result into a consistent { success, data/error } shape.
 * This is the standard error handling pattern for all Supabase calls in Fitty.
 *
 * @example
 * const result = wrapSupabaseResult(await supabase.from("cats").select("*"));
 * if (!result.success) { showToast(result.error); return; }
 * setCats(result.data);
 */
export function wrapSupabaseResult<T>(response: {
  data: T | null;
  error: { message: string } | null;
}): SupabaseResult<T> {
  if (response.error) {
    return { success: false, error: response.error.message };
  }

  if (response.data === null) {
    return { success: false, error: "No data returned." };
  }

  return { success: true, data: response.data };
}

/**
 * Maps common Supabase error codes to user-friendly messages.
 * Prevents raw DB error messages from leaking into the UI.
 */
export function getFriendlySupabaseError(errorMessage: string): string {
  if (errorMessage.includes("duplicate key")) {
    return "This record already exists.";
  }
  if (errorMessage.includes("violates foreign key")) {
    return "This cat profile could not be found. Please try again.";
  }
  if (errorMessage.includes("JWT expired")) {
    return "Your session has expired. Please log in again.";
  }
  if (errorMessage.includes("Anonymous sign-ins are disabled")) {
    return "Guest mode is currently unavailable. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}
