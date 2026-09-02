// Saybon v2 — Main Grid Canvas
// The persistent spatial environment. An infinite pannable/zoomable galaxy
// of French vocabulary nodes rendered in Skia at up to 120fps.
//
// Architecture:
//   GestureDetector (Gesture Handler, UI thread)
//     └── Animated.View (Reanimated, transforms the canvas group)
//           └── Canvas (Skia, GPU rasterized)
//                 ├── EdgeRenderer   (relationship filaments)
//                 └── ConceptNode[]  (concept circles, text labels)
//   + React Native overlay (HUD: search, filter, node detail card)

import React, {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  useColorScheme,
  Pressable,
  Platform,
} from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/tokens';
import { ConceptNode as ConceptNodeRenderer } from './ConceptNode';
import { EdgeRenderer } from './EdgeRenderer';
import { useGridGestures } from '../../gestures/useGridGestures';
import { useGridStore } from '../../core/store/useGridStore';
import { useProgressStore } from '../../core/store/useProgressStore';
import { buildLayout, layoutToIndexed } from '../../core/canvas/gridLayout';
import type { LayoutNode } from '../../core/canvas/gridLayout';
import type { ConceptRelationship } from '../../core/content/schema';

interface GridCanvasProps {
  onNodeSelect?: (nodeId: string) => void;
}

export function GridCanvas({ onNodeSelect }: GridCanvasProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;

  // ── Store Access ─────────────────────────────────────────────────────────────
  const { concepts, relationships, progress, isInitialized, initialize } =
    useProgressStore();
  const { selectedNodeId, selectNode, zoomLevel } = useGridStore();

  // ── Initialize database on first mount ──────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // ── Build Layout (memoized — only rebuilds when concepts/progress change) ────
  const progressMap = useMemo(() => {
    const map: Record<string, { mastery: number; seenState: boolean }> = {};
    Object.entries(progress).forEach(([id, p]) => {
      map[id] = { mastery: p.mastery, seenState: p.seenState };
    });
    return map;
  }, [progress]);

  const layoutNodes = useMemo(
    () => buildLayout(concepts, progressMap),
    [concepts, progressMap]
  );

  const layoutMap = useMemo(() => {
    const map: Record<string, LayoutNode> = {};
    layoutNodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [layoutNodes]);

  // ── Mastery-5 pulse animation (repeating) ───────────────────────────────────
  const pulseAnim = useSharedValue(0);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [pulseAnim]);

  // ── Gesture System ───────────────────────────────────────────────────────────
  const handleNodeTap = useCallback(
    (nodeId: string) => {
      if (onNodeSelect) onNodeSelect(nodeId);
    },
    [onNodeSelect]
  );

  const handleEmptyTap = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const { translateX, translateY, scale, composed } = useGridGestures({
    screenWidth,
    screenHeight,
    layoutNodes,
    onNodeTap: handleNodeTap,
    onEmptyTap: handleEmptyTap,
  });

  // ── Selected Node Info Panel ─────────────────────────────────────────────────
  const selectedNode = selectedNodeId ? layoutMap[selectedNodeId] : null;
  const selectedProgress = selectedNodeId ? progress[selectedNodeId] : null;

  // ── Viewport values for rendering (read from SharedValues each frame) ────────
  // We pass these directly to Skia children — they re-render at frame rate
  // by being driven from Reanimated's worklet loop.
  const txVal = translateX.value;
  const tyVal = translateY.value;
  const scaleVal = scale.value;

  // ── Viewport culling bounding box (world space) ──────────────────────────────
  const visibleNodes = useMemo(() => {
    // Rough visible world-space bounds for coarse culling
    const halfW = (screenWidth / 2 + 80) / scaleVal;
    const halfH = (screenHeight / 2 + 80) / scaleVal;
    const centerWorldX = -txVal / scaleVal;
    const centerWorldY = -tyVal / scaleVal;

    return layoutNodes.filter((n) => {
      return (
        Math.abs(n.screenX - centerWorldX) < halfW &&
        Math.abs(n.screenY - centerWorldY) < halfH
      );
    });
  }, [layoutNodes, txVal, tyVal, scaleVal, screenWidth, screenHeight]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── GPU Canvas ──────────────────────────────────────────────────────── */}
      <GestureDetector gesture={composed}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Relationship Filaments — drawn behind nodes */}
            <EdgeRenderer
              relationships={relationships}
              layoutMap={layoutMap}
              translateX={txVal}
              translateY={tyVal}
              scale={scaleVal}
              screenCenterX={screenCenterX}
              screenCenterY={screenCenterY}
              isDarkMode={isDarkMode}
            />

            {/* Concept Nodes — depth-sorted (back-to-front) */}
            {visibleNodes.map((node) => {
              const pulseR =
                node.mastery >= 5
                  ? node.radius * scaleVal + interpolate(pulseAnim.value, [0, 1], [0, 12])
                  : undefined;

              return (
                <ConceptNodeRenderer
                  key={node.id}
                  node={node}
                  translateX={txVal}
                  translateY={tyVal}
                  scale={scaleVal}
                  screenCenterX={screenCenterX}
                  screenCenterY={screenCenterY}
                  isDarkMode={isDarkMode}
                  isSelected={node.id === selectedNodeId}
                  zoomLevel={zoomLevel}
                  pulseRadius={pulseR}
                />
              );
            })}
          </Canvas>
        </View>
      </GestureDetector>

      {/* ── HUD Overlay — React Native layer on top ──────────────────────────── */}
      <View
        style={[styles.hud, { paddingTop: insets.top + SPACING.md }]}
        pointerEvents="box-none"
      >
        {/* Header */}
        <View style={styles.header} pointerEvents="none">
          <Text style={[styles.wordmark, { color: theme.text }]}>Saybon</Text>
          <Text style={[styles.nodeCount, { color: theme.textMuted }]}>
            {concepts.length} mots
          </Text>
        </View>

        {/* Node detail card — slides up when a node is selected */}
        {selectedNode && (
          <Pressable
            style={[
              styles.nodeCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                bottom: insets.bottom + SPACING.xl,
              },
            ]}
            onPress={() => { if (onNodeSelect && selectedNode) onNodeSelect(selectedNode.id); }}
          >
            <View style={styles.nodeCardRow}>
              <View
                style={[
                  styles.masteryDot,
                  {
                    backgroundColor:
                      (isDarkMode ? COLORS.dark : COLORS.light).mastery[
                        Math.round(selectedNode.mastery) as 0 | 1 | 2 | 3 | 4 | 5
                      ],
                  },
                ]}
              />
              <View style={styles.nodeCardText}>
                <Text style={[styles.nodeFrench, { color: theme.text }]}>
                  {selectedNode.french}
                </Text>
                <Text style={[styles.nodeEnglish, { color: theme.textMuted }]}>
                  {selectedNode.english}
                </Text>
              </View>
              <View style={styles.nodeCardMeta}>
                <Text style={[styles.nodeLevel, { color: theme.textMuted }]}>
                  {selectedNode.level}
                </Text>
                <Text style={[styles.nodeMastery, { color: theme.text }]}>
                  {'★'.repeat(selectedNode.mastery)}{'☆'.repeat(5 - selectedNode.mastery)}
                </Text>
              </View>
            </View>
            <Text style={[styles.nodeCardHint, { color: theme.textMuted }]}>
              Appuyez pour pratiquer →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Loading skeleton */}
      {!isInitialized && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Chargement de votre univers…
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  wordmark: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: -0.5,
  },
  nodeCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nodeCard: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  nodeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  masteryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  nodeCardText: {
    flex: 1,
  },
  nodeFrench: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: -0.2,
  },
  nodeEnglish: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 1,
  },
  nodeCardMeta: {
    alignItems: 'flex-end',
  },
  nodeLevel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  nodeMastery: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1,
  },
  nodeCardHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.sm,
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 0.3,
  },
});
