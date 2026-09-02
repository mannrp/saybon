// Saybon v2 — Concept Node Renderer (Skia)
// Draws a single vocabulary concept node on the spatial grid.
// Visual state is driven entirely by mastery level (0–5).
//
// Level 0: Dim stone dust — barely visible, ghostlike
// Level 1: Warm rose glow — just noticed
// Level 2: Amber — familiar
// Level 3: Mint — comfortable
// Level 4: Emerald — fluent recall
// Level 5: Rich glowing crystal — mastered, with a pulse halo

import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Circle,
  Text as SkiaText,
  matchFont,
  vec,
  RadialGradient,
  Group,
  Paint,
} from '@shopify/react-native-skia';
import type { LayoutNode } from '../../core/canvas/gridLayout';
import { worldToScreen } from '../../core/canvas/gridLayout';
import { COLORS, TYPOGRAPHY } from '../../theme/tokens';
import type { GridZoomLevel } from '../../core/store/useGridStore';

interface ConceptNodeProps {
  node: LayoutNode;
  translateX: number;
  translateY: number;
  scale: number;
  screenCenterX: number;
  screenCenterY: number;
  isDarkMode: boolean;
  isSelected: boolean;
  zoomLevel: GridZoomLevel;
  pulseRadius?: number;  // Animated value from Reanimated for mastery-5 pulse
}

// Mastery color accessor
function masteryColor(mastery: number, isDarkMode: boolean): string {
  const palette = isDarkMode ? COLORS.dark.mastery : COLORS.light.mastery;
  const key = Math.max(0, Math.min(5, Math.round(mastery))) as 0 | 1 | 2 | 3 | 4 | 5;
  return palette[key];
}

// Subtle highlight (lighter version of the fill for radial gradient center)
const HIGHLIGHT_ALPHA = 'CC';
const fontFamily = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
  default: 'sans-serif',
});

export function ConceptNode({
  node,
  translateX,
  translateY,
  scale,
  screenCenterX,
  screenCenterY,
  isDarkMode,
  isSelected,
  zoomLevel,
  pulseRadius,
}: ConceptNodeProps) {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const font = useMemo(() => {
    const size = Math.round(Math.max(8, Math.min(14, 10 * scale)));
    return matchFont({
      fontFamily,
      fontSize: size,
      fontWeight: 'bold',
    });
  }, [scale]);

  const subFont = useMemo(() => {
    const size = Math.round(Math.max(7, Math.min(11, 8 * scale)));
    return matchFont({
      fontFamily,
      fontSize: size,
      fontWeight: 'normal',
    });
  }, [scale]);

  const { px, py } = worldToScreen(
    node.screenX,
    node.screenY,
    translateX,
    translateY,
    scale,
    screenCenterX,
    screenCenterY
  );

  // Compute visual radius scaled by depth + current zoom
  const r = Math.max(4, node.radius * Math.max(scale * 0.9, 0.7));

  // Don't render if entirely off-screen (coarse cull — Quadtree handles fine culling)
  const margin = r + 8;
  if (
    px < -margin || px > screenCenterX * 2 + margin ||
    py < -margin || py > screenCenterY * 2 + margin
  ) {
    return null;
  }

  const fillColor = masteryColor(node.mastery, isDarkMode);
  const highlightColor = fillColor + HIGHLIGHT_ALPHA;
  const baseAlpha = isSelected ? 1.0 : node.alpha;

  // Selection ring
  const selectionRingColor = theme.accent;

  // Show label text at cluster+ zoom when node is either selected or has been seen
  const showLabel = (zoomLevel === 'cluster' || zoomLevel === 'node') &&
    (node.seenState || isSelected) &&
    scale > 0.6;

  const showEnglish = zoomLevel === 'node' && isSelected && scale > 1.4;

  // Text size adapts with zoom
  const fontSize = Math.max(8, Math.min(14, 10 * scale));
  const subFontSize = Math.max(7, Math.min(11, 8 * scale));

  return (
    <Group opacity={baseAlpha}>
      {/* Mastery-5 pulse halo */}
      {node.mastery >= 5 && pulseRadius !== undefined && (
        <Circle
          cx={px}
          cy={py}
          r={pulseRadius}
          color={fillColor}
          opacity={0.18}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle
          cx={px}
          cy={py}
          r={r + 5}
          color={selectionRingColor}
          style="stroke"
          strokeWidth={2}
          opacity={0.8}
        />
      )}

      {/* Main node circle with radial gradient */}
      <Circle cx={px} cy={py} r={r} color={fillColor}>
        <RadialGradient
          c={vec(px - r * 0.2, py - r * 0.3)}
          r={r * 1.4}
          colors={[highlightColor, fillColor]}
        />
      </Circle>

      {/* French word label */}
      {showLabel && font && (
        <SkiaText
          x={px - r * 0.5}
          y={py + r + fontSize + 2}
          text={node.french}
          color={theme.text}
          font={font}
        />
      )}

      {/* English translation — only in deep node zoom when selected */}
      {showEnglish && subFont && (
        <SkiaText
          x={px - r * 0.5}
          y={py + r + fontSize + subFontSize + 5}
          text={node.english}
          color={theme.textMuted}
          font={subFont}
        />
      )}
    </Group>
  );
}
