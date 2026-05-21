// Saybon v2 — Edge Renderer (Skia)
// Draws relationship filament lines between concept nodes on the grid.
// Filaments are only visible when both endpoints have been seen by the learner.
// Line opacity and thickness scale with edge weight and mastery levels.

import React from 'react';
import { Line, vec, Paint } from '@shopify/react-native-skia';
import type { ConceptRelationship } from '../../core/content/schema';
import type { LayoutNode } from '../../core/canvas/gridLayout';
import { worldToScreen } from '../../core/canvas/gridLayout';
import { COLORS } from '../../theme/tokens';

interface EdgeRendererProps {
  relationships: ConceptRelationship[];
  layoutMap: Record<string, LayoutNode>;
  translateX: number;
  translateY: number;
  scale: number;
  screenCenterX: number;
  screenCenterY: number;
  isDarkMode: boolean;
}

// Only draw edges above this weight (performance + visual cleanliness)
const EDGE_WEIGHT_THRESHOLD = 0.4;

// Max edges to draw — beyond this, cull the weakest for performance
const MAX_VISIBLE_EDGES = 400;

export function EdgeRenderer({
  relationships,
  layoutMap,
  translateX,
  translateY,
  scale,
  screenCenterX,
  screenCenterY,
  isDarkMode,
}: EdgeRendererProps) {
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Filter to only edges where both nodes exist, both have been seen,
  // and weight meets threshold
  const visibleEdges = relationships
    .filter((rel) => {
      const src = layoutMap[rel.sourceId];
      const tgt = layoutMap[rel.targetId];
      return (
        src &&
        tgt &&
        src.seenState &&
        tgt.seenState &&
        rel.weight >= EDGE_WEIGHT_THRESHOLD
      );
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_VISIBLE_EDGES);

  return (
    <>
      {visibleEdges.map((rel) => {
        const src = layoutMap[rel.sourceId];
        const tgt = layoutMap[rel.targetId];

        const { px: x1, py: y1 } = worldToScreen(
          src.screenX, src.screenY,
          translateX, translateY, scale,
          screenCenterX, screenCenterY
        );
        const { px: x2, py: y2 } = worldToScreen(
          tgt.screenX, tgt.screenY,
          translateX, translateY, scale,
          screenCenterX, screenCenterY
        );

        // Average mastery between endpoints drives opacity
        const avgMastery = (src.mastery + tgt.mastery) / 2;
        const masteryAlpha = 0.15 + (avgMastery / 5) * 0.45;
        const weightAlpha = rel.weight * 0.6;
        const lineAlpha = Math.min(masteryAlpha + weightAlpha * 0.2, 0.65);

        // Line thickness: derived edges thicker than category edges
        const strokeWidth =
          rel.type === 'derived' ? 1.5 * scale
          : rel.type === 'grammar' ? 1.2 * scale
          : 0.8 * scale;

        // Color: mastered pairs glow in accent; others are muted border
        const lineColor =
          src.mastery >= 5 && tgt.mastery >= 5
            ? theme.accent
            : theme.border;

        return (
          <Line
            key={`${rel.sourceId}-${rel.targetId}`}
            p1={vec(x1, y1)}
            p2={vec(x2, y2)}
            color={lineColor}
            strokeWidth={Math.max(0.5, strokeWidth)}
            style="stroke"
          >
            <Paint color={lineColor} opacity={lineAlpha} />
          </Line>
        );
      })}
    </>
  );
}
