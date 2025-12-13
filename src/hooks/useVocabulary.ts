import { useState, useCallback, useRef, useMemo } from 'react';
import type { VocabWord, WordProgress } from '../types';

type VocabLevel = 'A1' | 'A2' | 'all';
type PracticeDirection = 'fr-en' | 'en-fr';

interface WordBankData {
  level: 'A1' | 'A2';
  words: VocabWord[];
}

interface UseVocabularyOptions {
  level: VocabLevel;
  weakOnly?: boolean;
  progress?: Map<string, WordProgress>;
}

interface UseVocabularyReturn {
  words: VocabWord[];
  loading: boolean;
  error: string | null;
  loadWords: () => Promise<void>;
  selectWordsForPractice: (count: number) => VocabWord[];
  resetSession: () => void;
  seenWordsCount: number;
}

// Cache for loaded word banks
let a1WordsCache: VocabWord[] | null = null;
let a2WordsCache: VocabWord[] | null = null;

/**
 * Loads A1 vocabulary words (lazy loaded)
 */
async function loadA1Words(): Promise<VocabWord[]> {
  if (a1WordsCache) return a1WordsCache;
  
  const module = await import('../data/a1-vocabulary.json');
  const data = module.default as unknown as WordBankData;
  a1WordsCache = data.words.map(w => ({ ...w, level: 'A1' as const }));
  return a1WordsCache;
}

/**
 * Loads A2 vocabulary words (lazy loaded)
 */
async function loadA2Words(): Promise<VocabWord[]> {
  if (a2WordsCache) return a2WordsCache;
  
  const module = await import('../data/a2-vocabulary.json');
  const data = module.default as unknown as WordBankData;
  a2WordsCache = data.words.map(w => ({ ...w, level: 'A2' as const }));
  return a2WordsCache;
}

/**
 * Weighted shuffle algorithm - items with higher weight appear earlier
 */
export function weightedShuffle<T>(items: { item: T; weight: number }[]): T[] {
  // Create array with weighted random values
  const weighted = items.map(({ item, weight }) => ({
    item,
    sortKey: Math.random() * weight,
  }));
  
  // Sort by weighted random value (higher weights tend to sort first)
  weighted.sort((a, b) => b.sortKey - a.sortKey);
  
  return weighted.map(w => w.item);
}

/**
 * Filters words based on weak-only mode
 */
export function filterWeakWords(
  words: VocabWord[],
  progress: Map<string, WordProgress>,
  weakOnly: boolean
): VocabWord[] {
  if (!weakOnly) return words;
  
  return words.filter(word => {
    const p = progress.get(word.id);
    // Include if no progress (unseen) or mastery <= 2
    return !p || p.attempts === 0 || p.masteryLevel <= 2;
  });
}

/**
 * Selects words for practice with weighted shuffle
 * Words with lower mastery get higher weight
 */
export function selectWords(
  words: VocabWord[],
  progress: Map<string, WordProgress>,
  seenThisSession: Set<string>,
  count: number
): VocabWord[] {
  // Filter out already seen words in this session
  const candidates = words.filter(w => !seenThisSession.has(w.id));
  
  if (candidates.length === 0) return [];
  
  // Weight toward less-practiced words
  const weighted = candidates.map(word => {
    const p = progress.get(word.id);
    // Unseen words get weight 5, mastered words get weight 1
    const weight = p ? Math.max(1, 6 - p.masteryLevel) : 5;
    return { item: word, weight };
  });
  
  const shuffled = weightedShuffle(weighted);
  return shuffled.slice(0, count);
}

/**
 * Hook for loading and selecting vocabulary words
 */
export function useVocabulary(options: UseVocabularyOptions): UseVocabularyReturn {
  const { level, weakOnly = false, progress = new Map() } = options;
  
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenThisSession = useRef<Set<string>>(new Set());

  const loadWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let loadedWords: VocabWord[] = [];
      
      if (level === 'A1' || level === 'all') {
        const a1 = await loadA1Words();
        loadedWords = [...loadedWords, ...a1];
      }
      
      if (level === 'A2' || level === 'all') {
        const a2 = await loadA2Words();
        loadedWords = [...loadedWords, ...a2];
      }
      
      setWords(loadedWords);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
      setError('Failed to load vocabulary. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [level]);

  // Filter words based on weak-only mode
  const filteredWords = useMemo(() => {
    return filterWeakWords(words, progress, weakOnly);
  }, [words, progress, weakOnly]);

  const selectWordsForPractice = useCallback((count: number): VocabWord[] => {
    const selected = selectWords(
      filteredWords,
      progress,
      seenThisSession.current,
      count
    );
    
    // Mark selected words as seen
    selected.forEach(word => seenThisSession.current.add(word.id));
    
    return selected;
  }, [filteredWords, progress]);

  const resetSession = useCallback(() => {
    seenThisSession.current = new Set();
  }, []);

  return {
    words: filteredWords,
    loading,
    error,
    loadWords,
    selectWordsForPractice,
    resetSession,
    seenWordsCount: seenThisSession.current.size,
  };
}

/**
 * Strips common articles from text for flexible matching
 */
function stripArticles(text: string): string {
  // French articles: le, la, l', les, un, une, des
  // English articles: the, a, an
  // Also strip "to " for verbs
  return text
    .replace(/^(le |la |l'|les |un |une |des |the |a |an |to )/i, '')
    .trim();
}

/**
 * Removes diacritics (accents) from text
 */
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Checks if two strings are similar enough (fuzzy match)
 */
function isSimilar(input: string, target: string): boolean {
  // Exact match after normalization
  const normalizedInput = removeDiacritics(input.toLowerCase().trim());
  const normalizedTarget = removeDiacritics(target.toLowerCase().trim());
  
  if (normalizedInput === normalizedTarget) return true;
  
  // For short words (<=4 chars), allow 1 edit distance
  // For longer words, allow up to 2 edit distance
  const maxDistance = normalizedTarget.length <= 4 ? 1 : 2;
  const distance = levenshteinDistance(normalizedInput, normalizedTarget);
  
  return distance <= maxDistance;
}

/**
 * Validates an answer against acceptable translations with flexible matching
 */
export function validateAnswer(
  word: VocabWord,
  answer: string,
  direction: PracticeDirection
): boolean {
  const normalizedAnswer = answer.trim().toLowerCase();
  const strippedAnswer = stripArticles(normalizedAnswer);
  
  if (direction === 'fr-en') {
    // Build list of acceptable answers
    const acceptableAnswers = [
      word.english.toLowerCase(),
      ...(word.alternativeTranslations?.map(t => t.toLowerCase()) || [])
    ];
    
    for (const acceptable of acceptableAnswers) {
      const strippedAcceptable = stripArticles(acceptable);
      
      // Exact match
      if (normalizedAnswer === acceptable) return true;
      
      // Match without articles (e.g., "key" matches "the key")
      if (strippedAnswer === strippedAcceptable) return true;
      
      // Fuzzy match (typos, minor spelling differences)
      if (isSimilar(strippedAnswer, strippedAcceptable)) return true;
    }
    
    return false;
  } else {
    // French answer validation
    const frenchWord = word.french.toLowerCase();
    const strippedFrench = stripArticles(frenchWord);
    
    // Exact match
    if (normalizedAnswer === frenchWord) return true;
    
    // Match without articles
    if (strippedAnswer === strippedFrench) return true;
    
    // Fuzzy match (allows for accent mistakes)
    if (isSimilar(strippedAnswer, strippedFrench)) return true;
    
    return false;
  }
}

export type { VocabLevel, PracticeDirection, UseVocabularyOptions, UseVocabularyReturn };
