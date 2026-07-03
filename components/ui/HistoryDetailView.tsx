import React, { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Platform, Modal, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FileText, Mic, X, Play, Square } from "lucide-react-native";
import { Audio } from "expo-av";
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { useActiveCat } from "../../lib/ActiveCatContext";
import { supabase } from "../../lib/supabase";
import { BCSGauge } from "../../components/ui/BCSGauge";
import { AIReasoningCard } from "../../components/ui/AIReasoningCard";
import { RecommendationsList } from "../../components/ui/RecommendationsList";
import { Skeleton } from "../../components/ui/Skeleton";
import { ChatModal } from "../../components/ui/ChatModal";
import { Bot, MessageCircle } from "lucide-react-native";

/**
 * HistoryDetailView is the comprehensive screen displaying a single health check record.
 * It renders the original images, the calculated BCS score on a visual gauge,
 * any provided owner notes, and the detailed AI reasoning and recommendations.
 */
export default function HistoryDetailView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCheckId, setSelectedCheckId } = useActiveCat();
  const [expandedImage, setExpandedImage] = useState<any>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioRemaining, setAudioRemaining] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [ownerFirstName, setOwnerFirstName] = useState<string>('Owner');
  const [processingDots, setProcessingDots] = useState('');
  const webAudioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Need to handle missing ID gracefully since we rely on Context now
  const { healthCheck, isLoading, error } = useHealthCheck(selectedCheckId || '');

  // Initialize chat history once health check is loaded
  React.useEffect(() => {
    setChatHistory(Array.isArray(healthCheck?.chat_history) ? healthCheck.chat_history : []);
  }, [healthCheck?.id, healthCheck?.chat_history]);

  // Fetch owner first name
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name?.split(' ')[0] || (user.is_anonymous ? 'Judge' : 'Owner');
        setOwnerFirstName(name);
      }
    });
  }, []);

  // Animated dots for processing title
  React.useEffect(() => {
    if (healthCheck?.status !== 'processing') return;
    const interval = setInterval(() => {
      setProcessingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [healthCheck?.status]);

  // Preload audio duration on web
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !healthCheck?.voice_note_url) return;
    const NativeAudio = (window as any).Audio;
    const preload = new NativeAudio(healthCheck.voice_note_url);
    preload.addEventListener('loadedmetadata', () => {
      if (preload.duration && isFinite(preload.duration)) {
        setAudioDuration(Math.round(preload.duration));
      }
    });
  }, [healthCheck?.voice_note_url]);

  // Clean up audio on unmount
  React.useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
          webAudioRef.current = null;
        }
      } else {
        sound?.unloadAsync();
      }
    };
  }, [sound]);

  /**
   * Plays or stops audio playback for a voice note.
   * Uses the native HTML5 Audio API on web (bypassing expo-av) and expo-av on native.
   *
   * @param uri - The public URL of the audio file to play.
   */
  const playAudio = async (uri: string) => {
    // --- Web: use native HTML5 Audio API ---
    if (Platform.OS === 'web') {
      if (isPlaying && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.currentTime = 0;
        webAudioRef.current = null;
        setIsPlaying(false);
        setAudioRemaining(null);
        return;
      }

      try {
        // Use window.Audio explicitly to avoid conflict with expo-av Audio import
        const NativeAudio = (window as any).Audio;
        console.log('[HistoryDetailView] Attempting to play:', uri);
        const audio: HTMLAudioElement = new NativeAudio(uri);
        webAudioRef.current = audio;

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudioRemaining(null);
          webAudioRef.current = null;
        });

        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration && isFinite(audio.duration)) {
            setAudioDuration(Math.round(audio.duration));
            setAudioRemaining(Math.round(audio.duration));
          }
        });

        audio.addEventListener('timeupdate', () => {
          if (audio.duration && isFinite(audio.duration)) {
            setAudioRemaining(Math.max(0, Math.round(audio.duration - audio.currentTime)));
          }
        });

        audio.addEventListener('error', () => {
          const code = audio.error?.code;
          const msg = audio.error?.message;
          console.error('[HistoryDetailView] Audio error:', code, msg, uri);
          setIsPlaying(false);
          webAudioRef.current = null;
        });

        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('[HistoryDetailView] play() failed:', e);
        setIsPlaying(false);
        webAudioRef.current = null;
      }
      return;
    }

    // --- Native: use expo-av ---
    try {
      if (isPlaying) {
        await sound?.stopAsync();
        setIsPlaying(false);
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.log('Error playing audio', e);
    }
  };

  const getDisplayPhoto = (url: string | null, type: 'top' | 'side') => {
    if (!url) return null;
    if (url === 'https://raw.githubusercontent.com/gonzagramaglia/fitty/main/assets/images/coding-kitty.jpg' || url.includes('mock-')) {
      return type === 'top' 
        ? require('../../assets/images/cat-top-view.png')
        : require('../../assets/images/cat-side-view.png');
    }
    return { uri: url };
  };
  const headerPadding = Platform.OS === 'web' ? 48 : Math.max(insets.top, 20);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        {/* Skeleton Header */}
        <View 
          className="flex-row items-center px-4 pb-4 mb-2 bg-background border-b border-border"
          style={{ paddingTop: headerPadding }}
        >
          <View className="p-2 -ml-2">
            <ChevronLeft color="#cbd5e1" size={28} />
          </View>
          <View className="flex-1 items-center mr-8">
            <Skeleton width={80} height={20} borderRadius={4} className="mb-1" />
            <Skeleton width={120} height={12} borderRadius={4} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-4 pb-24" showsVerticalScrollIndicator={false}>
          {/* Skeleton Photos Row */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Skeleton width={60} height={12} borderRadius={4} className="mb-2 ml-1" />
              <Skeleton width="100%" height={128} borderRadius={16} />
            </View>
            <View className="flex-1">
              <Skeleton width={60} height={12} borderRadius={4} className="mb-2 ml-1" />
              <Skeleton width="100%" height={128} borderRadius={16} />
            </View>
          </View>

          {/* Skeleton BCS Gauge */}
          <Skeleton width="100%" height={120} borderRadius={16} className="mb-6" />

          {/* Skeleton AI Reasoning */}
          <Skeleton width="100%" height={160} borderRadius={16} className="mb-6" />

          {/* Skeleton Recommendations */}
          <Skeleton width="100%" height={200} borderRadius={16} className="mb-12" />
        </ScrollView>
      </View>
    );
  }

  if (error || !healthCheck) {
    return (
      <View className="flex-1 bg-surface justify-center items-center px-6">
        <Text className="text-error text-center mb-4">{error || "Health check not found"}</Text>
        <TouchableOpacity 
          className="bg-primary-cool px-6 py-3 rounded-xl"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/history");
            }
          }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(healthCheck.created_at));

  return (
    <>
      <Head>
        <title>Fitty | {healthCheck.status === 'processing' ? 'Scan processing' : (healthCheck.cats?.name ? `${healthCheck.cats.name}'s Results` : 'Results')}</title>
      </Head>
      <View className="flex-1 bg-surface">
      {/* Header */}
      <View 
        className="flex-row items-center px-4 pb-4 mb-2 bg-background border-b border-border"
        style={{ paddingTop: headerPadding }}
      >
        <TouchableOpacity 
          onPress={() => setSelectedCheckId(null)}
          className="p-2 -ml-2"
        >
          <ChevronLeft color="#1A303F" size={28} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-text-primary text-lg font-bold">
            {healthCheck.status === 'processing' ? `Scan processing${processingDots}` : (healthCheck.cats?.name ? `${healthCheck.cats.name}'s Results` : 'Results')}
          </Text>
          <Text className="text-text-muted text-xs">{dateFormatted}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-24" showsVerticalScrollIndicator={false}>
        {/* Photos Row */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Top View</Text>
            {healthCheck.top_photo_url ? (
              <TouchableOpacity onPress={() => setExpandedImage(getDisplayPhoto(healthCheck.top_photo_url, 'top'))} activeOpacity={0.8}>
                <Image 
                  source={getDisplayPhoto(healthCheck.top_photo_url, 'top')} 
                  className="w-full bg-surface-secondary rounded-2xl border border-border"
                  style={{ width: '100%', height: 128 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-full h-32 bg-surface-secondary rounded-2xl border border-border items-center justify-center">
                <Text className="text-text-muted text-xs">No image</Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Side View</Text>
            {healthCheck.side_photo_url ? (
              <TouchableOpacity onPress={() => setExpandedImage(getDisplayPhoto(healthCheck.side_photo_url, 'side'))} activeOpacity={0.8}>
                <Image 
                  source={getDisplayPhoto(healthCheck.side_photo_url, 'side')} 
                  className="w-full bg-surface-secondary rounded-2xl border border-border"
                  style={{ width: '100%', height: 128 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-full h-32 bg-surface-secondary rounded-2xl border border-border items-center justify-center">
                <Text className="text-text-muted text-xs">No image</Text>
              </View>
            )}
          </View>
        </View>

        {/* User Context Card */}
        {(healthCheck.text_note || healthCheck.voice_note_url) && (
          <View className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
            {/* Header */}
            <View className="flex-row items-center px-5 pt-4 pb-2">
              <View className="w-7 h-7 rounded-full bg-[#74B7B5]/15 items-center justify-center mr-2.5">
                <FileText color="#74B7B5" size={14} />
              </View>
              <Text className="text-text-primary text-sm font-bold tracking-wide">
                {ownerFirstName}'s Notes
              </Text>
            </View>

            <View className="px-5 pt-0 pb-4">
              {/* Text note — styled as a quote */}
              {healthCheck.text_note && (
                <View className="flex-row">
                  <View className="w-[3px] bg-[#74B7B5]/40 rounded-full mr-3 self-stretch" />
                  <Text className="text-text-primary text-sm leading-relaxed flex-1 italic">
                    {healthCheck.text_note}
                  </Text>
                </View>
              )}

              {/* Audio player — only if voice note exists */}
              {healthCheck.voice_note_url && (
                <TouchableOpacity
                  className={`flex-row items-center mt-4 px-4 py-3 rounded-xl border ${isPlaying ? 'bg-[#EAB308]/10 border-[#EAB308]/30' : 'bg-surface-secondary border-border'}`}
                  onPress={() => playAudio(healthCheck.voice_note_url!)}
                  activeOpacity={0.75}
                >
                  {isPlaying ? (
                    <Square size={15} color="#EAB308" fill="#EAB308" />
                  ) : (
                    <Play size={15} color="#74B7B5" fill="#74B7B5" />
                  )}
                  <Text className={`text-sm font-semibold ml-2.5 ${isPlaying ? 'text-[#EAB308]' : 'text-text-primary'}`}>
                    {isPlaying ? 'Stop audio' : 'Play voice note'}
                  </Text>
                  {(audioDuration || audioRemaining !== null) && (
                    <Text className="text-text-muted text-xs ml-auto font-medium">
                      {(() => {
                        const secs = isPlaying && audioRemaining !== null ? audioRemaining : audioDuration || 0;
                        return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
                      })()}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* BCS Gauge Card */}
        {healthCheck.status === 'processing' ? (
          <View className="bg-background border border-border rounded-2xl p-6 shadow-sm mb-6 mt-2 items-center">
            <Text className="text-3xl mb-3">⏳</Text>
            <Text className="text-text-primary text-base font-bold mb-2 text-center">AI Analysis In Progress</Text>
            <Text className="text-text-secondary text-sm text-center leading-relaxed">
              Powered by <Text className="font-bold text-primary-cool-dark" onPress={() => Linking.openURL('https://temporal.io')}>Temporal.io</Text>. Results will appear automatically.
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-background border border-border rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-text-primary text-base font-semibold mb-4">
                Body Condition Score
              </Text>
              <BCSGauge score={healthCheck.bcs_score} />
            </View>

            {/* AI Reasoning */}
            <View className="mb-6">
              <AIReasoningCard reasoning={healthCheck.ai_reasoning} />
            </View>

            {/* Recommendations */}
            <View className="mb-12">
              <RecommendationsList recommendations={healthCheck.recommendations} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Fullscreen Image */}
      {Platform.OS === 'web' ? (
        expandedImage && (
          <View className="absolute top-0 bottom-0 left-0 right-0 z-50 bg-black/95 justify-center items-center">
            <TouchableOpacity 
              className="absolute top-12 right-6 p-3 z-10 bg-white/10 rounded-full"
              onPress={() => setExpandedImage(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            <Image 
              source={expandedImage} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )
      ) : (
        <Modal visible={!!expandedImage} transparent={true} animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/95">
            <TouchableOpacity 
              className="absolute top-12 right-6 p-3 z-10 bg-white/10 rounded-full"
              onPress={() => setExpandedImage(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            {expandedImage && (
              <Image 
                source={expandedImage} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </View>
        </Modal>
      )}

      {/* Ask Vet AI FAB */}
      {!expandedImage && (
        <TouchableOpacity 
          className="absolute bottom-8 right-6 bg-[#1A303F] px-6 py-4 rounded-full flex-row items-center shadow-lg border border-white/10"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
          onPress={() => setChatVisible(true)}
        >
          <MessageCircle color="white" size={20} className="mr-2" />
          <Text className="text-white font-bold text-base tracking-wide">Ask Vet AI</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      {healthCheck && (
        <ChatModal 
          visible={chatVisible} 
          onClose={() => setChatVisible(false)} 
          healthCheckId={healthCheck.id} 
          initialHistory={chatHistory} 
          onHistoryUpdate={setChatHistory}
          ownerName={ownerFirstName}
          catName={healthCheck.cats?.name}
          isProcessing={healthCheck.status === 'processing'}
        />
      )}
    </View>
    </>
  );
}
