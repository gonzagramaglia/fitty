import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCameraContext } from './_layout';
import { supabase } from '../../lib/supabase';
import { useActiveCat } from '../../lib/ActiveCatContext';

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
  const { activeCatId } = useActiveCat();
  const { hasVoiceNote, hasTextNote } = processingState;
  
  const [dots, setDots] = useState('');
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

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
          event: 'INSERT',
          schema: 'public',
          table: 'health_checks',
          filter: `cat_id=eq.${activeCatId}`,
        },
        (payload) => {
          const newRecord = payload.new as { id: string; status: string };
          if (newRecord?.id && typeof newRecord.id === 'string') {
            console.log('[processing] Health check result received:', newRecord.id, 'status:', newRecord.status);
            
            if (newRecord.status === 'failed') {
              setHasFailed(true);
            } else {
              // Clear transient state before leaving
              setProcessingState({ hasVoiceNote: false, hasTextNote: false });
              router.replace(`/history/${newRecord.id}`);
            }
          }
        }
      )
      .subscribe();

    // Instead of failing, we show a reassurance message after 30 seconds
    // to highlight Temporal's durable execution capabilities.
    const timeoutId = setTimeout(() => {
      console.log('[processing] Analysis taking longer than usual.');
      setIsTakingLong(true);
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
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

  // Text rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadingTexts.length]);

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

  if (isTakingLong) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
        <View className="w-24 h-24 bg-blue-50 rounded-3xl items-center justify-center mb-8 border border-blue-100">
          <Sparkles color="#3B82F6" size={40} />
        </View>

        <Text className="text-[#1A303F] text-3xl font-black tracking-tight text-center mb-4">
          Durable Execution
        </Text>
        
        <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-10">
          The AI analysis is taking a bit longer than usual. Thanks to <Text className="font-bold text-blue-500">Temporal.io</Text>, your request is running durably in the background. You can safely leave this screen and check your dashboard later!
        </Text>

        <TouchableOpacity 
          className="bg-primary-cool w-full py-4 rounded-2xl flex-row justify-center shadow-sm"
          onPress={() => {
            setProcessingState({ hasVoiceNote: false, hasTextNote: false });
            router.replace('/(tabs)');
          }}
        >
          <Text className="text-white font-bold text-lg">Go to Dashboard</Text>
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
      
      <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-10">
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
    </View>
  );
}
