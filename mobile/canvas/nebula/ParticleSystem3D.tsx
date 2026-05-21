// Saybon v2 — 3D GPU Stardust Particle System
// Seeds floating stars in a 3D coordinate space and projects them dynamically
// using UI-thread worklets. Driven by gesture offsets without JS re-renders.

import React, { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { Points, vec } from '@shopify/react-native-skia';

import { project3D } from './projection';
import type { Coordinate3D } from './projection';

interface ParticleSystem3DProps {
  screenWidth: number;
  screenHeight: number;
  rotateX: { value: number };
  rotateY: { value: number };
  zoom: { value: number };
  panX: { value: number };
  panY: { value: number };
}

const PARTICLE_COUNT = 150;

export function ParticleSystem3D({
  screenWidth,
  screenHeight,
  rotateX,
  rotateY,
  zoom,
  panX,
  panY,
}: ParticleSystem3DProps) {
  // ── Seed 3D Coordinates Once ───────────────────────────────────────────────
  const particles = useMemo(() => {
    const pts: Coordinate3D[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pts.push({
        // Scattered in a massive cosmic cube
        x: (Math.random() - 0.5) * 900,
        y: (Math.random() - 0.5) * 900,
        z: (Math.random() - 0.5) * 900,
      });
    }
    return pts;
  }, []);

  // ── Project Particles in Real Time ──────────────────────────────────────────
  const projectedPoints = useDerivedValue(() => {
    const pointsList = [];
    const rx = rotateX.value;
    const ry = rotateY.value;
    const z = zoom.value;
    const px = panX.value;
    const py = panY.value;

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const proj = project3D(
        pt,
        rx,
        ry,
        z,
        px,
        py,
        screenWidth,
        screenHeight,
        1.0 // Base radius
      );

      if (proj.visible) {
        pointsList.push(vec(proj.screenX, proj.screenY));
      }
    }

    return pointsList;
  }, [rotateX, rotateY, zoom, panX, panY, screenWidth, screenHeight]);

  return (
    <Points
      points={projectedPoints}
      mode="points"
      color="rgba(235, 235, 245, 0.28)" // Peaceful cosmic light grey stardust
      strokeWidth={1.5}
    />
  );
}
