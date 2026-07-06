import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, FlatList, LayoutChangeEvent, useWindowDimensions, DeviceEventEmitter, Platform, Animated, ScrollView, Linking } from "react-native";
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
  // If this is an OAuth redirect callback, skip onboarding
  const isOAuthRedirect = Platform.OS === 'web' && typeof window !== 'undefined' && 
    (window.location.hash.includes('access_token') || window.location.search.includes('code='));
  const [showOnboarding, setShowOnboarding] = useState(!isOAuthRedirect);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'guest' | 'google' | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [containerWidth, setContainerWidth] = useState(0);

  // Breathing animation for the logo
  const logoScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.07, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleGuestLogin = async () => {
    try {
      setIsGuestLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      const message = "Temporary Guest Account. Data is saved locally and will be lost if you clear your browser data or sign out.";
      DeviceEventEmitter.emit('showToast', { message, persistent: true });
      
      // Router redirect is handled automatically by the _layout.tsx session listener
    } catch (err: unknown) {
      DeviceEventEmitter.emit('showToast', getFriendlySupabaseError(err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
        }
      });
      if (error) throw error;
      // Router redirect is handled automatically by the _layout.tsx session listener
    } catch (err: unknown) {
      DeviceEventEmitter.emit('showToast', getFriendlySupabaseError(err instanceof Error ? err.message : "Unknown error"));
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
        <View className="px-6 pb-[88px]">
          {/* Pagination Dots */}
          <View className="flex-row justify-center space-x-2 mb-9 gap-2">
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
          <View className="flex-row items-center justify-center">
            <TouchableOpacity 
              onPress={handleNext}
              className="py-3 px-8 rounded-xl flex-row items-center"
              style={{ backgroundColor: '#FFD700' }}
            >
              <Text style={{ color: '#1A2530' }} className="font-semibold text-base">
                {currentIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#1A2530" style={{ marginLeft: 8 }} />
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
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image 
            source={require("../../assets/images/fitty-logo.png")} 
            style={{ width: 140, height: 140, marginBottom: 4, borderRadius: 24 }}
            resizeMode="contain"
          />
        </Animated.View>
        <Text className="text-4xl font-sans text-text-primary font-black tracking-tight mb-2">Fitty</Text>
        <Text className="text-base text-text-secondary text-center">Keep your cat healthy with{'\n'}AI-powered body scoring & vet insights.</Text>
      </View>

      {/* Bottom Section - Actions */}
      <View className="w-full mb-8">
        <View className="mb-6">
          {/* Secondary Action - OAuth */}
          <TouchableOpacity 
            className="bg-background border border-border py-4 rounded-xl flex-row justify-center items-center shadow-sm mb-4"
            onPress={() => handleGoogleLogin()}
            disabled={isGuestLoading || isGoogleLoading}
          >
            <Ionicons name="logo-google" size={20} color="#1A1C1E" style={{ marginRight: 12 }} />
            <Text className="text-text-primary font-bold text-base font-sans">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Primary Action - Guest Mode */}
          <TouchableOpacity 
            className={`py-4 rounded-xl flex-row justify-center items-center ${isGuestLoading ? 'opacity-50' : ''}`}
            style={{ backgroundColor: '#FFD700' }}
            onPress={() => { setPendingAction('guest'); setTermsVisible(true); }}
            disabled={isGuestLoading || isGoogleLoading}
          >
            <Ionicons name="flash-outline" size={20} color="#1A2530" style={{ marginRight: 12 }} />
            <Text style={{ color: '#1A2530' }} className="font-bold text-base font-sans">
              {isGuestLoading ? 'Entering...' : 'Continue as Guest (Judges)'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { setPendingAction(null); setTermsVisible(true); }}>
          <Text className="text-xs text-text-muted text-center px-4">
            Read our <Text className="underline text-primary-cool-dark font-bold">Terms & Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms Modal — rendered as absolute overlay to stay within WebFrame */}
      {termsVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}>
          <View className="items-center px-6 py-4 border-b border-border" style={{ paddingTop: 56 }}>
            <Text className="text-lg font-bold text-text-primary">Terms & Privacy</Text>
          </View>
          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-black text-text-primary mb-4">🐾 Fitty Terms of Service</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              Last updated: July 2026. By using Fitty, you agree to the following (very serious) terms:
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">1. Acceptance of Cat Supremacy</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              By using this app, you acknowledge that cats are superior beings. Fitty is exclusively for cats — no dogs, no hamsters, no exceptions.
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">2. Photo Usage</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              Your cat photos are stored securely and used exclusively for health analysis. We do not share them with third parties, though our AI may silently admire how cute your cat is.
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">3. Not a Vet</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              Fitty provides BCS estimates — not medical diagnoses. If your cat gives you "the look," please consult an actual veterinarian. We cannot prescribe treats.
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">4. AI Limitations</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              Our AI is smart but not infallible. It cannot determine if your cat is plotting world domination (they probably are).
            </Text>

            <Text className="text-2xl font-black text-text-primary mb-4 mt-4">🔒 Privacy Policy</Text>

            <Text className="text-base font-bold text-text-primary mb-2">What we collect</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              • Photos of your cat (top and side views){'\n'}
              • Optional voice notes and text observations{'\n'}
              • Basic account info (email or anonymous session){'\n'}
              • Cat profile data (name, breed, age, weight)
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">What we don't do</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-4">
              • Sell your data{'\n'}
              • Share photos with third parties{'\n'}
              • Train models on your cat's majestic physique without consent{'\n'}
              • Judge you for the amount of cat photos on your phone
            </Text>

            <Text className="text-base font-bold text-text-primary mb-2">Security</Text>
            <Text className="text-sm text-text-secondary leading-relaxed mb-8">
              All data is encrypted in transit and at rest via Supabase. Row Level Security ensures you can only access your own cat's data. AI workflows are orchestrated by <Text className="font-bold text-primary-cool-dark" onPress={() => Linking.openURL('https://temporal.io')}>Temporal.io</Text> for durable, reliable execution. Our infrastructure is continuously monitored by <Text className="font-bold text-primary-cool-dark" onPress={() => Linking.openURL('https://www.aikido.dev')}>Aikido Security</Text>. Your cat's secrets are safe with us.
            </Text>
          </ScrollView>
          <View className="px-6 pb-[84px] pt-4 border-t border-border">
            {pendingAction ? (
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => { setTermsVisible(false); setPendingAction(null); }}
                  className="py-3.5 rounded-2xl bg-surface-tertiary items-center" style={{ flex: 1 }}
                >
                  <Text className="font-bold text-text-secondary text-base">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    const action = pendingAction;
                    setPendingAction(null);
                    // Don't close terms until login redirect happens (avoids flash)
                    if (action === 'guest') {
                      setTermsVisible(false);
                      handleGuestLogin();
                    } else {
                      handleGoogleLogin();
                      // Google OAuth redirects away, so the overlay stays until navigation
                    }
                  }}
                  className="py-3.5 rounded-2xl bg-primary-cool items-center" style={{ flex: 2 }}
                >
                  <Text className="text-white font-bold text-base">Purrfect, I Accept 😸</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setTermsVisible(false)} className="bg-primary-cool py-3.5 rounded-2xl items-center">
                <Text className="text-white font-bold text-base">Purrfect, take me back 😸</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
