// Saybon v2 — Grid Viewport Store (Zustand)
// Manages the 2D viewport state of the spatial concept grid:
// pan offset, zoom scale, selected node, focus mode.
// Designed for Reanimated SharedValue integration — JS state mirrors
// the animated values for React-side conditionals only.

import { create } from 'zustand';
import type { CEFRLevel } from '../content/schema';

export type GridZoomLevel = 'galaxy' | 'cluster' | 'node';

/** Determines rendering detail based on zoom scale */
export function zoomLevelFromScale(scale: number): GridZoomLevel {
  if (scale < 0.5) return 'galaxy';   // Heatmap view — clusters only
  if (scale < 1.2) return 'cluster';  // Label + node visible
  return 'node';                       // Full detail — morphology hints visible
}

export interface GridViewport {
  translateX: number;
  translateY: number;
  scale: number;
}

interface GridStore {
  // Viewport (mirrors Reanimated SharedValues for React conditionals)
  viewport: GridViewport;
  zoomLevel: GridZoomLevel;

  // Active View Mode (2D flat grid vs 3D space nebula)
  currentMode: '2D' | '3D';

  // Selection & Focus
  selectedNodeId: string | null;
  focusedNodeId: string | null;    // Zoomed-in focus (drill-down intent)

  // Filter state
  activeLevelFilter: CEFRLevel | 'all';
  showOnlySeen: boolean;
  showOnlyMastered: boolean;

  // Actions
  setViewport: (viewport: GridViewport) => void;
  setMode: (mode: '2D' | '3D') => void;
  selectNode: (id: string | null) => void;
  focusNode: (id: string | null) => void;
  setLevelFilter: (level: CEFRLevel | 'all') => void;
  toggleShowOnlySeen: () => void;
  toggleShowOnlyMastered: () => void;
  resetViewport: () => void;
}

const DEFAULT_VIEWPORT: GridViewport = {
  translateX: 0,
  translateY: 0,
  scale: 0.85,
};

export const useGridStore = create<GridStore>((set) => ({
  viewport: DEFAULT_VIEWPORT,
  zoomLevel: zoomLevelFromScale(DEFAULT_VIEWPORT.scale),
  currentMode: '2D',

  selectedNodeId: null,
  focusedNodeId: null,

  activeLevelFilter: 'all',
  showOnlySeen: false,
  showOnlyMastered: false,

  setViewport: (viewport) =>
    set({
      viewport,
      zoomLevel: zoomLevelFromScale(viewport.scale),
    }),

  setMode: (mode) => set({ currentMode: mode, selectedNodeId: null }), // Clear selection on switch to prevent ghost cards

  selectNode: (id) => set({ selectedNodeId: id }),

  focusNode: (id) => set({ focusedNodeId: id }),

  setLevelFilter: (level) => set({ activeLevelFilter: level }),

  toggleShowOnlySeen: () =>
    set((s) => ({ showOnlySeen: !s.showOnlySeen })),

  toggleShowOnlyMastered: () =>
    set((s) => ({ showOnlyMastered: !s.showOnlyMastered })),

  resetViewport: () =>
    set({
      viewport: DEFAULT_VIEWPORT,
      zoomLevel: zoomLevelFromScale(DEFAULT_VIEWPORT.scale),
      currentMode: '2D',
      selectedNodeId: null,
      focusedNodeId: null,
    }),
}));
