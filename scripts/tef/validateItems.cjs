// SayBon — TEF Content QA Gate
// Mirrors planning/TEF_MODE_DESIGN.md §8.2. Run with:
//   node scripts/tef/validateItems.cjs <path-to-result.json>
//
// Standalone Node script (no ts-node dependency) so it runs against relay
// results immediately. Accepts two input shapes:
//   1. A flat array of items (e.g. gap-fill batches — no stimuli involved)
//   2. An object { stimuli: [...], items: [...] } (passage-mcq, doc-match,
//      CO audio-mcq — anything where items reference a stimulusId)
// Shape is auto-detected. Should eventually be superseded by a proper
// scripts/tef/validateItems.ts sharing tef/data/itemSchema.ts directly.

const fs = require('fs');
const path = require('path');

const SKILL_TAGS = new Set([
  // CE
  'inference', 'detail-scan', 'main-idea', 'connecteurs-logiques',
  'reference-anaphorique', 'register-detection', 'false-friend', 'negation',
  'temporal-sequence', 'author-stance', 'lexical-precision',
  // grammar-in-context
  'subjonctif', 'temps-du-passe', 'pronoms-relatifs', 'pronoms-complements',
  'accord', 'prepositions', 'articles-partitifs', 'conditionnel',
  'gerondif', 'concordance-des-temps',
  // EE
  'structure-argumentative', 'articulateurs', 'richesse-lexicale', 'registre',
  'longueur-consigne', 'coherence', 'orthographe-grammaticale',
]);

const TEF_MODULES = new Set(['CE', 'CO', 'EE']);
const TEF_ITEM_TYPES = new Set([
  'doc-match', 'passage-mcq', 'gap-fill', 'text-order', 'register-match', 'audio-mcq',
]);
const STIMULUS_KINDS = new Set(['article', 'ad', 'email', 'notice', 'dialogue', 'announcement']);

/**
 * Validates a TefWritingPrompt[] batch (EE section — no options/correctOptionId,
 * so none of the MCQ checks below apply). Prints its own report and exits.
 */
function validateWritingPrompts(prompts) {
  const failures = [];
  const warnings = [];
  const fail = (id, reason) => failures.push({ id, reason });
  const warn = (id, reason) => warnings.push({ id, reason });

  const seenIds = new Set();
  const bySection = { A: 0, B: 0 };
  const bandBySection = {};

  for (const p of prompts) {
    const id = p.id || '(missing id)';
    if (seenIds.has(id)) fail(id, 'duplicate id');
    seenIds.add(id);

    if (p.section !== 'A' && p.section !== 'B') {
      fail(id, `section should be "A" or "B", got "${p.section}"`);
      continue;
    }
    bySection[p.section]++;
    const key = `${p.section}-${p.targetBand}`;
    bandBySection[key] = (bandBySection[key] || 0) + 1;

    if (!p.brief || p.brief.trim().length === 0) fail(id, 'empty brief');

    if (p.section === 'A') {
      if (!p.leadIn || p.leadIn.trim().length === 0) fail(id, 'Section A requires a non-null leadIn');
      if (p.minWords !== 80) warn(id, `Section A minWords should be 80, got ${p.minWords}`);
      if (p.suggestedMinutes !== 20) warn(id, `Section A suggestedMinutes should be 20, got ${p.suggestedMinutes}`);
    } else {
      if (p.leadIn !== null) fail(id, `Section B leadIn should be null, got ${JSON.stringify(p.leadIn)}`);
      if (p.minWords !== 200) warn(id, `Section B minWords should be 200, got ${p.minWords}`);
      if (p.suggestedMinutes !== 40) warn(id, `Section B suggestedMinutes should be 40, got ${p.suggestedMinutes}`);
    }
  }

  // Near-duplicate topic detection across briefs
  const normalized = new Map();
  for (const p of prompts) {
    const norm = (p.brief || '').toLowerCase().replace(/[^a-zàâäéèêëïîôöùûüç ]/gi, '').slice(0, 120);
    if (!norm) continue;
    if (normalized.has(norm)) warn('BATCH', `possible near-duplicate brief: "${p.id}" vs "${normalized.get(norm)}"`);
    else normalized.set(norm, p.id);
  }

  console.log(`=== TEF QA Gate (writing prompts): ${path.basename(filePath)} ===\n`);
  console.log(`Prompts: ${prompts.length}`);
  console.log(`Section distribution: ${JSON.stringify(bySection)} (expected {"A":10,"B":10})`);
  console.log(`Band-by-section: ${JSON.stringify(bandBySection)}`);

  console.log(`\n--- FAILURES (${failures.length}) ---`);
  for (const f of failures) console.log(`  [FAIL] ${f.id}: ${f.reason}`);
  console.log(`\n--- WARNINGS (${warnings.length}) ---`);
  for (const w of warnings) console.log(`  [WARN] ${w.id}: ${w.reason}`);
  console.log(`\n=== RESULT: ${failures.length === 0 ? 'PASS (with warnings noted above)' : 'FAIL'} ===`);
  process.exit(failures.length === 0 ? 0 : 1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/tef/validateItems.cjs <path-to-result.json>');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('FATAL: not valid JSON —', e.message);
  process.exit(1);
}

// EE writing prompts are a structurally different shape (section/brief/
// leadIn/minWords — no module/itemType/options/correctOptionId at all), so
// detect and validate them on their own path rather than force-fitting the
// MCQ-shaped checks below onto a schema that was never going to satisfy them.
if (Array.isArray(parsed) && parsed.length > 0 && 'section' in parsed[0] && !('options' in parsed[0])) {
  validateWritingPrompts(parsed);
  process.exit(0); // validateWritingPrompts exits itself; unreachable, kept for clarity
}

let stimuli = [];
let items = [];
if (Array.isArray(parsed)) {
  items = parsed;
} else if (parsed && Array.isArray(parsed.items)) {
  items = parsed.items;
  stimuli = Array.isArray(parsed.stimuli) ? parsed.stimuli : [];
} else {
  console.error('FATAL: expected either a JSON array of items, or an object with an "items" array.');
  process.exit(1);
}

const failures = []; // { id, reason }
const warnings = [];
function fail(id, reason) { failures.push({ id, reason }); }
function warn(id, reason) { warnings.push({ id, reason }); }

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

// ---- Stimuli checks ----
const stimulusIds = new Set();
for (const s of stimuli) {
  const id = s.id || '(missing id)';
  if (stimulusIds.has(id)) fail(id, 'duplicate stimulus id');
  stimulusIds.add(id);

  if (!TEF_MODULES.has(s.module)) fail(id, `stimulus module "${s.module}" not a valid module`);
  if (!STIMULUS_KINDS.has(s.kind)) fail(id, `stimulus kind "${s.kind}" not a valid kind`);
  if (!s.body || s.body.trim().length === 0) fail(id, 'stimulus body is empty');
  if (s.reviewStatus !== 'generated') warn(id, `stimulus reviewStatus should be "generated", got "${s.reviewStatus}"`);

  const actualWc = wordCount(s.body);
  if (typeof s.wordCount === 'number' && Math.abs(actualWc - s.wordCount) > Math.max(5, actualWc * 0.25)) {
    warn(id, `declared wordCount ${s.wordCount} doesn't match actual (~${actualWc})`);
  }

  if (s.module === 'CO' && s.audioAssetId !== null) {
    warn(id, `CO stimulus should have audioAssetId: null at this stage, got ${JSON.stringify(s.audioAssetId)}`);
  }
}

// ---- Item checks ----
const seenItemIds = new Set();
const positionCounts = { a: 0, b: 0, c: 0, d: 0 };
const bandCounts = {};
const itemTypeCounts = {};

for (const item of items) {
  const id = item.id || '(missing id)';

  if (seenItemIds.has(id)) fail(id, 'duplicate item id');
  seenItemIds.add(id);

  if (!TEF_MODULES.has(item.module)) fail(id, `module "${item.module}" not a valid module`);
  if (!TEF_ITEM_TYPES.has(item.itemType)) fail(id, `itemType "${item.itemType}" not a valid item type`);
  itemTypeCounts[item.itemType] = (itemTypeCounts[item.itemType] || 0) + 1;

  if (item.stimulusId !== null && item.stimulusId !== undefined) {
    if (stimuli.length > 0 && !stimulusIds.has(item.stimulusId)) {
      fail(id, `stimulusId "${item.stimulusId}" does not match any stimulus in this batch`);
    }
  }

  if (!Array.isArray(item.options) || item.options.length !== 4) {
    fail(id, `expected exactly 4 options, got ${item.options ? item.options.length : 'none'}`);
    continue;
  }

  const optionIds = item.options.map((o) => o.id);
  if (new Set(optionIds).size !== 4) fail(id, 'option ids are not unique');

  if (!optionIds.includes(item.correctOptionId)) {
    fail(id, `correctOptionId "${item.correctOptionId}" does not match any option id`);
  } else {
    if (positionCounts[item.correctOptionId] !== undefined) positionCounts[item.correctOptionId]++;
  }

  const wrongIds = optionIds.filter((oid) => oid !== item.correctOptionId);
  const rationaleKeys = Object.keys(item.distractorRationales || {});
  for (const wid of wrongIds) {
    if (!item.distractorRationales || !item.distractorRationales[wid]) {
      fail(id, `missing distractorRationales entry for wrong option "${wid}"`);
    }
  }
  if (rationaleKeys.length !== wrongIds.length) {
    warn(id, `distractorRationales has ${rationaleKeys.length} entries, expected exactly ${wrongIds.length}`);
  }

  if (!item.rationale || item.rationale.trim().length === 0) fail(id, 'empty rationale');

  if (!Array.isArray(item.skillTags) || item.skillTags.length === 0) {
    fail(id, 'missing skillTags');
  } else {
    for (const tag of item.skillTags) {
      if (!SKILL_TAGS.has(tag)) fail(id, `skillTag "${tag}" is not in the closed taxonomy`);
    }
  }

  if (typeof item.targetBand !== 'number' || item.targetBand < 4 || item.targetBand > 10) {
    warn(id, `targetBand ${item.targetBand} outside the 4-10 NCLC range`);
  }
  bandCounts[item.targetBand] = (bandCounts[item.targetBand] || 0) + 1;

  if (item.reviewStatus !== 'generated') {
    warn(id, `reviewStatus should be "generated", got "${item.reviewStatus}"`);
  }

  // Length-bias check: correct option shouldn't be the longest by a wide margin.
  // Skipped for gap-fill — the correct verb/article form is frequently and
  // legitimately the longest option (compound tenses, elided articles), so
  // this heuristic produces mostly false positives there (confirmed by manual
  // review of the first gap-fill batch — see archive/0001's revision notes).
  // Kept active for passage-mcq/doc-match/audio-mcq, where it's a real,
  // known LLM tell.
  if (item.itemType !== 'gap-fill') {
    const correctOpt = item.options.find((o) => o.id === item.correctOptionId);
    if (correctOpt) {
      const lengths = item.options.map((o) => o.text.length);
      const maxLen = Math.max(...lengths);
      const correctLen = correctOpt.text.length;
      if (correctLen === maxLen && maxLen > Math.min(...lengths) * 1.6) {
        warn(id, 'correct option is conspicuously the longest — possible length bias');
      }
    }
  }

  // Near-duplicate option check within the item
  const texts = item.options.map((o) => o.text.trim().toLowerCase());
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (texts[i] === texts[j]) fail(id, `options "${optionIds[i]}" and "${optionIds[j]}" are identical text`);
    }
  }

  // Language check: rationale/distractorRationales should be in English.
  // Task specs explicitly ask for quoted French phrases inside otherwise-
  // English explanations (e.g. "she states: 'à condition de reporter...'"),
  // so strip anything inside single/curly quotes before testing — otherwise
  // a single correctly-quoted French clause false-flags an English sentence.
  // Confirmed against batch 0007 (see its revision notes): 4 items flagged
  // by the naive version were English prose quoting French dialogue, not
  // French explanations.
  const frenchMarkers = /\b(le|la|les|est|sont|forme|correcte|obligatoire|incompatible|emploie|texte|parce)\b/i;
  const englishMarkers = /\b(the|is|are|correct|form|because|since|requires|text|refers|she|he|states?|sets?|does|not|proposes?|concludes?)\b/i;
  // Known limitation: French elisions (l', d', qu') contain apostrophes that
  // can terminate this pairing early, so a quote containing one may not be
  // fully stripped and can still false-flag. Manually verified against
  // batches 0002 and 0007 — the residual false-positive rate is low enough
  // that this stays advisory (a warning, never a failure); always eyeball
  // flagged items by hand before treating this as a real defect.
  const stripQuotes = (s) => (s || '').replace(/['"“”‘’«»][^'"“”‘’«»]*['"“”‘’«»]/g, '');
  const rationaleText = stripQuotes(item.rationale);
  if (frenchMarkers.test(rationaleText) && !englishMarkers.test(rationaleText)) {
    warn(id, 'rationale appears to be written in French, not English (task requires English explanations)');
  }
}

// ---- Batch-level checks ----
console.log(`=== TEF QA Gate: ${path.basename(filePath)} ===\n`);
console.log(`Stimuli: ${stimuli.length}`);
console.log(`Items: ${items.length}`);
console.log(`Item type distribution: ${JSON.stringify(itemTypeCounts)}`);
console.log(`Band distribution: ${JSON.stringify(bandCounts)}`);
console.log(`Correct-option position distribution: ${JSON.stringify(positionCounts)}`);

const posValues = Object.values(positionCounts);
const posMax = Math.max(...posValues);
const posMin = Math.min(...posValues);
const posTotal = posValues.reduce((a, b) => a + b, 0);
// Only meaningful with enough items to expect a roughly even spread.
if (posTotal >= 16 && posMax - posMin > Math.ceil(posTotal * 0.35)) {
  warn('BATCH', `position bias suspected — spread from ${posMin} to ${posMax} across a/b/c/d out of ${posTotal} total`);
}

// Near-duplicate detection across the whole batch (normalized prompt text)
const normalizedPrompts = new Map();
for (const item of items) {
  const norm = (item.prompt || '').toLowerCase().replace(/[^a-zàâäéèêëïîôöùûüç ]/gi, '').trim();
  if (!norm) continue;
  if (normalizedPrompts.has(norm)) {
    warn('BATCH', `possible near-duplicate prompt: "${item.id}" vs "${normalizedPrompts.get(norm)}"`);
  } else {
    normalizedPrompts.set(norm, item.id);
  }
}

// Near-duplicate stimulus bodies
const normalizedBodies = new Map();
for (const s of stimuli) {
  const norm = (s.body || '').toLowerCase().replace(/[^a-zàâäéèêëïîôöùûüç ]/gi, '').trim().slice(0, 200);
  if (!norm) continue;
  if (normalizedBodies.has(norm)) {
    warn('BATCH', `possible near-duplicate stimulus opening: "${s.id}" vs "${normalizedBodies.get(norm)}"`);
  } else {
    normalizedBodies.set(norm, s.id);
  }
}

console.log(`\n--- FAILURES (${failures.length}) ---`);
for (const f of failures) console.log(`  [FAIL] ${f.id}: ${f.reason}`);

console.log(`\n--- WARNINGS (${warnings.length}) ---`);
for (const w of warnings) console.log(`  [WARN] ${w.id}: ${w.reason}`);

console.log(`\n=== RESULT: ${failures.length === 0 ? 'PASS (with warnings noted above)' : 'FAIL'} ===`);
process.exit(failures.length === 0 ? 0 : 1);
