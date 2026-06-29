# Testing Report — Fitty

This document serves as the official test report for the Fitty hackathon submission.
It covers automated unit tests and manual feature verification across all phases.

---

## Automated Unit Tests

### Setup

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | ^30.4.2 | Test runner |
| ts-jest | ^29.4.11 | TypeScript transform |
| @types/jest | ^30.0.0 | TypeScript type definitions |

**Run all tests:**
```bash
yarn test
```

---

### Phase 2 — Core Business Logic

**Result: 49/49 tests passing ✅**

#### `lib/bcsValidator.ts` — BCS Score Validation

Tests the core AI output validation layer. Every score returned by AWS Bedrock (Claude) is validated before being written to the database.

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| Valid minimum score | `1` | `valid: true` | ✅ |
| Valid maximum score | `9` | `valid: true` | ✅ |
| Valid middle score | `5` | `valid: true` | ✅ |
| Score below minimum | `0` | `valid: false`, "out of range" | ✅ |
| Score above maximum | `10` | `valid: false`, "out of range" | ✅ |
| Negative score | `-1` | `valid: false` | ✅ |
| Float score | `4.5` | `valid: false`, "whole number" | ✅ |
| String input | `"5"` | `valid: false`, "must be a number" | ✅ |
| Null input | `null` | `valid: false` | ✅ |
| Undefined input | `undefined` | `valid: false` | ✅ |
| Classification attached | `3` | `classification: "underweight"` | ✅ |
| Classify 1 | `1` | `"underweight"` | ✅ |
| Classify 3 | `3` | `"underweight"` | ✅ |
| Classify 4 | `4` | `"healthy"` | ✅ |
| Classify 5 | `5` | `"healthy"` | ✅ |
| Classify 6 | `6` | `"overweight"` | ✅ |
| Classify 9 | `9` | `"overweight"` | ✅ |

#### `lib/catProfileValidator.ts` — Cat Profile Validation

Tests the form validation layer for the cat profile page before any data is written to Supabase.

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| Complete valid profile | All fields filled | `valid: true` | ✅ |
| Missing optional breed | No breed | `valid: true` | ✅ |
| Empty name | `""` | `valid: false`, name error | ✅ |
| Whitespace-only name | `"   "` | `valid: false` | ✅ |
| Name over 50 chars | 51 char string | `valid: false`, "50 characters" | ✅ |
| Null age | `null` | `valid: false`, age error | ✅ |
| Negative age | `-1` | `valid: false` | ✅ |
| Float age | `2.5` | `valid: false` | ✅ |
| Unrealistic age | `31` | `valid: false`, "max 30" | ✅ |
| Null weight | `null` | `valid: false`, weight error | ✅ |
| Zero weight | `0` | `valid: false` | ✅ |
| Negative weight | `-2` | `valid: false` | ✅ |
| Unrealistic weight | `26 kg` | `valid: false`, "max 25 kg" | ✅ |
| Multiple invalid fields | name + age + weight null | `valid: false`, ≥3 errors | ✅ |
| Complete profile check | All required fields | `true` | ✅ |
| Missing name | No name | `false` | ✅ |
| Whitespace name | `"   "` | `false` | ✅ |
| Null age_years | `null` | `false` | ✅ |
| Null weight | `null` | `false` | ✅ |
| Zero weight | `0` | `false` | ✅ |
| Empty object | `{}` | `false` | ✅ |

#### `lib/supabaseHelpers.ts` — Supabase Error Handling

Tests the error handling wrapper used for all Supabase queries across the app.

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| Success with data | `data: [...], error: null` | `success: true, data` | ✅ |
| Supabase error returned | `error: { message: "JWT expired" }` | `success: false, "JWT expired"` | ✅ |
| Null data, no error | `data: null, error: null` | `success: false`, "no data" | ✅ |
| Single object success | `data: {}` | `success: true` | ✅ |
| Error priority over data | `data + error` | `success: false` | ✅ |
| Duplicate key error | "duplicate key..." | "already exists" | ✅ |
| Foreign key error | "violates foreign key..." | "cat profile could not be found" | ✅ |
| JWT expired error | "JWT expired" | "session has expired" | ✅ |
| Anonymous disabled | "Anonymous sign-ins are disabled" | "guest mode is currently unavailable" | ✅ |
| Unknown error | "ECONNREFUSED..." | "something went wrong" | ✅ |
| Empty error string | `""` | "something went wrong" | ✅ |

---

## Manual Test Documentation

### Phase 1 — Foundation

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| App launches on Web | `yarn start` → browser | WebFrame renders with iPhone mockup | ✅ |
| App launches on iOS Simulator | `yarn start` → iOS | Native app renders correctly | ✅ |
| Bottom tabs render | Any authenticated state | 4 tabs visible (Dashboard, Camera, History, Profile) | ✅ |
| Protected route — unauthenticated | No active session | Redirects to `/login` | ✅ |
| Supabase client connects | App loads | No Supabase connection error in console | ✅ |
| WebFrame footer links | Click sponsor links | Opens correct URLs in new tab | ✅ |
| Hackathon hashtag link | Click `#hackthekitty` | Opens hackthekitty.com | ✅ |

### Phase 2 — Testing Infrastructure

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| `yarn test` runs | All test files present | 49 tests pass, 0 failures | ✅ |
| TypeScript strict mode | `tsc --noEmit` | No type errors | ✅ |
| Husky pre-commit hook | `git commit` | Runs tsc + commitlint before allowing commit | ✅ |

---

*This document is updated at the end of each phase. Last updated: Phase 2.*
