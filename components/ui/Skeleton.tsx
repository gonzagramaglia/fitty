import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(Animated.View, { className: 'style' });

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
};

/**
 * Skeleton provides a generic animated placeholder for loading states.
 * It uses Reanimated to pulse opacity, indicating background activity.
 *
 * @param props - Styling configuration including width, height, and border radius.
 */
export function Skeleton({ width, height, borderRadius = 8, className = '', style }: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  return (
    <Animated.View
      className={`bg-[#94a3b8] ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}
