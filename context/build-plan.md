# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

## Testing Principle

Every piece of business logic extracted into `lib/` must have a corresponding unit test in `__tests__/`. Tests are written **alongside** the logic, not after the fact. The rule is simple:

- **Pure logic** (validators, formatters, helpers) → unit test in `__tests__/`
- **UI behaviour** → manual test documented in `docs/testing.md`
- **External services** (Supabase, Temporal, AWS) → mocked in unit tests, manual E2E documented

The `docs/testing.md` file is a living document updated at the end of every phase. It serves as the test report submitted with the hackathon.

## Phase 1 — Foundation

### 01 Project Setup & Navigation
Initialize the Expo project with Expo Router and configure styling. Ensure the project is configured as a Universal App (iOS, Android, Web).

**Logic:**
- Setup Expo Router folder structure (`app/(tabs)`, `app/(auth)`)
- Implement navigation (Dashboard, Camera, History, Profile) using Bottom Tabs
- Implement Web Presentation Wrapper (`WebFrame`) to simulate mobile layout on desktop browsers for hackathon demo
- Enforce protected routes (redirect to `/login` if no active session via Expo Router `_layout.tsx`)

### 02 Auth UI & Logic
Supabase authentication — Google OAuth and Guest Mode (Anonymous) for Hackathon Judges.

**UI:**
- Onboarding Carousel — 3 screens explaining the app value (AI analysis, 2 photos, voice note)
- Login Screen — App Logo, prominent "Continue with Google" button, and a highly visible "Continue as Guest (Judge Mode)" button.

**Logic:**
- Google OAuth via Supabase Auth `signInWithOAuth`
- Guest Mode via Supabase Auth Anonymous sign-ins (`signInAnonymously`)
- Session persistence via Supabase Auth state listener
- Auto-redirect to `/` (Dashboard) on successful login or guest entry
- Show Onboarding only on first app launch

### 03 Database Schema
All Supabase tables and storage buckets created before any data is written.

**Logic:**
- Create `cats` table with all columns from `architecture.md` (id, user_id, name, avatar_url, breed, age_years, base_weight_kg)
- Create `health_checks` table with all columns from `architecture.md`
- Create `cat_avatars` storage bucket with authenticated access only
- Create `cat_photos` storage bucket with authenticated access only
- Create `voice_notes` storage bucket with authenticated access only
- Row Level Security (RLS) policies on all tables and buckets — always filter by `user_id`

## Phase 2 — Profile & Dashboard

### 04 Profile Page — Full UI
Build the complete profile page UI with mock data. No save logic yet.

**UI:**
- Profile Needs Attention Banner — visually indicates if required fields (Name, Base Weight) are missing
- Profile Information Form:
  - Cat Name (Text input, required)
  - Breed (Text input, optional)
  - Age in Years (Number input, required)
  - Base Weight in kg (Number input, required)
- "Save Profile" primary button at the bottom

### 05 Profile Save Logic
Wire profile form to Supabase DB.

**Logic:**
- Custom hook/service saves form fields to `cats` table in Supabase
- Form pre-fills automatically with existing data on return visits (fetching from Supabase on mount)
- Toast notification displays success or error on save

### 06 Dashboard Page — Full UI
Build the main landing view with mock data. No fetch logic yet.

**UI:**
- Welcome Header — "Hello [User], how is [Cat Name] doing today?"
- "Incomplete Profile" Warning Banner (conditionally rendered)
- "Start New Health Check" large CTA card with camera icon
- Recent Checks Summary Widget — shows last recorded BCS score, last recorded weight, and date

### 07 Dashboard Logic
Wire dashboard to Supabase DB.

**Logic:**
- Fetch active cat profile from `cats` table on mount
- Conditionally render the "Incomplete Profile" banner if `cats.base_weight_kg` or `cats.age_years` is null
- Fetch the single most recent row from `health_checks` for the active cat to populate the Summary Widget

## Phase 3 — Camera & AI Analysis

### 08 Camera Interface — Full UI
Build the camera capture flow visually with mock data.

**UI:**
- Camera Viewfinder — Full screen camera preview
- "Top-down" silhouette overlay (semi-transparent cat outline from above)
- "Side-profile" silhouette overlay (semi-transparent cat outline from the side)
- Capture Button (shutter)
- Voice Note Button — Microphone icon, "Hold to record observations" text
- Processing Screen — Fun loading animation while AI analyzes

### 09 Camera Capture & Upload Logic
Implement the data collection flow up to the cloud.

**Logic:**
- Request Camera and Microphone permissions on mount (handling iOS/Android and Web browser prompts)
- `expo-camera` captures high-quality images (must ensure Web compatibility) and `expo-image-manipulator` compresses them locally
- `expo-av` records audio and saves temporarily (must ensure Web compatibility)
- Upload photos to Supabase `cat_photos` bucket (using `user_id/cat_id/timestamp.jpg`)
- Upload audio to Supabase `voice_notes` bucket
- Retrieve public/signed URLs for the uploaded files

### 10 AI Workflow & Extraction Logic
Trigger the Temporal workflow to process the media and extract the BCS score.

**Logic:**
- App sends POST request to backend API route triggering Temporal Workflow (passing `cat_id`, photo URLs, audio URL)
- Temporal worker calls Amazon Transcribe API with audio URL to extract raw text
- If transcribed text is empty — skip text context, but proceed with photos
- Temporal worker calls Amazon Bedrock (Claude 4.3 Sonnet) passing the photos and the transcribed text
- Claude 4.3 Sonnet returns structured JSON matching the DB schema (`bcs_score`, `ai_reasoning`, `recommendations`)
- Temporal worker inserts the structured JSON results into the `health_checks` table
- App listens to Supabase Realtime for the new `health_checks` row to appear, then navigates to Results screen

## Phase 4 — Results & History

### 11 Results Screen — Full UI & Logic
Build the post-analysis view and wire it directly.

**UI:**
- BCS Score Gauge — Visual indicator (1-9 scale) highlighting the cat's score
- AI Reasoning — Text block explaining why the score was given based on the photos
- Recommendations — Bulleted list of actionable advice

**Logic:**
- Fetch the specific `health_checks` row by ID passed from the Camera flow
- Populate UI fields directly from DB row

### 12 History & Trends — Full UI & Logic
Build the historical tracking view and wire it.

**UI:**
- History List — Chronological list of past health checks (Date, BCS Score, Thumbnail)
- Trend Chart — Line chart showing BCS progression over time

**Logic:**
- Fetch all `health_checks` for the `cat_id`, ordered by `created_at` descending
- Format data for the Line Chart component
- Map over results to render the History List
