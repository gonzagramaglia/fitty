import {
  validateCatProfile,
  isProfileComplete,
  type ProfileValidationResult,
} from "../lib/catProfileValidator";

// Helper for type-safe access to the invalid branch
function asInvalid(r: ProfileValidationResult) {
  return r as Extract<ProfileValidationResult, { valid: false }>;
}

describe("validateCatProfile", () => {
  const validInput = {
    name: "Mochi",
    breed: "Siamese",
    age_years: 3,
    base_weight_kg: 4.5,
  };

  it("returns valid for a complete, correct profile", () => {
    expect(validateCatProfile(validInput).valid).toBe(true);
  });

  it("returns valid when breed is omitted (optional field)", () => {
    expect(validateCatProfile({ ...validInput, breed: undefined }).valid).toBe(true);
  });

  it("returns invalid when name is empty string", () => {
    const result = validateCatProfile({ ...validInput, name: "" });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns invalid when name is only whitespace", () => {
    expect(validateCatProfile({ ...validInput, name: "   " }).valid).toBe(false);
  });

  it("returns invalid when name exceeds 50 characters", () => {
    const result = validateCatProfile({ ...validInput, name: "A".repeat(51) });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.find((e) => e.field === "name")?.message).toMatch(/50 characters/i);
  });

  it("returns invalid when age_years is null", () => {
    const result = validateCatProfile({ ...validInput, age_years: null });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.some((e) => e.field === "age_years")).toBe(true);
  });

  it("returns invalid when age_years is negative", () => {
    expect(validateCatProfile({ ...validInput, age_years: -1 }).valid).toBe(false);
  });

  it("returns invalid when age_years is a float", () => {
    expect(validateCatProfile({ ...validInput, age_years: 2.5 }).valid).toBe(false);
  });

  it("returns invalid when age_years exceeds 30 (unrealistic)", () => {
    const result = validateCatProfile({ ...validInput, age_years: 31 });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.find((e) => e.field === "age_years")?.message).toMatch(/max 30/i);
  });

  it("returns invalid when base_weight_kg is null", () => {
    const result = validateCatProfile({ ...validInput, base_weight_kg: null });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.some((e) => e.field === "base_weight_kg")).toBe(true);
  });

  it("returns invalid when base_weight_kg is 0", () => {
    expect(validateCatProfile({ ...validInput, base_weight_kg: 0 }).valid).toBe(false);
  });

  it("returns invalid when base_weight_kg is negative", () => {
    expect(validateCatProfile({ ...validInput, base_weight_kg: -2 }).valid).toBe(false);
  });

  it("returns invalid when base_weight_kg exceeds 25 kg (unrealistic)", () => {
    const result = validateCatProfile({ ...validInput, base_weight_kg: 26 });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.find((e) => e.field === "base_weight_kg")?.message).toMatch(/max 25 kg/i);
  });

  it("returns multiple errors at once when several fields are invalid", () => {
    const result = validateCatProfile({ name: "", age_years: null, base_weight_kg: null });
    expect(result.valid).toBe(false);
    expect(asInvalid(result).errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("isProfileComplete", () => {
  it("returns true when all required fields are present", () => {
    expect(isProfileComplete({ name: "Mochi", age_years: 3, base_weight_kg: 4.5 })).toBe(true);
  });

  it("returns false when name is missing", () => {
    expect(isProfileComplete({ age_years: 3, base_weight_kg: 4.5 })).toBe(false);
  });

  it("returns false when name is only whitespace", () => {
    expect(isProfileComplete({ name: "   ", age_years: 3, base_weight_kg: 4.5 })).toBe(false);
  });

  it("returns false when age_years is null", () => {
    expect(isProfileComplete({ name: "Mochi", age_years: null, base_weight_kg: 4.5 })).toBe(false);
  });

  it("returns false when base_weight_kg is null", () => {
    expect(isProfileComplete({ name: "Mochi", age_years: 3, base_weight_kg: null })).toBe(false);
  });

  it("returns false when base_weight_kg is 0", () => {
    expect(isProfileComplete({ name: "Mochi", age_years: 3, base_weight_kg: 0 })).toBe(false);
  });

  it("returns false for an empty object", () => {
    expect(isProfileComplete({})).toBe(false);
  });
});
