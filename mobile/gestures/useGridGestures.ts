// Saybon v2 — Grid Gesture Controller
// Pan + Pinch-to-Zoom running entirely on the UI thread via Reanimated 4.
// SharedValues are read directly by the Skia Canvas without crossing the JS bridge.
// Ensures <1ms touch response latency for 120fps feel.

import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
} from 'react-native-gesture-handler';

import { screenToWorld, layoutToIndexed } from '../core/canvas/gridLayout';
import { useGridStore } from '../core/store/useGridStore';
import { buildQuadtree } from '../core/content/quadtree';
import type { LayoutNode } from '../core/canvas/gridLayout';
import type { GridViewport } from '../core/store/useGridStore';

// ── Zoom Bounds ────────────────────────────────────────────────────────────────
const SCALE_MIN = 0.25;   // Galaxy heatmap view
const SCALE_MAX = 3.5;    // Deep-node detail view

// ── Spring Configs ─────────────────────────────────────────────────────────────
// Inertial "heavy canvas" spring — high mass, low damping
const PAN_SPRING = { mass: 1.2, damping: 28, stiffness: 180 };
// Snappy zoom settle
const ZOOM_SPRING = { mass: 0.8, damping: 22, stiffness: 240 };
// Snap-back when hitting bounds
const BOUNDS_SPRING = { mass: 0.6, damping: 18, stiffness: 300 };

export interface GridGestureState {
  translateX: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  scale: ReturnType<typeof useSharedValue<number>>;
  panGesture: ReturnType<typeof Gesture.Pan>;
  pinchGesture: ReturnType<typeof Gesture.Pinch>;
  tapGesture: ReturnType<typeof Gesture.Tap>;
  composed: ReturnType<typeof Gesture.Simultaneous>;
}

interface UseGridGesturesOptions {
  screenWidth: number;
  screenHeight: number;
  layoutNodes: LayoutNode[];
  onNodeTap?: (nodeId: string) => void;
  onEmptyTap?: () => void;
}

export function useGridGestures({
  screenWidth,
  screenHeight,
  layoutNodes,
  onNodeTap,
  onEmptyTap,
}: UseGridGesturesOptions): GridGestureState {
  const selectNode = (id: string | null) => useGridStore.getState().selectNode(id);
  const setViewport = (vp: GridViewport) => useGridStore.getState().setViewport(vp);

  // ── Animated SharedValues (UI thread) ────────────────────────────────────────
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.85);

  // Snapshot values at gesture start
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(0.85);

  // Pinch focal point (to zoom toward the pinch center)
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // ── Sync to JS-side viewport store (throttled) ───────────────────────────────
  const syncViewport = useCallback(() => {
    setViewport({
      translateX: translateX.value,
      translateY: translateY.value,
      scale: scale.value,
    });
  }, [setViewport, translateX, translateY, scale]);

  // ── Pan Gesture ──────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(2)
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd((e) => {
      // Apply inertial spring with velocity carry
      const velocityDecay = 0.85;
      translateX.value = withSpring(
        translateX.value + e.velocityX * velocityDecay * 0.1,
        PAN_SPRING,
        () => { runOnJS(syncViewport)(); }
      );
      translateY.value = withSpring(
        translateY.value + e.velocityY * velocityDecay * 0.1,
        PAN_SPRING
      );
    });

  // ── Pinch Gesture ────────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onBegin((e) => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const nextScale = Math.max(
        SCALE_MIN,
        Math.min(SCALE_MAX, savedScale.value * e.scale)
      );

      // Zoom toward pinch focal point
      const scaleDelta = nextScale / savedScale.value;
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      const focalOffsetX = focalX.value - centerX;
      const focalOffsetY = focalY.value - centerY;

      translateX.value =
        focalOffsetX + (savedTranslateX.value - focalOffsetX) * scaleDelta;
      translateY.value =
        focalOffsetY + (savedTranslateY.value - focalOffsetY) * scaleDelta;

      scale.value = nextScale;
    })
    .onEnd(() => {
      // Clamp to bounds with spring snap-back
      const clampedScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale.value));
      scale.value = withSpring(clampedScale, ZOOM_SPRING, () => {
        runOnJS(syncViewport)();
      });
    });

  // ── Tap Gesture (hit detection) ──────────────────────────────────────────────
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      // Convert screen tap to world coordinates
      const cx = screenWidth / 2;
      const cy = screenHeight / 2;
      const { worldX, worldY } = screenToWorld(
        e.x,
        e.y,
        translateX.value,
        translateY.value,
        scale.value,
        cx,
        cy
      );

      // Build a fresh quadtree from current layout and query tap point
      const indexed = layoutNodes.map((n) => ({
        id: n.id,
        x: n.screenX,
        y: n.screenY,
        radius: n.radius,
      }));

      const tree = buildQuadtree(indexed);

      // Search radius in world units — scale-adjusted so small zoom still works
      const hitRadius = 36 / scale.value;
      const hit = tree.findNearest({ x: worldX, y: worldY }, hitRadius);

      if (hit) {
        runOnJS(selectNode)(hit.id);
        if (onNodeTap) runOnJS(onNodeTap)(hit.id);
      } else {
        runOnJS(selectNode)(null);
        if (onEmptyTap) runOnJS(onEmptyTap)();
      }
    });

  // ── Compose gestures (pan + pinch simultaneous, tap exclusive) ───────────────
  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(tapGesture),
    panGesture,
    pinchGesture
  );

  return {
    translateX,
    translateY,
    scale,
    panGesture,
    pinchGesture,
    tapGesture,
    composed,
  };
}
