import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useActiveCat } from "../lib/ActiveCatContext";

export type HealthCheckRecord = {
  id: string;
  cat_id: string;
  created_at: string;
  bcs_score: number;
  top_photo_url: string;
  side_photo_url: string;
  classification: string;
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
    async function fetchHistory() {
      if (!activeCatId) {
        setHistory([]);
        setIsLoading(false);
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
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setHistory(data as HealthCheckRecord[]);
      } catch (err: any) {
        console.error("[useHistory] error fetching history", err);
        setError(err.message || "Failed to fetch history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [activeCatId]);

  return { history, isLoading, error };
}
