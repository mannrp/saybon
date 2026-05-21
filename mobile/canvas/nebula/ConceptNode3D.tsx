// Saybon v2 — 3D Concept Node Renderer (Skia)
// Renders a single vocabulary node projected in 3D celestial space.
// Visual illumination is driven entirely by mastery:
//   - Mastery 0 (Unexplored): Completely unlit, faint charcoal grey star.
//   - Mastery 1-4 (Acquiring): Brightness and opacity proportional to mastery.
//   - Mastery 5 (Mastered): Vibrant emerald-cyan crystal with a slow breathing halo.

import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Circle,
  Text as SkiaText,
  matchFont,
  vec,
  RadialGradient,
  Group,
} from '@shopify/react-native-skia';
import { COLORS } from '../../theme/tokens';
import { project3D } from './projection';
import type { ConceptNode } from '../../core/content/schema';

interface ConceptNode3DProps {
  node: ConceptNode;
  mastery: number;
  seenState: boolean;
  rotateX: { value: number };
  rotateY: { value: number };
  zoom: { value: number };
  panX: { value: number };
  panY: { value: number };
  screenWidth: number;
  screenHeight: number;
  isDarkMode: boolean;
  isSelected: boolean;
  scale: number;        // Current zoom scale (derived from zoom value)
  pulseRadius?: number; // Animated mastery-5 glow radius
}

function getMasteryColor(mastery: number, isDarkMode: boolean): string {
  const palette = isDarkMode ? COLORS.dark.mastery : COLORS.light.mastery;
  const key = Math.max(0, Math.min(5, Math.round(mastery))) as 0 | 1 | 2 | 3 | 4 | 5;
  return palette[key];
}

const fontFamily = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

export function ConceptNode3D({
  node,
  mastery,
  seenState,
  rotateX,
  rotateY,
  zoom,
  panX,
  panY,
  screenWidth,
  screenHeight,
  isDarkMode,
  isSelected,
  scale,
  pulseRadius,
}: ConceptNode3DProps) {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // ── 3D Projection Calculation (runs on UI thread inside Skia draw loop) ───
  const baseRadius = node.type === 'fia' ? 24 : 16; // Fait au Québec is slightly larger
  const proj = project3D(
    node.coordinates,
    rotateX.value,
    rotateY.value,
    zoom.value,
    panX.value,
    panY.value,
    screenWidth,
    screenHeight,
    baseRadius
  );

  // Viewport culling
  if (!proj.visible) return null;

  const { screenX, screenY, radius, alpha } = proj;

  // Minimum size lock to prevent node from disappearing at distance
  const r = Math.max(2.5, radius * Math.max(scale * 0.9, 0.7));

  // Dynamic mastery-based node size (high mastery nodes feel physically heavier and brighter)
  const finalRadius = seenState
    ? r * (0.85 + (mastery / 5.0) * 0.35)
    : r * 0.7; // Unexplored nodes are tiny dust specks

  // ── Calculate Illumination Brightness ──────────────────────────────────────
  let nodeAlpha = alpha;
  let fillColor = getMasteryColor(mastery, isDarkMode);

  if (!seenState) {
    // Unlit — sleeping star state (pure matte charcoal, completely unlit star)
    fillColor = isDarkMode ? '#1C1917' : '#E7E5E4';
    nodeAlpha = alpha * 0.12; // Extremely low opacity, quiet in background
  } else {
    // Illuminated — mastery brightness scaling (opacity and glowing presence)
    const masteryScale = mastery / 5.0;
    const brightnessFactor = 0.55 + masteryScale * 0.55;
    nodeAlpha = Math.min(alpha * brightnessFactor, 1.0);
  }

  // If node is currently selected, light it up to max brilliance
  if (isSelected) {
    nodeAlpha = 1.0;
  }

  // Pure white/intense emissive core for higher mastery to represent glowing starlight
  const getHighlightColor = () => {
    if (!seenState) return fillColor;
    const m = Math.round(mastery);
    if (m >= 5) return '#FFFFFF';
    if (m === 4) return isDarkMode ? '#6EE7B7' : '#A7F3D0';
    if (m === 3) return isDarkMode ? '#A7F3D0' : '#D1FAE5';
    if (m === 2) return isDarkMode ? '#FDE68A' : '#FEF3C7';
    return isDarkMode ? '#FECACA' : '#FEE2E2';
  };
  const highlightColor = getHighlightColor();

  // Selection outline color
  const selectionRingColor = theme.accent;

  // Show labels only for illuminated nodes or selected nodes when zoomed in enough
  const showLabel = scale > 0.65 && (seenState || isSelected);
  const showEnglish = scale > 1.35 && isSelected;

  const fontSize = Math.max(8, Math.min(13, 9.5 * scale));
  const subFontSize = Math.max(7, Math.min(10, 8 * scale));

  // ── Dynamic Font Compilations (React cached) ───────────────────────────────
  const font = useMemo(() => {
    const size = Math.round(fontSize);
    return matchFont({
      fontFamily,
      fontSize: size,
      fontWeight: 'bold',
    });
  }, [fontSize]);

  const subFont = useMemo(() => {
    const size = Math.round(subFontSize);
    return matchFont({
      fontFamily,
      fontSize: size,
      fontWeight: 'normal',
    });
  }, [subFontSize]);

  return (
    <Group opacity={nodeAlpha}>
      {/* 1. Ambient Soft Glowing Halo (radius and intensity scales with skill level) */}
      {seenState && mastery > 0 && (
        <Circle
          cx={screenX}
          cy={screenY}
          r={finalRadius * (1.15 + (mastery / 5.0) * 1.6)}
          color={fillColor}
          opacity={(0.04 + (mastery / 5.0) * 0.22) * nodeAlpha}
        />
      )}

      {/* 2. Mastery-5 Pulsing Halo */}
      {seenState && mastery >= 5 && pulseRadius !== undefined && (
        <Circle
          cx={screenX}
          cy={screenY}
          r={pulseRadius}
          color={fillColor}
          opacity={0.16}
        />
      )}

      {/* 3. Selection Highlight Circle */}
      {isSelected && (
        <Circle
          cx={screenX}
          cy={screenY}
          r={finalRadius + 5}
          color={selectionRingColor}
          style="stroke"
          strokeWidth={1.8}
          opacity={0.85}
        />
      )}

      {/* 4. Core Node Circle (Radial Glow or Matte Cold Stone) */}
      {seenState ? (
        <Circle cx={screenX} cy={screenY} r={finalRadius} color={fillColor}>
          <RadialGradient
            c={vec(screenX - finalRadius * 0.2, screenY - finalRadius * 0.3)}
            r={finalRadius * 1.35}
            colors={[highlightColor, fillColor]}
          />
        </Circle>
      ) : (
        <Circle cx={screenX} cy={screenY} r={finalRadius} color={fillColor} />
      )}

      {/* 4. French Text Label (Faded according to depth) */}
      {showLabel && font && (
        <SkiaText
          x={screenX - finalRadius * 0.5}
          y={screenY + finalRadius + fontSize + 2}
          text={node.french}
          color={theme.text}
          font={font}
        />
      )}

      {/* 5. English Subtitle (Only on deep selected zoom) */}
      {showEnglish && subFont && (
        <SkiaText
          x={screenX - finalRadius * 0.5}
          y={screenY + finalRadius + fontSize + subFontSize + 4}
          text={node.english}
          color={theme.textMuted}
          font={subFont}
        />
      )}
    </Group>
  );
}
