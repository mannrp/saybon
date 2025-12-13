import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  selectWords,
  filterWeakWords,
  weightedShuffle,
  validateAnswer,
} from './useVocabulary';
import type { VocabWord, WordProgress } from '../types';

/**
 * Property tests for vocabulary selection functionality
 * **Feature: vocabulary-heatmap**
 */

// Arbitrary for generating non-whitespace strings (realistic French word content)
// Only includes ASCII letters and common French accented characters (no ß or other special chars)
const frenchChars = 'abcdefghijklmnopqrstuvwxyzàâäéèêëïîôùûüçœæ';
const nonWhitespaceString = (minLength: number, maxLength: number) =>
  fc.array(fc.constantFrom(...frenchChars.split('')), { minLength, maxLength })
    .map(chars => chars.join(''))
    .filter(s => s.trim().length > 0);

// Arbitrary for generating valid VocabWord objects with realistic content
const vocabWordArb: fc.Arbitrary<VocabWord> = fc.record({
  id: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1 && s.length <= 20),
  french: nonWhitespaceString(1, 50),
  english: nonWhitespaceString(1, 50),
  partOfSpeech: fc.constantFrom('noun', 'verb', 'adjective', 'adverb', 'other') as fc.Arbitrary<'noun' | 'verb' | 'adjective' | 'adverb' | 'other'>,
  exampleFr: nonWhitespaceString(5, 100),
  exampleEn: nonWhitespaceString(5, 100),
  level: fc.constantFrom('A1', 'A2') as fc.Arbitrary<'A1' | 'A2'>,
  alternativeTranslations: fc.option(
    fc.array(nonWhitespaceString(1, 30), { minLength: 0, maxLength: 3 }),
    { nil: undefined }
  ),
  gender: fc.option(
    fc.constantFrom('le', 'la', "l'") as fc.Arbitrary<'le' | 'la' | "l'">,
    { nil: undefined }
  ),
}) as fc.Arbitrary<VocabWord>;

// Simpler arbitrary for generating unique VocabWord arrays
const uniqueVocabWordsArb = (minLength: number, maxLength: number) =>
  fc.array(fc.nat({ max: 999 }), { minLength, maxLength })
    .map(ids => [...new Set(ids)]) // Ensure unique IDs
    .filter(ids => ids.length >= minLength)
    .map(ids =>
      ids.map((id): VocabWord => ({
        id: `word-${id}`,
        french: `french-${id}`,
        english: `english-${id}`,
        partOfSpeech: 'noun',
        exampleFr: `Example ${id}`,
        exampleEn: `Example ${id}`,
        level: id % 2 === 0 ? 'A1' : 'A2',
      }))
    );

describe('Vocabulary Selection Properties', () => {
  /**
   * **Property 4: No Repetition Within Session**
   * *For any* practice session with N words selected, the first N words shown
   * SHALL all be unique (no duplicates).
   * **Validates: Requirements 6.1, 6.2, 6.3**
   */
  it('Property 4: No Repetition Within Session - first N words are unique', () => {
    fc.assert(
      fc.property(
        uniqueVocabWordsArb(10, 50),
        fc.nat({ max: 20 }),
        (words, requestCount) => {
          const count = Math.min(requestCount, words.length);
          const progress = new Map<string, WordProgress>();
          const seenThisSession = new Set<string>();

          const selected = selectWords(words, progress, seenThisSession, count);

          // All selected words should be unique
          const selectedIds = selected.map(w => w.id);
          const uniqueIds = new Set(selectedIds);
          expect(uniqueIds.size).toBe(selectedIds.length);

          // Should not exceed requested count
          expect(selected.length).toBeLessThanOrEqual(count);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 4 (continued): Multiple selections don't repeat within session**
   */
  it('Property 4: Multiple selections maintain no repetition within session', () => {
    fc.assert(
      fc.property(
        uniqueVocabWordsArb(20, 100),
        fc.array(fc.nat({ max: 10 }), { minLength: 2, maxLength: 5 }),
        (words, batchSizes) => {
          const progress = new Map<string, WordProgress>();
          const seenThisSession = new Set<string>();
          const allSelected: string[] = [];

          for (const batchSize of batchSizes) {
            const selected = selectWords(words, progress, seenThisSession, batchSize);
            
            // Mark as seen (simulating what the hook does)
            selected.forEach(w => seenThisSession.add(w.id));
            allSelected.push(...selected.map(w => w.id));
          }

          // All selected words across all batches should be unique
          const uniqueSelected = new Set(allSelected);
          expect(uniqueSelected.size).toBe(allSelected.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 5: Weak Words Filter Correctness**
   * *For any* word included when weakOnly mode is enabled, that word's masteryLevel
   * SHALL be ≤ 2 or the word SHALL have zero attempts.
   * **Validates: Requirements 5.2, 5.3**
   */
  it('Property 5: Weak Words Filter Correctness - filtered words have mastery ≤ 2 or zero attempts', () => {
    fc.assert(
      fc.property(
        uniqueVocabWordsArb(10, 50),
        fc.array(fc.nat({ max: 5 }), { minLength: 5, maxLength: 30 }),
        (words, masteryLevels) => {
          // Create progress map with various mastery levels
          const progress = new Map<string, WordProgress>();
          words.forEach((word, index) => {
            if (index < masteryLevels.length) {
              const mastery = masteryLevels[index];
              progress.set(word.id, {
                wordId: word.id,
                timesCorrect: mastery * 2,
                timesWrong: Math.max(0, 5 - mastery),
                attempts: mastery * 2 + Math.max(0, 5 - mastery),
                lastSeen: new Date().toISOString(),
                masteryLevel: mastery,
                streak: 0,
              });
            }
            // Words without progress entry are considered unseen
          });

          const filtered = filterWeakWords(words, progress, true);

          // Every filtered word should have mastery <= 2 or be unseen
          for (const word of filtered) {
            const p = progress.get(word.id);
            if (p && p.attempts > 0) {
              expect(p.masteryLevel).toBeLessThanOrEqual(2);
            }
            // If no progress or zero attempts, it's valid (unseen word)
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 5 (continued): Strong words are excluded in weak-only mode**
   */
  it('Property 5: Strong words (mastery > 2) are excluded in weak-only mode', () => {
    fc.assert(
      fc.property(
        uniqueVocabWordsArb(10, 30),
        (words) => {
          // Create progress with some strong words (mastery > 2)
          const progress = new Map<string, WordProgress>();
          words.forEach((word, index) => {
            const mastery = index % 2 === 0 ? 4 : 1; // Alternate between strong and weak
            progress.set(word.id, {
              wordId: word.id,
              timesCorrect: mastery * 3,
              timesWrong: 1,
              attempts: mastery * 3 + 1,
              lastSeen: new Date().toISOString(),
              masteryLevel: mastery,
              streak: 0,
            });
          });

          const filtered = filterWeakWords(words, progress, true);

          // No filtered word should have mastery > 2 (with attempts > 0)
          for (const word of filtered) {
            const p = progress.get(word.id);
            if (p && p.attempts > 0) {
              expect(p.masteryLevel).toBeLessThanOrEqual(2);
            }
          }

          // Strong words should be excluded
          const strongWordIds = words
            .filter((_, i) => i % 2 === 0)
            .map(w => w.id);
          const filteredIds = new Set(filtered.map(w => w.id));
          
          for (const strongId of strongWordIds) {
            expect(filteredIds.has(strongId)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Weighted Shuffle Properties', () => {
  it('should return all items from input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ item: fc.string(), weight: fc.double({ min: 0.1, max: 10 }) }), { minLength: 1, maxLength: 50 }),
        (items) => {
          const shuffled = weightedShuffle(items);
          expect(shuffled.length).toBe(items.length);
          
          // All original items should be present
          const originalItems = new Set(items.map(i => i.item));
          const shuffledSet = new Set(shuffled);
          expect(shuffledSet.size).toBe(originalItems.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Answer Validation Properties', () => {
  /**
   * **Property 7: Bidirectional Answer Validation**
   * *For any* VocabWord, when practicing FR→EN the english and alternativeTranslations
   * SHALL be accepted, and when practicing EN→FR the french SHALL be accepted.
   * **Validates: Requirements 2.2, 2.3, 2.5**
   */
  it('Property 7: Bidirectional Answer Validation - FR→EN accepts english and alternatives', () => {
    fc.assert(
      fc.property(
        vocabWordArb,
        (word) => {
          // Primary english translation should be accepted
          const primaryResult = validateAnswer(word, word.english, 'fr-en');
          expect(primaryResult).toBe(true);

          // All alternative translations should be accepted
          if (word.alternativeTranslations && word.alternativeTranslations.length > 0) {
            for (const alt of word.alternativeTranslations) {
              const altResult = validateAnswer(word, alt, 'fr-en');
              expect(altResult).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 7 (continued): EN→FR accepts french word**
   * **Validates: Requirements 2.2, 2.3, 2.5**
   */
  it('Property 7: Bidirectional Answer Validation - EN→FR accepts french word', () => {
    fc.assert(
      fc.property(
        vocabWordArb,
        (word) => {
          const result = validateAnswer(word, word.french, 'en-fr');
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 7 (continued): Case insensitivity for both directions**
   * **Validates: Requirements 2.2, 2.3, 2.5**
   */
  it('Property 7: Bidirectional Answer Validation - case insensitive for both directions', () => {
    fc.assert(
      fc.property(
        vocabWordArb,
        (word) => {
          // FR→EN: case insensitive
          const frEnUpper = validateAnswer(word, word.english.toUpperCase(), 'fr-en');
          const frEnLower = validateAnswer(word, word.english.toLowerCase(), 'fr-en');
          expect(frEnUpper).toBe(true);
          expect(frEnLower).toBe(true);

          // EN→FR: case insensitive
          const enFrUpper = validateAnswer(word, word.french.toUpperCase(), 'en-fr');
          const enFrLower = validateAnswer(word, word.french.toLowerCase(), 'en-fr');
          expect(enFrUpper).toBe(true);
          expect(enFrLower).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 7 (continued): Whitespace trimming for both directions**
   * **Validates: Requirements 2.2, 2.3, 2.5**
   */
  it('Property 7: Bidirectional Answer Validation - trims whitespace', () => {
    fc.assert(
      fc.property(
        vocabWordArb,
        (word) => {
          // FR→EN: whitespace trimmed
          const frEnWithSpaces = validateAnswer(word, `  ${word.english}  `, 'fr-en');
          expect(frEnWithSpaces).toBe(true);

          // EN→FR: whitespace trimmed
          const enFrWithSpaces = validateAnswer(word, `  ${word.french}  `, 'en-fr');
          expect(enFrWithSpaces).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 7 (continued): Wrong answers are rejected**
   * **Validates: Requirements 2.2, 2.3, 2.5**
   */
  it('Property 7: Bidirectional Answer Validation - rejects wrong answers', () => {
    fc.assert(
      fc.property(
        vocabWordArb,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (word, randomAnswer) => {
          // Only test if randomAnswer is not a valid answer
          const isValidFrEn = 
            randomAnswer.toLowerCase().trim() === word.english.toLowerCase() ||
            (word.alternativeTranslations?.some(
              alt => alt.toLowerCase() === randomAnswer.toLowerCase().trim()
            ) ?? false);
          
          const isValidEnFr = randomAnswer.toLowerCase().trim() === word.french.toLowerCase();

          if (!isValidFrEn) {
            const frEnResult = validateAnswer(word, randomAnswer, 'fr-en');
            expect(frEnResult).toBe(false);
          }

          if (!isValidEnFr) {
            const enFrResult = validateAnswer(word, randomAnswer, 'en-fr');
            expect(enFrResult).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
