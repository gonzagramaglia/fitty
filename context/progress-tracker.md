# Progress Tracker

Living document to track the completion of Fitty's phases as defined in `build-plan.md`.

## Phase 1 — Foundation
- [ ] **01 Project Setup & Navigation**
  - [ ] Initialize Expo app (`create-expo-app`)
  - [ ] Setup TailwindCSS (NativeWind v4) and custom `ui-tokens`
  - [ ] Configure Expo Router (`app/(tabs)`, `app/(auth)`)
  - [ ] Implement Bottom Tabs Navigation (Dashboard, Camera, History, Profile)
  - [ ] Implement Protected Routes logic (`_layout.tsx`)
  - [ ] Initialize Supabase Client & Environment Variables (`lib/supabase.ts`)
- [ ] **02 Auth UI & Logic**
  - [ ] Build Onboarding Carousel UI
  - [ ] Build Login Screen UI (Google + Guest buttons)
  - [ ] Implement Google OAuth via Supabase
  - [ ] Implement Anonymous Guest Mode via Supabase
  - [ ] Configure Supabase session state listener
- [ ] **03 Database Schema (Supabase)**
  - [ ] Create `cats` table
  - [ ] Create `health_checks` table
  - [ ] Create `cat_avatars` storage bucket
  - [ ] Create `cat_photos` storage bucket
  - [ ] Create `voice_notes` storage bucket
  - [ ] Setup RLS (Row Level Security) policies

## Phase 2 — Profile & Dashboard
- [ ] **04 Profile Page — Full UI**
  - [ ] Build "Profile Needs Attention" Banner
  - [ ] Build Cat Form (Avatar, Name, Breed, Age, Base Weight)
- [ ] **05 Profile Save Logic**
  - [ ] Fetch existing profile on mount
  - [ ] Save/Update `cats` table on submit
  - [ ] Upload avatar photo to `cat_avatars` bucket
  - [ ] Add success/error Toast notifications
- [ ] **06 Dashboard Page — Full UI**
  - [ ] Build Welcome Header
  - [ ] Build conditional "Incomplete Profile" banner
  - [ ] Build "Start New Health Check" CTA card
  - [ ] Build "Recent Checks" summary widget
- [ ] **07 Dashboard Logic**
  - [ ] Fetch active cat from `cats` table
  - [ ] Fetch latest check from `health_checks` table

## Phase 3 — Camera & AI Analysis
- [ ] **08 Camera Interface — Full UI**
  - [ ] Build Camera Viewfinder component
  - [ ] Build Top-down silhouette overlay
  - [ ] Build Side-profile silhouette overlay
  - [ ] Build Voice Note recording button
  - [ ] Build Processing/Loading screen
- [ ] **09 Camera Capture & Upload Logic**
  - [ ] Request Camera & Microphone permissions
  - [ ] Capture & compress top and side photos
  - [ ] Record & save audio note
  - [ ] Upload all media to Supabase Storage
- [ ] **10 AI Workflow & Extraction Logic (Temporal + AWS)**
  - [ ] Scaffold Expo API route for webhook/trigger (`app/api/temporal+api.ts`)
  - [ ] Create Temporal workflow file
  - [ ] Implement AWS Transcribe activity (Audio -> Text)
  - [ ] Implement AWS Bedrock activity (Photos + Text -> BCS JSON)
  - [ ] Insert result into `health_checks` table
  - [ ] App listens via Realtime for new DB row to navigate

## Phase 4 — Results & History
- [ ] **11 Results Screen — Full UI & Logic**
  - [ ] Build BCS Score Gauge component
  - [ ] Build AI Reasoning card
  - [ ] Build Recommendations list
  - [ ] Fetch data by `id` and populate UI
- [ ] **12 History & Trends — Full UI & Logic**
  - [ ] Build History List UI (rows of past checks)
  - [ ] Build Trend Chart UI (line chart)
  - [ ] Fetch and format data from `health_checks`
