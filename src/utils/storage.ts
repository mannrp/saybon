// Minimal IndexedDB storage layer for MVP
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Exercise, AppSettings, CEFRLevel, ExerciseType } from '../types';

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
}

const DB_NAME = 'rapide-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RapideDB> | null = null;

// Initialize database with stores and indexes
async function getDB(): Promise<IDBPDatabase<RapideDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<RapideDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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

// Utility function to check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
