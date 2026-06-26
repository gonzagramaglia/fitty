# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against `architecture.md` and `project-overview.md`
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations in try/catch, log failures, never let one failure crash everything

## TypeScript

- Strict mode enabled in `tsconfig.json` — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

## Expo Router & React Native Conventions

- Use Expo Router file-based routing (`app/`)
- All UI components are functional components using hooks
- Separate business logic and data fetching from UI components using custom hooks (e.g., `hooks/useHealthCheck.ts`)
- Never fetch data directly inside UI components without a custom hook or service abstraction
- Always read Expo documentation before implementing any Expo-specific feature — APIs may differ from standard React Native or React web

## File and Folder Naming

- Folders: kebab-case — `ui-components`, `health-checks`
- Component files: PascalCase — `StatCard.tsx`, `CameraOverlay.tsx`
- Utility files: camelCase — `supabaseClient.ts`, `dateFormatter.ts`
- Type files: camelCase — `types.ts`
- API route files: `+api.ts` (Expo API routes convention)
- Server Action / Service files: camelCase — `profileService.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

## Component Structure

Every component follows this exact order:

```typescript
// 1. External imports
import { useState } from "react";
import { View, Text } from "react-native";

// 2. Internal imports
import { StatCard } from "@/components/ui/StatCard";

// 3. Type definitions
type Props = {
  catId: string;
  bcsScore: number;
};

// 4. Component
export function ComponentName({ catId, bcsScore }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always use named exports
- Props type defined directly above the component — not in a separate types file unless shared across completely different components
- No inline styles — all styling via Tailwind classes using NativeWind variables from `ui-tokens.md`

## API Route & Backend Services

- Every route handler or service function has a `try/catch`
- Every route handler validates the request body before processing
- Errors are logged with the route path or file name as prefix: `[api/temporal]`
- Always return `{ success: boolean, data?: T, error?: string }`
- Never return raw data without the success wrapper
- Never throw from backend services — always return the error gracefully

Example Expo API route structure:
```typescript
// app/api/temporal+api.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // validate body
    
    // call service function
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("[api/temporal]", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

## Service / Worker Code

```typescript
// lib/temporal.ts

export async function triggerHealthCheck(
  catId: string,
  photoTopUrl: string,
  photoSideUrl: string,
  voiceNoteUrl?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // implementation
    return { success: true, data: result };
  } catch (error) {
    console.error("[lib/temporal]", error);
    return { success: false, error: String(error) };
  }
}
```

- Worker/Service functions never import from `components/` or `app/`
- Worker/Service functions never use React hooks or browser APIs
- Errors are always logged to console or a telemetry table before returning

## Supabase Client Usage

```typescript
// React Native (Client) context
import { supabase } from "@/lib/supabase";

// Server / API Route context
// Use the appropriate server-side Supabase client initialization
```

- Never use the client-side Supabase instance inside API routes without proper context
- Always scope every database query to the current `user_id` — never query without a user filter (even if RLS is enabled, defense in depth)
