// Saybon v2 — 3D Nebula Gesture Controller
// Binds physical inputs to Reanimated 3 SharedValues entirely on the UI thread.
// Implements rotational pitch/yaw inertia, camera panning, and spatial 3D touch triggers.

import { useCallback } from 'react';
import {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

import { project3D } from '../canvas/nebula/projection';
import { useGridStore } from '../core/store/useGridStore';
import type { ConceptNode } from '../core/content/schema';

// Visual bounds
const PITCH_LIMIT = 1.4;      // Keep rotation within +/- 80 degrees (no inversion)
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;

// Springs
const ROTATION_SPRING = { mass: 1.2, damping: 30, stiffness: 120 };
const ZOOM_SPRING = { mass: 0.8, damping: 24, stiffness: 200 };
const PAN_SPRING = { mass: 1.0, damping: 26, stiffness: 150 };

export interface NebulaGestureState {
  rotateX: ReturnType<typeof useSharedValue<number>>; // Pitch
  rotateY: ReturnType<typeof useSharedValue<number>>; // Yaw
  zoom: ReturnType<typeof useSharedValue<number>>;
  panX: ReturnType<typeof useSharedValue<number>>;
  panY: ReturnType<typeof useSharedValue<number>>;
  composed: ReturnType<typeof Gesture.Simultaneous>;
}

interface UseNebulaGesturesOptions {
  screenWidth: number;
  screenHeight: number;
  concepts: ConceptNode[];
  onNodeTap?: (nodeId: string) => void;
  onEmptyTap?: () => void;
}

export function useNebulaGestures({
  screenWidth,
  screenHeight,
  concepts,
  onNodeTap,
  onEmptyTap,
}: UseNebulaGesturesOptions): NebulaGestureState {
  const selectNode = (id: string | null) => useGridStore.getState().selectNode(id);

  // ── Shared Values ──────────────────────────────────────────────────────────
  const rotateX = useSharedValue(0.2); // Start tilted slightly down
  const rotateY = useSharedValue(-0.5); // Start tilted slightly to the side
  const zoom = useSharedValue(0.9);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);

  // Start snapshots
  const savedRotateX = useSharedValue(0);
  const savedRotateY = useSharedValue(0);
  const savedZoom = useSharedValue(0.9);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);

  // ── 1-Finger Drag: Yaw & Pitch Rotation ─────────────────────────────────────
  const rotationGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onBegin(() => {
      savedRotateX.value = rotateX.value;
      savedRotateY.value = rotateY.value;
    })
    .onUpdate((e) => {
      // Scale translation to radians (smaller scale = slower rotation)
      const scaleFactor = 0.005;
      const nextPitch = savedRotateX.value - e.translationY * scaleFactor;
      
      // Clamp pitch to avoid upside-down disorientation
      rotateX.value = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, nextPitch));
      rotateY.value = savedRotateY.value + e.translationX * scaleFactor;
    })
    .onEnd((e) => {
      // Carry rotational velocity with heavy inertial spring deceleration
      const velocityDecay = 0.06;
      const finalYaw = rotateY.value + e.velocityX * velocityDecay * 0.05;
      const finalPitch = Math.max(
        -PITCH_LIMIT,
        Math.min(PITCH_LIMIT, rotateX.value - e.velocityY * velocityDecay * 0.05)
      );

      rotateY.value = withSpring(finalYaw, ROTATION_SPRING);
      rotateX.value = withSpring(finalPitch, ROTATION_SPRING);
    });

  // ── 2-Finger Drag: Camera Panning ──────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onBegin(() => {
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
    })
    .onUpdate((e) => {
      // Move camera relative to zoom factor (faster panning when zoomed out)
      const speedScale = 1.2 / zoom.value;
      panX.value = savedPanX.value + e.translationX * speedScale;
      panY.value = savedPanY.value + e.translationY * speedScale;
    })
    .onEnd((e) => {
      const finalPanX = panX.value + e.velocityX * 0.05;
      const finalPanY = panY.value + e.velocityY * 0.05;
      
      panX.value = withSpring(finalPanX, PAN_SPRING);
      panY.value = withSpring(finalPanY, PAN_SPRING);
    });

  // ── 2-Finger Pinch: Camera Z-Flight Zoom ──────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedZoom.value = zoom.value;
    })
    .onUpdate((e) => {
      const nextZoom = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, savedZoom.value * e.scale)
      );
      zoom.value = nextZoom;
    })
    .onEnd(() => {
      const clampedZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value));
      zoom.value = withSpring(clampedZoom, ZOOM_SPRING);
    });

  // ── 1-Finger Tap: 3D Raycast Hit Detection ──────────────────────────────────
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      // Run projection for all nodes to find the closest clicked one
      let closestNodeId: string | null = null;
      let minDistance = 38; // Max tap selection radius (px)

      for (let i = 0; i < concepts.length; i++) {
        const c = concepts[i];
        const proj = project3D(
          c.coordinates,
          rotateX.value,
          rotateY.value,
          zoom.value,
          panX.value,
          panY.value,
          screenWidth,
          screenHeight,
          18
        );

        if (proj.visible) {
          const dx = e.x - proj.screenX;
          const dy = e.y - proj.screenY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDistance) {
            minDistance = dist;
            closestNodeId = c.id;
          }
        }
      }

      if (closestNodeId) {
        runOnJS(selectNode)(closestNodeId);
        if (onNodeTap) runOnJS(onNodeTap)(closestNodeId);
      } else {
        runOnJS(selectNode)(null);
        if (onEmptyTap) runOnJS(onEmptyTap)();
      }
    });

  // Compose all inputs simultaneously, tapping is mutually exclusive
  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(tapGesture),
    rotationGesture,
    panGesture,
    pinchGesture
  );

  return {
    rotateX,
    rotateY,
    zoom,
    panX,
    panY,
    composed,
  };
}
