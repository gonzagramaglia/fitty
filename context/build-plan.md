# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

## Testing Principle

Every piece of business logic extracted into `lib/` must have a corresponding unit test in `__tests__/`. Tests are written **alongside** the logic, not after the fact. The rule is simple:

- **Pure logic** (validators, formatters, helpers) → unit test in `__tests__/`
- **UI behaviour** → manual test documented in `docs/testing.md`
- **External services** (Supabase, Temporal, Anthropic) → mocked in unit tests, manual E2E documented

The `docs/testing.md` file is a living document updated at the end of every phase. It serves as the test report submitted with the hackathon.

## Phase 1 — Foundation

### 01 Project Setup & Navigation
Initialize the Expo project with Expo Router and configure styling. Ensure the project is configured as a Universal App (iOS, Android, Web).

**Logic:**
- Setup Expo Router folder structure (`app/(tabs)`, `app/(auth)`)
- Setup TailwindCSS (NativeWind v4) and custom `ui-tokens`
- Implement navigation (Dashboard, Camera, History, Profile) using Bottom Tabs
- Implement Web Presentation Wrapper (`WebFrame`) to simulate mobile layout on desktop browsers for hackathon demo
- Enforce protected routes (redirect to `/login` if no active session via Expo Router `_layout.tsx`)

## Phase 2 — Testing Infrastructure

### 02 Testing Setup & Unit Tests
Set up the Jest testing environment for the React Native/Expo app.

**Logic:**
- Install Jest + `ts-jest` + `@react-native/jest-preset`
- Create `lib/bcsValidator.ts`, `lib/catProfileValidator.ts`, and `lib/supabaseHelpers.ts`
- Write unit tests ensuring 100% pass rate for pure logic functions

## Phase 3 — Auth UI & Logic

### 03 Auth UI & Logic
Supabase authentication — Google OAuth and Guest Mode (Anonymous) for Hackathon Judges.

**UI:**
- Onboarding Carousel — 3 screens explaining the app value
- Login Screen — App Logo, "Continue with Google" button, and "Continue as Guest" button

**Logic:**
- Google OAuth via Supabase Auth `signInWithOAuth`
- Guest Mode via Supabase Auth Anonymous sign-ins (`signInAnonymously`)
- Session persistence via Supabase Auth state listener
- Auto-redirect to `/` (Dashboard) on successful login or guest entry

## Phase 4 — Database Schema & Profile

### 04 Database Schema & State
All Supabase tables and storage buckets created before any data is written.

**Logic:**
- Create `cats` table (id, user_id, name, breed, age_years, base_weight_kg, avatar_url)
- Create `health_checks` table (id, cat_id, top_photo_url, side_photo_url, voice_note_url, text_note, bcs_score, classification, ai_reasoning, recommendations, status)
- Create `cat_avatars`, `cat_photos`, `voice_notes`, and `user_avatars` storage buckets
- Row Level Security (RLS) policies on all tables and buckets
- Global state context (`ActiveCatContext`) to manage the selected cat

### 05 Profile Page — Full UI
Build the complete profile page UI.

**UI:**
- Profile Needs Attention Banner
- Profile Information Form (Avatar, Name, Breed, Age, Base Weight)
- Absolute Overlay Pattern for Seamless Edit Transitions
- Horizontal Cat Selector Pills

### 06 Profile Save Logic
Wire profile form to Supabase DB.

**Logic:**
- Fetch existing profile on mount
- Save/Update `cats` table on submit
- Upload avatar photo to `cat_avatars` bucket
- Add success/error Toast notifications

### 07 Dashboard Page — Full UI
Build the main landing view with mock data.

**UI:**
- Welcome Header (Split Screen Dark Header Layout)
- Incomplete Profile Warning Banner
- Start New Health Check CTA card
- Recent Checks Summary Widget

### 08 Dashboard Logic
Wire dashboard to Supabase DB.

**Logic:**
- Fetch active cat profile from `cats` table
- Fetch the single most recent row from `health_checks` for the active cat

## Phase 5 — Camera & AI Analysis

### 09 Camera Interface — Full UI
Build the camera capture flow visually.

**UI:**
- Camera Viewfinder with top-down and side-profile silhouette overlays
- Voice Note / Text Note context entry screen
- Processing/Loading screen with animated progress bar and rotating text
- Implement Implicit State Routing (hiding URL query params from user using React Context)

### 10 Camera Capture & Upload Logic
Implement the data collection flow up to the cloud.

**Logic:**
- Request Camera and Microphone permissions
- Capture high-quality images and compress them locally
- Record and save audio note or text fallback
- Upload all media to Supabase Storage (`cat_photos`, `voice_notes`)
- Navigate to processing screen

### 11 AI Workflow & Extraction Logic (Temporal + Anthropic + OpenAI)
Trigger the Temporal workflow to process the media and extract the BCS score.

**Logic:**
- App sends POST request to backend API route triggering Temporal Workflow
- Temporal worker calls OpenAI Whisper API with audio URL to extract raw text (if voice note is present)
- Temporal worker calls Anthropic API (Claude 5 Sonnet) passing photos and text context
- Claude returns structured JSON matching the DB schema
- Temporal worker inserts the structured JSON results into the `health_checks` table
- App listens to Supabase Realtime for the new `health_checks` row to appear, then navigates to Results screen

## Phase 6 — Results & History

### 12 Results Screen — Full UI & Logic
Build the post-analysis view and wire it directly.

**UI & Logic:**
- BCS Score Gauge (1-9 scale)
- AI Reasoning text block
- Recommendations list
- Fetch the specific `health_checks` row by ID passed from the Camera flow

### 13 History & Trends — Full UI & Logic
Build the historical tracking view and wire it.

**UI & Logic:**
- History List (rows of past checks)
- Trend Chart (line chart showing BCS progression)
- Fetch all `health_checks` for the `cat_id`, ordered by `created_at` descending

## Phase 7 — AI Contextual Chat

### 14 Contextual Q&A Interface
Build an interactive chat interface to ask follow-up questions about a specific health check.

**UI & Logic:**
- Update `health_checks` table with `chat_history` JSONB column via SQL migration
- Build "Ask Vet AI" Floating Action Button in `HistoryDetailView`
- Build Chat Modal UI (message bubbles, input field)
- Scaffold `temporal/server.ts` standalone Express API route (bypassing Expo API routes)
- Implement Anthropic Claude integration for Q&A with health check context
- Connect UI to backend with strict rate limiting (5 req/min) and 500-char validation
- Persist chat messages to Supabase and implement UI edit/delete functions

## Phase 8 — Production Readiness: Judge Mode & Real User End-to-End

### 15 Judge Mode UX & Demo Mocking
Polish the anonymous guest (Judge Mode) experience so hackathon judges can fully explore the app without a real account or data.

**UI & Logic:**
- Guest Mode guard: block second scan and second cat creation with Judge Mode modal
- Toast notifications (auto-dismiss with 2s draining progress bar, no X button)
- Placeholder typing animation on cat profile form fields
- Save button fixed height to prevent layout shift during loading
- `pendingAddCat` ref fixes `useFocusEffect` race condition on Add Cat flow
- `handleSave` data-driven INSERT vs UPDATE — immune to stale `activeCatId` from previous anonymous sessions
- `fetchData` clears stale `activeCatId` when user has no cats
- 6 pre-seeded mock health check records on first Judge Mode scan (Jan–Jun timeline)
- 5 real voice notes uploaded to Supabase (`health-checks/mock/`) and linked to DB records
- Redesigned "Owner's Notes" card: quote style, conditional audio player, no border divider
- Web audio playback via native HTML5 `Audio` API (bypasses `expo-av` which doesn't work on web)
- Guest camera flow: flash simulation effect, `guestCaptured` state, `isCaptured` computed flag
- Camera permissions requested only for real users, not guests

### 16 End-to-End Real User Flow
Enable Google login and verify the complete production flow works for real users: from login to scan to upload.

**Auth & Identity:**
- Google OAuth via Supabase with `redirectTo` for deployed domain
- Profile pre-fills first name and avatar from Google `user_metadata`

**Camera & Upload:**
- Camera and microphone permissions requested for real users
- Photos and voice notes upload to Supabase Storage
- App triggers POST to `/api/analyze` with valid payload

### 17 UX Polish
Final UX pass across Login, Profile, Chat, and navigation for a polished demo.

**Login:** Remove Skip, center Next, bypass Terms for Google, reposition buttons.
**Profile:** Reset on tab blur, tap/enter-to-save owner, avatar auto-upload with loader, input validation & max lengths.
**Chat:** Persist guest history, edit-in-place UX, one edit per session, clear on close.
**Navigation:** Scan disabled without cat, `/camera` guard, dynamic owner name, Realtime fix.

### 18 Refactor & Modularization
Extract sub-components from large route files, consolidate shared patterns (header, cat selector, avatar upload), remove dead code, narrow `any` types.

## Phase 9 — End-to-End Verification

### 19 End-to-End AI Workflow Verification
Verify the full Temporal → Whisper → Claude → Supabase → Realtime pipeline works for real users in production, end to end.
