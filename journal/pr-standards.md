# Pull Request Standards

This document defines the standard PR format for every pull request in the Fitty project.
Follow this template exactly so every PR is consistent, professional, and ready for the hackathon judges.

---

## Title Format

Follows Conventional Commits. Must be under 50 characters to avoid GitHub truncation.

```
<type>(<scope>): <short description> (Phase N)
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or screen |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependencies |
| `refactor` | Code restructure without behaviour change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |

**Examples:**
- `feat(core): setup Phase 1 foundation & web demo`
- `feat(testing): setup Phase 2 testing infrastructure`
- `feat(auth): implement login screen and OAuth flow (Phase 3)`

---

## Description Template

Copy and paste this into the GitHub PR description box every time.

```markdown
## 🚀 What is this PR?
[One paragraph. State which phase this closes and what it accomplishes at a high level.]

## 🛠️ Key Changes
- **[Area]:** [What was built or changed and why it matters.]
- **[Area]:** [What was built or changed and why it matters.]
- **[Area]:** [What was built or changed and why it matters.]

## 📸 Screenshot
[Drag and drop a screenshot of the UI here. For non-UI phases (testing, config), paste the terminal output or test results instead.]

## ✅ Checklist
- [ ] Tested on Web
- [ ] Tested on iOS/Android Simulator
- [ ] Passes TypeScript strict checks (`tsc --noEmit`)
- [ ] All unit tests pass (`yarn test`)
- [ ] Conventional Commits applied
```

---

## Extended Description (Merge Commit)

When GitHub asks for the Extended Description during the merge, use this bullet format:

```text
- [Area]: [What was done — one line.]
- [Area]: [What was done — one line.]
- [Area]: [What was done — one line.]
```

**Example (Phase 1):**
```text
- Expo Router: Universal routing setup with protected routes logic.
- NativeWind v4: global.css configuration and UI tokens implementation.
- Supabase: Secure client initialization and environment variables setup.
- Web Presentation: WebFrame component with CSS iPhone mockup and sponsor links.
```

---

## Screenshot Guidelines

- For **UI phases** (Auth, Profile, Dashboard, Camera, Results, History): screenshot of the actual screen running in the browser at `localhost:8081`.
- For **non-UI phases** (Testing, Config, Schema): paste the terminal output (e.g. `49 tests passed`).
- Always drag the image directly into the GitHub description box — no external hosting needed.
- Delete the placeholder text `[Drag and drop...]` before submitting.

---

## PR History Reference

| PR | Branch | Phase | Status |
|----|--------|-------|--------|
| #1 | `feat/00-kiro-config` | 00 Kiro Config | ✅ Merged |
| #2 | `feat/01-project-setup` | 01 Foundation | ✅ Merged |
| #3 | `feat/02-testing-infrastructure` | 02 Testing | ✅ Merged |
| #4 | `feat/03-auth-logic` | 03 Auth | ✅ Merged |
| #5 | `feat/04-profile-dashboard` | 04 Profile & Dashboard | ✅ Merged |
| #6 | `feat/05-camera-and-ai-analysis` | 05 Camera & AI Analysis | ✅ Merged |
| #7 | `feat/06-results-and-history` | 06 Results & History | ✅ Merged |
| #8 | `feat/07-ai-contextual-chat` | 07 AI Contextual Chat & Judge Mode UX | ✅ Merged |
| #9 | `feat/08-production-readiness` | 08 Production Readiness: Google Auth, UX Polish & Refactoring (Tasks 16–18) | ✅ Merged |
| #10 | `feat/09-e2e-workflow` | 09 End-to-End AI Workflow Verification (Task 19) | ✅ Merged |
| #11 | `docs/10-final-submission` | 10 Documentation & Project Report (Task 20) | ✅ Merged |
| #12 | `fix/ai-aikido-security` | Aikido SAST Findings: SSRF, Path Traversal, Helmet, Deps | ✅ Merged |
| #13–16 | `aikido-security-code-audits` | Aikido AI Code Audit: Threat Scenarios & Security Hardening + AutoFixes | ✅ Merged |

*(Update this table every time a PR is opened or merged.)*
