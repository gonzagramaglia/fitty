# Architecture

## Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Framework | React Native (Expo) | Cross-platform mobile and web application |
| State Management | React Context + AsyncStorage | Global state for the active cat ID (`ActiveCatContext`) |
| Auth + DB + Storage | Supabase | Entire backend (User sessions, Postgres DB, Photo storage) |
| Durable Execution | Temporal.io | Reliable orchestration of AI workflows, retries, and background jobs |
| AI Model (Vision & Logic) | Anthropic API (Claude 5 Sonnet) | Extracting visual features from photos, scoring BCS, and generating reasoning |
| AI Model (Audio) | OpenAI API (Whisper) | Transcribing user voice notes into text for the AI context |
| Contextual AI Chat | OpenAI API (gpt-4o-mini) + Expo API Routes | Judge AI Assistant embedded natively in the app to answer architectural queries |
| Security & CI/CD | Aikido Security | AI Code Audit with automated vulnerability scanning, threat scenario analysis, and AutoFix PRs via GitHub integration |

---

## Folder Structure

```text
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── _layout.tsx         → Root layout (Providers, Expo Router setup)
│   ├── index.tsx           → Homepage / Dashboard
│   ├── (auth)/
│   │   ├── login.tsx       → Login screen (Email, OAuth)
│   │   └── _layout.tsx
│   ├── camera/
│   │   ├── index.tsx       → Camera interface (Top/Side photo capture)
│   │   └── processing.tsx  → Loading screen during AI processing
│   ├── history/
│   │   ├── index.tsx       → Past health checks & interactive charts
│   │   └── [id].tsx        → Detailed view of a specific health check
│   └── profile/
│       └── index.tsx       → Cat profile management
├── components/
│   ├── ui/                 → Reusable UI components (Buttons, Inputs, Cards)
│   └── camera/             → Camera-specific components (Silhouette overlays)
├── lib/
│   ├── supabase.ts         → Supabase client initialization
│   ├── temporal.ts         → Temporal client & workflow triggers
│   ├── supabaseHelpers.ts  → Wrappers for error handling
│   └── ai.ts               → Anthropic / AI utility functions
└── assets/                 → Images, fonts, icons
├── __tests__/              → Unit tests mirroring lib/ structure
│   ├── bcsValidator.test.ts
│   ├── catProfileValidator.test.ts
│   └── supabaseHelpers.test.ts
└── docs/
    └── testing.md          → Manual test documentation & hackathon test report
```

---

## System Boundaries

| Folder | Owns |
|--------|------|
| `app/` | Expo Router pages and layouts only. Minimal business logic. |
| `components/` | Reusable UI only. No direct database mutations or data fetching. |
| `lib/` | Third-party client initialization (Supabase, Temporal, Anthropic) and shared utilities only. |
| `hooks/` | Custom React hooks for data fetching, Supabase subscriptions, and state management. |
| `temporal/` | All Temporal workflows and activities. Fully isolated from React/Expo code. |

---

## Data Flow: Health Check Operations

User captures top/side photos and voice note in Camera UI
  ↓
App directly uploads photos to Supabase Storage
  ↓
App triggers Temporal Workflow (passing photo URLs and voice audio)
  ↓
Temporal worker calls OpenAI Whisper API (converts audio → text)
  ↓
Temporal worker calls Anthropic API (Claude 5 Sonnet) with photos + text
  ↓
Temporal worker writes BCS result, reasoning, and transcribed text to Supabase `health_checks` table
  ↓
App listens for DB changes and displays Results Page

---

## Data Flow: Judge AI Assistant (Chatbot)

Judge clicks the floating Cat button on the web app
  ↓
App sends chat history to `app/api/chat+api.ts` (Expo API Route)
  ↓
API Route prepends the Fitty System Prompt (Context & Architecture)
  ↓
API Route calls OpenAI `gpt-4o-mini` API
  ↓
API Route returns text response to the client
  ↓
App renders response with typing animation

---

## Data Flow: Profile & Auth Operations

User logs in via OAuth / Email
  ↓
Supabase Auth creates secure session. Owner Profile (Name, Photo URL) is stored in `auth.users` via `raw_user_meta_data`.
  ↓
App loads ActiveCatContext (fetches last used cat from AsyncStorage, or queries first cat from DB)
  ↓
App fetches `cats` profile data from Supabase DB using the active cat ID
  ↓
If profile lacks required data (e.g., base weight), UI shows "Incomplete Profile" banner
  ↓
User updates profile → App writes directly to Supabase DB (No AI/Temporal needed)

---

## Supabase Database Schema

### `cats`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key, auto-generated |
| `user_id` | uuid | References `auth.users(id)` |
| `name` | text | Name of the cat |
| `avatar_url` | text | (Optional) Supabase Storage URL for the cat's avatar photo |
| `breed` | text | e.g., "Domestic Shorthair", "Siamese" (optional) |
| `age_years` | integer | Age of the cat |
| `base_weight_kg` | numeric | The cat's normal or baseline weight in kg |
| `created_at` | timestamp | Automatically set on creation |

### `health_checks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `cat_id` | uuid | References `cats(id)` |
| `user_id` | uuid | References `auth.users(id)` (for strict RLS) |
| `photo_top_url` | text | Supabase Storage URL |
| `photo_side_url` | text | Supabase Storage URL |
| `voice_note_url` | text | (Optional) Supabase Storage URL for the audio |
| `text_note`| text | Text transcribed by OpenAI Whisper |
| `bcs_score` | integer | 1 to 9 scale |
| `ai_reasoning` | text | Explanation provided by Claude 5 Sonnet |
| `recommendations` | text[] | Array of actionable advice |
| `created_at` | timestamp | When the check was performed |

---

## Invariants

Rules the AI agent must never violate when writing or modifying code:

- Expo routes (`app/`) contain no heavy business logic. React components contain no direct DB logic. All Supabase operations must be abstracted into a services or hooks layer.
- Temporal workflow code never imports from UI components or Expo routes. Workflows must be completely decoupled from the frontend.
- All Supabase mutations (writes/updates) must use the properly initialized Supabase client and respect TypeScript types.
- No hardcoded hex values or raw color strings in styles — always use design tokens from a centralized theme file (e.g., `ui-tokens`).
- Every OpenAI and Anthropic API call must be wrapped in try/catch and orchestrated through Temporal. Failures are handled gracefully, never thrown directly to crash the mobile app.
- The `cats` profile table is never modified automatically by an AI health check result. The AI only inserts new records into the `health_checks` table.
- Before saving a new health check, ensure the photos have successfully uploaded to Supabase Storage and valid URLs are returned.
- Always scope Supabase queries to the current authenticated user — never query or update records without enforcing Row Level Security (RLS).
- The app must gracefully handle the "Incomplete Profile" state if a cat is missing required data (like base weight) before allowing a new health check to start.