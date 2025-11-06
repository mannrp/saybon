# Design Document

## Overview

Rapide is a React-based Progressive Web Application built with TypeScript, Vite, and Tailwind CSS. The architecture follows a layered approach with clear separation between UI components, business logic (hooks), data providers (AI services), and storage (IndexedDB). The application prioritizes performance through caching, preloading, and code splitting.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components (UI)                    │
│  QuestionCard │ FeedbackDisplay │ BatchAnalysis │ Settings  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Custom Hooks (Logic)                      │
│  usePracticeSession │ useAI │ useSettings │ useStorage      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  AI Provider Abstraction                     │
│    GeminiProvider │ OllamaProvider │ CustomProvider         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Storage Layer (IndexedDB)                 │
│    Exercises │ Sessions │ Settings │ Cache                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5+ (fast HMR, optimized builds)
- **Styling**: Tailwind CSS 3+ (utility-first, responsive)
- **State Management**: React Context API + useReducer (no external library)
- **Storage**: IndexedDB via `idb` library with localStorage fallback
- **PWA**: Workbox via `vite-plugin-pwa`
- **Icons**: Lucide React (tree-shakeable)
- **HTTP**: Native fetch API

## Components and Interfaces

### Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Main app wrapper with navigation
│   │   ├── Header.tsx             # Top navigation bar
│   │   └── Navigation.tsx         # Bottom/side navigation
│   ├── practice/
│   │   ├── PracticePage.tsx       # Main practice orchestrator
│   │   ├── QuestionCard.tsx       # Display question and input
│   │   ├── FeedbackDisplay.tsx    # Show answer feedback
│   │   ├── BatchAnalysis.tsx      # Display AI analysis
│   │   └── ProgressBar.tsx        # Visual progress indicator
│   ├── settings/
│   │   ├── SettingsPage.tsx       # Settings container
│   │   ├── ProviderSelector.tsx   # AI provider tabs/radio
│   │   ├── APIKeyInput.tsx        # Secure key input with toggle
│   │   └── PreferencesPanel.tsx   # User preferences form
│   └── shared/
│       ├── Button.tsx             # Reusable button component
│       ├── Input.tsx              # Reusable input component
│       ├── Modal.tsx              # Modal dialog wrapper
│       └── LoadingSpinner.tsx     # Loading state indicator
├── providers/
│   ├── AIProvider.interface.ts    # Provider contract
│   ├── GeminiProvider.ts          # Google Gemini implementation
│   ├── OllamaProvider.ts          # Ollama local implementation
│   └── CustomProvider.ts          # Custom endpoint implementation
├── hooks/
│   ├── useAI.ts                   # AI provider management
│   ├── usePracticeSession.ts      # Practice session logic
│   ├── useSettings.ts             # Settings CRUD operations
│   └── useStorage.ts              # IndexedDB wrapper hooks
├── utils/
│   ├── validation.ts              # Answer validation logic
│   ├── storage.ts                 # IndexedDB operations
│   ├── prompts.ts                 # AI prompt templates
│   └── levenshtein.ts             # Fuzzy matching algorithm
└── types/
    └── index.ts                   # All TypeScript interfaces
```

### Key Component Designs

#### QuestionCard Component

**Purpose**: Display exercise question and capture user input

**Props**:
- `exercise: Exercise` - Current exercise to display
- `onSubmit: (answer: string) => void` - Callback when answer submitted
- `isSubmitting?: boolean` - Loading state
- `questionNumber: number` - Current question index
- `totalQuestions?: number` - Total in batch

**Features**:
- Auto-focus input on mount
- Keyboard shortcut support (Enter to submit)
- Optional hint display (toggle button)
- Disabled state during submission
- Accessibility: ARIA labels, semantic HTML

#### FeedbackDisplay Component

**Purpose**: Show immediate feedback after answer submission

**Props**:
- `isCorrect: boolean` - Answer correctness
- `exercise: Exercise` - Original exercise
- `userAnswer: string` - What user submitted
- `onNext: () => void` - Callback to continue
- `showExplanation?: boolean` - Toggle explanation display

**Features**:
- Animated success/error indicators
- Side-by-side answer comparison
- Expandable explanation section
- Auto-focus "Next" button
- Celebration animations for correct answers

#### BatchAnalysis Component

**Purpose**: Display AI-generated feedback after batch completion

**Props**:
- `feedback: AIFeedback` - AI analysis results
- `correctCount: number` - Number correct in batch
- `totalCount: number` - Total questions in batch
- `onContinue: () => void` - Callback to resume practice

**Features**:
- Circular progress indicator
- Categorized feedback (strengths/weaknesses)
- Actionable recommendations list
- Detailed explanation section
- Visual charts for performance

## Data Models

### Core Data Structures

**Exercise**:
```typescript
{
  id: string;                    // Unique identifier
  type: ExerciseType;            // conjugation, fill-blank, etc.
  level: CEFRLevel;              // A1, A2, B1, etc.
  question: string;              // Question text
  correctAnswer: string | string[]; // Correct answer(s)
  acceptableAnswers?: string[];  // Acceptable variations
  hint?: string;                 // Optional hint
  explanation?: string;          // Why this is correct
  metadata: {
    topic: string;               // Grammar topic
    difficulty: number;          // 1-5 scale
    createdAt: string;           // ISO timestamp
    source: 'ai-generated' | 'curated' | 'community';
  };
}
```

**PracticeSession**:
```typescript
{
  id: string;                    // Unique session ID
  startTime: string;             // ISO timestamp
  endTime?: string;              // ISO timestamp (when ended)
  level: CEFRLevel;              // Practice level
  answers: UserAnswer[];         // All answers in session
  aiFeedback?: AIFeedback[];     // Batch analysis results
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    averageTime: number;         // Milliseconds
  };
}
```

**AppSettings**:
```typescript
{
  aiProvider: 'gemini' | 'ollama' | 'custom';
  gemini?: {
    apiKey: string;
    model: string;               // Default: gemini-2.0-flash-exp
  };
  ollama?: {
    endpoint: string;            // Default: http://localhost:11434
    model: string;               // Default: croissantllm
  };
  custom?: {
    endpoint: string;
    headers: Record<string, string>;
  };
  preferences: {
    questionsPerBatch: number;   // Default: 10
    showExplanations: boolean;   // Default: true
    autoAdvance: boolean;        // Default: false
    soundEffects: boolean;       // Default: true
  };
  privacy: {
    shareAnonymousData: boolean; // Default: false
  };
}
```

### IndexedDB Schema

**Object Stores**:

1. **exercises**
   - Key: `id` (string)
   - Indexes: `level`, `type`, `createdAt`
   - Purpose: Cache generated exercises

2. **sessions**
   - Key: `id` (string)
   - Indexes: `startTime`, `level`
   - Purpose: Store practice history

3. **settings**
   - Key: `'app-settings'` (singleton)
   - Purpose: Persist user configuration

4. **cache**
   - Key: composite `${level}-${type}-${timestamp}`
   - Indexes: `timestamp`
   - Purpose: Temporary exercise storage with auto-expiry

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **API Key Errors**: Invalid or missing credentials
3. **Rate Limit Errors**: API quota exceeded
4. **Parse Errors**: Invalid JSON from AI provider
5. **Storage Errors**: IndexedDB failures
6. **Unknown Errors**: Unexpected failures

### Error Recovery Strategy

**Retry Logic**:
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
}
```

**User-Facing Messages**:
- Network: "Connection lost. Check your internet and try again."
- API Key: "Invalid API key. Please check your settings."
- Rate Limit: "Rate limit reached. Please wait a moment."
- Storage: "Could not save progress. Check browser settings."

## Testing Strategy

### Unit Testing

**Coverage Areas**:
- Answer validation logic (exact match, fuzzy match, normalization)
- Levenshtein distance calculation
- Storage utilities (CRUD operations)
- Prompt generation
- Data normalization functions

**Testing Framework**: Vitest (Vite-native, fast)

### Integration Testing

**Test Scenarios**:
1. Complete practice flow (start → answer → feedback → batch analysis)
2. AI provider switching (Gemini ↔ Ollama)
3. Settings persistence across page reloads
4. Cache population and retrieval
5. Offline mode with cached exercises

### Manual Testing Checklist

- [ ] First-time setup wizard
- [ ] API key validation and connection testing
- [ ] Exercise generation with different parameters
- [ ] Answer validation (correct, incorrect, typos)
- [ ] Batch analysis trigger after 10 questions
- [ ] Settings persistence
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Performance Optimization

### Caching Strategy

**Exercise Cache**:
- Generate 30 exercises per level/type combination
- Store for 7 days in IndexedDB
- Refresh in background when cache falls below 10
- Preload next question while showing feedback

**API Response Cache**:
- Cache identical prompts for 24 hours
- Store batch feedback for review
- Implement LRU eviction when storage exceeds 50MB

### Code Splitting

```typescript
// Lazy load heavy components
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));
const BatchAnalysis = lazy(() => import('./components/practice/BatchAnalysis'));

// Use Suspense with fallback
<Suspense fallback={<LoadingSpinner />}>
  <SettingsPage />
</Suspense>
```

### Bundle Optimization

- Target bundle size: < 500KB gzipped
- Tree-shake unused Lucide icons
- Use dynamic imports for routes
- Compress images to WebP format
- Implement virtual scrolling for long lists

## Security Considerations

### API Key Storage

**Encryption Strategy**:
```typescript
// Use Web Crypto API for encryption
async function storeAPIKey(key: string): Promise<void> {
  const encryptionKey = await generateEncryptionKey();
  const encrypted = await encryptData(key, encryptionKey);
  localStorage.setItem('encrypted_api_key', encrypted);
}
```

**Security Measures**:
- Never log API keys to console
- Use HTTPS for all API calls
- Implement Content Security Policy headers
- Sanitize user input before storage
- Clear sensitive data on logout

### Privacy

**Data Collection**:
- All data stored locally (IndexedDB)
- No personal information collected
- Optional anonymous usage statistics
- No third-party analytics by default

## Accessibility (WCAG 2.1 Level AA)

### Keyboard Navigation

- Tab: Navigate between interactive elements
- Enter: Submit answers, activate buttons
- Escape: Close modals, cancel actions
- Arrow keys: Navigate lists (optional enhancement)

### Screen Reader Support

- Semantic HTML (nav, main, article, section)
- ARIA labels on all inputs and buttons
- ARIA live regions for dynamic feedback
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all images and icons

### Visual Accessibility

- Color contrast: 4.5:1 minimum for normal text
- Focus indicators: 2px solid outline
- Success/error not reliant on color alone (icons + text)
- Reduced motion support via CSS media query
- Resizable text up to 200% without loss of functionality

## PWA Configuration

### Service Worker Strategy

**Caching Approach**:
- **App Shell**: Cache-first (HTML, CSS, JS)
- **API Calls**: Network-first with cache fallback
- **Images**: Cache-first with network fallback
- **Exercises**: IndexedDB (not service worker cache)

**Workbox Configuration**:
```typescript
{
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
            maxAgeSeconds: 3600 // 1 hour
          }
        }
      }
    ]
  }
}
```

### Manifest Configuration

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
  ]
}
```

## AI Provider Integration

### Provider Abstraction

**Interface**:
```typescript
interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback>;
}
```

### Gemini Provider

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

**Configuration**:
- Temperature: 0.7 (balance creativity and consistency)
- Max tokens: 2048 for exercises, 2048 for analysis
- Response format: JSON
- Rate limit handling: Exponential backoff

**Prompt Engineering**:
- Structured prompts with clear role, task, format, constraints
- JSON schema specification in prompt
- Examples included for consistency
- Explicit instruction to return only JSON

### Ollama Provider

**Endpoint**: `http://localhost:11434/api/generate`

**Supported Models**:
- CroissantLLM (1.3B) - French-specific, lightweight
- Mistral 7B - Multilingual, better quality
- Custom fine-tuned models

**Configuration**:
- Stream: false (wait for complete response)
- Format: json (enforce JSON output)
- Temperature: 0.7
- Connection detection: Ping `/api/tags` endpoint

## Deployment

### Build Configuration

**Vite Config**:
```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        // ... manifest config
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
          'storage-vendor': ['idb']
        }
      }
    }
  }
});
```

### Environment Variables

```env
VITE_APP_NAME=Rapide
VITE_DEFAULT_GEMINI_MODEL=gemini-2.0-flash-exp
VITE_DEFAULT_OLLAMA_ENDPOINT=http://localhost:11434
VITE_DEFAULT_OLLAMA_MODEL=croissantllm
VITE_BATCH_SIZE=10
VITE_CACHE_EXPIRY_DAYS=7
```

### Hosting

**Recommended Platforms**:
- Vercel (automatic deployments, edge functions)
- Netlify (similar features, good PWA support)
- Cloudflare Pages (fast CDN, workers support)

**Deployment Steps**:
1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Enable automatic deployments on push

## Future Enhancements

### Phase 2 (Post-MVP)
- Spaced repetition algorithm
- Adaptive difficulty based on performance
- Voice input for pronunciation practice
- Audio playback for listening exercises
- Dark mode support
- Export progress reports (PDF/CSV)

### Phase 3 (Long-term)
- Community features (shared exercises)
- Achievement system and gamification
- Topic-specific practice modes
- Custom flashcard decks
- Multi-language support (Spanish, German)
- Mobile native apps (React Native)
