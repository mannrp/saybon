// SayBon — TEF Mode Zustand Store
// Mirrors the selector-only-subscription discipline established in
// planning/SAYBON_TECHNICAL_AUDIT.md §1 — every consumer must select a slice,
// never destructure the whole store.

import { create } from 'zustand';
import { getTefItemCount } from '../data/tefDb';
import type { TefModule } from '../data/itemSchema';

interface TefStore {
  itemCounts: Partial<Record<TefModule, number>>;
  isLoaded: boolean;
  loadItemCounts: () => Promise<void>;
}

export const useTefStore = create<TefStore>((set) => ({
  itemCounts: {},
  isLoaded: false,

  loadItemCounts: async () => {
    try {
      const [ce, co, ee] = await Promise.all([
        getTefItemCount('CE'),
        getTefItemCount('CO'),
        getTefItemCount('EE'),
      ]);
      set({ itemCounts: { CE: ce, CO: co, EE: ee }, isLoaded: true });
    } catch (err) {
      console.warn('Failed to load TEF item counts:', err);
      set({ isLoaded: true });
    }
  },
}));
