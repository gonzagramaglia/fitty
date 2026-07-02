import React, { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, FlatList, LayoutChangeEvent, useWindowDimensions, DeviceEventEmitter } from "react-native";
import { supabase } from "../../lib/supabase";
import { getFriendlySupabaseError } from "../../lib/supabaseHelpers";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ONBOARDING_SLIDES = [
  {
    id: "1",
    title: "AI Cat Health Tracker",
    description: "Analyze your cat's health with the power of artificial intelligence.",
    image: require("../../assets/images/fitty-onboarding-how-it-works-1.png"),
  },
  {
    id: "2",
    title: "Simple Process",
    description: "Just take two photos of your cat and record a quick voice note.",
    image: require("../../assets/images/fitty-onboarding-how-it-works-2.png"),
  },
  {
    id: "3",
    title: "Results & AI Chat",
    description: "Get an accurate BCS score and chat with Vet AI about your cat's health.",
    image: require("../../assets/images/fitty-onboarding-how-it-works-3.png"),
  },
];

export default function LoginScreen() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [containerWidth, setContainerWidth] = useState(0);

  const handleGuestLogin = async () => {
    try {
      setIsGuestLoading(true);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      const message = "Temporary Guest Account. Data is saved locally and will be lost if you clear your browser data or sign out.";
      DeviceEventEmitter.emit('showToast', { message, persistent: true });
      
      // Router redirect is handled automatically by the _layout.tsx session listener
    } catch (err: any) {
      DeviceEventEmitter.emit('showToast', getFriendlySupabaseError(err.message));
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // Router redirect is handled automatically by the _layout.tsx session listener
    } catch (err: any) {
      DeviceEventEmitter.emit('showToast', getFriendlySupabaseError(err.message));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      setShowOnboarding(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  if (showOnboarding) {
    return (
      <View 
        className="flex-1 bg-background" 
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        onLayout={onLayout}
      >
        {containerWidth > 0 && (
          <FlatList
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            getItemLayout={(data, index) => ({
              length: containerWidth,
              offset: containerWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width: containerWidth, flexShrink: 0 }} className="items-center px-6 mt-24">
                <Image 
                  source={item.image} 
                  style={{ width: 280, height: 280 }}
                  resizeMode="contain"
                />
                <View className="h-28 mt-2 items-center">
                  <Text className="text-2xl font-bold font-sans text-text-primary text-center mb-2">
                    {item.title}
                  </Text>
                  <Text className="text-base text-text-secondary text-center px-4">
                    {item.description}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
        
        {/* Footer Area */}
        <View className="px-6 pb-24">
          {/* Pagination Dots */}
          <View className="flex-row justify-center space-x-2 mb-12 gap-2">
            {ONBOARDING_SLIDES.map((_, index) => (
              <View 
                key={index}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index ? "w-6 bg-primary-cool" : "w-2 bg-primary-cool-light"
                }`}
              />
            ))}
          </View>

          {/* Buttons */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => setShowOnboarding(false)}
              className="py-3 px-4"
            >
              <Text className="text-text-muted font-medium text-base">Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNext}
              className="bg-primary-warm py-3 px-8 rounded-xl"
            >
              <Text className="text-primary-warm-foreground font-semibold text-base">
                {currentIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 12 }}>
      {/* Top Section - Logo & Branding */}
      <View className="flex-1 items-center justify-center">
        <Image 
          source={require("../../assets/images/fitty-logo.png")} 
          style={{ width: 140, height: 140, marginBottom: 4, borderRadius: 24 }}
          resizeMode="contain"
        />
        <Text className="text-4xl font-sans text-text-primary font-black tracking-tight mb-2">Fitty</Text>
        <Text className="text-base text-text-secondary text-center">Your cat's personal health companion.</Text>
      </View>

      {/* Bottom Section - Actions */}
      <View className="w-full mb-8">
        <View className="mb-6">
          {/* Secondary Action - OAuth (temporarily disabled) */}
          <TouchableOpacity 
            className="bg-background border border-border py-4 rounded-xl flex-row justify-center items-center shadow-sm mb-4 opacity-40"
            onPress={() => {}}
            disabled={true}
          >
            <Ionicons name="logo-google" size={20} color="#1A1C1E" style={{ marginRight: 12 }} />
            <Text className="text-text-primary font-bold text-base font-sans">
              Continue with Google (Soon)
            </Text>
          </TouchableOpacity>

          {/* Primary Action - Guest Mode */}
          <TouchableOpacity 
            className={`bg-primary-warm py-4 rounded-xl flex-row justify-center items-center ${isGuestLoading ? 'opacity-50' : ''}`}
            onPress={handleGuestLogin}
            disabled={isGuestLoading || isGoogleLoading}
          >
            <Ionicons name="flash-outline" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text className="text-white font-bold text-base font-sans">
              {isGuestLoading ? 'Entering...' : 'Continue as Guest (Judges)'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-text-muted text-center px-4">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </Text>
      </View>
    </View>
  );
}
