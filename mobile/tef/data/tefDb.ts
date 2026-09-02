// SayBon — TEF Canada Mode: SQLite Data Layer
// Sibling to core/db/database.ts, not a modification of it. Uses its own MMKV
// seed flag (saybon_tef_seeded_v1) so TEF content can be re-seeded without
// touching the 800 L'Atelier concepts. See planning/TEF_MODE_DESIGN.md §3, §8.

import { db, mmkvStorage } from '../../core/db/database';
import type {
  TefEssay,
  TefItem,
  TefModule,
  TefOption,
  TefResponse,
  TefStimulus,
  TefWritingPrompt,
} from './itemSchema';

const TEF_SEEDED_KEY = 'saybon_tef_seeded_v1';

/**
 * Create TEF SQLite tables. Called once from core/db/database.ts#initDatabase,
 * after the core tables exist. Idempotent.
 */
export async function initTefTables(): Promise<void> {
  console.log('Initializing TEF Mode SQLite Tables...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tef_stimuli (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      wordCount INTEGER NOT NULL,
      audioAssetId TEXT,
      targetBand INTEGER NOT NULL,
      sourceModel TEXT NOT NULL,
      reviewStatus TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tef_items (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      itemType TEXT NOT NULL,
      stimulusId TEXT,
      prompt TEXT NOT NULL,
      options TEXT NOT NULL,
      correctOptionId TEXT NOT NULL,
      rationale TEXT NOT NULL,
      distractorRationales TEXT NOT NULL,
      skillTags TEXT NOT NULL,
      targetBand INTEGER NOT NULL,
      sourceModel TEXT NOT NULL,
      reviewStatus TEXT NOT NULL,
      FOREIGN KEY (stimulusId) REFERENCES tef_stimuli(id) ON DELETE CASCADE
    );
  `);

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_tef_items_selection ON tef_items(module, targetBand, itemType);`
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tef_responses (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      chosenOptionId TEXT,
      correct INTEGER NOT NULL,
      elapsedMs INTEGER NOT NULL,
      sessionId TEXT NOT NULL,
      answeredAt INTEGER NOT NULL
    );
  `);

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_tef_responses_item ON tef_responses(itemId);`
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_tef_responses_time ON tef_responses(answeredAt);`
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tef_essays (
      id TEXT PRIMARY KEY,
      promptId TEXT NOT NULL,
      body TEXT NOT NULL,
      wordCount INTEGER NOT NULL,
      elapsedMs INTEGER NOT NULL,
      offlineReport TEXT,
      aiFeedback TEXT,
      submittedAt INTEGER NOT NULL
    );
  `);
}

/**
 * Seed TEF content from mobile/seed/tef/*.json on first run. No-ops if
 * already seeded, mirroring core/db/database.ts#seedDatabase.
 */
export async function seedTefContent(): Promise<void> {
  if (mmkvStorage.getBoolean(TEF_SEEDED_KEY)) {
    console.log('TEF content already seeded.');
    return;
  }

  console.log('Seeding TEF content...');

  try {
    const ceStimuli = safeRequireJson<TefStimulus[]>('../../seed/tef/ce-stimuli.json');
    const ceItems = safeRequireJson<TefItem[]>('../../seed/tef/ce-items.json');
    const coItems = safeRequireJson<TefItem[]>('../../seed/tef/co-items.json');
    const eePrompts = safeRequireJson<TefWritingPrompt[]>('../../seed/tef/ee-prompts.json');

    if (
      ceStimuli.length === 0 &&
      ceItems.length === 0 &&
      coItems.length === 0 &&
      eePrompts.length === 0
    ) {
      console.log('No TEF seed content present yet (Phase 0 — content pipeline not run). Skipping.');
      mmkvStorage.set(TEF_SEEDED_KEY, true);
      return;
    }

    await db.execute('BEGIN TRANSACTION;');

    for (const stimulus of ceStimuli) {
      await insertStimulus(stimulus);
    }
    for (const item of [...ceItems, ...coItems]) {
      await insertItem(item);
    }
    for (const prompt of eePrompts) {
      await insertWritingPrompt(prompt);
    }

    await db.execute('COMMIT;');
    mmkvStorage.set(TEF_SEEDED_KEY, true);
    console.log(
      `TEF seeding complete. ${ceStimuli.length} stimuli, ${ceItems.length + coItems.length} items, ${eePrompts.length} writing prompts.`
    );
  } catch (error) {
    await db.execute('ROLLBACK;');
    console.error('TEF content seeding failed, rolled back changes:', error);
    throw error;
  }
}

function safeRequireJson<T>(path: string): T extends unknown[] ? T : never {
  try {
    // Metro bundler static JSON imports, same pattern as core/db/database.ts.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path);
  } catch {
    return [] as unknown as T extends unknown[] ? T : never;
  }
}

async function insertStimulus(s: TefStimulus): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO tef_stimuli (id, module, kind, title, body, wordCount, audioAssetId, targetBand, sourceModel, reviewStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.id,
      s.module,
      s.kind,
      s.title,
      s.body,
      s.wordCount,
      s.audioAssetId,
      s.targetBand,
      s.sourceModel,
      s.reviewStatus,
    ]
  );
}

async function insertItem(i: TefItem): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO tef_items (id, module, itemType, stimulusId, prompt, options, correctOptionId, rationale, distractorRationales, skillTags, targetBand, sourceModel, reviewStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      i.id,
      i.module,
      i.itemType,
      i.stimulusId,
      i.prompt,
      JSON.stringify(i.options),
      i.correctOptionId,
      i.rationale,
      JSON.stringify(i.distractorRationales),
      JSON.stringify(i.skillTags),
      i.targetBand,
      i.sourceModel,
      i.reviewStatus,
    ]
  );
}

async function insertWritingPrompt(p: TefWritingPrompt): Promise<void> {
  // tef_essays stores submissions, not prompts. Prompts ship as static seed
  // data read directly from JSON at runtime (small, immutable, no query need).
  // This function is a placeholder seam for Phase 4 if prompts move to SQLite.
  void p;
}

function rowToStimulus(row: Record<string, unknown>): TefStimulus {
  return {
    id: row.id as string,
    module: row.module as TefStimulus['module'],
    kind: row.kind as TefStimulus['kind'],
    title: (row.title as string) ?? null,
    body: row.body as string,
    wordCount: row.wordCount as number,
    audioAssetId: (row.audioAssetId as string) ?? null,
    targetBand: row.targetBand as number,
    sourceModel: row.sourceModel as string,
    reviewStatus: row.reviewStatus as TefStimulus['reviewStatus'],
  };
}

function rowToItem(row: Record<string, unknown>): TefItem {
  return {
    id: row.id as string,
    module: row.module as TefModule,
    itemType: row.itemType as TefItem['itemType'],
    stimulusId: (row.stimulusId as string) ?? null,
    prompt: row.prompt as string,
    options: JSON.parse(row.options as string) as TefOption[],
    correctOptionId: row.correctOptionId as string,
    rationale: row.rationale as string,
    distractorRationales: JSON.parse(row.distractorRationales as string) as Record<string, string>,
    skillTags: JSON.parse(row.skillTags as string) as string[],
    targetBand: row.targetBand as number,
    sourceModel: row.sourceModel as string,
    reviewStatus: row.reviewStatus as TefItem['reviewStatus'],
  };
}

export async function getTefItemCount(module?: TefModule): Promise<number> {
  const result = module
    ? await db.execute('SELECT COUNT(*) as n FROM tef_items WHERE module = ?', [module])
    : await db.execute('SELECT COUNT(*) as n FROM tef_items');
  return (result.rows?.[0]?.n as number) ?? 0;
}

export async function getTefStimulus(id: string): Promise<TefStimulus | null> {
  const result = await db.execute('SELECT * FROM tef_stimuli WHERE id = ?', [id]);
  if (!result.rows || result.rows.length === 0) return null;
  return rowToStimulus(result.rows[0]);
}

/**
 * Candidate pool for the drill selection algorithm (see TEF_MODE_DESIGN.md §5.1).
 * Selection weighting (skill-tag priority, spaced repetition, recency decay)
 * happens in tef/hooks/useDrillSession.ts, not here — this is the raw query.
 */
export async function getTefItemsInBandRange(
  module: TefModule,
  minBand: number,
  maxBand: number
): Promise<TefItem[]> {
  const result = await db.execute(
    `SELECT * FROM tef_items WHERE module = ? AND targetBand >= ? AND targetBand <= ? AND reviewStatus != 'flagged'`,
    [module, minBand, maxBand]
  );
  if (!result.rows) return [];
  const items: TefItem[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(rowToItem(result.rows[i]));
  }
  return items;
}

/**
 * Raw (itemId, correct, skillTags) rows for every response to the given
 * module, joined against tef_items. Used by tef/hooks/useDrillSession.ts to
 * compute per-skill-tag accuracy for the selection weighting in
 * TEF_MODE_DESIGN.md §5.1. Small dataset by construction (a learner's own
 * response history) — aggregation happens in JS, not SQL, deliberately, so
 * it stays readable without leaning on op-sqlite's JSON1 support.
 */
export async function getResponseHistoryWithSkillTags(
  module: TefModule
): Promise<{ correct: boolean; skillTags: string[]; answeredAt: number; itemId: string }[]> {
  const result = await db.execute(
    `SELECT r.itemId as itemId, r.correct as correct, r.answeredAt as answeredAt, i.skillTags as skillTags
     FROM tef_responses r
     JOIN tef_items i ON i.id = r.itemId
     WHERE i.module = ?
     ORDER BY r.answeredAt DESC`,
    [module]
  );
  if (!result.rows) return [];
  const rows: { correct: boolean; skillTags: string[]; answeredAt: number; itemId: string }[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    let skillTags: string[] = [];
    try {
      skillTags = JSON.parse(row.skillTags as string);
    } catch {
      skillTags = [];
    }
    rows.push({
      itemId: row.itemId as string,
      correct: row.correct === 1,
      answeredAt: row.answeredAt as number,
      skillTags,
    });
  }
  return rows;
}

export async function recordTefResponse(response: TefResponse): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO tef_responses (id, itemId, chosenOptionId, correct, elapsedMs, sessionId, answeredAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      response.id,
      response.itemId,
      response.chosenOptionId,
      response.correct ? 1 : 0,
      response.elapsedMs,
      response.sessionId,
      response.answeredAt,
    ]
  );
}

/**
 * Rolling accuracy per band, used by tef/scoring/estimateBand.ts.
 * Reads the append-only response log directly — never a cached aggregate.
 * See TEF_MODE_DESIGN.md §3.4 for why the log must stay the source of truth.
 */
export async function getRecentResponsesForModule(
  module: TefModule,
  limit: number = 400
): Promise<{ targetBand: number; correct: boolean; answeredAt: number }[]> {
  const result = await db.execute(
    `SELECT r.correct as correct, r.answeredAt as answeredAt, i.targetBand as targetBand
     FROM tef_responses r
     JOIN tef_items i ON i.id = r.itemId
     WHERE i.module = ?
     ORDER BY r.answeredAt DESC
     LIMIT ?`,
    [module, limit]
  );
  if (!result.rows) return [];
  const rows: { targetBand: number; correct: boolean; answeredAt: number }[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    rows.push({
      targetBand: row.targetBand as number,
      correct: row.correct === 1,
      answeredAt: row.answeredAt as number,
    });
  }
  return rows;
}

export async function saveTefEssay(essay: TefEssay): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO tef_essays (id, promptId, body, wordCount, elapsedMs, offlineReport, aiFeedback, submittedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      essay.id,
      essay.promptId,
      essay.body,
      essay.wordCount,
      essay.elapsedMs,
      essay.offlineReport,
      essay.aiFeedback,
      essay.submittedAt,
    ]
  );
}

export async function flagTefItem(itemId: string): Promise<void> {
  await db.execute(`UPDATE tef_items SET reviewStatus = 'flagged' WHERE id = ?`, [itemId]);
}

export async function markTefItemReviewed(itemId: string): Promise<void> {
  await db.execute(`UPDATE tef_items SET reviewStatus = 'human-reviewed' WHERE id = ?`, [itemId]);
}
