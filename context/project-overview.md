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
- **Anthropic Claude 5 Sonnet** extracts key visual features (rib visibility, waistline, abdominal tuck) and calculates the BCS (1-9).
- User receives the results: Classification, visual reasoning, and personalized recommendations based on the AI's analysis of the photos and the user's voice note.

### 3. History & Tracking
- All logs are saved. User can view a visual timeline of BCS and weight trends over time.
- Users can review past photos, AI reasoning, and recommendations.

### 4. Contextual AI Chat
- Users can have a back-and-forth conversation with Vet AI about a specific health check.
- The AI maintains context of the cat's profile, the specific check's photos, and the BCS result.
- Chat history is persisted and users can edit or delete their past messages.

### 5. Judge AI Assistant (Demo Mode)
- A floating chatbot specifically built for the Hackathon judges, available globally on the Web view.
- Powered by OpenAI `gpt-4o-mini` with full context of the project's architecture, stack, and rules.
- Answers technical questions instantly via an Expo API Route.

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
- Voice note recording with auto-transcription via OpenAI Whisper.
- Anthropic Claude 5 Sonnet integration for BCS scoring and reasoning.
- Reliable backend AI processing queue.
- History page with interactive trend charts.
- Contextual AI Chat for follow-up questions on health checks.
- **English UI** (mandatory for the hackathon).

## Features Out of Scope

- Veterinary medical diagnosis (the app estimates BCS, it does not diagnose illnesses).
- Push notifications or email reminders.
- Social features, sharing, or leaderboards.
- Complex diet planning or calorie counting.
- Real-time video analysis.
- Payment or subscription systems (MVP is fully free).

---

## Hackathon Strategy

To maximize the judging criteria (Technical Execution, Innovation, Theme Relevance, Security, UX/UI, Documentation), Fitty's technical architecture is explicitly designed around the sponsors' technologies. 

We utilize **Temporal.io** to guarantee durable execution for our AI workflows, **Anthropic and OpenAI APIs** for scalable cloud AI services, **Aikido** for robust security scanning, and **Kiro** to accelerate our build process through spec-driven development.

Additionally, to ensure high code quality and maintain standards during the fast-paced development cycle, we have integrated **CodeRabbit** for automated AI code reviews on every Pull Request.

For the full technical breakdown, stack details, and data flows, see [`architecture.md`](./architecture.md).

---

## Target User

A cat owner who:
- Wants to ensure their cat is maintaining a healthy weight and preventing pet obesity.
- Finds it difficult to objectively assess their cat's body condition or weigh them on a traditional scale.
- Is looking for a quick, stress-free way to monitor their pet's health at home without frequent vet visits.
- Is comfortable taking photos with a smartphone and using a modern mobile/web application.

---

## Success Criteria

- User can sign up, create a cat profile, and complete their first health check in under 3 minutes.
- The camera interface correctly guides the user to take top-down and side-profile photos using intuitive silhouette overlays.
- Anthropic Claude 5 Sonnet accurately calculates a Body Condition Score (BCS) that aligns with standard veterinary guidelines.
- AI reasoning is empathetic, clear, and makes logical sense based on the visual evidence in the photos.
- Voice notes are accurately transcribed by OpenAI Whisper and meaningfully incorporated into the AI's final recommendations.
- Temporal.io successfully orchestrates the backend workflow, ensuring no failed AI API calls disrupt the user experience.
- The History dashboard correctly displays interactive timeline charts for weight and BCS trends.
- All cat profiles, health check logs, and photos are securely stored in Supabase.
- UI is visually premium, fluid, and fully in English (as required by the hackathon rules).
- Aikido Security scans pass cleanly, and the report is included in the final submission.