import { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, TouchableOpacity, Linking } from 'react-native';
import { Sparkles, AlertCircle, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCameraContext } from '../../app/camera/_layout';
import { supabase } from '../../lib/supabase';
import { useActiveCat } from '../../lib/ActiveCatContext';
import { BCSGauge } from '../ui/BCSGauge';

/**
 * Screen displayed while the AI is processing the captured health check data.
 * Subscribes to Supabase Realtime to detect when the Temporal workflow
 * has finished inserting the result into the health_checks table.
 * Automatically navigates to the Results screen once the row appears.
 *
 * @returns React component rendering the processing view.
 */
export default function ProcessingScreen() {
  const router = useRouter();
  const { processingState, setProcessingState } = useCameraContext();
  const { activeCatId, setSelectedCheckId } = useActiveCat();
  const { hasVoiceNote, hasTextNote } = processingState;

  const [dots, setDots] = useState('');
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; score: number } | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.is_anonymous) {
        setIsGuest(true);
      }
    });
  }, []);

  const hasContext = hasVoiceNote || hasTextNote;

  const loadingTexts = hasContext ? [
    "Analyzing image dimensions...",
    "Detecting body outline...",
    "Comparing with veterinary BCS standards...",
    "Processing contextual notes...",
    "Generating final health report..."
  ] : [
    "Analyzing image dimensions...",
    "Detecting body outline...",
    "Scanning for physical cues...",
    "Comparing with veterinary BCS standards...",
    "Generating final health report..."
  ];

  // Subscribe to Supabase Realtime for the new health_checks row
  useEffect(() => {
    if (!activeCatId) return;

    const channel = supabase
      .channel('health-check-result')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_checks',
          filter: `cat_id=eq.${activeCatId}`,
        },
        (payload) => {
          const newRecord = payload.new as { id: string; status: string; bcs_score?: number };
          if (newRecord?.id && typeof newRecord.id === 'string') {
            console.log('[processing] Health check event:', payload.eventType, newRecord.id, 'status:', newRecord.status);

            if (newRecord.status === 'failed') {
              setHasFailed(true);
            } else if (newRecord.status === 'completed') {
              setSuccessData({ id: newRecord.id, score: newRecord.bcs_score || 5 });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCatId, router, setProcessingState]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Text rotation — stops at the last item, then triggers "still processing" after 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => {
        if (prev >= loadingTexts.length - 1) {
          clearInterval(interval);
          return prev; // Stay on last item
        }
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [loadingTexts.length]);

  // Show "still processing" screen 6 seconds after reaching the last loading text
  useEffect(() => {
    if (loadingTextIndex >= loadingTexts.length - 1) {
      const timeout = setTimeout(() => {
        setIsTakingLong(true);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [loadingTextIndex, loadingTexts.length]);

  // Progress bar animation (simulating progress over 20 seconds)
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 90, // Only go to 90% — last 10% is instant on result arrival
      duration: 20000,
      useNativeDriver: false,
    }).start();
  }, []);

  const getContextText = () => {
    if (hasVoiceNote) return ' and your voice note';
    if (hasTextNote) return ' and your text note';
    return '';
  };

  if (hasFailed) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
        <View className="w-24 h-24 bg-red-50 rounded-3xl items-center justify-center mb-8 border border-red-100">
          <AlertCircle color="#EF4444" size={40} />
        </View>

        <Text className="text-[#1A303F] text-3xl font-black tracking-tight text-center mb-4">
          Analysis Failed
        </Text>

        <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-10">
          We encountered an issue while analyzing the photos and could not complete the health check. Please ensure the photos are clear and try again.
        </Text>

        <TouchableOpacity
          className="bg-primary-cool w-full py-4 rounded-2xl flex-row justify-center shadow-sm"
          onPress={() => {
            setProcessingState({ hasVoiceNote: false, hasTextNote: false });
            router.replace('/camera');
          }}
        >
          <Text className="text-white font-bold text-lg">Go Back & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (successData) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
        <View className="w-24 h-24 bg-green-50 rounded-3xl items-center justify-center mb-8 border border-green-100 shadow-sm">
          <Sparkles color="#10B981" size={40} />
        </View>

        <Text className="text-[#1A303F] text-3xl font-black tracking-tight text-center mb-2">
          Analysis Complete!
        </Text>

        <Text className="text-[#64748B] text-center text-base leading-relaxed px-4 mb-8">
          The AI has finished reviewing the photos and notes.
        </Text>

        <View className="w-full bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0] mb-8">
          <BCSGauge score={successData.score} />
        </View>

        <TouchableOpacity
          className="bg-[#1A2530] w-full py-4 rounded-2xl flex-row justify-center shadow-md"
          onPress={() => {
            setProcessingState({ hasVoiceNote: false, hasTextNote: false });
            setSelectedCheckId(successData.id);
            router.replace('/(tabs)/history');
          }}
        >
          <Text className="text-white font-bold text-lg">View Full Health Report</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isTakingLong) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
        <View className="w-24 h-24 bg-[#FFFBEB] rounded-3xl items-center justify-center mb-6 border border-[#FDE047]/30">
          <Sparkles color="#EAB308" size={40} />
        </View>

        <Text className="text-[#EAB308] text-3xl font-black tracking-tight text-center mb-3">
          Still Processing{dots}
        </Text>

        <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-6">
          Taking a bit longer than usual, but don't worry. Your analysis is running safely in the background thanks to <Text className="font-bold text-blue-500" onPress={() => Linking.openURL('https://temporal.io')}>Temporal.io</Text>. Results will appear automatically.
        </Text>

        <TouchableOpacity
          className="bg-primary-cool w-full py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
          onPress={async () => {
            // Find the processing health check and navigate to it
            setProcessingState({ hasVoiceNote: false, hasTextNote: false });
            if (activeCatId) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: processingCheck } = await supabase
                  .from('health_checks')
                  .select('id')
                  .eq('cat_id', activeCatId)
                  .eq('user_id', user.id)
                  .in('status', ['processing', 'failed'])
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (processingCheck?.id) {
                  setSelectedCheckId(processingCheck.id);
                  router.replace('/(tabs)/history');
                  return;
                }
              }
            }
            router.replace('/(tabs)');
          }}
        >
          <Text className="text-white font-bold text-lg">View Current Health Check</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
      {/* Icon Container with subtle animation effect */}
      <View className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] items-center justify-center mb-8 relative">
        <Sparkles color="#EAB308" size={40} />
        <View className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-sm border border-[#E2E8F0]">
          <ActivityIndicator size="small" color="#EAB308" />
        </View>
      </View>

      <Text className="text-[#EAB308] text-3xl font-black tracking-tight text-center mb-4">
        Analyzing Health{dots}
      </Text>

      <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-6">
        Claude 5 Sonnet is currently <Text className="font-bold text-[#1A303F]">evaluating the top & side photos{getContextText()}</Text> to determine the BCS score.
      </Text>

      {/* Progress Bar Container */}
      <View className="w-full max-w-sm mb-4">
        <View className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-[#EAB308] rounded-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }}
          />
        </View>
      </View>

      {/* Rotating Status Text */}
      <View className="bg-white px-6 py-4 rounded-2xl w-full max-w-sm border border-[#E2E8F0] shadow-sm">
        <Text className="text-[#74B7B5] text-center font-bold text-sm tracking-widest uppercase">
          {loadingTexts[loadingTextIndex]}
        </Text>
      </View>

      {isGuest && (
        <View className="bg-blue-50/80 px-4 py-3 rounded-xl border border-blue-200 w-full max-w-sm flex-row items-center mt-6">
          <AlertCircle color="#3B82F6" size={20} style={{ marginRight: 12, marginTop: 2 }} className="self-start" />
          <Text className="text-blue-800 text-sm flex-1 leading-relaxed">
            <Text className="font-bold">Judge Mode Simulation:</Text> This analysis is simulated. For the real AI experience, please log in with a Google account.
          </Text>
        </View>
      )}
    </View>
  );
}
