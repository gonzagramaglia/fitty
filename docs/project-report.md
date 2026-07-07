# Project Report

**Project Name:** Fitty
**Reference ID:** #hackthekitty 2026

---

## 1. Executive Summary

Fitty is an AI-powered cat health tracker that estimates Body Condition Score (BCS) from two photos using Claude Sonnet 5, with voice note transcription via OpenAI Whisper. Built as a Universal App (iOS, Android, Web) with durable AI execution via Temporal.io, it delivers instant veterinary-grade health insights to cat owners — no vet visit required.

🎬 **Video Demo:** [https://youtu.be/nqmhqraKEKY](https://youtu.be/nqmhqraKEKY)

---

## 2. Project Overview

### 2a. Why we're building this

Pet obesity affects over 60% of domestic cats but remains undetected because owners lack an objective way to assess their cat's body condition at home. Weighing a cat on a scale is stressful and doesn't account for breed differences. Fitty solves this by using AI vision to score body condition from simple photos — the same method vets use, democratized for everyday pet parents.

### 2b. How it relates to the theme

World Cat Domination Day celebrates cats and their well-being. Fitty drives positive impact for cats by enabling early detection of weight issues, preventing obesity-related health problems (the #1 preventable health issue affecting 60%+ of domestic cats), and reducing unnecessary vet visits for routine weight checks. The theme isn't surface-level — it's the core purpose of the entire application. Every feature, from the AI analysis to the trend tracking to the contextual chat, exists to improve cat health outcomes.

### 2c. Target Audience

Cat owners who want a quick, stress-free way to monitor their pet's health at home. Comfortable with smartphones, looking for actionable health insights without the anxiety of a vet visit for a simple weight check.

---

## 3. Key Features

- **AI Body Condition Scoring** — Two-photo analysis (top + side view) using Claude Sonnet 5 with structured JSON output
- **Voice Note Context** — Optional voice observations auto-transcribed by OpenAI Whisper and incorporated into AI reasoning
- **Guided Camera Interface** — Silhouette overlays guide correct photo positioning
- **Real-time Processing Feedback** — Live step updates (transcribing → analyzing → saving) via Supabase Realtime
- **Durable AI Execution** — Temporal.io guarantees workflow completion with automatic retries
- **Interactive Trend Tracking** — BCS history chart showing health progression over time
- **Contextual AI Chat** — Follow-up Q&A about specific health reports with full cat context
- **Judge Mode** — Full demo experience for hackathon judges without requiring real data
- **Judge AI Assistant** — Floating web chatbot powered by GPT-4o-mini for judges to ask technical and architecture questions instantly
- **In-App Pitch Presentation** — Interactive, responsive slides detailing the problem, solution, and architecture for the demo video
- **Multi-cat Support** — Manage multiple cat profiles with quick switching
- **Delete & Retry** — Remove health checks or retry failed analyses without re-uploading

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (Universal App) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Auth + DB + Storage | Supabase (PostgreSQL, RLS, Realtime, Storage) |
| Durable Execution | Temporal.io (Cloud) |
| AI Vision & Reasoning | Anthropic API (Claude Sonnet 5) |
| Audio Transcription | OpenAI API (Whisper) |
| Security Scanning | Aikido Security |
| AI Code Review | CodeRabbit |
| Development Environment | Kiro |
| Frontend Hosting | Vercel |
| Backend Hosting | Render (Web Service) |

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                      │
│  React Native + Expo → Static Web Export                 │
│  Supabase Client (Auth, DB queries, Realtime, Storage)   │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
                │ POST /api/analyze       │ Realtime subscription
                │ POST /api/chat          │ (health_checks updates)
                ▼                         │
┌─────────────────────────────────┐       │
│     Backend (Render)             │       │
│  Express Server                  │       │
│  ├── /api/analyze (rate-limited) │       │
│  ├── /api/chat (rate-limited)    │       │
│  └── Temporal Worker             │       │
│       ├── transcribeAudio()      │       │
│       ├── analyzeImages()        │       │
│       └── saveResultToDatabase() ├───────┘
└──────┬──────────────┬────────────┘
       │              │
       ▼              ▼
┌────────────┐  ┌────────────┐
│  OpenAI    │  │  Anthropic │
│  Whisper   │  │  Claude 5  │
└────────────┘  └────────────┘
```

**Data Flow:** Camera → Upload to Supabase Storage → Trigger Temporal Workflow → Whisper transcribes audio → Claude analyzes photos → Results saved to Supabase → Frontend updates via Realtime

---

## 6. Testing Matrix

| Feature / Flow | Steps | Expected Result | Actual Result | Pass / Fail |
|---------------|-------|-----------------|---------------|-------------|
| Guest Mode Login | Tap "Continue as Guest" → Accept Terms | Redirects to Dashboard with toast | Works as expected | ✅ |
| Create Cat Profile | Fill name + age + weight → Save | Cat created, redirects to Dashboard | Works as expected | ✅ |
| Guest Scan Flow | Tap Scan → Capture (simulated) → Add voice → Submit | 6 mock health checks seeded, results shown | Works as expected | ✅ |
| Real User Scan | Capture real photos → Record voice → Submit | Photos uploaded, Temporal workflow triggered | Works as expected | ✅ |
| AI Analysis E2E | Submit scan → Wait for processing | Whisper transcribes → Claude scores → Results appear | Works as expected | ✅ |
| BCS Trend Chart | Complete multiple scans | Line chart updates with new data points | Works as expected | ✅ |
| AI Chat | Open chat → Ask question | Claude responds with health check context | Works as expected | ✅ |
| Delete Health Check | Tap delete → Type "I understand" → Confirm | Record removed, toast shown with date | Works as expected | ✅ |
| Delete Cat Profile | Tap remove → Type "I understand" → Confirm | Cat + health checks removed | Works as expected | ✅ |
| Failed Analysis Retry | Analysis fails → Tap "Retry Analysis" | Workflow re-triggered, status updates live | Works as expected | ✅ |

Full automated test report: 54/54 unit tests passing (`yarn test`).
Complete manual test matrix: see `docs/testing.md`.

---

## 7. Security

- **Aikido Security** — Continuous automated vulnerability scanning integrated via GitHub. Full AI Code Audit completed with findings resolved. See scan report screenshots below.
- **Row Level Security (RLS)** — Every Supabase table enforces user-scoped access at the database level
- **Service Role Isolation** — Frontend only has the anon key; service role key lives exclusively on the backend
- **Rate Limiting** — All API endpoints (`/api/analyze`, `/api/chat`) rate-limited to 5 req/min per IP
- **Input Validation** — Message length caps (500 chars), form field filtering (no numbers in text, no text in numbers), enforced max lengths
- **Error Sanitization** — Internal error details (stack traces, Supabase messages) never exposed to clients
- **JWT Verification** — Every API request validates the auth token before processing
- **Secure External Links** — All `window.open` calls include `noopener,noreferrer`
- **No Exposed Secrets** — API keys never prefixed with `EXPO_PUBLIC_`, only available server-side
- **Prompt Injection Mitigation** — User-supplied text sanitized and wrapped in delimited data blocks, separated from system instructions
- **Ownership Verification (Defense-in-depth)** — Temporal worker validates `user_id` ownership before every DB write, even though the service role key bypasses RLS
- **Guest Quota Enforcement** — Server-side per-anonymous-user analysis limit (3/day) prevents resource exhaustion from bypassed client UI

### Aikido Security Scan Report

![Aikido Scan Overview](aikido/ai-aikido-security-report-1.png)
![Aikido Scan Details](aikido/ai-aikido-security-report-2.png)
![Aikido Threat Scenarios](aikido/ai-aikido-security-report-3.png)
![Aikido Trust Boundaries](aikido/ai-aikido-security-report-4.png)
![Aikido Findings Resolved](aikido/ai-aikido-security-report-5.png)

---

## 8. Future Improvements

- **Streaming AI responses** in chat (real SSE instead of simulated typewriter)
- **Push notifications** when analysis completes (for mobile users who leave the app)
- **Weight tracking** integration with smart scales
- **Multi-language support** for voice notes and UI
- **Vet sharing** — export reports as PDF to share with veterinarians
- **Breed-specific BCS calibration** using breed-aware AI prompts

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| Kiro | Primary development environment (Tasks 17–20) |
| Claude Code | Development environment (Tasks 1–16) |
| CodeRabbit | Automated AI code review on every PR |
| Aikido Security | Continuous vulnerability scanning + AI Code Audit |
| Temporal Cloud | Managed durable execution platform |
| Supabase | Managed PostgreSQL + Auth + Storage + Realtime |
| Vercel | Frontend hosting (static export) |
| Render | Backend hosting (Express + Temporal Worker) |

---

## 10. Learnings & Takeaways

- **Temporal.io** proved invaluable for AI workflows — retries, timeouts, and durable execution eliminated the "silent failure" problem common in direct API calls.
- **Claude Sonnet 5** required careful prompt engineering for structured JSON output — we had to handle thinking blocks and fallback parsing for edge cases.
- **NativeWind v4** (Tailwind for React Native) dramatically sped up UI development but has quirks with dynamic classes that required inline style fallbacks.
- **Expo API Routes** don't work with static exports (Vercel) — we moved backend logic to an Express server on Render.
- **Kiro's steering files** provided persistent context across coding sessions, preventing architectural drift over 14 days.

---

## 11. Acknowledgments

- **Temporal.io** — Durable execution platform sponsoring the hackathon
- **Aikido Security** — AI Code Audit platform sponsoring the hackathon. Identified and helped resolve 5 threat scenarios via automated scanning and AutoFix PRs.
- **Kiro** — AI development environment sponsoring the hackathon
- **Anthropic** — Claude Sonnet 5 for vision analysis
- **OpenAI** — Whisper for audio transcription
- **Supabase** — Open-source Firebase alternative powering our entire backend
- **CodeRabbit** — AI code review keeping our PR quality high
