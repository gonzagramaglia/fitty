import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Platform, Linking, Animated } from 'react-native';
import { Cloud, Server, Shield, Cpu, Lock, TrendingUp, BookOpen, Target, Code2, Heart, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Helper for Neo-Brutalist shadows (works perfectly on React Native Web)
const neoShadow = (x: number = 8, y: number = 8) => Platform.OS === 'web' 
  ? { boxShadow: `${x}px ${y}px 0px #000` } as any 
  : { elevation: 10 };

export default function Presentation() {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const { width, height } = containerSize;
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the down button on first slide
  useEffect(() => {
    if (currentSlide === 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentSlide]);

  const handleDemoPress = () => {
    // Navigate to the main app
    router.push('/');
  };

  if (width <= 768 && width > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 24 }}>
          OOPS.
        </Text>
        <View style={[{ backgroundColor: '#f4f9f9', padding: 24, borderWidth: 4, borderColor: '#000', marginBottom: 40, borderRadius: 16, maxWidth: 350 }, neoShadow(8, 8)]}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', textAlign: 'center', lineHeight: 28 }}>
            This presentation is built for larger screens.
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#475569', textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
            Please open this on a tablet or desktop.
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleDemoPress}
          style={[{ backgroundColor: '#74B7B5', paddingHorizontal: 24, paddingVertical: 18, borderWidth: 4, borderColor: '#000', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, neoShadow(6, 6)]}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#000', textAlign: 'center' }}>
            I prefer to launch the app
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View 
      style={{ flex: 1, backgroundColor: '#fff' }}
      onLayout={(e) => setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {width > 0 && height > 0 && (
        <>
        <ScrollView 
          ref={scrollViewRef}
          pagingEnabled 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            setCurrentSlide(Math.round(offsetY / height));
          }}
          scrollEventThrottle={100}
        >
      
      {/* Slide 1: Intro (Soft UI for Video Consistency) */}
      {/* Slide 1: Intro (Soft UI for Video Consistency) */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#f4f9f9', flexDirection: width > 768 ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', paddingHorizontal: width > 768 ? 80 : 24, paddingTop: width > 768 ? 0 : 40 }}>
        <View style={{ flex: width > 768 ? 1 : 0, paddingRight: width > 768 ? 40 : 0, alignItems: width > 768 ? 'flex-start' : 'center', marginBottom: width > 768 ? 0 : 24, marginTop: width > 768 ? 60 : 0 }}>
          <Text style={{ fontSize: width > 768 ? 60 : 36, fontWeight: '900', color: '#1A2530', marginBottom: 16, lineHeight: width > 768 ? 64 : 40, textAlign: width > 768 ? 'left' : 'center' }}>
            Monitor Your Cat's Health with AI.
          </Text>
          <Text style={{ fontSize: width > 768 ? 20 : 16, fontWeight: '500', color: '#475569', lineHeight: width > 768 ? 32 : 24, marginBottom: 0, textAlign: width > 768 ? 'left' : 'center' }}>
            Fitty estimates Body Condition Score (BCS) from just two photos and features an always-on Vet AI assistant.
          </Text>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => { Linking.openURL('https://youtu.be/nqmhqraKEKY').catch(() => {}); }}
            style={[{ marginTop: 32, backgroundColor: '#1A2530', paddingHorizontal: width > 768 ? 32 : 24, paddingVertical: width > 768 ? 16 : 12, borderWidth: 3, borderColor: '#000', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, neoShadow(2, 2)]}
          >
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' }} />
            <Text style={{ fontSize: width > 768 ? 18 : 16, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>
              Watch Video Demo
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: width > 768 ? 1 : 0, alignItems: 'center', justifyContent: 'center', marginTop: width > 768 ? 0 : 24 }}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            <Image 
              source={require('../assets/images/fitty-header-bkg.png')} 
              style={{ width: width > 768 ? 500 : 280, height: width > 768 ? 600 : 300 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slide 2: The Problem */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#FF5C5C', justifyContent: 'center', paddingHorizontal: '10%' }}>
        <Text style={{ fontSize: width > 768 ? 72 : 48, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 32 }}>
          The Problem: {"\n"}
          <Text style={{ color: '#fff', textShadowColor: '#000', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 }}>Humans are lazy.</Text>
        </Text>
        <View style={[{ backgroundColor: '#fff', padding: 32, borderWidth: 4, borderColor: '#000', maxWidth: 800, borderRadius: 24 }, neoShadow(12, 12)]}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#000', lineHeight: 36 }}>
            Relying on humans is highly inefficient. They guess. They lack precision.
          </Text>
        </View>


      </View>

      {/* Slide 3: The Solution */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#74B7B5', justifyContent: 'center', paddingHorizontal: width > 768 ? '10%' : '5%' }}>
        <View style={{ flexDirection: width > 768 ? 'row' : 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: width > 768 ? 1 : 0, maxWidth: 600, alignItems: width > 768 ? 'flex-start' : 'center', marginBottom: width > 768 ? 0 : 24 }}>
            <Text style={{ fontSize: width > 768 ? 72 : 40, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 24, textAlign: width > 768 ? 'left' : 'center' }}>
              The Solution: {"\n"}
              <Text style={{ color: '#fff', textShadowColor: '#000', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 }}>Fitty AI.</Text>
            </Text>
            <View style={[{ backgroundColor: '#fff', padding: width > 768 ? 24 : 16, borderWidth: width > 768 ? 4 : 2, borderColor: '#000', marginBottom: width > 768 ? 32 : 0, borderRadius: 24 }, neoShadow()]}>
              <Text style={{ fontSize: width > 768 ? 22 : 16, fontWeight: '600', color: '#000', lineHeight: width > 768 ? 32 : 24, textAlign: width > 768 ? 'left' : 'center' }}>
                An ecosystem designed to eliminate human error entirely. Zero guessing. Total precision.
              </Text>
            </View>
          </View>
          <View style={{ flex: width > 768 ? 1 : 0, alignItems: 'center', justifyContent: 'center', marginTop: width > 768 ? 0 : 16 }}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              style={[{ borderRadius: width > 768 ? 40 : 24, backgroundColor: '#1A2530' }, neoShadow(12, 12)]}
            >
              <View style={{ width: width > 768 ? 320 : 180, height: width > 768 ? 674 : 379, borderRadius: width > 768 ? 40 : 24, overflow: 'hidden', borderWidth: width > 768 ? 4 : 2, borderColor: '#1A2530' }}>
                <Image 
                  source={require('../assets/images/onboarding.png')} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Slide 4: Why Fitty? */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#f4f9f9', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '5%' }}>
        <Text style={{ fontSize: width > 768 ? 56 : 32, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 48, textAlign: 'center' }}>
          Why Fitty?
        </Text>
        <View style={{ flexDirection: width > 768 ? 'row' : 'column', justifyContent: 'center', maxWidth: 1000, width: '90%' }}>
          {[
            { icon: Heart, title: 'Absolute Perfection', text: 'Fast, simple, and reliable tracking to maintain our flawless physique.' },
            { icon: MessageCircle, title: 'Contextual Vet AI', text: 'Because humans always have follow-up questions about our care.' },
          ].map((benefit, idx) => (
            <View key={idx} style={[{ flex: width > 768 ? 1 : 0, backgroundColor: '#fff', borderWidth: width > 768 ? 4 : 2, borderColor: '#000', borderRadius: 24, padding: width > 768 ? 32 : 16, alignItems: width > 768 ? 'center' : 'flex-start', flexDirection: width > 768 ? 'column' : 'row', marginHorizontal: width > 768 ? 16 : 0, marginBottom: width > 768 ? 0 : 16 }, neoShadow()]}>
              <View style={{ borderWidth: 2, borderColor: '#000', borderRadius: 16, backgroundColor: '#74B7B5', padding: width > 768 ? 12 : 8, marginBottom: width > 768 ? 24 : 0, marginRight: width > 768 ? 0 : 16 }}>
                <benefit.icon size={width > 768 ? 48 : 24} color="#000" />
              </View>
              <View style={{ flex: width > 768 ? 0 : 1 }}>
                <Text style={{ fontSize: width > 768 ? 24 : 16, fontWeight: '800', color: '#000', marginBottom: width > 768 ? 12 : 4, textAlign: width > 768 ? 'center' : 'left' }}>{benefit.title}</Text>
                <Text style={{ fontSize: width > 768 ? 18 : 12, fontWeight: '500', color: '#000', textAlign: width > 768 ? 'center' : 'left' }}>{benefit.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Slide 5: Features (Architecture) */}
      {width > 768 ? (
        <View style={{ height, width, overflow: 'hidden', backgroundColor: '#FFDF21', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '5%' }}>
          <Text style={{ fontSize: 56, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 48, textAlign: 'center' }}>
            The Architecture
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, maxWidth: 1200 }}>
            {[
              { icon: Cloud, title: 'Anthropic & OpenAI', text: 'Claude 5 for vision & Vet AI and Whisper for audio.', url: 'https://anthropic.com/' },
              { icon: Server, title: 'Temporal Execution', text: 'Durable AI workflows. Zero dropped requests.', url: 'https://temporal.io/' },
              { icon: Shield, title: 'Aikido Security', text: 'Security is mandatory.', url: 'https://www.aikido.dev/' },
              { icon: Cpu, title: 'Kiro AI Agents', text: 'Strict spec-driven dev.', url: 'https://kiro.dev/' },
              { icon: Lock, title: 'CodeRabbit QA', text: 'Automated code reviews for edge cases.', url: 'https://coderabbit.ai/' },
              { icon: TrendingUp, title: 'Supabase & Expo', text: 'Universal frontend on PostgreSQL.', url: 'https://supabase.com/' },
            ].map((feat, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => Linking.openURL(feat.url)} style={[{ width: 320, backgroundColor: '#fff', borderWidth: 4, borderColor: '#000', borderRadius: 24, padding: 24 }, neoShadow()]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                  <View style={{ borderWidth: 2, borderColor: '#000', borderRadius: 12, backgroundColor: '#FFDF21', padding: 8 }}>
                    <feat.icon size={32} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 4 }}>{feat.title}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>{feat.text}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={{ height, width, overflow: 'hidden', backgroundColor: '#FFDF21', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '5%' }}>
            <Text style={{ fontSize: 32, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 24, textAlign: 'center' }}>
              The Architecture (1/2)
            </Text>
            <View style={{ flexDirection: 'column', width: '100%' }}>
              {[
                { icon: Cloud, title: 'Anthropic & OpenAI', text: 'Claude 5 for vision & Vet AI and Whisper for audio.', url: 'https://anthropic.com/' },
                { icon: Server, title: 'Temporal Execution', text: 'Durable AI workflows. Zero dropped requests.', url: 'https://temporal.io/' },
                { icon: Shield, title: 'Aikido Security', text: 'Security is mandatory.', url: 'https://www.aikido.dev/' },
              ].map((feat, idx) => (
                <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => Linking.openURL(feat.url)} style={[{ width: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', borderRadius: 20, padding: 12, marginBottom: 16 }, neoShadow()]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ borderWidth: 2, borderColor: '#000', borderRadius: 10, backgroundColor: '#FFDF21', padding: 6 }}>
                      <feat.icon size={24} color="#000" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 2 }}>{feat.title}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#000' }}>{feat.text}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ height, width, overflow: 'hidden', backgroundColor: '#FFDF21', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '5%' }}>
            <Text style={{ fontSize: 32, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 24, textAlign: 'center' }}>
              The Architecture (2/2)
            </Text>
            <View style={{ flexDirection: 'column', width: '100%' }}>
              {[
                { icon: Cpu, title: 'Kiro AI Agents', text: 'Strict spec-driven dev.', url: 'https://kiro.dev/' },
                { icon: Lock, title: 'CodeRabbit QA', text: 'Automated code reviews for edge cases.', url: 'https://coderabbit.ai/' },
                { icon: TrendingUp, title: 'Supabase & Expo', text: 'Universal frontend on PostgreSQL.', url: 'https://supabase.com/' },
              ].map((feat, idx) => (
                <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => Linking.openURL(feat.url)} style={[{ width: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', borderRadius: 20, padding: 12, marginBottom: 16 }, neoShadow()]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ borderWidth: 2, borderColor: '#000', borderRadius: 10, backgroundColor: '#FFDF21', padding: 6 }}>
                      <feat.icon size={24} color="#000" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 2 }}>{feat.title}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#000' }}>{feat.text}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Slide 6: AI Mindset */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#74B7B5', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '5%' }}>
        <Text style={{ fontSize: width > 768 ? 56 : 32, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: width > 768 ? 24 : 16, textAlign: 'center' }}>
          AI Engineering Mindset
        </Text>
        <View style={{ width: '90%', maxWidth: 1000 }}>
          <View style={[{ backgroundColor: '#fff', padding: width > 768 ? 16 : 12, borderWidth: width > 768 ? 3 : 2, borderColor: '#000', borderRadius: 24, marginBottom: width > 768 ? 48 : 24, marginHorizontal: width > 768 ? 16 : 0 }, neoShadow()]}>
            <Text style={{ fontSize: width > 768 ? 20 : 14, fontWeight: '700', color: '#000', textAlign: 'center' }}>
              I did not let my human just write code. We adopted strict discipline.
            </Text>
          </View>

          <View style={{ flexDirection: width > 768 ? 'row' : 'column', justifyContent: 'center' }}>
            {[
            { icon: BookOpen, title: 'Read Context', text: 'Agents must read docs before any action.', url: 'https://youtu.be/9dKA2hq4vf0' },
            { icon: Target, title: 'Scope is Sacred', text: 'Build only what is demanded.', url: 'https://youtu.be/QQEgIo4Juxg' },
            { icon: Code2, title: 'Clean Over Clever', text: 'Simple, brutally effective code.', url: 'https://youtu.be/ix8JovAfBS8' },
          ].map((prac, idx) => (
            <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => Linking.openURL(prac.url)} style={[{ flex: width > 768 ? 1 : 0, backgroundColor: '#fff', borderWidth: width > 768 ? 4 : 2, borderColor: '#000', borderRadius: 24, padding: width > 768 ? 32 : 16, alignItems: width > 768 ? 'center' : 'flex-start', flexDirection: width > 768 ? 'column' : 'row', marginHorizontal: width > 768 ? 16 : 0, marginBottom: width > 768 ? 0 : 16 }, neoShadow()]}>
              <View style={{ borderWidth: 2, borderColor: '#000', borderRadius: 16, backgroundColor: '#FFDF21', padding: width > 768 ? 12 : 8, marginBottom: width > 768 ? 24 : 0, marginRight: width > 768 ? 0 : 16 }}>
                <prac.icon size={width > 768 ? 48 : 24} color="#000" />
              </View>
              <View style={{ flex: width > 768 ? 0 : 1 }}>
                <Text style={{ fontSize: width > 768 ? 24 : 16, fontWeight: '800', color: '#000', marginBottom: width > 768 ? 12 : 4, textAlign: width > 768 ? 'center' : 'left' }}>{prac.title}</Text>
                <Text style={{ fontSize: width > 768 ? 18 : 12, fontWeight: '500', color: '#000', textAlign: width > 768 ? 'center' : 'left' }}>{prac.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        </View>
      </View>

      {/* Slide 7: Transition to Demo */}
      <View style={{ height, width, overflow: 'hidden', backgroundColor: '#FF5C5C', justifyContent: 'center', alignItems: 'center', paddingHorizontal: '10%' }}>
        <Text style={{ fontSize: width > 768 ? 72 : 48, fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: 24, textAlign: 'center' }}>
          Enough Talk.
        </Text>
        <View style={[{ backgroundColor: '#fff', padding: width > 768 ? 32 : 24, borderWidth: 4, borderColor: '#000', maxWidth: 800, marginBottom: 48, borderRadius: 24 }, neoShadow(12, 12)]}>
          <Text style={{ fontSize: width > 768 ? 32 : 24, fontWeight: '800', color: '#000', lineHeight: width > 768 ? 40 : 32, textAlign: 'center' }}>
            Let me show you how my human serves me.
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleDemoPress}
          style={[{ backgroundColor: '#FFDF21', paddingHorizontal: width > 768 ? 48 : 32, paddingVertical: width > 768 ? 24 : 16, borderWidth: 4, borderColor: '#000', borderRadius: 24 }, neoShadow()]}
        >
          <Text style={{ fontSize: width > 768 ? 28 : 20, fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>
            Launch App
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
        {/* Navigation Controls — fixed to browser viewport, next to tablet left edge (desktop only) */}
        {width > 768 && (
        <View style={{ position: 'fixed' as any, left: '9%', top: '50%', transform: [{ translateY: -135 }], zIndex: 99999, alignItems: 'center', gap: 14 }}>
          {/* Slide indicator */}
          <View style={{ 
            backgroundColor: '#1A2530', 
            borderRadius: 12, 
            paddingHorizontal: 14, 
            paddingVertical: 8, 
            marginBottom: 6,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' }}>
              {currentSlide + 1}/{width > 768 ? 7 : 8}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (currentSlide > 0) {
                scrollViewRef.current?.scrollTo({ y: (currentSlide - 1) * height, animated: true });
              }
            }}
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: currentSlide > 0 ? '#1A2530' : 'transparent',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: currentSlide > 0 ? 2 : 1,
              borderColor: currentSlide > 0 ? '#000' : 'rgba(100,116,139,0.25)',
              ...(Platform.OS === 'web' && currentSlide > 0 ? { boxShadow: '4px 4px 0px #000' } as any : {}),
            }}
            disabled={currentSlide === 0}
          >
            <Text style={{ color: currentSlide > 0 ? '#fff' : 'rgba(100,116,139,0.3)', fontSize: 28, fontWeight: '900' }}>↑</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: currentSlide === 0 ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            onPress={() => {
              const totalSlides = width > 768 ? 7 : 8;
              if (currentSlide < totalSlides - 1) {
                scrollViewRef.current?.scrollTo({ y: (currentSlide + 1) * height, animated: true });
              }
            }}
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: '#1A2530',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#000',
              ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0px #000' } as any : { elevation: 4 }),
            }}
          >
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>↓</Text>
          </TouchableOpacity>
          </Animated.View>
        </View>
        )}
        </>
      )}
    </View>
  );
}
