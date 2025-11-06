# Requirements Document

## Introduction

Rapide is a progressive web application for rapid-fire French language practice (A1-A2 initially) with AI-powered feedback. The core philosophy is learning through volume and immediate feedback rather than lengthy lessons. Users answer questions in quick succession with instant validation and periodic deep AI analysis of patterns. The system supports multiple AI providers (Gemini, Ollama, custom) with BYOK (Bring Your Own Key) functionality.

## Glossary

- **PWA**: Progressive Web App - a web application that can be installed and work offline
- **BYOK**: Bring Your Own Key - users provide their own API keys for AI services
- **CEFR**: Common European Framework of Reference for Languages (A1, A2, B1, B2, C1, C2)
- **Rapide System**: The complete French practice application
- **AI Provider**: External service that generates exercises and provides feedback (Gemini, Ollama, or custom)
- **Exercise**: A single practice question with correct answer and metadata
- **Practice Session**: A continuous period of answering exercises with tracked statistics
- **Batch Analysis**: AI-powered feedback provided after a set number of questions (default: 10)
- **IndexedDB**: Browser database for local storage of exercises, sessions, and settings

## Requirements

### Requirement 1: User Onboarding and Configuration

**User Story:** As a new user, I want to configure my AI provider settings, so that I can start practicing French immediately.

#### Acceptance Criteria

1. WHEN the User opens the Rapide System for the first time, THE Rapide System SHALL display a setup wizard for AI provider configuration
2. THE Rapide System SHALL support configuration of Gemini, Ollama, or custom AI providers
3. WHEN the User enters an API key or endpoint, THE Rapide System SHALL validate the connection before allowing continuation
4. THE Rapide System SHALL store API keys securely using encryption in local storage
5. WHEN the User completes setup, THE Rapide System SHALL persist settings to IndexedDB

### Requirement 2: Exercise Generation and Caching

**User Story:** As a learner, I want exercises to load quickly without delays, so that I can maintain my practice flow.

#### Acceptance Criteria

1. WHEN the User starts a practice session, THE Rapide System SHALL generate exercises using the configured AI Provider
2. THE Rapide System SHALL cache generated exercises in IndexedDB for up to 7 days
3. WHEN cached exercises are available, THE Rapide System SHALL use cached exercises before generating new ones
4. THE Rapide System SHALL preload the next exercise while displaying feedback to minimize wait time
5. WHEN the cache contains fewer than 10 exercises for a level/type combination, THE Rapide System SHALL generate additional exercises in the background

### Requirement 3: Rapid-Fire Practice Flow

**User Story:** As a learner, I want to answer questions in quick succession with immediate feedback, so that I can maximize my practice volume.

#### Acceptance Criteria

1. THE Rapide System SHALL display one exercise at a time with clear question text
2. WHEN the User submits an answer, THE Rapide System SHALL validate the answer within 100 milliseconds
3. THE Rapide System SHALL accept answers with minor typos using Levenshtein distance of 1 or less
4. WHEN an answer is correct, THE Rapide System SHALL display a success indicator with animation
5. WHEN an answer is incorrect, THE Rapide System SHALL display the correct answer and optional explanation
6. THE Rapide System SHALL automatically focus the input field for each new question
7. THE Rapide System SHALL support keyboard shortcuts for submission (Enter key)

### Requirement 4: Answer Validation

**User Story:** As a learner, I want my answers to be validated fairly with tolerance for minor mistakes, so that I'm not penalized for typos.

#### Acceptance Criteria

1. THE Rapide System SHALL normalize answers by converting to lowercase and trimming whitespace
2. THE Rapide System SHALL accept answers that match any acceptable variation defined in the exercise
3. WHEN comparing answers, THE Rapide System SHALL ignore diacritical marks for fuzzy matching
4. THE Rapide System SHALL accept answers within Levenshtein distance of 1 for single-word responses
5. THE Rapide System SHALL record the time spent on each question in milliseconds

### Requirement 5: Batch AI Analysis

**User Story:** As a learner, I want periodic AI analysis of my performance, so that I can understand my strengths and weaknesses.

#### Acceptance Criteria

1. WHEN the User completes 10 questions, THE Rapide System SHALL trigger batch analysis using the AI Provider
2. THE Rapide System SHALL send the last 10 questions and answers to the AI Provider for analysis
3. THE Rapide System SHALL display AI feedback including strengths, weaknesses, and recommendations
4. THE Rapide System SHALL store AI feedback in the practice session record
5. WHEN batch analysis is complete, THE Rapide System SHALL allow the User to continue practicing or review mistakes

### Requirement 6: Session Tracking and Statistics

**User Story:** As a learner, I want to track my practice statistics, so that I can monitor my progress over time.

#### Acceptance Criteria

1. WHEN the User starts practicing, THE Rapide System SHALL create a new practice session with unique ID and timestamp
2. THE Rapide System SHALL track total questions answered, correct answers, and average time per question
3. THE Rapide System SHALL store all user answers with correctness, timestamp, and time spent
4. WHEN the User ends a session, THE Rapide System SHALL persist the complete session to IndexedDB
5. THE Rapide System SHALL display current session statistics including question count and accuracy percentage

### Requirement 7: Offline Capability

**User Story:** As a learner, I want to practice offline using cached exercises, so that I can learn without an internet connection.

#### Acceptance Criteria

1. THE Rapide System SHALL function as a Progressive Web App with service worker
2. WHEN the User is offline, THE Rapide System SHALL use cached exercises from IndexedDB
3. THE Rapide System SHALL display a notification when operating in offline mode
4. WHEN the User is offline, THE Rapide System SHALL disable batch AI analysis features
5. THE Rapide System SHALL allow installation to the device home screen

### Requirement 8: Settings Management

**User Story:** As a user, I want to customize my practice preferences, so that the experience matches my learning style.

#### Acceptance Criteria

1. THE Rapide System SHALL provide a settings page accessible from the main navigation
2. THE Rapide System SHALL allow the User to change AI provider and update API keys
3. THE Rapide System SHALL allow the User to configure questions per batch (default: 10)
4. THE Rapide System SHALL allow the User to toggle explanation display after incorrect answers
5. THE Rapide System SHALL persist all settings changes to IndexedDB immediately

### Requirement 9: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the application to be fully keyboard navigable and screen reader compatible, so that I can practice effectively.

#### Acceptance Criteria

1. THE Rapide System SHALL support complete keyboard navigation using Tab, Enter, and Escape keys
2. THE Rapide System SHALL provide ARIA labels on all interactive elements
3. THE Rapide System SHALL maintain color contrast ratio of at least 4.5:1 for normal text
4. THE Rapide System SHALL use semantic HTML with proper heading hierarchy
5. THE Rapide System SHALL announce dynamic feedback changes to screen readers using ARIA live regions

### Requirement 10: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and recovery options when something goes wrong, so that I can continue practicing without frustration.

#### Acceptance Criteria

1. WHEN an API call fails, THE Rapide System SHALL display a user-friendly error message
2. THE Rapide System SHALL implement exponential backoff retry logic for network errors (maximum 3 attempts)
3. WHEN an API key is invalid, THE Rapide System SHALL prompt the User to update settings
4. WHEN rate limits are exceeded, THE Rapide System SHALL inform the User and suggest waiting
5. THE Rapide System SHALL log errors to console for debugging while showing simplified messages to users
