import React, { createContext, useContext, useState } from 'react';
import { Stack } from 'expo-router';

/**
 * Context type for managing transient camera state between screens.
 */
type CameraContextType = {
  processingState: { hasVoiceNote: boolean; hasTextNote: boolean };
  setProcessingState: (state: { hasVoiceNote: boolean; hasTextNote: boolean }) => void;
};

const CameraContext = createContext<CameraContextType | null>(null);

/**
 * Hook to access the camera context state.
 * Throws an error if used outside of a CameraContext.Provider.
 * 
 * @returns The camera context object.
 */
export function useCameraContext() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCameraContext must be used within CameraContext.Provider');
  return ctx;
}

/**
 * Layout component for the camera feature stack.
 * Provides the CameraContext to its child screens to avoid passing state via URL parameters.
 * 
 * @returns React component rendering the camera stack layout.
 */
export default function CameraLayout() {
  const [processingState, setProcessingState] = useState({ hasVoiceNote: false, hasTextNote: false });

  return (
    <CameraContext.Provider value={{ processingState, setProcessingState }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
      </Stack>
    </CameraContext.Provider>
  );
}
