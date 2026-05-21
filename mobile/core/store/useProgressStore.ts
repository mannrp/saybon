// Saybon v2 — Zustand Progress Store (SQLite + MMKV Caching)
import { create } from 'zustand';
import {
  initDatabase,
  seedDatabase,
  getAllConcepts,
  getAllRelationships,
  getAllProgress,
  saveProgress,
} from '../db/database';
import { updateProgressRecord, createInitialProgress } from '../mastery/masteryEngine';
import { getNeighbors, getDerivedConcepts } from '../content/relationships';
import type { ConceptNode, ConceptRelationship, ConceptProgress } from '../content/schema';

interface ProgressStore {
  // Store State
  concepts: ConceptNode[];
  conceptsMap: Map<string, ConceptNode>;
  relationships: ConceptRelationship[];
  progress: Record<string, ConceptProgress>;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  recordAnswer: (conceptId: string, isCorrect: boolean) => Promise<ConceptProgress>;
  resetProgress: () => Promise<void>;
  
  // Graph Queries
  getNeighbors: (conceptId: string) => { neighborId: string; type: string; weight: number }[];
  getDerived: (conceptId: string) => string[];
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  concepts: [],
  conceptsMap: new Map(),
  relationships: [],
  progress: {},
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    try {
      // 1. Setup SQLite schema and seed if first launch
      await initDatabase();
      await seedDatabase();

      // 2. Fetch all dataset from SQLite
      const concepts = await getAllConcepts();
      const relationships = await getAllRelationships();
      const progressList = await getAllProgress();

      // 3. Construct map for O(1) lookups
      const conceptsMap = new Map<string, ConceptNode>();
      concepts.forEach((c) => conceptsMap.set(c.id, c));

      // 4. Map progress array to dictionary
      const progressRecord: Record<string, ConceptProgress> = {};
      progressList.forEach((p) => {
        progressRecord[p.conceptId] = p;
      });

      set({
        concepts,
        conceptsMap,
        relationships,
        progress: progressRecord,
        isInitialized: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to initialize progress store:', error);
      set({
        error: error.message || 'Database initialization failed.',
        isLoading: false,
      });
    }
  },

  recordAnswer: async (conceptId: string, isCorrect: boolean): Promise<ConceptProgress> => {
    const { progress, conceptsMap } = get();
    
    // Ensure the concept actually exists before tracking
    if (!conceptsMap.has(conceptId)) {
      throw new Error(`Concept with ID ${conceptId} not found in dataset.`);
    }

    // 1. Retrieve or generate default progress
    const existing = progress[conceptId] || createInitialProgress(conceptId);

    // 2. Run mastery engine calculations
    const updated = updateProgressRecord(existing, isCorrect);

    // 3. Persist to SQLite and MMKV hot cache synchronously/asynchronously
    await saveProgress(updated);

    // 4. Update memory state in Zustand
    set((state) => ({
      progress: {
        ...state.progress,
        [conceptId]: updated,
      },
    }));

    return updated;
  },

  resetProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const { concepts, conceptsMap } = get();
      
      // Open transaction to reset progress entries in SQLite
      const { db, rebuildProgressHotCache } = require('../db/database');
      await db.execute('BEGIN TRANSACTION;');
      
      for (const concept of concepts) {
        await db.execute(
          `INSERT OR REPLACE INTO progress (conceptId, mastery, seenState, reviewState, familiarityScore, streak, attempts, correctAnswers, lastSeen)
           VALUES (?, 0, 0, 'new', 0.0, 0, 0, 0, NULL)`,
          [concept.id]
        );
      }
      
      await db.execute('COMMIT;');
      
      // Rebuild the MMKV hot-cache
      await rebuildProgressHotCache();

      // Read reset values back to memory state
      const freshProgress = await getAllProgress();
      const progressRecord: Record<string, ConceptProgress> = {};
      freshProgress.forEach((p) => {
        progressRecord[p.conceptId] = p;
      });

      set({
        progress: progressRecord,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to reset progress:', error);
      set({
        error: error.message || 'Failed to reset progress state.',
        isLoading: false,
      });
    }
  },

  getNeighbors: (conceptId: string) => {
    return getNeighbors(conceptId, get().relationships);
  },

  getDerived: (conceptId: string) => {
    return getDerivedConcepts(conceptId, get().relationships);
  },
}));
