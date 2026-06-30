import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useCameraContext } from './_layout';

/**
 * Screen displayed while the AI is processing the captured health check data.
 * Simulates a loading state while awaiting the Temporal workflow completion.
 * 
 * @returns React component rendering the processing view.
 */
export default function ProcessingScreen() {
  const { processingState } = useCameraContext();
  const { hasVoiceNote, hasTextNote } = processingState;
  const [dots, setDots] = useState('');
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
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
  }, []);

  // Progress bar animation (simulating progress over 15 seconds)
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 15000,
      useNativeDriver: false, // width animation doesn't support native driver
    }).start();
  }, []);

  const getContextText = () => {
    if (hasVoiceNote) return ' and your voice note';
    if (hasTextNote) return ' and your text note';
    return '';
  };

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
        Claude 4.3 Sonnet is currently <Text className="font-bold text-[#1A303F]">evaluating the top & side photos{getContextText()}</Text> to determine the BCS score.
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
