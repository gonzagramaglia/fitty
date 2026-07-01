# Progress Tracker

Living document to track the completion of Fitty's phases as defined in `build-plan.md`.

## Phase 1 — Foundation
- [x] **01 Project Setup & Navigation**
  - [x] Initialize Expo app (`create-expo-app`)
  - [x] Setup TailwindCSS (NativeWind v4) and custom `ui-tokens`
  - [x] Configure Expo Router (`app/(tabs)`, `app/(auth)`)
  - [x] Implement Bottom Tabs Navigation (Dashboard, Camera, History, Profile)
  - [x] Implement Protected Routes logic (`_layout.tsx`)
  - [x] Initialize Supabase Client & Environment Variables (`lib/supabase.ts`)
  - [x] Build Web Presentation Wrapper (Hackathon Demo UI)

## Phase 2 — Testing Infrastructure *(cross-cutting — grows with every phase)*
- [x] **02 Testing Setup & Unit Tests**
  - [x] Install Jest + `ts-jest` + `@react-native/jest-preset`
  - [x] Configure Jest in `package.json` (pure `ts-jest`, node environment)
  - [x] Add `jest` to `tsconfig.json` types
  - [x] Create `lib/bcsValidator.ts` — pure BCS score validation logic
  - [x] Create `lib/catProfileValidator.ts` — pure profile form validation logic
  - [x] Create `lib/supabaseHelpers.ts` — Supabase error handling wrappers
  - [x] Write unit tests — `__tests__/bcsValidator.test.ts`
  - [x] Write unit tests — `__tests__/catProfileValidator.test.ts`
  - [x] Write unit tests — `__tests__/supabaseHelpers.test.ts`
  - [x] Confirm all tests pass — **49/49 ✅** (`yarn test`)
  - [x] Create `docs/testing.md` — manual test documentation table

## Phase 3 — Auth UI & Logic
- [x] **03 Auth UI & Logic**
  - [x] Build Onboarding Carousel UI (3 slides, in-memory state — no AsyncStorage)
  - [x] Build Login Screen UI (Google + Guest Mode buttons)
  - [x] Implement Anonymous Guest Mode via Supabase (`signInAnonymously`) — **priority**
  - [x] Implement Google OAuth via Supabase (`signInWithOAuth`) — bonus, configure Redirect URL in Supabase Dashboard first
  - [x] Configure Supabase session state listener & auto-redirect to `/` on login

## Phase 4 — Database Schema & Profile
- [x] **04 Database Schema & State** *(via `docs/supabase-schema.sql`)*
  - [x] Create `cats` table
  - [x] Create `health_checks` table
  - [x] Create `cat_avatars` storage bucket
  - [x] Create `cat_photos` storage bucket
  - [x] Create `voice_notes` storage bucket
  - [x] Setup RLS (Row Level Security) policies
  - [x] Create `ActiveCatContext` to manage active cat ID
  - [x] Wrap `_layout.tsx` in `ActiveCatProvider`
- [x] **05 Profile Page — Full UI**
  - [x] Build "Profile Needs Attention" Banner
  - [x] Build Cat Form (Avatar, Name, Breed, Age, Base Weight)
  - [x] Build Owner Profile Header (Name & Avatar Editing)
  - [x] Implement Absolute Overlay Pattern for Seamless Edit Transitions
  - [x] Implement Horizontal Cat Selector Pills
- [x] **06 Profile Save Logic**
  - [x] Fetch existing profile on mount
  - [x] Save/Update `cats` table on submit
  - [x] Upload avatar photo to `cat_avatars` bucket
  - [x] Add success/error Toast notifications
  - [x] Update local state dynamically without layout shifts
- [x] **07 Dashboard Page — Full UI**
  - [x] Build Welcome Header
  - [x] Build conditional "Incomplete Profile" banner
  - [x] Build "Start New Health Check" CTA card
  - [x] Build "Recent Checks" summary widget
  - [x] Synchronize header styling with Profile Page (Dark Header Layout)
  - [x] Integrate Cat Selector Pills matching Profile UI
- [x] **08 Dashboard Logic**
  - [x] Fetch active cat from `cats` table
  - [x] Fetch latest check from `health_checks` table

## Phase 5 — Camera & AI Analysis
- [x] **09 Camera Interface — Full UI**
  - [x] Build Camera Viewfinder component
  - [x] Build Top-down silhouette overlay
  - [x] Build Side-profile silhouette overlay
  - [x] Build Voice Note recording button
  - [x] Build Processing/Loading screen
  - [x] Implement Implicit State Routing (hiding URL query params from user)
- [x] **10 Camera Capture & Upload Logic**
  - [x] Request Camera & Microphone permissions
  - [x] Capture & compress top and side photos
  - [x] Record & save audio note
  - [x] Upload all media to Supabase Storage
- [x] **11 AI Workflow & Extraction Logic (Temporal + Anthropic + OpenAI)**
  - [x] Scaffold Expo API route for webhook/trigger (`app/api/analyze+api.ts`)
  - [x] Create Temporal workflow file
  - [x] Implement OpenAI Whisper activity (Audio → Text)
  - [x] Implement Anthropic API activity (Photos + Text → BCS JSON)
  - [x] Insert result into `health_checks` table
  - [x] App listens via Realtime for new DB row to navigate

## Phase 6 — Results & History
- [x] **12 Results Screen — Full UI & Logic**
  - [x] Build BCS Score Gauge component
  - [x] Build AI Reasoning card
  - [x] Build Recommendations list
  - [x] Fetch data by `id` and populate UI
- [x] **13 History & Trends — Full UI & Logic**
  - [x] Build History List UI (rows of past checks)
  - [x] Build Trend Chart UI (line chart)
  - [x] Fetch and format data from `health_checks`

## Phase 7 — AI Contextual Chat
- [x] **14 Contextual Q&A Interface**
  - [x] Update `health_checks` table with `chat_history` JSONB column
  - [x] Build "Ask Vet AI" Floating Action Button in `HistoryDetailView`
  - [x] Build Chat Modal UI (message bubbles, input field)
  - [x] Scaffold `temporal/server.ts` standalone Express API route (bypassing Expo API routes for Vercel/Render compatibility)
  - [x] Implement Anthropic Claude integration for Q&A with health check context
  - [x] Connect UI to backend with strict rate limiting (5 req/min) and 500-char validation
  - [x] Persist chat messages to Supabase and implement UI edit/delete functions
