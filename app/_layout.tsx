import { useEffect, useState, useRef } from "react";
import { LogBox, DeviceEventEmitter, Animated, Text, View, TouchableOpacity, Linking } from "react-native";
import { AlertCircle, X } from "lucide-react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { WebFrame } from "../components/WebFrame";
import { ActiveCatProvider, useActiveCat } from "../lib/ActiveCatContext";
import { GuestLimitModal } from "../components/ui/GuestLimitModal";
import { InlineModal } from "../components/ui/InlineModal";
import { JudgeChat } from "../components/JudgeChat";
import { GitHubLink } from "../components/GitHubLink";
// @ts-ignore
import "../global.css";

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
    if (
      msg.includes('Unknown event handler property') ||
      msg.includes('Invalid DOM property') ||
      msg.includes('Did you mean `transformOrigin`') ||
      msg.includes('TouchableMixin is deprecated') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('shadow*') 
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

const TOAST_DURATION = 3000;

const GlobalToast = () => {
  const [message, setMessage] = useState('');
  const [persistent, setPersistent] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setMessage('');
      setPersistent(false);
    });
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('showToast', (payload) => {
      // Cancel any pending dismiss
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      // Support both string and object payloads
      const msg = typeof payload === 'string' ? payload : payload.message;
      const isPersistent = typeof payload === 'object' && payload.persistent === true;

      setMessage(msg);
      setPersistent(isPersistent);

      // Reset animations
      opacity.setValue(0);
      progress.setValue(1);

      // Fade in
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

      if (!isPersistent) {
        // Drain progress bar left to right over TOAST_DURATION
        Animated.timing(progress, {
          toValue: 0,
          duration: TOAST_DURATION,
          useNativeDriver: false,
        }).start();

        // Auto-dismiss after duration
        dismissTimer.current = setTimeout(dismiss, TOAST_DURATION);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        opacity.setValue(0);
        setMessage('');
        setPersistent(false);
      }
    });

    return () => {
      sub.remove();
      subscription.unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!message) return null;

  return (
    <Animated.View 
      style={{ opacity, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 99999, pointerEvents: 'box-none', alignItems: 'center' }}
    >
      <TouchableOpacity
        className="bg-[#1A2530] rounded-2xl shadow-lg border border-warning/30 w-[92%] max-w-[340px] overflow-hidden"
        onPress={dismiss}
        activeOpacity={0.8}
      >
        {/* Content row */}
        <View className="flex-row items-center px-3 py-5">
          <View className="bg-warning/20 w-10 h-10 rounded-full items-center justify-center mr-3 flex-shrink-0">
            <AlertCircle color="#eab308" size={22} />
          </View>
          <Text className="text-white font-medium leading-tight text-sm flex-1">
            {message}
          </Text>
          {persistent && (
            <View className="ml-2 p-1">
              <X color="#94a3b8" size={18} />
            </View>
          )}
        </View>

        {/* Draining progress bar — only for auto-dismiss toasts */}
        {!persistent && (
          <View className="h-[3px] bg-white/10" style={{ alignItems: 'flex-end' }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#74B7B5',
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * GlobalGuestModal renders the centralized Judge Mode modal.
 * It reads visibility state from ActiveCatContext to ensure only one instance exists app-wide.
 *
 * @returns The GuestLimitModal component connected to global context state.
 */
const GlobalGuestModal = () => {
  const { guestModalVisible, guestModalMessage, hideGuestModal } = useActiveCat();
  return (
    <GuestLimitModal
      visible={guestModalVisible}
      onClose={hideGuestModal}
      message={guestModalMessage}
    />
  );
};

/**
 * GlobalProcessingModal renders a modal informing the user a health check is already being processed.
 */
const GlobalProcessingModal = () => {
  const { processingModalVisible, hideProcessingModal } = useActiveCat();
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (processingModalVisible) {
      progress.setValue(1);
      Animated.timing(progress, {
        toValue: 0,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) hideProcessingModal();
      });
    }
  }, [processingModalVisible]);

  if (!processingModalVisible) return null;
  return (
    <InlineModal visible={true} onClose={hideProcessingModal}>
        <TouchableOpacity activeOpacity={0.95} onPress={hideProcessingModal} className="bg-surface w-full max-w-[340px] rounded-3xl p-6 items-center shadow-xl">
          <Text className="text-4xl mb-4">⏳</Text>
          <Text className="text-xl font-black text-text-primary mb-2 text-center">Analysis In Progress</Text>
          <Text className="text-text-secondary text-center mb-4">
            A health check is being processed. Powered by <Text className="font-bold text-primary-cool-dark" onPress={() => Linking.openURL('https://temporal.io')}>Temporal.io</Text> for reliable execution.
          </Text>
          <Text className="text-text-muted text-center text-xs mb-4">
            Results will appear automatically.
          </Text>
          <View className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden" style={{ alignItems: 'flex-end' }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#74B7B5',
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        </TouchableOpacity>
    </InlineModal>
  );
};

export default function RootLayout() {
  // Ignore specific yellow box warnings in the UI
  LogBox.ignoreLogs([
    'Unknown event handler property',
    'TouchableMixin is deprecated',
    'Invalid DOM property'
  ]);

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
    const isPresentation = segments[0] === "presentation";

    if (!session && !inAuthGroup && !isPresentation) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  const inAuthGroup = segments[0] === "(auth)";
  const isPresentation = segments[0] === "presentation";
  const isRouting = (!session && !inAuthGroup && !isPresentation) || (!!session && inAuthGroup);

  return (
    <>
      <Head>
        <title>Fitty | AI Cat Health Tracker</title>
      </Head>
      <View style={{ flex: 1 }}>
        <WebFrame>
          <ActiveCatProvider>
            <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="camera" options={{ headerShown: false, presentation: "fullScreenModal" }} />
                <Stack.Screen name="presentation" options={{ headerShown: false }} />
              </Stack>
              {isRouting && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1A2530', zIndex: 99998 }} />
              )}
            </View>
            <GlobalToast />
            <GlobalGuestModal />
            <GlobalProcessingModal />
          </ActiveCatProvider>
        </WebFrame>
        <JudgeChat />
        <GitHubLink />
      </View>
    </>
  );
}
