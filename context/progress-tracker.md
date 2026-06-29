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
- [ ] **05 Profile Page — Full UI**
  - [ ] Build "Profile Needs Attention" Banner
  - [ ] Build Cat Form (Avatar, Name, Breed, Age, Base Weight)
- [ ] **06 Profile Save Logic**
  - [ ] Fetch existing profile on mount
  - [ ] Save/Update `cats` table on submit
  - [ ] Upload avatar photo to `cat_avatars` bucket
  - [ ] Add success/error Toast notifications
- [ ] **07 Dashboard Page — Full UI**
  - [ ] Build Welcome Header
  - [ ] Build conditional "Incomplete Profile" banner
  - [ ] Build "Start New Health Check" CTA card
  - [ ] Build "Recent Checks" summary widget
- [ ] **08 Dashboard Logic**
  - [ ] Fetch active cat from `cats` table
  - [ ] Fetch latest check from `health_checks` table

## Phase 5 — Camera & AI Analysis
- [ ] **09 Camera Interface — Full UI**
  - [ ] Build Camera Viewfinder component
  - [ ] Build Top-down silhouette overlay
  - [ ] Build Side-profile silhouette overlay
  - [ ] Build Voice Note recording button
  - [ ] Build Processing/Loading screen
- [ ] **10 Camera Capture & Upload Logic**
  - [ ] Request Camera & Microphone permissions
  - [ ] Capture & compress top and side photos
  - [ ] Record & save audio note
  - [ ] Upload all media to Supabase Storage
- [ ] **11 AI Workflow & Extraction Logic (Temporal + AWS)**
  - [ ] Scaffold Expo API route for webhook/trigger (`app/api/temporal+api.ts`)
  - [ ] Create Temporal workflow file
  - [ ] Implement AWS Transcribe activity (Audio → Text)
  - [ ] Implement AWS Bedrock activity (Photos + Text → BCS JSON)
  - [ ] Insert result into `health_checks` table
  - [ ] App listens via Realtime for new DB row to navigate

## Phase 6 — Results & History
- [ ] **12 Results Screen — Full UI & Logic**
  - [ ] Build BCS Score Gauge component
  - [ ] Build AI Reasoning card
  - [ ] Build Recommendations list
  - [ ] Fetch data by `id` and populate UI
- [ ] **13 History & Trends — Full UI & Logic**
  - [ ] Build History List UI (rows of past checks)
  - [ ] Build Trend Chart UI (line chart)
  - [ ] Fetch and format data from `health_checks`
