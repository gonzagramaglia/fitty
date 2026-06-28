import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { WebFrame } from "../components/WebFrame";
// @ts-ignore
import "../global.css";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <>
      <Head>
        <title>Fitty | AI Cat Health Tracker</title>
      </Head>
      <WebFrame>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </WebFrame>
    </>
  );
}
