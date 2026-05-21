// Saybon v2 — Grid Layout Projection
// Transforms 3D concept node coordinates (from migration seed) into
// flat 2D screen positions. Handles depth sorting, node radius scaling,
// and opacity depth-fade for the spatial visual hierarchy.

import type { ConceptNode } from '../content/schema';
import type { IndexedNode } from '../content/quadtree';

// World units per screen unit at scale=1.0
// The migration seed places A1 at radius~150, A2 at radius~300
export const WORLD_SCALE = 1.4;

// Min/max visual radius for concept nodes (screen px)
export const NODE_RADIUS_MIN = 10;
export const NODE_RADIUS_MAX = 28;

// Z-depth range from migration: roughly -300 to +300
const Z_MIN = -320;
const Z_MAX = 320;

export interface LayoutNode {
  id: string;
  french: string;
  english: string;
  level: string;
  mastery: number;          // 0-5 from progress store
  seenState: boolean;
  screenX: number;          // Projected 2D x (world space, before pan/zoom)
  screenY: number;          // Projected 2D y (world space, before pan/zoom)
  radius: number;           // Visual radius (px) — depth scaled
  alpha: number;            // Depth-based opacity (0.3 → 1.0)
  zDepth: number;           // Raw z for depth sorting
  type: string;
}

/**
 * Normalize z into [0, 1] range, returning depth factor.
 * Closer to front (higher z) = larger, more opaque.
 */
function depthFactor(z: number): number {
  return (z - Z_MIN) / (Z_MAX - Z_MIN);
}

/**
 * Project a single ConceptNode from 3D world → 2D layout node.
 * mastery and seenState come from the progress store at render time.
 */
export function projectNode(
  node: ConceptNode,
  mastery: number,
  seenState: boolean
): LayoutNode {
  const { x, y, z } = node.coordinates;
  const depth = depthFactor(z);

  // Linear interpolate radius: background nodes are smaller
  const radius =
    NODE_RADIUS_MIN + depth * (NODE_RADIUS_MAX - NODE_RADIUS_MIN);

  // Deeper nodes are brighter; unseen nodes are always dim
  const baseAlpha = 0.28 + depth * 0.72;
  const alpha = seenState ? Math.min(baseAlpha + 0.1, 1.0) : baseAlpha * 0.6;

  return {
    id: node.id,
    french: node.french,
    english: node.english,
    level: node.level,
    mastery,
    seenState,
    screenX: x * WORLD_SCALE,
    screenY: y * WORLD_SCALE,
    radius,
    alpha,
    zDepth: z,
    type: node.type,
  };
}

/**
 * Build full sorted layout from the concept list + progress map.
 * Painter's algorithm: sort ascending by z (back-to-front) so closer
 * nodes are drawn on top of distant ones.
 */
export function buildLayout(
  nodes: ConceptNode[],
  progressMap: Record<string, { mastery: number; seenState: boolean }>
): LayoutNode[] {
  const layout = nodes.map((node) => {
    const prog = progressMap[node.id];
    return projectNode(node, prog?.mastery ?? 0, prog?.seenState ?? false);
  });

  // Back-to-front sort (painter's algorithm)
  layout.sort((a, b) => a.zDepth - b.zDepth);

  return layout;
}

/**
 * Convert layout nodes to IndexedNode entries for the Quadtree.
 * Uses world-space screenX/screenY — the Quadtree lives in world space.
 */
export function layoutToIndexed(nodes: LayoutNode[]): IndexedNode[] {
  return nodes.map((n) => ({
    id: n.id,
    x: n.screenX,
    y: n.screenY,
    radius: n.radius,
  }));
}

/**
 * Apply the camera transform (pan + zoom) to a world-space coordinate,
 * returning the actual device pixel position for rendering.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  translateX: number,
  translateY: number,
  scale: number,
  screenCenterX: number,
  screenCenterY: number
): { px: number; py: number } {
  return {
    px: worldX * scale + translateX + screenCenterX,
    py: worldY * scale + translateY + screenCenterY,
  };
}

/**
 * Inverse camera transform: device pixel → world space.
 * Used to convert a tap position into world coordinates for hit detection.
 */
export function screenToWorld(
  px: number,
  py: number,
  translateX: number,
  translateY: number,
  scale: number,
  screenCenterX: number,
  screenCenterY: number
): { worldX: number; worldY: number } {
  return {
    worldX: (px - translateX - screenCenterX) / scale,
    worldY: (py - translateY - screenCenterY) / scale,
  };
}
