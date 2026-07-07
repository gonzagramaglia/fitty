import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export type HealthCheckDetail = {
  id: string;
  cat_id: string;
  created_at: string;
  bcs_score: number | null;
  top_photo_url: string | null;
  side_photo_url: string | null;
  voice_note_url: string | null;
  text_note: string | null;
  classification: string | null;
  ai_reasoning: string | null;
  recommendations: { title: string; description: string }[] | null;
  status: string;
  processing_step?: string | null;
  cats?: { name: string };
};

/**
 * useHealthCheck retrieves the full details of a specific health check by ID.
 * It also joins the cat's name from the cats table for display purposes.
 *
 * @param id - The UUID of the health check record to fetch.
 * @returns An object containing the healthCheck data, loading state, and any error.
 */
export function useHealthCheck(id: string) {
  const [healthCheck, setHealthCheck] = useState<HealthCheckDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealthCheck() {
      if (!id) {
        if (!cancelled) {
          setIsLoading(false);
          setHealthCheck(null);
          setError(null);
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
          .select("*, cats(name)")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (fetchError) throw fetchError;
        if (!cancelled) {
          setHealthCheck(data as HealthCheckDetail);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch health check details";
          console.error("[useHealthCheck] error fetching health check detail", err);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchHealthCheck();

    // Skip realtime subscription for empty IDs
    if (!id) return () => { cancelled = true; };

    // Remove any existing channel with the same name before subscribing
    const channelName = `health-check-${id}`;
    const existingChannel = supabase.getChannels().find(ch => ch.topic === `realtime:${channelName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // Subscribe to Realtime updates for this health check (e.g., when processing completes)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'health_checks',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (!cancelled && payload.new) {
            // Re-fetch to get the joined cat name
            fetchHealthCheck();
          }
        }
      )
      .subscribe();

    // Polling fallback: if Realtime misses the update, poll every 5s
    // (stops once status changes from 'processing')
    let pollingStopped = false;
    const pollInterval = setInterval(async () => {
      if (cancelled || pollingStopped) {
        clearInterval(pollInterval);
        return;
      }
      // Quick check if still processing before doing a full refetch
      const { data: check } = await supabase
        .from('health_checks')
        .select('status')
        .eq('id', id)
        .single();
      if (check && check.status !== 'processing') {
        pollingStopped = true;
        clearInterval(pollInterval);
        fetchHealthCheck(); // One final fetch to get full data
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { healthCheck, isLoading, error };
}
