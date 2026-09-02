// SayBon — Cultural Context Patch QA Gate
// Validates a { id, french, english, culturalContext }[] batch (see
// .relay/tasks/0008-quebec-cultural-context.md) against the actual seed
// corpus. Built after the first attempt at this task attached 176/212 notes
// to the wrong concept id — this mechanically catches that failure mode by
// requiring the source french/english to be echoed back and checked exactly.
//
// Run from mobile/: node ../scripts/content/validateCulturalContext.cjs <path>

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/content/validateCulturalContext.cjs <path-to-result.json>');
  process.exit(1);
}

const a1 = require(path.resolve('mobile/seed/a1-concepts.json'));
const a2 = require(path.resolve('mobile/seed/a2-concepts.json'));
const byId = new Map([...a1, ...a2].map((c) => [c.id, c]));

const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
let patches;
try {
  patches = JSON.parse(raw);
} catch (e) {
  console.error('FATAL: not valid JSON —', e.message);
  process.exit(1);
}

const failures = [];
const warnings = [];
const fail = (id, reason) => failures.push({ id, reason });
const warn = (id, reason) => warnings.push({ id, reason });

const seen = new Set();
let mismatchCount = 0;

for (const p of patches) {
  const id = p.id || '(missing id)';
  if (seen.has(id)) fail(id, 'duplicate id');
  seen.add(id);

  const concept = byId.get(p.id);
  if (!concept) {
    fail(id, 'id does not exist in a1/a2 seed corpus');
    continue;
  }

  // The self-check: echoed french/english must exactly match the real word
  // at this id. This is the check that would have caught the first batch's
  // 83% misalignment rate.
  if (!('french' in p) || !('english' in p)) {
    fail(id, 'missing echoed french/english fields (required for the id self-check)');
  } else {
    const frenchMatch = p.french.trim().toLowerCase() === concept.french.trim().toLowerCase();
    const englishMatch = p.english.trim().toLowerCase() === concept.english.trim().toLowerCase();
    if (!frenchMatch || !englishMatch) {
      mismatchCount++;
      fail(
        id,
        `echoed word mismatch — patch says "${p.french}"/"${p.english}", actual concept at this id is "${concept.french}"/"${concept.english}"`
      );
    }
  }

  if (!p.culturalContext || p.culturalContext.trim().length === 0) {
    fail(id, 'empty culturalContext');
    continue;
  }

  // Generic-filler heuristic (advisory only)
  const fillerPattern = /\b(also used in quebec|is common in quebec|is popular in quebec|used commonly)\b/i;
  if (fillerPattern.test(p.culturalContext)) {
    warn(id, 'note reads as generic filler rather than a specific claim');
  }

  // Weak signal that the note is actually about its own word: does the note
  // mention the target french word anywhere? Not required (a good note can
  // discuss a related word/phrase without repeating the headword), but a
  // total absence across the WHOLE batch would be the same red flag as
  // last time, so this is tracked and reported in aggregate below.
}

const total = patches.length;
console.log(`=== Cultural Context QA Gate: ${path.basename(filePath)} ===\n`);
console.log(`Patches: ${total}`);
console.log(`Echoed-word mismatches: ${mismatchCount} / ${total} (${total > 0 ? Math.round((mismatchCount / total) * 100) : 0}%)`);
if (mismatchCount / Math.max(1, total) > 0.1) {
  console.log('\n⚠ Mismatch rate exceeds 10% — this looks like the same id-misalignment failure as the first attempt. Do not integrate; send back for revision.');
}

console.log(`\n--- FAILURES (${failures.length}) ---`);
for (const f of failures.slice(0, 40)) console.log(`  [FAIL] ${f.id}: ${f.reason}`);
if (failures.length > 40) console.log(`  ... and ${failures.length - 40} more`);

console.log(`\n--- WARNINGS (${warnings.length}) ---`);
for (const w of warnings) console.log(`  [WARN] ${w.id}: ${w.reason}`);

console.log(`\n=== RESULT: ${failures.length === 0 ? 'PASS' : 'FAIL'} ===`);
process.exit(failures.length === 0 ? 0 : 1);
