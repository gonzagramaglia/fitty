---
inclusion: always
---

# Fitty — Project Steering

This is a React Native (Expo) + Supabase + Temporal.io + Anthropic/OpenAI app built for the **Coding Kitty Hackathon 2026**. It is an AI-powered cat health tracker that estimates Body Condition Score (BCS) from photos.

## Context Files — Read These Before Implementing Anything

Always read in this order before any implementation:

1. #[[file:context/project-overview.md]]
2. #[[file:context/architecture.md]]
3. #[[file:context/ui-tokens.md]]
4. #[[file:context/ui-rules.md]]
5. #[[file:context/ui-registry.md]]
6. #[[file:context/code-standards.md]]
7. #[[file:context/library-docs.md]]
8. #[[file:context/build-plan.md]]
9. #[[file:context/progress-tracker.md]]

## Stack Quick Reference

- **Framework**: React Native + Expo (Universal App — iOS, Android, Web)
- **Routing**: Expo Router (file-based, `app/` directory)
- **Styling**: NativeWind (Tailwind CSS for React Native) — no raw hex values, no inline styles, tokens defined in `context/ui-tokens.md`, component rules in `context/ui-rules.md`, component registry in `context/ui-registry.md`
- **Auth + DB + Storage**: Supabase
- **Durable AI execution**: Temporal.io
- **AI Vision**: Anthropic API (Claude 5 Sonnet)
- **Audio transcription**: OpenAI API (Whisper)
- **Security scanning**: Aikido Security

## Non-Negotiable Rules

- No `any` types — use `unknown` and narrow
- No inline styles — NativeWind classes only, using tokens from `context/ui-tokens.md`
- No default exports for components — named exports always
- No business logic inside `app/` route files — extract to `hooks/` or `lib/`
- No direct Supabase calls inside components — use custom hooks
- No direct AI API calls from the frontend — Temporal activities only
- All Supabase queries scoped to `user_id` (defense in depth on top of RLS)
- Every async function wrapped in try/catch
- Strict TypeScript — no exceptions

## Git Workflow

- Branch naming: `feat/NN-short-description` or `fix/NN-short-description`
- Never push directly to `main`
- Open PRs for CodeRabbit review before merging

## Path Alias

Use `@/` for all internal imports (maps to project root).
