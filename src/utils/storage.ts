// Minimal IndexedDB storage layer for MVP
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Exercise, AppSettings, CEFRLevel, ExerciseType, WordProgress } from '../types';

// Database schema definition
interface RapideDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-level': CEFRLevel; 'by-type': ExerciseType };
  };
  settings: {
    key: 'app-settings';
    value: AppSettings;
  };
  wordProgress: {
    key: string;
    value: WordProgress;
    indexes: { 'by-mastery': number; 'by-lastSeen': string };
  };
}

const DB_NAME = 'rapide-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<RapideDB> | null = null;

// Initialize database with stores and indexes
async function getDB(): Promise<IDBPDatabase<RapideDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<RapideDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create exercises store
      if (!db.objectStoreNames.contains('exercises')) {
        const exerciseStore = db.createObjectStore('exercises', {
          keyPath: 'id',
        });
        exerciseStore.createIndex('by-level', 'level');
        exerciseStore.createIndex('by-type', 'type');
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // Create wordProgress store (added in version 2)
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('wordProgress')) {
          const wordProgressStore = db.createObjectStore('wordProgress', {
            keyPath: 'wordId',
          });
          wordProgressStore.createIndex('by-mastery', 'masteryLevel');
          wordProgressStore.createIndex('by-lastSeen', 'lastSeen');
        }
      }
    },
  });

  return dbInstance;
}

// Exercise storage operations
export const exerciseStorage = {
  // Store a single exercise
  async store(exercise: Exercise): Promise<void> {
    const db = await getDB();
    await db.put('exercises', exercise);
  },

  // Store multiple exercises
  async storeMany(exercises: Exercise[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('exercises', 'readwrite');
    await Promise.all([
      ...exercises.map((exercise) => tx.store.put(exercise)),
      tx.done,
    ]);
  },

  // Retrieve exercises by level
  async getByLevel(level: CEFRLevel): Promise<Exercise[]> {
    const db = await getDB();
    return db.getAllFromIndex('exercises', 'by-level', level);
  },

  // Retrieve exercises by type
  async getByType(type: ExerciseType): Promise<Exercise[]> {
    const db = await getDB();
    return db.getAllFromIndex('exercises', 'by-type', type);
  },

  // Retrieve exercises by level and type
  async getByLevelAndType(
    level: CEFRLevel,
    type: ExerciseType
  ): Promise<Exercise[]> {
    const db = await getDB();
    const allByLevel = await db.getAllFromIndex('exercises', 'by-level', level);
    return allByLevel.filter((exercise) => exercise.type === type);
  },

  // Get a single exercise by ID
  async getById(id: string): Promise<Exercise | undefined> {
    const db = await getDB();
    return db.get('exercises', id);
  },

  // Delete an exercise
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('exercises', id);
  },

  // Clear all exercises
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('exercises');
  },

  // Count exercises by level
  async countByLevel(level: CEFRLevel): Promise<number> {
    const db = await getDB();
    return db.countFromIndex('exercises', 'by-level', level);
  },
};

// Settings storage operations
export const settingsStorage = {
  // Get app settings
  async get(): Promise<AppSettings | undefined> {
    const db = await getDB();
    return db.get('settings', 'app-settings');
  },

  // Update app settings
  async update(settings: AppSettings): Promise<void> {
    const db = await getDB();
    await db.put('settings', settings, 'app-settings');
  },

  // Delete settings (reset to default)
  async delete(): Promise<void> {
    const db = await getDB();
    await db.delete('settings', 'app-settings');
  },
};

// Word progress storage operations
export const wordProgressStorage = {
  // Get progress for a single word
  async get(wordId: string): Promise<WordProgress | undefined> {
    const db = await getDB();
    return db.get('wordProgress', wordId);
  },

  // Get all word progress records
  async getAll(): Promise<WordProgress[]> {
    const db = await getDB();
    return db.getAll('wordProgress');
  },

  // Store/update word progress
  async update(progress: WordProgress): Promise<void> {
    const db = await getDB();
    await db.put('wordProgress', progress);
  },

  // Get words by mastery level
  async getByMastery(masteryLevel: number): Promise<WordProgress[]> {
    const db = await getDB();
    return db.getAllFromIndex('wordProgress', 'by-mastery', masteryLevel);
  },

  // Get weak words (mastery <= 2)
  async getWeakWords(): Promise<WordProgress[]> {
    const db = await getDB();
    const all = await db.getAll('wordProgress');
    return all.filter(p => p.masteryLevel <= 2);
  },

  // Delete progress for a word
  async delete(wordId: string): Promise<void> {
    const db = await getDB();
    await db.delete('wordProgress', wordId);
  },

  // Clear all progress
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('wordProgress');
  },
};

// Utility function to check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
