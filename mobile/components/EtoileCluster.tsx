// Saybon v2 — L'Étoile Progress Visualization Particle Cluster
// Renders an organic cluster of drifting and pulsing dots representing mastery.
// Powered by hardware-accelerated Reanimated loop configurations for perfect 60fps.

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../theme/tokens';

const DOT_COUNT = 24;

interface DriftingDotProps {
  index: number;
  theme: typeof COLORS.light;
  isDarkMode: boolean;
}

function DriftingDot({ index, theme, isDarkMode }: DriftingDotProps) {
  // Generate deterministic but random-looking coordinates inside a circle
  const radius = 20 + (index * 53.7) % 60; // radius between 20 and 80
  const angle = (index * 137.5 * Math.PI) / 180; // golden angle spiral distribution
  
  const initialX = Math.cos(angle) * radius;
  const initialY = Math.sin(angle) * radius;

  // Dot characteristics
  const size = 3 + (index % 5); // size between 3 and 7
  const isSage = index % 3 !== 0; // 66% Sage Green, 33% Warm Stone Gray
  const dotColor = isSage 
    ? theme.primary 
    : (isDarkMode ? '#cbc6bc' : '#615e56');

  // Reanimated shared values for float/drift and scale/opacity pulsing
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const opacity = useSharedValue(0.1 + (index % 4) * 0.1); // initial opacity 0.1 - 0.4
  const scale = useSharedValue(0.9 + (index % 3) * 0.05); // initial scale 0.9 - 1.0

  useEffect(() => {
    // Drifting float loop
    const driftRange = 5 + (index % 6);
    const driftDuration = 4000 + (index % 5) * 1200;
    const delay = index * 80;

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialX + (index % 2 === 0 ? driftRange : -driftRange), {
            duration: driftDuration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(initialX, {
            duration: driftDuration,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialY + (index % 2 === 0 ? -driftRange : driftRange), {
            duration: driftDuration + 500,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(initialY, {
            duration: driftDuration + 500,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    // Subtle scale and opacity pulse loop
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.4 + (index % 3) * 0.15, {
          duration: 2500 + (index % 4) * 500,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.15, {
          duration: 3000 + (index % 3) * 600,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
        },
      ]}
    />
  );
}

interface EtoileClusterProps {
  theme: typeof COLORS.light;
  isDarkMode: boolean;
}

export function EtoileCluster({ theme, isDarkMode }: EtoileClusterProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <DriftingDot 
          key={i} 
          index={i} 
          theme={theme} 
          isDarkMode={isDarkMode} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 192,
    height: 192,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
