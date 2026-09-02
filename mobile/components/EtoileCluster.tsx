// Saybon v2 — L'Étoile Progress Visualization Particle Cluster
// High-performance Skia GPU particle cluster driven by a single unified clock.
// Replaces 96 concurrent Reanimated loops with one 60fps clock driving 24 dots.

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { COLORS } from '../theme/tokens';

const DOT_COUNT = 24;
const CANVAS_SIZE = 192;
const CENTER = CANVAS_SIZE / 2;

interface DotConfig {
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  driftRange: number;
  speed: number;
  phase: number;
}

interface SkiaDotProps {
  config: DotConfig;
  clock: SharedValue<number>;
}

const SkiaDot = React.memo(function SkiaDot({ config, clock }: SkiaDotProps) {
  const cx = useDerivedValue(() => {
    'worklet';
    const t = clock.value * config.speed + config.phase;
    return CENTER + config.initialX + Math.sin(t) * config.driftRange;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const t = clock.value * config.speed + config.phase;
    return CENTER + config.initialY + Math.cos(t * 2) * config.driftRange;
  });

  const r = useDerivedValue(() => {
    'worklet';
    const t = clock.value * config.speed + config.phase;
    return (config.size / 2) * (0.9 + 0.2 * Math.sin(t * 3));
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    const t = clock.value * config.speed + config.phase;
    return 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2));
  });

  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={r} color={config.color} />
    </Group>
  );
});

interface EtoileClusterProps {
  theme: typeof COLORS.light;
  isDarkMode: boolean;
}

export const EtoileCluster = React.memo(function EtoileCluster({
  theme,
  isDarkMode,
}: EtoileClusterProps) {
  // Single master clock for all 24 dots (0 to 2*PI cycle)
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [clock]);

  // Precompute deterministic dot properties
  const dots = useMemo<DotConfig[]>(() => {
    const items: DotConfig[] = [];
    for (let index = 0; index < DOT_COUNT; index++) {
      const radius = 20 + ((index * 53.7) % 60); // 20 to 80
      const angle = (index * 137.5 * Math.PI) / 180; // golden angle spiral
      const initialX = Math.cos(angle) * radius;
      const initialY = Math.sin(angle) * radius;
      const size = 3 + (index % 5);
      const isSage = index % 3 !== 0;
      const color = isSage
        ? theme.primary
        : isDarkMode
        ? '#cbc6bc'
        : '#615e56';

      items.push({
        initialX,
        initialY,
        size,
        color,
        driftRange: 5 + (index % 6),
        speed: 1 + (index % 3),
        phase: (index * Math.PI) / 6,
      });
    }
    return items;
  }, [theme.primary, isDarkMode]);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {dots.map((dot, i) => (
          <SkiaDot key={i} config={dot} clock={clock} />
        ))}
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
});
