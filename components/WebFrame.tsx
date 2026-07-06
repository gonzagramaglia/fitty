import React from "react";
import { Platform, View, StyleSheet, Text, useWindowDimensions } from "react-native";
import { useSegments } from "expo-router";

/**
 * WebFrame is a wrapper component that constrains the app's maximum width
 * on the web, simulating a mobile device viewport in the browser.
 *
 * @param props - Contains the children elements to wrap.
 */
export function WebFrame({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const isPresentation = segments[0] === 'presentation';
  const { width } = useWindowDimensions();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 bg-text-primary items-center justify-center p-6">
      <View 
        className={`w-full bg-text-secondary rounded-[56px] p-3 relative ${isPresentation ? 'max-w-[1024px] h-[768px]' : 'max-w-[400px] h-full max-h-[850px]'}`}
        style={{ boxShadow: "0px 20px 24px rgba(0, 0, 0, 0.25)" }}
      >
        {/* Fake Dynamic Island (Notch) */}
        <View 
          className="absolute top-3 left-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-50"
          style={{ transform: [{ translateX: -60 }] }}
        />
        {/* Inner Screen */}
        <View className="web-frame-content flex-1 bg-surface rounded-[44px] overflow-hidden" nativeID="fitty-app-container">
          {children}
        </View>
      </View>

      {/* Footer */}
      <Text className="mt-6 text-text-muted text-sm text-center">
        Proudly built for{' '}
        <Text 
          className="font-bold underline"
          style={{ color: '#ffdf21', cursor: 'pointer' } as any}
          onPress={() => window.open("https://hackthekitty.com/", "_blank", "noopener,noreferrer")}
        >
        #hackthekitty
      </Text>
      {width <= 768 ? '\nusing ' : ' using '}
      <Text
          className="text-text-inverse underline font-semibold"
          style={{ cursor: 'pointer' } as any}
          onPress={() => window.open("https://kiro.dev", "_blank", "noopener,noreferrer")}
        >
          Kiro
        </Text>
        ,{' '}
        <Text
          className="text-text-inverse underline font-semibold"
          style={{ cursor: 'pointer' } as any}
          onPress={() => window.open("https://www.aikido.dev", "_blank", "noopener,noreferrer")}
        >
          Aikido
        </Text>
        , and{' '}
        <Text
          className="text-text-inverse underline font-semibold"
          style={{ cursor: 'pointer' } as any}
          onPress={() => window.open("https://temporal.io", "_blank", "noopener,noreferrer")}
        >
          Temporal
        </Text>
        .
      </Text>
    </View>
  );
}
