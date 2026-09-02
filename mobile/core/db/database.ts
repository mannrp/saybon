// Saybon v2 — SQLite + MMKV Offline-First Data Layer
import { open } from '@op-engineering/op-sqlite';
import { createMMKV } from 'react-native-mmkv';
import { buildRelationships } from '../content/relationships';
import type { ConceptNode, ConceptRelationship, ConceptProgress, CEFRLevel } from '../content/schema';
import { initTefTables, seedTefContent } from '../../tef/data/tefDb';

// 1. Initialize MMKV Storage Instance
export const mmkvStorage = createMMKV({
  id: 'saybon-storage',
});

// 2. Open SQLite Database Instance
export const db = open({
  name: 'saybon.db',
});

// Keys for MMKV hot-caches and flags
const SEEDED_KEY = 'saybon_db_seeded_v2';
const PROGRESS_CACHE_KEY_PREFIX = 'progress_cache_';

/**
 * Initialize SQLite database tables
 */
export async function initDatabase(): Promise<void> {
  console.log('Initializing SQLite Database Tables...');
  
  // 1. Create Concepts Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      difficulty REAL NOT NULL,
      level TEXT NOT NULL,
      frequency INTEGER NOT NULL,
      french TEXT NOT NULL,
      english TEXT NOT NULL,
      gender TEXT,
      morphology TEXT, -- JSON-encoded string
      examples TEXT NOT NULL, -- JSON-encoded string
      culturalContext TEXT,
      x REAL NOT NULL,
      y REAL NOT NULL,
      z REAL NOT NULL
    );
  `);

  // Create indexes for efficient visual grid querying and text searching
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_concepts_level ON concepts(level);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_concepts_french ON concepts(french);`);

  // 2. Create Relationships Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS relationships (
      sourceId TEXT NOT NULL,
      targetId TEXT NOT NULL,
      type TEXT NOT NULL,
      weight REAL NOT NULL,
      PRIMARY KEY (sourceId, targetId),
      FOREIGN KEY (sourceId) REFERENCES concepts(id) ON DELETE CASCADE,
      FOREIGN KEY (targetId) REFERENCES concepts(id) ON DELETE CASCADE
    );
  `);
  
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(sourceId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(targetId);`);

  // 3. Create Progress Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS progress (
      conceptId TEXT PRIMARY KEY,
      mastery INTEGER NOT NULL DEFAULT 0,
      seenState INTEGER NOT NULL DEFAULT 0,
      reviewState TEXT NOT NULL DEFAULT 'new',
      familiarityScore REAL NOT NULL DEFAULT 0.0,
      streak INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      correctAnswers INTEGER NOT NULL DEFAULT 0,
      lastSeen TEXT,
      FOREIGN KEY (conceptId) REFERENCES concepts(id) ON DELETE CASCADE
    );
  `);

  // 4. Create TEF Canada mode tables (self-contained, see tef/data/tefDb.ts)
  await initTefTables();
}

/**
 * Seed Database with migrated A1 and A2 assets on first launch
 */
export async function seedDatabase(): Promise<void> {
  // TEF content has its own seed flag and is independent of the L'Atelier
  // concept corpus below — see tef/data/tefDb.ts#seedTefContent.
  await seedTefContent();

  if (mmkvStorage.getBoolean(SEEDED_KEY)) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding Database with migrated vocabularies...');
  
  try {
    // Metro bundler static JSON imports
    const a1Concepts = require('../../seed/a1-concepts.json') as ConceptNode[];
    const a2Concepts = require('../../seed/a2-concepts.json') as ConceptNode[];
    const b1Concepts = require('../../seed/b1-concepts.json') as ConceptNode[];
    const allNodes = [...a1Concepts, ...a2Concepts, ...b1Concepts];

    console.log(`Loading ${allNodes.length} concept nodes...`);

    // Begin SQL Transaction
    await db.execute('BEGIN TRANSACTION;');

    for (const node of allNodes) {
      await db.execute(
        `INSERT OR REPLACE INTO concepts (id, type, difficulty, level, frequency, french, english, gender, morphology, examples, culturalContext, x, y, z)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          node.id,
          node.type,
          node.difficulty,
          node.level,
          node.frequency,
          node.french,
          node.english,
          node.gender || null,
          node.morphology ? JSON.stringify(node.morphology) : null,
          JSON.stringify(node.examples),
          node.culturalContext || null,
          node.coordinates.x,
          node.coordinates.y,
          node.coordinates.z,
        ]
      );

      // Initialize empty progress tracking for the node
      await db.execute(
        `INSERT OR IGNORE INTO progress (conceptId, mastery, seenState, reviewState, familiarityScore, streak, attempts, correctAnswers, lastSeen)
         VALUES (?, 0, 0, 'new', 0.0, 0, 0, 0, NULL)`,
        [node.id]
      );
    }

    // Programmatically generate relationship edges between vocabulary nodes
    console.log('Generating relationships between nodes...');
    const relationships = buildRelationships(allNodes);
    for (const rel of relationships) {
      await db.execute(
        `INSERT OR REPLACE INTO relationships (sourceId, targetId, type, weight)
         VALUES (?, ?, ?, ?)`,
        [rel.sourceId, rel.targetId, rel.type, rel.weight]
      );
    }

    await db.execute('COMMIT;');
    mmkvStorage.set(SEEDED_KEY, true);
    console.log(`Database seeding complete! Seeded ${allNodes.length} concepts and ${relationships.length} edges.`);
    
    // Build initial progress MMKV hot cache
    await rebuildProgressHotCache();
  } catch (error) {
    await db.execute('ROLLBACK;');
    console.error('Database seeding failed, rolled back changes:', error);
    throw error;
  }
}

/**
 * Rebuilds the fast MMKV synchronous hot cache for progress
 * Skia can read this synchronously on each frame for fast visual rendering updates
 */
export async function rebuildProgressHotCache(): Promise<void> {
  console.log('Rebuilding Progress Hot Cache in MMKV...');
  try {
    const result = await db.execute('SELECT conceptId, mastery, seenState, familiarityScore FROM progress');
    if (result.rows && result.rows.length > 0) {
      const batchData: Record<string, string> = {};
      
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        batchData[`${PROGRESS_CACHE_KEY_PREFIX}${row.conceptId}`] = JSON.stringify({
          mastery: row.mastery,
          seenState: row.seenState === 1,
          familiarityScore: row.familiarityScore,
        });
      }
      
      // Batch write into MMKV
      Object.entries(batchData).forEach(([key, val]) => {
        mmkvStorage.set(key, val);
      });
      console.log(`Hot cache successfully rebuilt with ${result.rows.length} progress nodes.`);
    }
  } catch (error) {
    console.error('Failed to rebuild progress hot cache:', error);
  }
}

/**
 * Get progress for a specific concept synchronously from the MMKV hot cache
 */
export function getCachedProgress(conceptId: string): { mastery: number; seenState: boolean; familiarityScore: number } | null {
  const cachedVal = mmkvStorage.getString(`${PROGRESS_CACHE_KEY_PREFIX}${conceptId}`);
  if (!cachedVal) return null;
  try {
    return JSON.parse(cachedVal);
  } catch {
    return null;
  }
}

/**
 * Fetch all concepts from SQLite
 */
export async function getAllConcepts(): Promise<ConceptNode[]> {
  const result = await db.execute('SELECT * FROM concepts');
  const concepts: ConceptNode[] = [];
  
  if (result.rows && result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      concepts.push({
        id: row.id as string,
        type: row.type as ConceptNode['type'],
        difficulty: row.difficulty as number,
        level: row.level as CEFRLevel,
        frequency: row.frequency as number,
        french: row.french as string,
        english: row.english as string,
        gender: (row.gender as ConceptNode['gender']) || undefined,
        morphology: row.morphology ? JSON.parse(row.morphology as string) : undefined,
        examples: JSON.parse(row.examples as string),
        culturalContext: (row.culturalContext as string) || undefined,
        coordinates: {
          x: row.x as number,
          y: row.y as number,
          z: row.z as number,
        },
      });
    }
  }
  
  return concepts;
}

/**
 * Fetch all relationships from SQLite
 */
export async function getAllRelationships(): Promise<ConceptRelationship[]> {
  const result = await db.execute('SELECT * FROM relationships');
  const relationships: ConceptRelationship[] = [];
  
  if (result.rows && result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      relationships.push({
        sourceId: row.sourceId as string,
        targetId: row.targetId as string,
        type: row.type as ConceptRelationship['type'],
        weight: row.weight as number,
      });
    }
  }
  
  return relationships;
}

/**
 * Fetch all progress entries from SQLite
 */
export async function getAllProgress(): Promise<ConceptProgress[]> {
  const result = await db.execute('SELECT * FROM progress');
  const progress: ConceptProgress[] = [];
  
  if (result.rows && result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      progress.push({
        conceptId: row.conceptId as string,
        mastery: row.mastery as number,
        seenState: row.seenState === 1,
        reviewState: row.reviewState as ConceptProgress['reviewState'],
        familiarityScore: row.familiarityScore as number,
        streak: row.streak as number,
        attempts: row.attempts as number,
        correctAnswers: row.correctAnswers as number,
        lastSeen: (row.lastSeen as string) || '',
      });
    }
  }
  
  return progress;
}

/**
 * Save / Update Concept Progress in SQLite and sync it to the MMKV hot cache
 */
export async function saveProgress(progress: ConceptProgress): Promise<void> {
  const seenValue = progress.seenState ? 1 : 0;
  
  // 1. Persist in SQLite
  await db.execute(
    `INSERT OR REPLACE INTO progress (conceptId, mastery, seenState, reviewState, familiarityScore, streak, attempts, correctAnswers, lastSeen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      progress.conceptId,
      progress.mastery,
      seenValue,
      progress.reviewState,
      progress.familiarityScore,
      progress.streak,
      progress.attempts,
      progress.correctAnswers,
      progress.lastSeen || new Date().toISOString(),
    ]
  );
  
  // 2. Sync to MMKV Hot Cache
  mmkvStorage.set(
    `${PROGRESS_CACHE_KEY_PREFIX}${progress.conceptId}`,
    JSON.stringify({
      mastery: progress.mastery,
      seenState: progress.seenState,
      familiarityScore: progress.familiarityScore,
    })
  );
}
