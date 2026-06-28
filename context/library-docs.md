# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to Fitty.

Read the relevant section before implementing any feature that touches these libraries.

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

`MCP server (real-time docs) -> Skills via AGENTS.md -> This file (project rules) -> General training knowledge`

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## Supabase

**Check first:** Check `AGENTS.md` for an installed Supabase skill. If a Supabase MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Client vs Server

Two separate instances — never mix them:

```typescript
// lib/supabase.ts — Client context only (Expo React Native)
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

**Rules:**
- Browser/Client client — Client Components, browser-side auth state, realtime subscriptions
- Server client — API Routes, background workers, agent functions
- Never use the browser client in server context
- Never use the server client in browser context

### Auth

```typescript
// Get current user in Expo (Client)
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) router.replace("/login");
```

### DB Queries

```typescript
// Read Example
const { data, error } = await supabase
  .from("health_checks")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

**Rules:**
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

### Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from("cat_photos")
  .upload(`${userId}/${catId}/top-photo.jpg`, fileBuffer, {
    contentType: "image/jpeg",
    upsert: true, // overwrites existing file
  });

// Get public URL
const { data } = supabase.storage
  .from("cat_photos")
  .getPublicUrl(`${userId}/${catId}/top-photo.jpg`);
  
const url = data.publicUrl;
```

**Storage paths for Fitty:**
- Cat avatar: `cat_avatars/{user_id}/{cat_id}/avatar-{timestamp}.jpg`
- Top photo: `cat_photos/{user_id}/{cat_id}/top-{timestamp}.jpg`
- Side photo: `cat_photos/{user_id}/{cat_id}/side-{timestamp}.jpg`
- Voice note: `voice_notes/{user_id}/{cat_id}/note-{timestamp}.m4a`

**Rules:**
- Always use `upsert: true` for photo and voice note uploads to overwrite any failed partial uploads.
- Always save the public URL back to the DB (`health_checks` table) after a successful upload.
- Never write files to disk permanently — always upload the temporary URI/buffer directly to storage from Expo Camera/AV.

---

## AWS Bedrock & Transcribe

**Check first:** Check `AGENTS.md` for an installed AWS skill. If an AWS MCP server is configured — use it. The skill/MCP will have the latest AWS SDK v3 patterns.

### Usage Constraints

- **Never** call AWS SDKs directly from the React Native client (Browser context).
- All AWS interactions must happen strictly inside a Temporal Activity running on the backend.
- Always use `@aws-sdk/client-bedrock-runtime` for Claude 4.3 and `@aws-sdk/client-transcribe` for audio.

### Initialisation

```typescript
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

**Rules:**
- AWS credentials must never be hardcoded. Load them securely from the backend `.env` file.
- Never expose AWS keys to the frontend (do not prefix with `EXPO_PUBLIC_`).

---

## Temporal.io

**Check first:** Check `AGENTS.md` for an installed Temporal skill. 

### Workflows vs Activities

- **Workflows** (`workflows.ts`): Must be deterministic. No API calls, no random numbers, no file system access.
- **Activities** (`activities.ts`): All side-effects go here. Calling AWS Bedrock, calling AWS Transcribe, or writing to Supabase must be done inside an activity.

```typescript
// Example Activity Signature
export async function processCatPhotos(catId: string, topPhotoUrl: string, sidePhotoUrl: string) {
  // 1. Call Bedrock
  // 2. Return JSON
}
```

**Important — Temporal Workflows run independently from your Expo API routes:** Temporal Workflows run on your dedicated worker instances, not inside the Expo API route that triggers them. A 30-second AWS Bedrock AI processing job does not require increasing the Expo API route timeout. The API route merely triggers the Temporal Workflow and returns an immediate response, while the Workflow continues running independently in the background to process the media. Do not configure long timeouts on API routes to accommodate background AI processing.
