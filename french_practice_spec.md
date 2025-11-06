# French Practice PWA - Technical Specification

**Version:** 1.0  
**Last Updated:** November 6, 2025  
**Project Codename:** Rapide (French for "fast")

---

## 1. Executive Summary

A progressive web application for rapid-fire French language practice (A1-A2 initially) with AI-powered feedback. Users answer questions in quick succession with instant validation and periodic deep AI analysis of patterns. Supports multiple AI providers (Gemini, Ollama, custom) with BYOK (Bring Your Own Key) functionality.

**Core Philosophy:** Learn through volume and immediate feedback, not lengthy lessons.

---

## 2. Technical Architecture

### 2.1 Tech Stack

**Frontend:**
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite 5+
- **Styling:** Tailwind CSS 3+
- **State Management:** React Context API + useReducer (no external library needed)
- **Storage:** IndexedDB (via idb library) + localStorage fallback
- **PWA:** Workbox (via vite-plugin-pwa)
- **Icons:** Lucide React
- **HTTP Client:** Native fetch API

**AI Providers:**
- Gemini Flash (primary) - Google AI Studio API
- Ollama (optional) - Local inference
- Custom endpoint (extensibility)

**Backend (Phase 3 - Optional):**
- Supabase (PostgreSQL + Auth + Storage)
- Anonymous data aggregation only

**Deployment:**
- Vercel / Netlify (frontend)
- Edge functions for rate limiting (if needed)

---

## 3. Core Features & User Flows

### 3.1 Main User Flow

```
1. User opens app → Settings check
   ├─ No API key? → Show setup wizard
   └─ Has API key? → Continue

2. Select practice mode
   ├─ Quick Practice (default)
   ├─ Level Selection (A1, A2, B1...)
   └─ Topic Selection (verbs, vocab, etc.)

3. Rapid-fire questions
   ├─ Display question
   ├─ User answers (text input or multiple choice)
   ├─ Instant validation (✓/✗)
   ├─ Show correct answer if wrong
   └─ Next question (no delay)

4. After 10 questions → AI Analysis
   ├─ Show summary of performance
   ├─ Highlight patterns (strengths/weaknesses)
   ├─ Specific grammar explanations
   └─ Continue or review?

5. Continue practicing or exit
   └─ Save progress locally
```

---

## 4. Data Models

### 4.1 Exercise Schema

```typescript
interface Exercise {
  id: string; // uuid
  type: ExerciseType;
  level: CEFRLevel;
  question: string;
  correctAnswer: string | string[]; // array for multiple correct answers
  acceptableAnswers?: string[]; // variations/typos
  hint?: string;
  explanation?: string;
  metadata: {
    topic: string; // "être conjugation", "passé composé", etc.
    difficulty: number; // 1-5
    createdAt: string;
    source: 'ai-generated' | 'curated' | 'community';
  };
}

type ExerciseType = 
  | 'conjugation'
  | 'fill-blank'
  | 'translation-en-fr'
  | 'translation-fr-en'
  | 'multiple-choice'
  | 'free-form';

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
```

### 4.2 User Answer Schema

```typescript
interface UserAnswer {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: string;
  timeSpent: number; // milliseconds
  hintsUsed: number;
}
```

### 4.3 Session Schema

```typescript
interface PracticeSession {
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

interface AIFeedback {
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
```

### 4.4 Settings Schema

```typescript
interface AppSettings {
  aiProvider: 'gemini' | 'ollama' | 'custom';
  gemini?: {
    apiKey: string;
    model: string; // default: 'gemini-2.0-flash-exp'
  };
  ollama?: {
    endpoint: string; // default: 'http://localhost:11434'
    model: string; // default: 'croissantllm'
  };
  custom?: {
    endpoint: string;
    headers: Record<string, string>;
  };
  preferences: {
    questionsPerBatch: number; // default: 10
    showExplanations: boolean; // default: true
    autoAdvance: boolean; // default: false
    soundEffects: boolean; // default: true
  };
  privacy: {
    shareAnonymousData: boolean; // default: false
  };
}
```

---

## 5. AI Provider Abstraction

### 5.1 Interface Definition

```typescript
interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback>;
}

interface GenerationParams {
  level: CEFRLevel;
  type: ExerciseType[];
  count: number;
  topics?: string[];
  avoidRecent?: string[]; // exercise IDs to avoid duplicates
}
```

### 5.2 Gemini Provider Implementation

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

**Prompt Template for Exercise Generation:**

```
You are a French language teacher creating exercises for {level} learners.

Generate {count} {type} exercises about {topics}.

Requirements:
- Questions should be clear and unambiguous
- Answers should be single words or short phrases
- Include brief explanations
- Focus on common mistakes learners make

Return JSON array:
[
  {
    "question": "...",
    "correctAnswer": "...",
    "acceptableAnswers": ["..."],
    "explanation": "...",
    "topic": "..."
  }
]
```

**Prompt Template for Batch Analysis:**

```
You are analyzing a French learner's practice session.

Questions and answers:
{questions_and_answers}

Provide:
1. Patterns in their mistakes
2. Grammar concepts they understand well
3. Concepts needing more practice
4. Specific actionable recommendations

Be encouraging but honest. Focus on 2-3 key improvement areas.

Return JSON:
{
  "patterns": {
    "strengths": [...],
    "weaknesses": [...],
    "commonMistakes": [...]
  },
  "recommendations": [...],
  "detailedExplanation": "..."
}
```

### 5.3 Ollama Provider Implementation

**Endpoint:** `http://localhost:11434/api/generate`

**Model Options:**
- CroissantLLM (1.3B) - French-specific, lightweight
- Mistral 7B - Multilingual, better quality
- Custom fine-tuned models

**Request Format:**
```json
{
  "model": "croissantllm",
  "prompt": "...",
  "stream": false,
  "format": "json"
}
```

---

## 6. Component Architecture

### 6.1 File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── practice/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerInput.tsx
│   │   ├── FeedbackDisplay.tsx
│   │   ├── ProgressBar.tsx
│   │   └── BatchAnalysis.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   ├── ProviderSelector.tsx
│   │   ├── APIKeyInput.tsx
│   │   └── PreferencesPanel.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── providers/
│   ├── AIProvider.interface.ts
│   ├── GeminiProvider.ts
│   ├── OllamaProvider.ts
│   └── CustomProvider.ts
├── hooks/
│   ├── useAI.ts
│   ├── usePracticeSession.ts
│   ├── useSettings.ts
│   └── useStorage.ts
├── context/
│   ├── AppContext.tsx
│   └── PracticeContext.tsx
├── utils/
│   ├── validation.ts
│   ├── storage.ts
│   ├── prompts.ts
│   └── levenshtein.ts (for fuzzy matching)
├── types/
│   └── index.ts (all TypeScript interfaces)
└── App.tsx
```

### 6.2 Key Components

#### QuestionCard Component

**Props:**
```typescript
interface QuestionCardProps {
  exercise: Exercise;
  onAnswer: (answer: string) => void;
  showHint?: boolean;
}
```

**Features:**
- Display question prominently
- Answer input (text or multiple choice based on type)
- Optional hint button
- Submit button
- Keyboard shortcuts (Enter to submit)

#### FeedbackDisplay Component

**Props:**
```typescript
interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  onNext: () => void;
}
```

**Features:**
- ✓/✗ visual indicator
- Show correct answer if wrong
- Brief explanation
- Celebration animation for correct answers
- "Next" button or auto-advance

#### BatchAnalysis Component

**Props:**
```typescript
interface BatchAnalysisProps {
  feedback: AIFeedback;
  stats: SessionStats;
  onContinue: () => void;
  onReview: () => void;
}
```

**Features:**
- Performance summary (X/10 correct)
- Visual chart of performance
- AI insights (strengths/weaknesses)
- Grammar explanations
- Continue or review incorrect questions

---

## 7. Core Logic & Algorithms

### 7.1 Answer Validation

**Instant Validation (Rule-Based):**

```typescript
function validateAnswer(
  userAnswer: string, 
  exercise: Exercise
): boolean {
  const normalized = normalizeAnswer(userAnswer);
  
  // Check exact match
  if (normalized === normalizeAnswer(exercise.correctAnswer)) {
    return true;
  }
  
  // Check acceptable variations
  if (exercise.acceptableAnswers?.some(
    ans => normalizeAnswer(ans) === normalized
  )) {
    return true;
  }
  
  // Fuzzy match for typos (Levenshtein distance ≤ 1)
  if (levenshteinDistance(
    normalized, 
    normalizeAnswer(exercise.correctAnswer)
  ) <= 1) {
    return true;
  }
  
  return false;
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .normalize('NFD') // Handle accents
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics for fuzzy matching
}
```

### 7.2 Exercise Generation Strategy

**Caching Strategy:**

```typescript
// Cache structure
interface ExerciseCache {
  [level: string]: {
    [type: string]: Exercise[];
  };
}

// Generation logic
async function getNextExercises(
  count: number,
  level: CEFRLevel,
  type: ExerciseType
): Promise<Exercise[]> {
  const cached = getCachedExercises(level, type);
  
  if (cached.length >= count) {
    // Return random subset
    return shuffleArray(cached).slice(0, count);
  }
  
  // Generate new exercises
  const newExercises = await aiProvider.generateExercises({
    level,
    type: [type],
    count: count * 3, // Generate extra for cache
  });
  
  // Cache new exercises
  cacheExercises(level, type, newExercises);
  
  return newExercises.slice(0, count);
}
```

### 7.3 Batch Feedback Trigger

```typescript
class PracticeManager {
  private answers: UserAnswer[] = [];
  private batchSize = 10;
  
  async submitAnswer(answer: UserAnswer): Promise<void> {
    this.answers.push(answer);
    
    if (this.answers.length % this.batchSize === 0) {
      await this.triggerBatchAnalysis();
    }
  }
  
  private async triggerBatchAnalysis(): Promise<void> {
    const batch = this.answers.slice(-this.batchSize);
    const feedback = await aiProvider.analyzeBatch(batch);
    
    // Show analysis modal
    showBatchAnalysisModal(feedback);
    
    // Store feedback
    await storeFeedback(feedback);
  }
}
```

---

## 8. Storage Strategy

### 8.1 IndexedDB Schema

**Object Stores:**

1. **exercises**
   - Key: `id` (string)
   - Indexes: `level`, `type`, `createdAt`

2. **sessions**
   - Key: `id` (string)
   - Indexes: `startTime`, `level`

3. **settings**
   - Key: `'app-settings'` (singleton)

4. **cache**
   - Key: composite (`${level}-${type}-${timestamp}`)
   - Auto-expire: 7 days

### 8.2 Storage Utilities

```typescript
// src/utils/storage.ts

import { openDB, DBSchema } from 'idb';

interface RapideDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 
      'by-level': string; 
      'by-type': string; 
    };
  };
  sessions: {
    key: string;
    value: PracticeSession;
    indexes: { 'by-date': string; };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

async function initDB() {
  return openDB<RapideDB>('rapide-db', 1, {
    upgrade(db) {
      // Create object stores
      const exerciseStore = db.createObjectStore('exercises', {
        keyPath: 'id'
      });
      exerciseStore.createIndex('by-level', 'level');
      exerciseStore.createIndex('by-type', 'type');
      
      const sessionStore = db.createObjectStore('sessions', {
        keyPath: 'id'
      });
      sessionStore.createIndex('by-date', 'startTime');
      
      db.createObjectStore('settings', { keyPath: 'id' });
    }
  });
}
```

---

## 9. PWA Configuration

### 9.1 Manifest (public/manifest.json)

```json
{
  "name": "Rapide - French Practice",
  "short_name": "Rapide",
  "description": "Rapid-fire French language practice with AI feedback",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ]
}
```

### 9.2 Service Worker Strategy (Workbox)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gemini-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## 10. API Integration Details

### 10.1 Gemini API

**Authentication:**
```typescript
const headers = {
  'Content-Type': 'application/json',
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
```

**Request Body:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Your prompt here"
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 2048,
    "responseMimeType": "application/json"
  }
}
```

**Response Parsing:**
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify(requestBody)
});

const data = await response.json();
const text = data.candidates[0].content.parts[0].text;
const parsed = JSON.parse(text);
```

**Error Handling:**
```typescript
try {
  const result = await callGemini(prompt);
  return result;
} catch (error) {
  if (error.status === 429) {
    // Rate limit hit
    showError('Rate limit reached. Please try again in a moment.');
  } else if (error.status === 401) {
    // Invalid API key
    showError('Invalid API key. Please check your settings.');
  } else {
    // Generic error
    showError('AI provider error. Please try again.');
  }
  throw error;
}
```

### 10.2 Ollama API

**Check Connection:**
```typescript
async function testOllamaConnection(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
```

**Generate Request:**
```typescript
async function generateWithOllama(
  endpoint: string,
  model: string,
  prompt: string
): Promise<string> {
  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

---

## 11. UI/UX Specifications

### 11.1 Color Palette

```css
:root {
  /* Primary - Blue */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Success - Green */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;
  
  /* Error - Red */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  
  /* Neutral - Gray */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-500: #6b7280;
  --neutral-900: #111827;
}
```

### 11.2 Key Screens

**1. Home Screen**
- Large "Start Practice" button
- Quick stats (streak, total questions answered)
- Level selection dropdown
- Settings icon (top-right)

**2. Practice Screen**
- Question number indicator (e.g., "7/10")
- Question card (centered, large text)
- Answer input (focused automatically)
- Hint button (if available)
- Progress bar (bottom)

**3. Feedback Screen**
- Large ✓ or ✗ icon
- Correct answer (if wrong)
- Brief explanation
- "Next" button (or 3s auto-advance)

**4. Batch Analysis Screen**
- Performance chart (donut or bar chart)
- AI insights in cards
- Grammar explanations (expandable)
- "Continue" or "Review Mistakes" buttons

**5. Settings Screen**
- AI Provider selector (tabs or radio buttons)
- API key input (with visibility toggle)
- Test connection button
- Preferences section
- Privacy toggle (data sharing)

### 11.3 Animations

```typescript
// Tailwind animation classes
const animations = {
  correct: 'animate-bounce', // When answer is correct
  incorrect: 'animate-shake', // When answer is wrong
  loading: 'animate-pulse', // Loading states
  slideIn: 'animate-slide-in-right', // New question
  fadeOut: 'animate-fade-out' // Question dismissed
};
```

**Custom animations (tailwind.config.js):**
```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 }
        }
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out'
      }
    }
  }
};
```

---

## 12. Performance Optimization

### 12.1 Code Splitting

```typescript
// Lazy load heavy components
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));
const BatchAnalysis = lazy(() => import('./components/practice/BatchAnalysis'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <SettingsPage />
</Suspense>
```

### 12.2 Preloading Strategy

```typescript
// Preload next question while showing feedback
async function handleAnswer(answer: string) {
  const isCorrect = validateAnswer(answer, currentExercise);
  
  // Show feedback immediately
  showFeedback(isCorrect);
  
  // Preload next question in background
  const nextExercise = await getNextExercise();
  preloadedExercise = nextExercise;
  
  // Wait for user to click "Next"
  await waitForNextClick();
  
  // Instantly show preloaded question
  showExercise(preloadedExercise);
}
```

### 12.3 Caching Strategy

**Exercise Cache:**
- Generate 30 exercises per level/type combination
- Store for 7 days
- Refresh in background when cache falls below 10

**API Response Cache:**
- Cache Gemini responses for identical prompts (24 hours)
- Cache batch feedback for review

---

## 13. Error Handling

### 13.1 Error Categories

```typescript
enum ErrorType {
  NETWORK = 'network',
  API_KEY = 'api_key',
  RATE_LIMIT = 'rate_limit',
  PARSE_ERROR = 'parse_error',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
}
```

### 13.2 Error Recovery

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 13.3 User-Facing Error Messages

```typescript
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 
    'Connection lost. Check your internet and try again.',
  [ErrorType.API_KEY]: 
    'Invalid API key. Please check your settings.',
  [ErrorType.RATE_LIMIT]: 
    'Rate limit reached. Please wait a moment before continuing.',
  [ErrorType.PARSE_ERROR]: 
    'Received invalid response. This has been logged.',
  [ErrorType.STORAGE]: 
    'Could not save progress. Please check browser settings.',
  [ErrorType.UNKNOWN]: 
    'Something went wrong. Please try again.'
};
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

**Coverage Areas:**
- Answer validation logic
- Normalization functions
- Levenshtein distance calculation
- Cache management
- Storage utilities

**Example Test:**
```typescript
describe('validateAnswer', () => {
  it('should accept exact matches', () => {
    const exercise = {
      correctAnswer: 'suis',
      acceptableAnswers: []
    };
    expect(validateAnswer('suis', exercise)).toBe(true);
  });
  
  it('should accept answers with different accents', () => {
    const exercise = {
      correctAnswer: 'été',
      acceptableAnswers: []
    };
    expect(validateAnswer('ete', exercise)).toBe(true);
  });
  
  it('should accept typos within distance 1', () => {
    const exercise = {
      correctAnswer: 'mange',
      acceptableAnswers: []
    };
    expect(validateAnswer('magne', exercise)).toBe(true);
  });
});
```

### 14.2 Integration Tests

**Test Scenarios:**
1. Complete practice session flow
2. AI provider switching
3. Batch feedback trigger
4. Cache population and retrieval
5. Settings persistence

### 14.3 Manual Testing Checklist

- [ ] First-time setup wizard
- [ ] API key validation
- [ ] Exercise generation with different parameters
- [ ] Answer submission and validation
- [ ] Batch analysis trigger (after 10 questions)
- [ ] Settings persistence across sessions
- [ ] Provider switching (Gemini ↔ Ollama)
- [ ] PWA installation
- [ ] Offline functionality (cached exercises)
- [ ] Error scenarios (network loss, invalid API key)

---

## 15. Deployment

### 15.1 Environment Variables

```env
# .env.example
VITE_APP_NAME=Rapide
VITE_DEFAULT_GEMINI_MODEL=gemini-2.0-flash-exp
VITE_DEFAULT_OLLAMA_ENDPOINT=http://localhost:11434
VITE_DEFAULT_OLLAMA_MODEL=croissantllm
VITE_BATCH_SIZE=10
VITE_CACHE_EXPIRY_DAYS=7
```

### 15.2 Build Configuration

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest"
  }
}
```

### 15.3 Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

---

## 16. Future Enhancements (Post-MVP)

### Phase 2 (Weeks 3-4)
- [ ] Spaced repetition algorithm
- [ ] Adaptive difficulty (AI adjusts based on performance)
- [ ] Voice input for pronunciation practice
- [ ] Audio playback for listening exercises
- [ ] Dark mode
- [ ] Export progress reports (PDF/CSV)

### Phase 3 (Month 2)
- [ ] Community features (shared exercises)
- [ ] Leaderboards (optional, anonymous)
- [ ] Achievement system
- [ ] Topic-specific practice (e.g., "restaurant vocabulary")
- [ ] Custom flashcard decks
- [ ] Multi-language support (Spanish, German, etc.)

### Phase 4 (Month 3+)
- [ ] Mobile native apps (React Native)
- [ ] Offline AI (WASM-based small models)
- [ ] Teacher dashboard (for classroom use)
- [ ] API for third-party integrations
- [ ] Premium features (advanced analytics, unlimited API usage)

---

## 17. Success Metrics

### Key Performance Indicators (KPIs)

**User Engagement:**
- Daily active users
- Average session duration
- Questions answered per session
- Retention rate (7-day, 30-day)

**Technical Performance:**
- API response time (p50, p95, p99)
- Cache hit rate
- Error rate
- PWA installation rate

**Learning Outcomes:**
- Improvement rate (% correct over time)
- Topic mastery (by CEFR level)
- User-reported confidence levels

---

## 18. Security & Privacy

### 18.1 API Key Storage

```typescript
// NEVER store API keys in plain text
// Use Web Crypto API for encryption

async function storeAPIKey(key: string): Promise<void> {
  const encryptionKey = await generateEncryptionKey();
  const encrypted = await encryptData(key, encryptionKey);
  localStorage.setItem('encrypted_api_key', encrypted);
}

async function retrieveAPIKey(): Promise<string> {
  const encrypted = localStorage.getItem('encrypted_api_key');
  if (!encrypted) throw new Error('No API key found');
  
  const encryptionKey = await generateEncryptionKey();
  return await decryptData(encrypted, encryptionKey);
}
```

### 18.2 Data Privacy

**User Data Collected (Locally Only):**
- Practice sessions and answers
- Performance statistics
- Settings and preferences

**NOT Collected:**
- Personal information (name, email, etc.)
- IP addresses
- Device fingerprints

**Optional Anonymous Data Sharing:**
- Aggregate question/answer patterns (no user IDs)
- Common mistakes (for improving exercise quality)
- Performance trends (for curriculum development)

### 18.3 Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        connect-src 'self' 
          https://generativelanguage.googleapis.com 
          http://localhost:11434;
        img-src 'self' data: https:;
      ">
```

---

## 19. Accessibility (a11y)

### 19.1 WCAG 2.1 Compliance

**Level AA Requirements:**

1. **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Enter to submit answers
   - Escape to close modals
   - Arrow keys for navigation (optional enhancement)

2. **Screen Reader Support**
   - Proper ARIA labels on all inputs
   - Live regions for dynamic feedback
   - Semantic HTML (headings, landmarks)

3. **Color Contrast**
   - Minimum 4.5:1 for normal text
   - Minimum 3:1 for large text
   - Success/error indicators not reliant on color alone

4. **Focus Management**
   - Visible focus indicators
   - Logical focus order
   - Focus trap in modals

### 19.2 Implementation Examples

```typescript
// QuestionCard component
<div role="region" aria-label="Practice question">
  <h2 id="question-text">{exercise.question}</h2>
  <input
    type="text"
    aria-labelledby="question-text"
    aria-describedby="hint-text"
    aria-invalid={showError}
    autoFocus
  />
  <div id="hint-text" aria-live="polite">
    {hint}
  </div>
</div>

// FeedbackDisplay component
<div role="alert" aria-live="assertive">
  {isCorrect ? (
    <span aria-label="Correct answer">✓ Bien!</span>
  ) : (
    <span aria-label="Incorrect answer">✗ The correct answer is {correctAnswer}</span>
  )}
</div>
```

### 19.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 20. Internationalization (i18n)

### 20.1 UI Language Support

**Initial Release:** English only  
**Phase 2:** French UI option (learning French in French)  
**Phase 3:** Spanish, German, etc.

### 20.2 Implementation

```typescript
// src/i18n/en.ts
export const en = {
  common: {
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...'
  },
  practice: {
    title: 'Practice French',
    questionCounter: 'Question {{current}} of {{total}}',
    submit: 'Submit Answer',
    nextQuestion: 'Next Question',
    showHint: 'Show Hint'
  },
  feedback: {
    correct: 'Correct! Well done!',
    incorrect: 'Not quite. The correct answer is:',
    explanation: 'Explanation'
  },
  settings: {
    title: 'Settings',
    aiProvider: 'AI Provider',
    apiKey: 'API Key',
    testConnection: 'Test Connection'
  }
};

// Usage with react-i18next (if needed)
import { useTranslation } from 'react-i18next';

function QuestionCard() {
  const { t } = useTranslation();
  return <button>{t('practice.submit')}</button>;
}
```

---

## 21. Development Phases & Timeline

### Phase 1: MVP (Week 1-2) ✓ Priority

**Sprint 1 (Days 1-3): Foundation**
- [ ] Project setup (Vite + React + TypeScript + Tailwind)
- [ ] File structure scaffolding
- [ ] Basic routing (Home, Practice, Settings)
- [ ] Storage utilities (IndexedDB wrapper)
- [ ] TypeScript interfaces

**Sprint 2 (Days 4-7): Core Practice Flow**
- [ ] AI Provider abstraction layer
- [ ] Gemini provider implementation
- [ ] Question card component
- [ ] Answer validation logic
- [ ] Feedback display component
- [ ] Basic practice session flow

**Sprint 3 (Days 8-10): Batch Feedback**
- [ ] Batch analysis trigger
- [ ] AI feedback prompt engineering
- [ ] Analysis results display
- [ ] Session storage

**Sprint 4 (Days 11-14): Settings & Polish**
- [ ] Settings page with BYOK
- [ ] API key storage (encrypted)
- [ ] Connection testing
- [ ] Error handling
- [ ] Loading states
- [ ] Basic animations

**Deliverable:** Functional desktop web app with Gemini integration

---

### Phase 2: Enhancement (Week 3-4)

**Sprint 5 (Days 15-17): Ollama Support**
- [ ] Ollama provider implementation
- [ ] Provider switching UI
- [ ] Connection detection
- [ ] Prompt optimization for smaller models

**Sprint 6 (Days 18-21): UX Improvements**
- [ ] Exercise caching system
- [ ] Preloading optimization
- [ ] Progress tracking
- [ ] Statistics dashboard
- [ ] Keyboard shortcuts

**Sprint 7 (Days 22-24): PWA Features**
- [ ] Service worker setup
- [ ] Manifest configuration
- [ ] Offline fallback
- [ ] Install prompts
- [ ] Icons and assets

**Sprint 8 (Days 25-28): Testing & Bug Fixes**
- [ ] Unit test coverage
- [ ] Integration tests
- [ ] Manual testing checklist
- [ ] Bug fixes
- [ ] Performance optimization

**Deliverable:** Full-featured PWA with dual AI provider support

---

### Phase 3: Community & Data (Month 2)

**Optional Backend Features:**
- [ ] Supabase setup
- [ ] Anonymous data aggregation
- [ ] Exercise sharing
- [ ] Performance analytics
- [ ] Community-sourced corrections

**Deliverable:** Community-enhanced platform

---

## 22. Code Quality Standards

### 22.1 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 22.2 ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_" 
    }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 22.3 Naming Conventions

```typescript
// Components: PascalCase
QuestionCard.tsx
FeedbackDisplay.tsx

// Hooks: camelCase with 'use' prefix
useAI.ts
usePracticeSession.ts

// Utilities: camelCase
validateAnswer()
normalizeText()

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

// Interfaces: PascalCase with 'I' prefix (optional)
interface Exercise { ... }
interface AIProvider { ... }

// Types: PascalCase
type CEFRLevel = 'A1' | 'A2' | ...
```

### 22.4 Code Documentation

```typescript
/**
 * Validates a user's answer against the correct answer with fuzzy matching
 * 
 * @param userAnswer - The answer provided by the user
 * @param exercise - The exercise containing the correct answer
 * @returns true if the answer is correct or within acceptable tolerance
 * 
 * @example
 * ```typescript
 * const isCorrect = validateAnswer('suis', {
 *   correctAnswer: 'suis',
 *   acceptableAnswers: ['sui']
 * });
 * // Returns: true
 * ```
 */
function validateAnswer(
  userAnswer: string,
  exercise: Exercise
): boolean {
  // Implementation...
}
```

---

## 23. Prompt Engineering Guide

### 23.1 Exercise Generation Prompts

**Template Structure:**
```
Role: You are [role description]
Task: [what to generate]
Context: [learner level, focus area]
Format: [output structure]
Constraints: [rules and requirements]
Examples: [optional examples]
```

**A1 Conjugation Exercise Prompt:**
```
Role: You are an experienced French teacher specializing in beginner learners.

Task: Generate 10 verb conjugation exercises for A1 level learners.

Context: 
- Focus on present tense of common verbs (être, avoir, aller, faire, venir)
- Mix of all persons (je, tu, il/elle, nous, vous, ils/elles)
- Simple, everyday contexts

Format: Return a JSON array with this structure:
[
  {
    "question": "Complete: Je ___ (être) content.",
    "correctAnswer": "suis",
    "acceptableAnswers": [],
    "explanation": "Être conjugates to 'suis' in first person singular",
    "topic": "être present tense",
    "difficulty": 1
  }
]

Constraints:
- Questions must be clear and unambiguous
- Use only vocabulary appropriate for A1 level
- Provide brief, simple explanations
- Mix different verbs and persons
- No trick questions

Generate the exercises now.
```

**A2 Fill-in-the-Blank Prompt:**
```
Role: You are a French grammar expert creating exercises for intermediate beginners.

Task: Generate 10 fill-in-the-blank exercises testing passé composé, imparfait, or common prepositions.

Context:
- A2 level learners who know present tense well
- Focus on past tenses and prepositions (à, de, en, avec, pour)
- Realistic, conversational sentences

Format: JSON array as shown in previous examples.

Constraints:
- Test one grammar point per question
- Provide context clues in the sentence
- Explanations should clarify the grammar rule
- Vary the difficulty (some easier, some harder)
- Include accent marks in correct answers

Generate the exercises now.
```

### 23.2 Batch Feedback Prompts

**Analysis Prompt Template:**
```
Role: You are a patient, encouraging French tutor analyzing a student's practice session.

Task: Analyze the following answers and provide constructive feedback.

Student's answers:
{{questions_and_answers}}

Format: Return JSON:
{
  "patterns": {
    "strengths": [2-3 specific things they did well],
    "weaknesses": [2-3 grammar areas needing work],
    "commonMistakes": [specific repeated errors]
  },
  "recommendations": [
    3 specific, actionable study suggestions
  ],
  "detailedExplanation": "2-3 paragraph explanation focusing on their biggest learning opportunity. Be encouraging but specific."
}

Tone:
- Encouraging and positive
- Specific and actionable
- Focus on patterns, not individual mistakes
- Suggest concrete next steps

Constraints:
- Keep recommendations practical and achievable
- Prioritize the most impactful improvements
- Use simple language (explain grammar terms)
- Be concise but thorough

Analyze the session now.
```

### 23.3 Prompt Optimization Tips

**For Better Results:**
1. Always specify JSON format explicitly
2. Provide examples in the prompt
3. Set clear constraints (no lists, specific length, etc.)
4. Use temperature 0.7 for creativity with consistency
5. Include "Generate/Analyze now" at the end for better completion

**Error Recovery:**
```typescript
async function generateWithFallback(prompt: string): Promise<any> {
  try {
    const result = await aiProvider.generate(prompt);
    return JSON.parse(result);
  } catch (parseError) {
    // Retry with stricter prompt
    const strictPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no additional text.`;
    const retry = await aiProvider.generate(strictPrompt);
    return JSON.parse(retry);
  }
}
```

---

## 24. LLM Coding Agent Instructions

### 24.1 Implementation Priority Order

**Step 1: Setup & Foundation**
```bash
# Initialize project
npm create vite@latest rapide-french -- --template react-ts
cd rapide-french
npm install

# Install dependencies
npm install tailwindcss postcss autoprefixer
npm install idb
npm install lucide-react
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

**Step 2: File Structure Creation**
Create the directory structure exactly as specified in Section 6.1.

**Step 3: TypeScript Interfaces**
Implement all interfaces from Section 4 in `src/types/index.ts` first. This provides type safety for all subsequent code.

**Step 4: Storage Layer**
Implement `src/utils/storage.ts` with IndexedDB wrapper. This is foundational for all data persistence.

**Step 5: AI Provider Abstraction**
- Create `src/providers/AIProvider.interface.ts`
- Implement `src/providers/GeminiProvider.ts`
- Add connection testing utilities

**Step 6: Core Components**
Build in this order:
1. `QuestionCard.tsx` (display questions)
2. `AnswerInput.tsx` (user input)
3. `FeedbackDisplay.tsx` (show results)
4. `BatchAnalysis.tsx` (AI feedback)

**Step 7: Practice Logic**
- Implement `src/hooks/usePracticeSession.ts`
- Add answer validation in `src/utils/validation.ts`
- Create session management

**Step 8: Settings & Configuration**
- Build `SettingsPage.tsx`
- Implement API key management
- Add provider switching

**Step 9: Polish & PWA**
- Add animations and transitions
- Configure service worker
- Add manifest.json
- Test installation flow

### 24.2 Code Generation Guidelines

**When generating components:**
```typescript
// ALWAYS include:
// 1. Proper TypeScript typing
// 2. Error boundaries
// 3. Loading states
// 4. Accessibility attributes
// 5. Inline comments for complex logic

// Example structure:
import { useState, useEffect } from 'react';
import { Exercise } from '@/types';

interface QuestionCardProps {
  exercise: Exercise;
  onAnswer: (answer: string) => void;
}

export function QuestionCard({ exercise, onAnswer }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAnswer(answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question-card" role="region" aria-label="Practice question">
      {/* Component implementation */}
    </div>
  );
}
```

**When generating utilities:**
```typescript
// ALWAYS include:
// 1. JSDoc comments
// 2. Input validation
// 3. Error handling
// 4. Unit test examples

/**
 * Normalizes user input for comparison
 */
export function normalizeAnswer(answer: string): string {
  if (!answer || typeof answer !== 'string') {
    throw new Error('Invalid answer input');
  }
  
  return answer
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Unit test example:
// expect(normalizeAnswer('  Été  ')).toBe('ete');
```

### 24.3 Testing Requirements

**For each new feature:**
1. Write unit tests for pure functions
2. Test error cases explicitly
3. Test edge cases (empty strings, special characters, etc.)
4. Verify TypeScript compilation with `npm run type-check`

**Manual testing checklist template:**
```typescript
/*
 * TESTING CHECKLIST for [Feature Name]
 * 
 * [ ] Happy path works
 * [ ] Error handling works
 * [ ] Loading states display correctly
 * [ ] Keyboard navigation works
 * [ ] Mobile responsive
 * [ ] Accessibility (screen reader tested)
 * [ ] Performance (no memory leaks)
 */
```

### 24.4 Common Pitfalls to Avoid

❌ **Don't:**
- Store API keys in plain text
- Use `any` type without justification
- Skip error boundaries on async operations
- Forget to cleanup useEffect listeners
- Hardcode API endpoints
- Skip TypeScript strict checks

✅ **Do:**
- Use const assertions for literal types
- Implement proper loading states
- Add error recovery mechanisms
- Use semantic HTML
- Follow accessibility guidelines
- Optimize bundle size (code splitting)

---

## 25. Deployment Checklist

### Pre-Deployment
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Build completes without errors
- [ ] Manual testing completed
- [ ] PWA manifest configured
- [ ] Icons generated (192x192, 512x512)
- [ ] Environment variables documented
- [ ] Security headers configured

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Post-Deployment
- [ ] Test deployed app thoroughly
- [ ] Verify PWA installability
- [ ] Test API connections
- [ ] Monitor error logs
- [ ] Set up analytics (optional)
- [ ] Create user documentation

---

## 26. Support & Maintenance

### Issue Tracking
Use GitHub Issues with labels:
- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `question` - User questions
- `help wanted` - Community contributions welcome

### Version Numbering
Follow Semantic Versioning (semver):
- `1.0.0` - MVP release
- `1.1.0` - Ollama support added
- `1.1.1` - Bug fixes
- `2.0.0` - Breaking changes (new storage format, etc.)

---

## 27. Glossary

**CEFR** - Common European Framework of Reference for Languages  
**PWA** - Progressive Web App  
**BYOK** - Bring Your Own Key  
**IDB** - IndexedDB  
**CSP** - Content Security Policy  
**WCAG** - Web Content Accessibility Guidelines  
**a11y** - Accessibility (numeronym)  
**i18n** - Internationalization (numeronym)

---

## 28. References & Resources

### Documentation Links
- [Gemini API Docs](https://ai.google.dev/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

### Learning Resources
- [French Grammar Reference](https://www.lawlessfrench.com/)
- [CEFR Levels Explained](https://www.coe.int/en/web/common-european-framework-reference-languages)
- [Spaced Repetition Science](https://ncase.me/remember/)

---

## 29. License & Credits

**License:** MIT (or specify your choice)

**Credits:**
- Gemini AI by Google
- Ollama by Ollama team
- CroissantLLM research team
- Open source libraries (React, Vite, Tailwind, etc.)

---

## 30. Contact & Contribution

**Project Maintainer:** [Your Name/Handle]  
**Repository:** [GitHub URL when created]  
**Issues:** [GitHub Issues URL]  
**Discussions:** [GitHub Discussions URL]

**Contributing Guidelines:**
1. Fork the repository
2. Create a feature branch
3. Follow code style guidelines (Section 22)
4. Write tests for new features
5. Submit pull request with clear description

---

## Appendix A: Sample Exercise Database

```json
{
  "exercises": [
    {
      "id": "a1-etre-001",
      "type": "conjugation",
      "level": "A1",
      "question": "Complete: Je ___ (être) étudiant.",
      "correctAnswer": "suis",
      "acceptableAnswers": [],
      "hint": "First person singular of être",
      "explanation": "Être conjugates to 'suis' for 'je' (I)",
      "metadata": {
        "topic": "être present tense",
        "difficulty": 1,
        "createdAt": "2025-11-06T00:00:00Z",
        "source": "curated"
      }
    },
    {
      "id": "a1-avoir-001",
      "type": "conjugation",
      "level": "A1",
      "question": "Complete: Tu ___ (avoir) un chat?",
      "correctAnswer": "as",
      "acceptableAnswers": [],
      "hint": "Second person singular of avoir",
      "explanation": "Avoir conjugates to 'as' for 'tu' (you)",
      "metadata": {
        "topic": "avoir present tense",
        "difficulty": 1,
        "createdAt": "2025-11-06T00:00:00Z",
        "source": "curated"
      }
    }
  ]
}
```

---

## Appendix B: API Rate Limits

### Gemini API (Free Tier)
- **Requests per minute:** 15
- **Requests per day:** 1500
- **Tokens per minute:** 32,000
- **Tokens per request:** 32,000 max

### Recommended Usage
- Cache aggressively
- Batch analysis (10 questions = 1 API call)
- Pre-generate exercises in chunks
- Implement request queuing

---

## Appendix C: Performance Benchmarks

### Target Metrics
- **Time to Interactive:** < 2s
- **First Contentful Paint:** < 1s
- **API Response Time:** < 2s (p95)
- **Cache Hit Rate:** > 70%
- **Bundle Size:** < 500KB (gzipped)

### Optimization Strategies
- Code splitting by route
- Lazy load heavy components
- Compress images (WebP format)
- Use CDN for static assets
- Implement virtual scrolling for long lists

---

**END OF SPECIFICATION DOCUMENT**

*This document is a living specification and should be updated as the project evolves.*