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

### Phase 1 — Foundation

*No Automated Tests*

Phase 1 consists entirely of project scaffolding, Expo Router setup, and basic UI rendering (WebFrame). Since there is no complex business logic and the focus is purely on rendering and routing, this phase is exclusively verified via Manual Testing to ensure the app compiles and navigates correctly across iOS and Web.

### Phase 2 — Core Business Logic

Tests the core AI output validation layer. Every score returned by Anthropic (Claude) is validated before being written to the database.

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

### Phase 3 — Auth UI & Logic

*No Automated Tests*

This phase relies heavily on Supabase Auth (a managed third-party service) and OAuth redirects. Unit testing third-party authentication flows often results in testing the mocks rather than the actual code. Therefore, Auth flows (Google OAuth, Guest Mode) are rigorously tested in the Manual Test section.

### Phase 4 — Profile & Dashboard

*UI Not Automated (Logic Tested in Phase 2)*

While the core validation logic (`catProfileValidator`) and database error handling (`supabaseHelpers`) for profiles are fully covered by unit tests in Phase 2, the React Native UI components themselves are not automatically tested. Components in this phase interact with native device APIs (like `expo-image-picker`), which require complex mocking and are more efficiently verified via Manual UI Testing in a 7-day hackathon setting.

### Phase 5 — AI & Temporal Workflows

**Result: 54/54 tests passing ✅**

#### `__tests__/temporal/activities.test.ts` — AI Workflow Activities

Tests the backend worker logic that handles OpenAI, Anthropic, and Supabase interactions. All external services are fully mocked.

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| Transcribe audio success | Valid `audioUrl` | Calls OpenAI Whisper API, returns text | ✅ |
| Transcribe skips gracefully | `OPENAI_API_KEY` missing | Returns empty string, avoids crashing | ✅ |
| Analyze images success | Valid `topPhoto`, `sidePhoto` | Calls Claude 5, parses JSON result | ✅ |
| Analyze images missing key | `ANTHROPIC_API_KEY` missing | Throws explicit Error | ✅ |
| Save result to DB success | Valid AI JSON + Cat data | Calls Supabase `insert`, doesn't throw | ✅ |

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

### Phase 3 — Auth UI & Logic

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Onboarding Carousel renders | First launch | 3 slides visible, swipeable horizontally | ✅ |
| Onboarding pagination | Swipe slides | Dots update active state accurately | ✅ |
| Onboarding buttons | Click "Next" / "Skip" | Navigates slides / skips to Login | ✅ |
| Login UI renders | End of carousel | Logo, texts, and 2 action buttons render | ✅ |
| Google OAuth trigger | Click Google button | Loads Google OAuth / Supabase flow | ✅ |
| Guest Mode login | Click Guest button | `signInAnonymously()` fires, redirects to `/` | ✅ |
| Protected route — authenticated | Guest Mode active | App redirects from `/(auth)` to `/(tabs)` | ✅ |

### Phase 4 — Profile & Dashboard

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Profile — Incomplete Banner | `base_weight_kg` or `age_years` is null | Red warning banner "Profile needs attention" is visible | ✅ |
| Profile — Form Validation | Save with empty Name or Weight | Highlights empty fields in red, blocks submission | ✅ |
| Profile — Edit Owner Profile | Click pencil icon next to owner name | Switches to editable text input seamlessly (no layout shift) | ✅ |
| Profile — Save Owner Profile | Enter name, click green check | Saves `full_name` to Supabase `auth.users`, updates UI | ✅ |
| Profile — Image Picker (Cat) | Click cat avatar circle | Opens native image picker, sets preview | ✅ |
| Profile — Image Picker (Owner) | Click owner avatar circle | Opens native image picker, sets preview | ✅ |
| Profile — Save Logic | Form valid, click Save | Uploads avatar to `cat_avatars`, upserts `cats` table, shows Success Toast | ✅ |
| Dashboard — Greeting Header | App launches with active session | Shows "Good Morning, [Name]" and owner avatar | ✅ |
| Dashboard — Cat Selector | Multiple cats exist | Horizontal pills display cats, clicking updates ActiveCatContext | ✅ |
| Dashboard — Incomplete Banner | Active cat missing weight | Warning banner "Finish setting up profile" is visible | ✅ |
| Dashboard — Recent Check Widget | No previous checks | Shows "No history yet. Start a new check." | ✅ |
| UI Consistency | Navigate between Home and Profile | Dark Header layout and Cat Selector styling match perfectly | ✅ |

### Phase 5 — Camera & AI Analysis

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Camera Permission Prompt | First launch of Camera tab | Asks for Camera + Mic permissions | ✅ |
| Audio Recording | Press and hold record button | Counter increments, waveform animates | ✅ |
| Image Capture (Top) | Tap capture button on top silhouette | Captures image, transitions to side | ✅ |
| Image Capture (Side) | Tap capture button on side silhouette | Captures image, unlocks Next button | ✅ |
| Submission Flow | Tap Analyze button | Uploads to Supabase Storage, calls API | ✅ |
| Temporal Worker execution | API triggers Temporal | Worker receives task, calls Claude/Whisper | ✅ |
| Realtime DB listening | App in Processing state | Subscribes to Supabase `cat_health_checks` | ✅ |
| Error Handling | API fails / Timeout | App shows error state, allows retry | ✅ |

### Phase 6 — Results & History

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Results — Fetch Logic | Open `history/[id]` | Fetches record by ID and populates UI | ✅ |
| Results — BCS Gauge | Render gauge component | Correctly highlights Ideal/Underweight/Overweight colors based on score | ✅ |
| Results — Image Fallbacks | No images in record | Shows "No image" placeholders gracefully | ✅ |
| History — Fetch Logic | Open History Tab | Fetches all completed checks for active cat | ✅ |
| History — Empty State | No history exists | Shows "No history yet" placeholder card | ✅ |
| History — Trend Chart | At least 2 checks exist | Line chart renders correctly with min/max scale 1-9 | ✅ |
| History — List Rows | Checks exist | Renders a row for each check, sorted newest first | ✅ |
| History — Tab Reset | Click active History tab | Clears detail view, returns to main history list | ✅ |
| Navigation | Click History Row | Navigates to `history/[id]` | ✅ |
| Results — Notes UI | Record has voice/text notes | Displays 'Additional Context' card with appropriate Mic/File icon | ✅ |
| Results — Recommendations | Record has structured recommendations | Displays title and description bullet points | ✅ |
| Results — AI Reasoning | Record has reasoning text | Displays AI Reasoning card with Brain icon | ✅ |

### Phase 7 — AI Contextual Chat

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Chat — Backend Start | `yarn worker` running | Express server starts on port 3001 along with Temporal worker | ✅ |
| Chat — Rate Limiting | Send >5 messages in 1 minute | API blocks request with 429 status and error message | ✅ |
| Chat — Input Validation | Send >500 characters | API blocks request with 400 status | ✅ |
| Chat — Send Message | Valid input, API up | Optimistic UI updates immediately, AI response follows shortly | ✅ |
| Chat — Delete Message | Tap Trash icon on user msg | Prompts confirmation. Deletes msg + AI response from UI and DB | ✅ |
| Chat — Edit Message | Tap Pencil icon on user msg | Prompts warning. Truncates subsequent history, sets input | ✅ |
| Chat — Auto-Scroll | Send or receive message | ScrollView automatically scrolls to bottom of chat | ✅ |

### Phase 8 — Judge Mode UX & Demo Mocking

| Feature | Condition | Expected Outcome | Result |
|---------|-----------|-----------------|--------|
| Guest Banner Toast | Log in as guest | Persistent toast "Temporary Guest Account" appears, dismissible on tap | ✅ |
| Guest Scan Guard | Complete first scan, tap Scan again | Judge Mode modal appears immediately (no camera flash) | ✅ |
| Guest Add Cat Guard | Tap "Add Cat" as guest with 1 cat | Judge Mode modal appears, blocks creation | ✅ |
| Mock Data Seeding | First guest scan completes | 6 health checks (Jan–Jun) appear in History | ✅ |
| Voice Note Playback (Web) | Tap "Play voice note" on a mock record | Audio plays via HTML5 Audio API, button shows stop state | ✅ |
| History Empty State | No health checks exist | Trend chart with axes + "No history yet" overlay shown | ✅ |
| Profile Auto-Create Mode | Navigate to Profile with no cats | "Add Cat" pill is pre-selected, form in create mode | ✅ |
| Google OAuth Disabled | View login screen | Google button shows "Coming Soon", is non-interactive | ✅ |

---

*This document is updated at the end of each phase. Last updated: Phase 8.*
