import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const GitHubLink = () => {
  if (Platform.OS !== 'web') {
    return null; // Only render on web for the hackathon demo
  }

  const handlePress = () => {
    Linking.openURL('https://github.com/gonzagramaglia/fitty');
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 32,
      left: 32,
      zIndex: 100000, // Ensure it's above WebFrame
      alignItems: 'flex-start',
      pointerEvents: 'box-none'
    }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#1A2530', // Dark navy to contrast with the yellow Judge AI button
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Feather name="github" color="#ffffff" size={32} />
      </TouchableOpacity>
    </View>
  );
};
