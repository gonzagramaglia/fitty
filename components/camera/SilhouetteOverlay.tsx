import { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Ellipse, Polygon, G } from 'react-native-svg';

type SilhouetteOverlayProps = {
  type: 'top' | 'side';
};

const { width, height } = Dimensions.get('window');

/**
 * SilhouetteOverlay renders a semi-transparent dashed outline to guide the user
 * when taking photos of their cat. It switches between 'top' and 'side' views
 * and includes a neon scanner animation.
 *
 * @param props - Component props containing the type of silhouette to render ('top' | 'side').
 */
export function SilhouetteOverlay({ type }: SilhouetteOverlayProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 460, // approximate height to scan
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      {/* Wrapper to contain the SVG and the scanner */}
      <View style={{ width: 360, height: 480, overflow: 'hidden', position: 'relative' }}>
        <Svg height={480} width={360} viewBox="0 0 300 400">
          {type === 'top' ? (
            // Top-down cat silhouette
            <>
              {/* Tail */}
              <Path d="M 150 320 Q 150 380 180 370" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Body */}
              <Ellipse cx="150" cy="200" rx="70" ry="120" fill="rgba(0,0,0,0.2)" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Head */}
              <Ellipse cx="150" cy="80" rx="45" ry="40" fill="rgba(0,0,0,0.4)" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Ears */}
              <Polygon points="115,50 125,10 140,40" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinejoin="round" />
              <Polygon points="185,50 175,10 160,40" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinejoin="round" />
            </>
          ) : (
            // Side-profile cat silhouette
            <G transform="translate(0, -20)">
              {/* Tail */}
              <Path d="M 58 230 Q 18 180 38 120" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Back Leg */}
              <Path d="M 75 260 L 75 330" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinecap="round" />
              <Path d="M 105 270 L 105 330" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinecap="round" />
              {/* Front Leg */}
              <Path d="M 205 270 L 205 330" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinecap="round" />
              <Path d="M 235 260 L 235 330" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinecap="round" />
              {/* Body */}
              <Ellipse cx="155" cy="210" rx="100" ry="60" fill="rgba(0,0,0,0.2)" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Head */}
              <Ellipse cx="235" cy="130" rx="40" ry="40" fill="rgba(0,0,0,0.4)" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" />
              {/* Ears */}
              <Polygon points="215,95 225,55 240,90" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinejoin="round" />
              <Polygon points="245,90 255,60 265,100" fill="none" stroke="rgba(253, 224, 71, 0.8)" strokeWidth="6" strokeDasharray="10, 10" strokeLinejoin="round" />
            </G>
          )}
        </Svg>

        {/* Neon Scanner Bar */}
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#FDE047', // yellow
          shadowColor: '#FDE047',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 10,
          elevation: 5,
          transform: [{ translateY: scanAnim }]
        }} />
      </View>
    </View>
  );
}
