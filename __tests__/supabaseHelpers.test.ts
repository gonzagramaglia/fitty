import { wrapSupabaseResult, getFriendlySupabaseError, type SupabaseResult } from "../lib/supabaseHelpers";

// Helper for type-safe access to the failure branch
function asFailure<T>(r: SupabaseResult<T>) {
  return r as Extract<SupabaseResult<T>, { success: false }>;
}

describe("wrapSupabaseResult", () => {
  it("returns success with data when no error", () => {
    const result = wrapSupabaseResult({ data: [{ id: "1", name: "Mochi" }], error: null });
    expect(result.success).toBe(true);
    const ok = result as Extract<typeof result, { success: true }>;
    expect(ok.data).toEqual([{ id: "1", name: "Mochi" }]);
  });

  it("returns failure with error message when Supabase returns an error", () => {
    const result = wrapSupabaseResult({ data: null, error: { message: "JWT expired" } });
    expect(result.success).toBe(false);
    expect(asFailure(result).error).toBe("JWT expired");
  });

  it("returns failure when data is null and no error (empty result)", () => {
    const result = wrapSupabaseResult({ data: null, error: null });
    expect(result.success).toBe(false);
    expect(asFailure(result).error).toMatch(/no data returned/i);
  });

  it("returns success for a single object (not just arrays)", () => {
    const result = wrapSupabaseResult({ data: { id: "abc", name: "Mochi" }, error: null });
    expect(result.success).toBe(true);
  });

  it("prioritises the error over data when both are present", () => {
    const result = wrapSupabaseResult({ data: { id: "abc" }, error: { message: "RLS violation" } });
    expect(result.success).toBe(false);
  });
});

describe("getFriendlySupabaseError", () => {
  it("maps 'duplicate key' to a user-friendly message", () => {
    expect(getFriendlySupabaseError("duplicate key value violates unique constraint")).toMatch(/already exists/i);
  });

  it("maps 'violates foreign key' to a user-friendly message", () => {
    expect(getFriendlySupabaseError("insert or update on table violates foreign key constraint")).toMatch(/cat profile could not be found/i);
  });

  it("maps 'JWT expired' to a session expiry message", () => {
    expect(getFriendlySupabaseError("JWT expired")).toMatch(/session has expired/i);
  });

  it("maps 'Anonymous sign-ins are disabled' to a guest unavailable message", () => {
    expect(getFriendlySupabaseError("Anonymous sign-ins are disabled")).toMatch(/guest mode is currently unavailable/i);
  });

  it("returns a generic fallback for unknown errors", () => {
    expect(getFriendlySupabaseError("ECONNREFUSED connection refused")).toMatch(/something went wrong/i);
  });

  it("returns a generic fallback for an empty error string", () => {
    expect(getFriendlySupabaseError("")).toMatch(/something went wrong/i);
  });
});
