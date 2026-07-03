/**
 * Shared type definitions for Fitty data models.
 * Used across components to avoid `any` types on Supabase query results.
 */

import { User } from '@supabase/supabase-js';

/** A cat profile owned by a user, stored in the `cats` table. */
export type CatProfile = {
  id: string;
  user_id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  base_weight_kg: number | null;
  avatar_url: string | null;
  created_at: string;
};

/** A single health check record produced by the AI analysis workflow. */
export type HealthCheck = {
  id: string;
  cat_id: string;
  user_id?: string;
  created_at: string;
  top_photo_url: string | null;
  side_photo_url: string | null;
  voice_note_url: string | null;
  text_note: string | null;
  bcs_score: number | null;
  classification: string | null;
  ai_reasoning: string | null;
  recommendations: Recommendation[] | null;
  chat_history: ChatMessage[] | null;
  status: 'processing' | 'completed' | 'failed';
  cats?: { name: string };
};

/** A single actionable recommendation returned by the AI after a health check. */
export type Recommendation = {
  title: string;
  description: string;
};

/** A single message in the follow-up chat conversation with the AI. */
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type { User };
