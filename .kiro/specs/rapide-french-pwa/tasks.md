# Implementation Plan

## Phase 1: MVP - Basic Working App (Core Features Only)

- [x] 1. Project setup and foundation





  - Initialize Vite React TypeScript project with essential dependencies (react, typescript, vite, tailwindcss, idb)
  - Configure basic Tailwind CSS with minimal custom theme (primary colors only)
  - Create basic directory structure (components, hooks, providers, utils, types)
  - Set up TypeScript configuration with strict mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Define core TypeScript types





  - Create essential type definitions in `src/types/index.ts`
  - Define Exercise, UserAnswer, PracticeSession interfaces
  - Define AppSettings with Gemini configuration only (skip Ollama for MVP)
  - Define AIProvider interface and GenerationParams
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 8.1_

- [x] 3. Build minimal storage layer



  - Create IndexedDB wrapper with idb library for exercises and settings stores only
  - Implement basic exercise storage (store and retrieve by level)
  - Implement settings storage (get and update)
  - Skip session history and cache management for MVP
  - _Requirements: 2.1, 2.2, 8.5_

- [x] 4. Implement answer validation


  - Create Levenshtein distance function for typo tolerance
  - Implement answer normalization (lowercase, trim)
  - Write validateAnswer function with exact and fuzzy matching
  - Skip diacritics handling for MVP
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Create Gemini AI provider (only)


  - Define AIProvider interface with testConnection and generateExercises methods
  - Implement GeminiProvider class with connection testing
  - Build exercise generation with basic prompts
  - Skip batch analysis for MVP (add in Phase 2)
  - Add basic error handling for API failures
  - _Requirements: 1.2, 1.3, 2.1, 10.1, 10.2_

- [x] 6. Build essential React hooks

  - [x] 6.1 Create useSettings hook


    - Load and save settings from IndexedDB
    - Implement setAPIKey for Gemini configuration
    - Add hasValidConfig validation
    - _Requirements: 1.1, 1.5, 8.1, 8.2, 8.5_

  - [x] 6.2 Create useAI hook


    - Initialize Gemini provider based on settings
    - Add generateExercises function
    - Track provider ready state
    - _Requirements: 1.2, 1.3, 2.1, 10.1_

  - [x] 6.3 Create usePracticeSession hook (simplified)


    - Manage current exercise and answer queue
    - Implement startSession and loadExercises
    - Add submitAnswer with validation
    - Add nextQuestion function
    - Skip session persistence and statistics for MVP
    - _Requirements: 2.1, 3.1, 3.2, 3.6, 3.7, 4.5_

- [x] 7. Build minimal UI components

  - [x] 7.1 Create QuestionCard component


    - Display question text
    - Add text input with auto-focus
    - Implement submit button and Enter key support
    - Skip hints for MVP
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [x] 7.2 Create FeedbackDisplay component


    - Show correct/incorrect status with simple icons
    - Display correct answer if wrong
    - Add "Next" button
    - Skip animations and explanations for MVP
    - _Requirements: 3.4, 3.5_

  - [x] 7.3 Create simple PracticePage


    - Manage question and feedback view states
    - Integrate QuestionCard and FeedbackDisplay
    - Show simple question counter
    - Skip progress bar and batch analysis for MVP
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.4 Create basic SettingsPage


    - Add API key input field for Gemini
    - Add "Test Connection" button
    - Add "Save" button with persistence
    - Skip provider selector and preferences for MVP
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.5_

  - [x] 7.5 Create minimal shared components


    - Build basic Button component
    - Create basic Input component
    - Add simple LoadingSpinner
    - Skip Modal for MVP
    - _Requirements: 3.7_

  - [x] 7.6 Create simple App layout


    - Build basic App.tsx with routing (practice and settings pages)
    - Add simple header with navigation links
    - Skip complex layout components for MVP
    - _Requirements: 8.1_

- [x] 8. Add basic styling

  - Apply Tailwind utility classes for layout and spacing
  - Add basic colors (primary blue, success green, error red)
  - Ensure mobile responsive design
  - Skip custom animations for MVP
  - _Requirements: 9.3_


- [x] 9. Implement basic error handling

  - Add try-catch blocks in API calls
  - Display simple error messages to user
  - Skip retry logic and error boundaries for MVP
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 10. Test and deploy MVP
  - Manually test complete flow: settings → practice → answer questions
  - Test with valid and invalid API keys
  - Deploy to Vercel or Netlify
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 3.4, 3.5_

## Phase 2: Enhanced Features (Iterate After MVP)

- [ ] 11. Add batch AI analysis
  - Implement analyzeBatch method in GeminiProvider
  - Create AIFeedback type and storage
  - Build BatchAnalysis component with feedback display
  - Update usePracticeSession to trigger analysis after 10 questions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Add session tracking and statistics
  - Implement session storage in IndexedDB
  - Track questions answered, accuracy, and time spent
  - Display session statistics on practice page
  - Add session history view
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Enhance UI with animations and polish
  - Add success/error animations (shake, bounce)
  - Implement slide-in transitions for new questions
  - Add progress bar with visual feedback
  - Add celebration effects for correct answers
  - Implement loading skeletons
  - _Requirements: 3.4, 9.5_

- [ ] 14. Add exercise caching and preloading
  - Implement cache store in IndexedDB
  - Add cache expiry logic (7 days)
  - Preload next exercise during feedback display
  - Generate exercises in batches of 10
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 15. Add user preferences
  - Create PreferencesPanel component
  - Add settings for batch size, explanations, auto-advance
  - Persist preferences to IndexedDB
  - Apply preferences in practice flow
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 16. Add hints and explanations
  - Add hint toggle button to QuestionCard
  - Display hints when requested
  - Show explanations in FeedbackDisplay
  - Track hints used in statistics
  - _Requirements: 3.1, 3.5, 8.4_

## Phase 3: Advanced Features (Future Enhancements)

- [ ] 17. Add Ollama provider support
  - Implement OllamaProvider class
  - Add provider selector in settings
  - Support local model inference
  - _Requirements: 1.2, 1.3, 2.1_

- [ ] 18. Implement PWA functionality
  - Configure service worker with Workbox
  - Create PWA manifest with icons
  - Add offline detection and messaging
  - Enable app installation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 19. Add comprehensive accessibility
  - Implement full keyboard navigation
  - Add ARIA labels and live regions
  - Ensure WCAG 2.1 AA color contrast
  - Add reduced motion support
  - Test with screen readers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 20. Optimize performance
  - Implement code splitting with React.lazy
  - Add Suspense boundaries
  - Optimize bundle size
  - Compress images
  - _Requirements: 2.4, 2.5_

- [ ] 21. Add advanced error handling
  - Implement error boundaries
  - Add retry logic with exponential backoff
  - Create comprehensive error logging
  - Add graceful degradation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 22. Write comprehensive tests
  - Unit tests for validation and utilities
  - Integration tests for complete flows
  - Test AI provider switching
  - Test offline scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2_
