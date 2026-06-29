import { validateBcsScore, classifyBcs, type BcsValidationResult } from "../lib/bcsValidator";

// Helper for type-safe access to the invalid branch
function asInvalid(r: BcsValidationResult) {
  return r as Extract<BcsValidationResult, { valid: false }>;
}

describe("validateBcsScore", () => {
  it("returns valid for a score of 1 (minimum)", () => {
    expect(validateBcsScore(1).valid).toBe(true);
  });

  it("returns valid for a score of 9 (maximum)", () => {
    expect(validateBcsScore(9).valid).toBe(true);
  });

  it("returns valid for a score of 5 (middle of range)", () => {
    expect(validateBcsScore(5).valid).toBe(true);
  });

  it("returns invalid for a score of 0 (below minimum)", () => {
    const result = validateBcsScore(0);
    expect(result.valid).toBe(false);
    expect(asInvalid(result).error).toMatch(/out of range/i);
  });

  it("returns invalid for a score of 10 (above maximum)", () => {
    const result = validateBcsScore(10);
    expect(result.valid).toBe(false);
    expect(asInvalid(result).error).toMatch(/out of range/i);
  });

  it("returns invalid for a negative score", () => {
    expect(validateBcsScore(-1).valid).toBe(false);
  });

  it("returns invalid for a float score (e.g. 4.5)", () => {
    const result = validateBcsScore(4.5);
    expect(result.valid).toBe(false);
    expect(asInvalid(result).error).toMatch(/whole number/i);
  });

  it("returns invalid when score is a string", () => {
    const result = validateBcsScore("5");
    expect(result.valid).toBe(false);
    expect(asInvalid(result).error).toMatch(/must be a number/i);
  });

  it("returns invalid when score is null", () => {
    expect(validateBcsScore(null).valid).toBe(false);
  });

  it("returns invalid when score is undefined", () => {
    expect(validateBcsScore(undefined).valid).toBe(false);
  });

  it("attaches correct classification when score is valid", () => {
    const result = validateBcsScore(3);
    const valid = result as Extract<BcsValidationResult, { valid: true }>;
    expect(valid.classification).toBe("underweight");
  });
});

describe("classifyBcs", () => {
  it("classifies score 1 as underweight", () => {
    expect(classifyBcs(1)).toBe("underweight");
  });

  it("classifies score 3 as underweight", () => {
    expect(classifyBcs(3)).toBe("underweight");
  });

  it("classifies score 4 as healthy", () => {
    expect(classifyBcs(4)).toBe("healthy");
  });

  it("classifies score 5 as healthy", () => {
    expect(classifyBcs(5)).toBe("healthy");
  });

  it("classifies score 6 as overweight", () => {
    expect(classifyBcs(6)).toBe("overweight");
  });

  it("classifies score 9 as overweight", () => {
    expect(classifyBcs(9)).toBe("overweight");
  });
});
