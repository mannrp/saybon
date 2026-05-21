// Saybon v2 — Main 3D Nebula Canvas
// L'Espace Saybon: A breathtaking, three-dimensional language galaxy
// rendered in Skia at up to 120fps with full UI-thread gesture control.

import React, {
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/tokens';
import { ConceptNode3D } from './ConceptNode3D';
import { EdgeRenderer3D } from './EdgeRenderer3D';
import { ParticleSystem3D } from './ParticleSystem3D';
import { useNebulaGestures } from '../../gestures/useNebulaGestures';
import { useGridStore } from '../../core/store/useGridStore';
import { useProgressStore } from '../../core/store/useProgressStore';
import type { ConceptNode } from '../../core/content/schema';

interface NebulaCanvasProps {
  onNodeSelect?: (nodeId: string) => void;
}

export function NebulaCanvas({ onNodeSelect }: NebulaCanvasProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  // ── Store Access ─────────────────────────────────────────────────────────────
  const { concepts, relationships, progress, isInitialized, initialize } =
    useProgressStore();
  const { selectedNodeId, selectNode } = useGridStore();

  // ── Initialize database on first mount ──────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // ── Maps for Fast O(1) Lookups ──────────────────────────────────────────────
  const conceptMap = useMemo(() => {
    const map: Record<string, ConceptNode> = {};
    concepts.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [concepts]);

  const progressMap = useMemo(() => {
    const map: Record<string, { mastery: number; seenState: boolean }> = {};
    Object.entries(progress).forEach(([id, p]) => {
      map[id] = { mastery: p.mastery, seenState: p.seenState };
    });
    return map;
  }, [progress]);

  // ── Mastery-5 pulsing glow animation ────────────────────────────────────────
  const pulseAnim = useSharedValue(0);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
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

  const { rotateX, rotateY, zoom, panX, panY, composed } = useNebulaGestures({
    screenWidth,
    screenHeight,
    concepts,
    onNodeTap: handleNodeTap,
    onEmptyTap: handleEmptyTap,
  });

  // ── Selected Node Panel Details ──────────────────────────────────────────────
  const selectedNode = selectedNodeId ? conceptMap[selectedNodeId] : null;
  const selectedProgress = selectedNodeId ? progress[selectedNodeId] : null;

  // Viewport scale mapping for node text sizes and culling
  const currentZoomVal = zoom.value;

  // Static depth-sorting based on world-space coordinates
  // Painter's algorithm: draw deeper background concepts first, so foreground projects on top
  const sortedConcepts = useMemo(() => {
    const list = [...concepts];
    list.sort((a, b) => a.coordinates.z - b.coordinates.z);
    return list;
  }, [concepts]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── 3D GPU Canvas ────────────────────────────────────────────────────── */}
      <GestureDetector gesture={composed}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Background 3D drifting stardust */}
            <ParticleSystem3D
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              rotateX={rotateX}
              rotateY={rotateY}
              zoom={zoom}
              panX={panX}
              panY={panY}
            />

            {/* Glowing Edge Filaments */}
            <EdgeRenderer3D
              relationships={relationships}
              conceptMap={conceptMap}
              progressMap={progressMap}
              rotateX={rotateX}
              rotateY={rotateY}
              zoom={zoom}
              panX={panX}
              panY={panY}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              isDarkMode={isDarkMode}
            />

            {/* Projected Concept Nodes */}
            {sortedConcepts.map((node) => {
              const nodeProg = progressMap[node.id];
              const mastery = nodeProg?.mastery ?? 0;
              const seenState = nodeProg?.seenState ?? false;

              // Pulse halo sizing for level-5 nodes
              const baseNodeRadius = node.type === 'fia' ? 24 : 16;
              const pulseR =
                mastery >= 5
                  ? baseNodeRadius * currentZoomVal +
                    interpolate(pulseAnim.value, [0, 1], [0, 10])
                  : undefined;

              return (
                <ConceptNode3D
                  key={node.id}
                  node={node}
                  mastery={mastery}
                  seenState={seenState}
                  rotateX={rotateX}
                  rotateY={rotateY}
                  zoom={zoom}
                  panX={panX}
                  panY={panY}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                  isDarkMode={isDarkMode}
                  isSelected={node.id === selectedNodeId}
                  scale={currentZoomVal}
                  pulseRadius={pulseR}
                />
              );
            })}
          </Canvas>
        </View>
      </GestureDetector>

      {/* ── HUD Interactive Overlay ─────────────────────────────────────────── */}
      <View
        style={[styles.hud, { paddingTop: insets.top + SPACING.md }]}
        pointerEvents="box-none"
      >
        {/* Header (Text Only, gestures pass through) */}
        <View style={styles.header} pointerEvents="none">
          <Text style={[styles.wordmark, { color: theme.text }]}>L'Espace</Text>
          <Text style={[styles.nodeCount, { color: theme.textMuted }]}>
            {concepts.length} concepts
          </Text>
        </View>

        {/* Dynamic Concept HUD card */}
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
            onPress={() => {
              if (onNodeSelect && selectedNode) onNodeSelect(selectedNode.id);
            }}
          >
            <View style={styles.nodeCardRow}>
              <View
                style={[
                  styles.masteryDot,
                  {
                    backgroundColor:
                      (isDarkMode ? COLORS.dark : COLORS.light).mastery[
                        Math.round(selectedProgress?.mastery ?? 0) as 0 | 1 | 2 | 3 | 4 | 5
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
                  {'★'.repeat(selectedProgress?.mastery ?? 0)}{'☆'.repeat(5 - (selectedProgress?.mastery ?? 0))}
                </Text>
              </View>
            </View>
            <Text style={[styles.nodeCardHint, { color: theme.textMuted }]}>
              Appuyez pour explorer & pratiquer →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Loading Skeleton */}
      {!isInitialized && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Chargement de l'univers 3D…
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
    shadowOpacity: 0.1,
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

export default NebulaCanvas;
