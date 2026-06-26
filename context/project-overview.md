# Project Overview: Fitty

> [!IMPORTANT]
> **Hackathon Context**: Fitty is being built as an MVP for **The Coding Kitty Hackathon 2026** (Theme: *World Cat Domination Day*). 
> The primary focus is on speed of delivery, a seamless "wow-factor" user experience (UX/UI), and demonstrating the core AI capability while successfully integrating the sponsors' technologies (**Temporal.io**, **Aikido Security**, and **Kiro**). 
> Edge cases and scaling concerns are intentionally kept out of scope to ensure a complete, working demo within the 14-day timeframe. All UI and documentation must be in English.

## About the Project (The Theme)
Fitty is an AI-powered cat health tracker that estimates a cat's Body Condition Score (BCS) from two photos (top and side view). It classifies cats as underweight, healthy, or overweight, explains the visual reasoning, and provides simple care recommendations. 

This directly ties into the **World Cat Domination Day** theme by driving positive impact for cats and their owners—helping owners monitor weight changes, prevent pet obesity, and spot health issues early without the stress of a vet visit for a simple weight check.

---

## Core User Flow

### 1. Onboarding & Profile
- User logs in via Google/Apple or Email.
- User creates a profile for their cat (Name, Breed, Age, Base Weight).

### 2. Health Check Analysis (The "Wow Factor")
- User navigates to the Camera page to start a new health check.
- App provides guided silhouette overlays to capture a top-down and side-profile photo.
- User can optionally add observations via **Voice Note** (auto-transcribed via Whisper) or Text (e.g., "eating less lately").
- **Durable AI Execution**: Photos, observations, and historical data are sent to a robust backend workflow (orchestrated by **Temporal.io**) to ensure the AI request doesn't fail silently.
- **GPT-4o Vision** extracts key visual features (rib visibility, waistline, abdominal tuck) and calculates the BCS (1-9).
- User receives the results: Classification, visual reasoning, and personalized recommendations based on the AI's analysis of the photos and the user's voice note.

### 3. History & Tracking
- All logs are saved. User can view a visual timeline of BCS and weight trends over time.
- Users can review past photos, AI reasoning, and recommendations.

---

## Data Architecture — Key Separation

### Main Cat Profile Data
- Lives in the `cats` table.
- Used as baseline context for every AI health check, never modified directly by the AI.

### Health Check Logs
- Photos are stored securely in cloud storage.
- Lives in the `health_checks` table (linked to a specific cat).
- `photo_top_url`, `photo_side_url`, `bcs_score`, `ai_reasoning`, and `transcribed_notes` are generated and saved after each analysis.
- Historical logs are append-only to enable timeline tracking.

---

## Features In Scope (MVP)

- Authentication (Email + OAuth).
- Multi-cat profile management.
- Guided camera interface with overlay silhouettes.
- Voice note recording with auto-transcription.
- GPT-4o Vision integration for BCS scoring and reasoning.
- Reliable backend AI processing queue.
- History page with interactive trend charts.
- **English UI** (mandatory for the hackathon).

## Features Out of Scope

- Veterinary medical diagnosis (the app estimates BCS, it does not diagnose illnesses).
- Push notifications or email reminders.
- Social features, sharing, or leaderboards.
- Complex diet planning or calorie counting.
- Real-time video analysis.
- Payment or subscription systems (MVP is fully free).

---

## Hackathon Tech Stack & Strategy

To maximize the judging criteria (Technical Execution, Innovation, Theme Relevance, Security, UX/UI, Documentation), Fitty utilizes the following stack:

- **Frontend / Mobile**: `React Native (Expo)` - For a polished, smooth, and universal user experience across iOS, Android, and Web.
- **Backend & Database**: `Supabase` - Provides instant PostgreSQL database, secure Storage for cat photos, and out-of-the-box Authentication.
- **Durable Execution (Technical Execution)**: `Temporal.io` - Used to orchestrate the AI analysis workflows reliably. It handles image uploading, AI API calls, and retries seamlessly behind the scenes.
- **AI / Machine Learning**: `OpenAI API (GPT-4o Vision & Whisper)` - Provides a unified, state-of-the-art ecosystem for both complex visual reasoning (BCS evaluation) and fast voice transcription under a single API and billing account.
- **Security & CI/CD (Bonus Points)**: `Aikido Security` - Integrated into GitHub Actions to scan dependencies and vulnerabilities, ensuring the code is secure from day one. (A report will be included in the final submission).
- **Spec-Driven Development (Kiro Track)**: `Kiro` - Built using agentic AI and a persistent `.kiro` / `.agents` configuration to accelerate development from weeks to days.