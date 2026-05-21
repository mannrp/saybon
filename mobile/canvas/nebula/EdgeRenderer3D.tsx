// Saybon v2 — 3D Edge Filament Renderer (Skia)
// Draws delicate relationship paths connecting concepts in 3D space.
// Updates dynamically on the UI thread inside Skia's draw loop.

import React from 'react';
import { Line, Group, LinearGradient, vec } from '@shopify/react-native-skia';
import type { ConceptRelationship, ConceptNode } from '../../core/content/schema';
import { project3D } from './projection';
import { COLORS } from '../../theme/tokens';

interface EdgeRenderer3DProps {
  relationships: ConceptRelationship[];
  conceptMap: Record<string, ConceptNode>;
  progressMap: Record<string, { mastery: number; seenState: boolean }>;
  rotateX: { value: number };
  rotateY: { value: number };
  zoom: { value: number };
  panX: { value: number };
  panY: { value: number };
  screenWidth: number;
  screenHeight: number;
  isDarkMode: boolean;
}

function getMasteryColor(mastery: number, isDarkMode: boolean): string {
  const palette = isDarkMode ? COLORS.dark.mastery : COLORS.light.mastery;
  const key = Math.max(0, Math.min(5, Math.round(mastery))) as 0 | 1 | 2 | 3 | 4 | 5;
  return palette[key];
}

export function EdgeRenderer3D({
  relationships,
  conceptMap,
  progressMap,
  rotateX,
  rotateY,
  zoom,
  panX,
  panY,
  screenWidth,
  screenHeight,
  isDarkMode,
}: EdgeRenderer3DProps) {
  return (
    <Group>
      {relationships.map((rel, idx) => {
        const sourceNode = conceptMap[rel.sourceId];
        const targetNode = conceptMap[rel.targetId];

        if (!sourceNode || !targetNode) return null;

        const sourceProg = progressMap[rel.sourceId];
        const targetProg = progressMap[rel.targetId];

        // 1. ILLUMINATION RULE: Unexplored edges are unlit (invisible)
        if (!sourceProg?.seenState || !targetProg?.seenState) {
          return null;
        }

        // 2. Project source point in 3D
        const p1 = project3D(
          sourceNode.coordinates,
          rotateX.value,
          rotateY.value,
          zoom.value,
          panX.value,
          panY.value,
          screenWidth,
          screenHeight,
          0
        );

        // 3. Project target point in 3D
        const p2 = project3D(
          targetNode.coordinates,
          rotateX.value,
          rotateY.value,
          zoom.value,
          panX.value,
          panY.value,
          screenWidth,
          screenHeight,
          0
        );

        // Skip drawing if either point is off-screen / clipped
        if (!p1.visible || !p2.visible) return null;

        // 4. Calculate average mastery to scale filament opacity and thickness
        const avgMastery = (sourceProg.mastery + targetProg.mastery) / 2;
        const masteryIntensity = avgMastery / 5.0; // 0.0 -> 1.0

        const avgAlpha = (p1.alpha + p2.alpha) / 2;
        
        // Brighter / more active filament connections for higher mastery levels
        const opacity = Math.max(0.06, masteryIntensity * 0.55) * avgAlpha;
        const strokeWidth = 0.4 + masteryIntensity * 1.8;

        const sourceColor = getMasteryColor(sourceProg.mastery, isDarkMode);
        const targetColor = getMasteryColor(targetProg.mastery, isDarkMode);

        return (
          <Line
            key={`${rel.sourceId}-${rel.targetId}-${idx}`}
            p1={{ x: p1.screenX, y: p1.screenY }}
            p2={{ x: p2.screenX, y: p2.screenY }}
            strokeWidth={strokeWidth}
            opacity={opacity}
            style="stroke"
          >
            {/* Emissive linear gradient transition representing relationship skill level */}
            <LinearGradient
              start={vec(p1.screenX, p1.screenY)}
              end={vec(p2.screenX, p2.screenY)}
              colors={[sourceColor, targetColor]}
            />
          </Line>
        );
      })}
    </Group>
  );
}

export default EdgeRenderer3D;
