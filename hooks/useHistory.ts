import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useActiveCat } from "../lib/ActiveCatContext";

/** A health check record (completed or processing) returned by the useHistory hook. */
export type HealthCheckRecord = {
  id: string;
  cat_id: string;
  created_at: string;
  bcs_score: number | null;
  top_photo_url: string | null;
  side_photo_url: string | null;
  classification: string | null;
  status: string;
  text_note?: string;
  voice_note_url?: string;
};

/**
 * useHistory fetches all completed health check records for the currently active cat.
 * It orders the records from newest to oldest.
 *
 * @returns An object containing the history array, loading state, and any error.
 */
export function useHistory() {
  const { activeCatId } = useActiveCat();
  const [history, setHistory] = useState<HealthCheckRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      if (!activeCatId) {
        if (!cancelled) {
          setHistory([]);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const { data, error: fetchError } = await supabase
          .from("health_checks")
          .select("id, cat_id, created_at, bcs_score, top_photo_url, side_photo_url, classification, status, text_note, voice_note_url")
          .eq("user_id", user.id)
          .eq("cat_id", activeCatId)
          .in("status", ["completed", "processing"])
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        
        if (!cancelled) {
          setHistory((data ?? []) as HealthCheckRecord[]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch history";
          console.error("[useHistory] error fetching history", err);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [activeCatId]);

  return { history, isLoading, error };
}
