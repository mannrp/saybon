# Implementation Guide for LLM Coding Agent

**Project:** Rapide - French Practice PWA  
**Purpose:** Step-by-step implementation instructions for AI coding assistants  
**Companion to:** Technical Specification Document v1.0

---

## Quick Start Commands

```bash
# 1. Initialize project
npm create vite@latest rapide-french -- --template react-ts
cd rapide-french

# 2. Install all dependencies
npm install \
  idb \
  lucide-react \
  tailwindcss \
  postcss \
  autoprefixer

npm install -D \
  @types/node \
  @vitejs/plugin-react \
  vite-plugin-pwa \
  workbox-window

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Start development
npm run dev
```

---

## Phase 1: Foundation (Day 1)

### Step 1.1: Configure Tailwind

**File: `tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 }
        },
        'fade-out': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 }
        }
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out'
      }
    },
  },
  plugins: [],
}
```

**File: `src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-neutral-50 text-neutral-900;
  }
}

@layer utilities {
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Step 1.2: Create Directory Structure

```bash
mkdir -p src/{components/{layout,practice,settings,shared},providers,hooks,context,utils,types}
touch src/types/index.ts
```

### Step 1.3: Define TypeScript Interfaces

**File: `src/types/index.ts`**

```typescript
// Exercise Types
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExerciseType = 
  | 'conjugation'
  | 'fill-blank'
  | 'translation-en-fr'
  | 'translation-fr-en'
  | 'multiple-choice'
  | 'free-form';

export interface Exercise {
  id: string;
  type: ExerciseType;
  level: CEFRLevel;
  question: string;
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  hint?: string;
  explanation?: string;
  metadata: {
    topic: string;
    difficulty: number;
    createdAt: string;
    source: 'ai-generated' | 'curated' | 'community';
  };
}

// User Answer Types
export interface UserAnswer {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: string;
  timeSpent: number;
  hintsUsed: number;
}

// Session Types
export interface PracticeSession {
  id: string;
  startTime: string;
  endTime?: string;
  level: CEFRLevel;
  answers: UserAnswer[];
  aiFeedback?: AIFeedback[];
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    averageTime: number;
  };
}

export interface AIFeedback {
  timestamp: string;
  questionsAnalyzed: number;
  patterns: {
    strengths: string[];
    weaknesses: string[];
    commonMistakes: string[];
  };
  recommendations: string[];
  detailedExplanation: string;
}

// Settings Types
export type AIProviderType = 'gemini' | 'ollama' | 'custom';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface OllamaConfig {
  endpoint: string;
  model: string;
}

export interface CustomConfig {
  endpoint: string;
  headers: Record<string, string>;
}

export interface AppSettings {
  aiProvider: AIProviderType;
  gemini?: GeminiConfig;
  ollama?: OllamaConfig;
  custom?: CustomConfig;
  preferences: {
    questionsPerBatch: number;
    showExplanations: boolean;
    autoAdvance: boolean;
    soundEffects: boolean;
  };
  privacy: {
    shareAnonymousData: boolean;
  };
}

// AI Provider Types
export interface GenerationParams {
  level: CEFRLevel;
  type: ExerciseType[];
  count: number;
  topics?: string[];
  avoidRecent?: string[];
}

export interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback>;
}

// Error Types
export enum ErrorType {
  NETWORK = 'network',
  API_KEY = 'api_key',
  RATE_LIMIT = 'rate_limit',
  PARSE_ERROR = 'parse_error',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
}
```

---

## Phase 2: Storage Layer (Day 1-2)

### Step 2.1: IndexedDB Wrapper

**File: `src/utils/storage.ts`**

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Exercise, PracticeSession, AppSettings } from '@/types';

interface RapideDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 
      'by-level': string; 
      'by-type': string;
      'by-date': string;
    };
  };
  sessions: {
    key: string;
    value: PracticeSession;
    indexes: { 
      'by-date': string;
      'by-level': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  cache: {
    key: string;
    value: {
      data: Exercise[];
      timestamp: number;
      level: string;
      type: string;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'rapide-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RapideDB> | null = null;

/**
 * Initialize the database
 */
export async function initDB(): Promise<IDBPDatabase<RapideDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RapideDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Exercises store
      if (!db.objectStoreNames.contains('exercises')) {
        const exerciseStore = db.createObjectStore('exercises', {
          keyPath: 'id'
        });
        exerciseStore.createIndex('by-level', 'level');
        exerciseStore.createIndex('by-type', 'type');
        exerciseStore.createIndex('by-date', 'metadata.createdAt');
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', {
          keyPath: 'id'
        });
        sessionStore.createIndex('by-date', 'startTime');
        sessionStore.createIndex('by-level', 'level');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', {
          keyPath: 'key'
        });
        cacheStore.createIndex('by-timestamp', 'timestamp');
      }
    }
  });

  return dbInstance;
}

/**
 * Get database instance
 */
async function getDB(): Promise<IDBPDatabase<RapideDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// ============= Exercise Operations =============

/**
 * Store multiple exercises
 */
export async function storeExercises(exercises: Exercise[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('exercises', 'readwrite');
  
  await Promise.all([
    ...exercises.map(ex => tx.store.put(ex)),
    tx.done
  ]);
}

/**
 * Get exercises by level and type
 */
export async function getExercisesByLevel(
  level: string,
  type?: string,
  limit?: number
): Promise<Exercise[]> {
  const db = await getDB();
  let exercises = await db.getAllFromIndex('exercises', 'by-level', level);
  
  if (type) {
    exercises = exercises.filter(ex => ex.type === type);
  }
  
  if (limit) {
    exercises = exercises.slice(0, limit);
  }
  
  return exercises;
}

/**
 * Delete old exercises (cache cleanup)
 */
export async function deleteOldExercises(daysOld: number = 7): Promise<number> {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const allExercises = await db.getAll('exercises');
  const toDelete = allExercises.filter(ex => 
    new Date(ex.metadata.createdAt) < cutoffDate &&
    ex.metadata.source === 'ai-generated'
  );
  
  const tx = db.transaction('exercises', 'readwrite');
  await Promise.all([
    ...toDelete.map(ex => tx.store.delete(ex.id)),
    tx.done
  ]);
  
  return toDelete.length;
}

// ============= Session Operations =============

/**
 * Store practice session
 */
export async function storeSession(session: PracticeSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<PracticeSession[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('sessions', 'by-date');
  return sessions.reverse().slice(0, limit);
}

/**
 * Get session by ID
 */
export async function getSession(id: string): Promise<PracticeSession | undefined> {
  const db = await getDB();
  return await db.get('sessions', id);
}

// ============= Settings Operations =============

const SETTINGS_KEY = 'app-settings';

/**
 * Get app settings
 */
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return await db.get('settings', SETTINGS_KEY);
}

/**
 * Store app settings
 */
export async function storeSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: SETTINGS_KEY });
}

/**
 * Update partial settings
 */
export async function updateSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial } as AppSettings;
  await storeSettings(updated);
  return updated;
}

// ============= Cache Operations =============

/**
 * Store exercises in cache
 */
export async function cacheExercises(
  level: string,
  type: string,
  exercises: Exercise[]
): Promise<void> {
  const db = await getDB();
  const key = `${level}-${type}-${Date.now()}`;
  
  await db.put('cache', {
    key,
    data: exercises,
    timestamp: Date.now(),
    level,
    type
  });
}

/**
 * Get cached exercises
 */
export async function getCachedExercises(
  level: string,
  type: string,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<Exercise[]> {
  const db = await getDB();
  const allCached = await db.getAll('cache');
  
  const now = Date.now();
  const relevant = allCached
    .filter(c => 
      c.level === level &&
      c.type === type &&
      (now - c.timestamp) < maxAgeMs
    )
    .sort((a, b) => b.timestamp - a.timestamp);
  
  if (relevant.length === 0) return [];
  
  return relevant[0].data;
}

/**
 * Clear old cache entries
 */
export async function clearOldCache(daysOld: number = 7): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  const allCached = await db.getAll('cache');
  const toDelete = allCached.filter(c => c.timestamp < cutoff);
  
  const tx = db.transaction('cache', 'readwrite');
  await Promise.all([
    ...toDelete.map(c => tx.store.delete(c.key)),
    tx.done
  ]);
  
  return toDelete.length;
}

// ============= Utility Functions =============

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('exercises'),
    db.clear('sessions'),
    db.clear('cache')
    // Don't clear settings
  ]);
}

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<{
  exercises: number;
  sessions: number;
  cacheEntries: number;
}> {
  const db = await getDB();
  
  const [exercises, sessions, cache] = await Promise.all([
    db.count('exercises'),
    db.count('sessions'),
    db.count('cache')
  ]);
  
  return { exercises, sessions, cacheEntries: cache };
}
```

### Step 2.2: Validation Utilities

**File: `src/utils/validation.ts`**

```typescript
import { Exercise } from '@/types';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of answers (typo tolerance)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
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

  return matrix[len1][len2];
}

/**
 * Normalize answer for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove diacritics (for fuzzy matching)
 */
export function normalizeAnswer(answer: string): string {
  if (!answer || typeof answer !== 'string') {
    return '';
  }
  
  return answer
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Validate user answer against correct answer(s)
 * 
 * @param userAnswer - The answer provided by the user
 * @param exercise - The exercise containing correct answer(s)
 * @param fuzzyMatch - Allow typos within edit distance of 1
 * @returns true if answer is correct or acceptable
 */
export function validateAnswer(
  userAnswer: string,
  exercise: Exercise,
  fuzzyMatch: boolean = true
): boolean {
  const normalized = normalizeAnswer(userAnswer);
  
  if (!normalized) return false;

  // Handle multiple correct answers
  const correctAnswers = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer
    : [exercise.correctAnswer];

  // Check exact matches
  for (const correct of correctAnswers) {
    if (normalized === normalizeAnswer(correct)) {
      return true;
    }
  }

  // Check acceptable variations
  if (exercise.acceptableAnswers) {
    for (const acceptable of exercise.acceptableAnswers) {
      if (normalized === normalizeAnswer(acceptable)) {
        return true;
      }
    }
  }

  // Fuzzy matching for typos (only for single-word answers)
  if (fuzzyMatch && !normalized.includes(' ')) {
    for (const correct of correctAnswers) {
      const normalizedCorrect = normalizeAnswer(correct);
      if (!normalizedCorrect.includes(' ')) {
        const distance = levenshteinDistance(normalized, normalizedCorrect);
        if (distance <= 1) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get the display format of correct answer
 */
export function getCorrectAnswerDisplay(exercise: Exercise): string {
  if (Array.isArray(exercise.correctAnswer)) {
    return exercise.correctAnswer.join(' or ');
  }
  return exercise.correctAnswer;
}

/**
 * Validate API key format
 */
export function validateAPIKey(key: string, provider: 'gemini' | 'ollama' | 'custom'): boolean {
  if (!key || typeof key !== 'string') return false;
  
  switch (provider) {
    case 'gemini':
      // Gemini keys start with specific patterns
      return key.length > 20 && /^[A-Za-z0-9_-]+$/.test(key);
    case 'ollama':
      // Ollama uses URL endpoint, not key
      return true;
    case 'custom':
      return key.length > 0;
    default:
      return false;
  }
}

/**
 * Validate endpoint URL
 */
export function validateEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

---

## Phase 3: AI Provider Layer (Day 2-3)

### Step 3.1: AI Provider Interface

**File: `src/providers/AIProvider.interface.ts`**

```typescript
import { Exercise, UserAnswer, AIFeedback, GenerationParams } from '@/types';

export interface AIProvider {
  readonly name: string;
  
  /**
   * Test if the provider is properly configured and accessible
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Generate exercises based on parameters
   */
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  
  /**
   * Analyze a batch of user answers and provide feedback
   */
  analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback>;
}

export interface AIProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  headers?: Record<string, string>;
}
```

### Step 3.2: Gemini Provider

**File: `src/providers/GeminiProvider.ts`**

```typescript
import { AIProvider } from './AIProvider.interface';
import { Exercise, UserAnswer, AIFeedback, GenerationParams, CEFRLevel, ExerciseType } from '@/types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  private apiKey: string;
  private model: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.callGemini('Test connection', 10);
      return response.length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  async generateExercises(params: GenerationParams): Promise<Exercise[]> {
    const prompt = this.buildExercisePrompt(params);
    
    try {
      const responseText = await this.callGemini(prompt);
      const parsed = JSON.parse(responseText);
      
      // Transform API response to Exercise format
      return parsed.map((item: any, index: number) => ({
        id: `${params.level}-${params.type[0]}-${Date.now()}-${index}`,
        type: params.type[0],
        level: params.level,
        question: item.question,
        correctAnswer: item.correctAnswer,
        acceptableAnswers: item.acceptableAnswers || [],
        hint: item.hint,
        explanation: item.explanation,
        metadata: {
          topic: item.topic || params.topics?.[0] || 'general',
          difficulty: item.difficulty || 1,
          createdAt: new Date().toISOString(),
          source: 'ai-generated' as const
        }
      }));
    } catch (error) {
      console.error('Failed to generate exercises:', error);
      throw new Error('Exercise generation failed');
    }
  }

  async analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback> {
    const prompt = this.buildAnalysisPrompt(answers);
    
    try {
      const responseText = await this.callGemini(prompt, 2048);
      const parsed = JSON.parse(responseText);
      
      return {
        timestamp: new Date().toISOString(),
        questionsAnalyzed: answers.length,
        patterns: {
          strengths: parsed.patterns?.strengths || [],
          weaknesses: parsed.patterns?.weaknesses || [],
          commonMistakes: parsed.patterns?.commonMistakes || []
        },
        recommendations: parsed.recommendations || [],
        detailedExplanation: parsed.detailedExplanation || ''
      };
    } catch (error) {
      console.error('Failed to analyze batch:', error);
      throw new Error('Batch analysis failed');
    }
  }

  private async callGemini(prompt: string, maxTokens: number = 2048): Promise<string> {
    const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private buildExercisePrompt(params: GenerationParams): string {
    const topicStr = params.topics?.length ? params.topics.join(', ') : 'general French';
    
    return `You are an experienced French teacher creating exercises for ${params.level} level learners.

Generate ${params.count} ${params.type[0]} exercises about ${topicStr}.

Requirements:
- Questions must be clear and unambiguous
- Answers should be single words or short phrases
- Include brief explanations
- Focus on common mistakes learners make
- Vary difficulty slightly within the level

Return JSON array:
[
  {
    "question": "...",
    "correctAnswer": "...",
    "acceptableAnswers": ["..."],
    "hint": "...",
    "explanation": "...",
    "topic": "...",
    "difficulty": 1-5
  }
]

Generate the exercises now.`;
  }

  private buildAnalysisPrompt(answers: UserAnswer[]): string {
    const questionsAndAnswers = answers.map((a, i) => 
      `${i + 1}. Correct: "${a.correctAnswer}" | User answered: "${a.userAnswer}" | ${a.isCorrect ? '✓' : '✗'}`
    ).join('\n');

    return `You are analyzing a French learner's practice session.

Questions and answers:
${questionsAndAnswers}

Provide constructive feedback following this structure:

{
  "patterns": {
    "strengths": [2-3 specific things they did well],
    "weaknesses": [2-3 grammar areas needing work],
    "commonMistakes": [specific repeated errors with examples]
  },
  "recommendations": [
    "3 specific, actionable study suggestions"
  ],
  "detailedExplanation": "2-3 paragraph explanation focusing on their biggest learning opportunity. Be encouraging but specific."
}

Tone: Encouraging and positive, specific and actionable
Focus on patterns, not individual mistakes
Suggest concrete next steps

Analyze the session now.`;
  }
}
```

**Continue to next artifact for remaining implementation steps...**