import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export type HealthCheckDetail = {
  id: string;
  cat_id: string;
  created_at: string;
  bcs_score: number;
  top_photo_url: string;
  side_photo_url: string;
  voice_note_url: string | null;
  text_note: string | null;
  classification: string;
  ai_reasoning: string;
  recommendations: any[];
  status: string;
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
      } catch (err: any) {
        if (!cancelled) {
          console.error("[useHealthCheck] error fetching health check detail", err);
          setError(err.message || "Failed to fetch health check details");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchHealthCheck();

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

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { healthCheck, isLoading, error };
}
