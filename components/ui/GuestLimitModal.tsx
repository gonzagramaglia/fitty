import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';

/**
 * Props for the GuestLimitModal component.
 */
interface GuestLimitModalProps {
  /** Whether the modal is currently visible. */
  visible: boolean;
  /** Callback invoked when the modal is dismissed. */
  onClose: () => void;
  /** Optional custom message to display. Falls back to a default guest limit message. */
  message?: string;
}

/**
 * GuestLimitModal displays a full-screen modal informing guest users that a specific
 * action is not available in Judge Mode. It auto-dismisses after 5 seconds via a
 * draining progress bar, or can be closed by tapping anywhere.
 *
 * @param props - The component props.
 * @returns The rendered modal component.
 */
export function GuestLimitModal({ visible, onClose, message }: GuestLimitModalProps) {
  const guestLimitProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      guestLimitProgress.setValue(1);
      Animated.timing(guestLimitProgress, {
        toValue: 0,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onClose();
        }
      });
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose} 
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <TouchableOpacity 
          activeOpacity={0.95} 
          onPress={onClose}
          className="bg-surface w-full max-w-[340px] rounded-3xl p-6 items-center shadow-xl relative"
        >
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4 mt-2">
            <Sparkles size={28} color="#3B82F6" />
          </View>
          <Text className="text-xl font-black text-text-primary mb-2 text-center">Judge Mode</Text>
          <Text className="text-text-secondary text-center mb-6">
            {message || "This action is not available in Judge Mode. For the full Fitty experience, please log in with a Google account."}
          </Text>

          <View className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden mt-2 items-end">
            <Animated.View 
              style={{
                height: '100%',
                backgroundColor: '#3B82F6',
                width: guestLimitProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }} 
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
