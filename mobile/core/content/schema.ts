// Saybon v2 — Core Domain Type Definitions and Schemas

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ConceptType =
  | 'word'
  | 'conjugation'
  | 'tense'
  | 'grammar'
  | 'pronoun'
  | 'morphology'
  | 'phrase'
  | 'exception'
  | 'fia'
  | 'culture';

export type ExerciseType =
  | 'translation'
  | 'fill-blank'
  | 'tense-correction'
  | 'sentence-reorder'
  | 'identify-error'
  | 'gender-recognition'
  | 'conjugation'
  | 'sentence-rebuilding'
  | 'morphology'
  | 'vocabulary';

// 3D Coordinate for Spatial Grid/Nebula Visualization
export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

// Every Concept Node in the Graph Grid System
export interface ConceptNode {
  // Core
  id: string;
  type: ConceptType;
  difficulty: number; // 0.0 to 1.0
  level: CEFRLevel;
  frequency: number; // Usage frequency percentile (e.g. 0 to 100)
  
  // Language
  french: string; // The primary french text
  english: string; // Meaning in english
  gender?: 'M' | 'F' | 'N'; // Grammatical gender (Masculin, Féminin, Neutre/None)
  morphology?: {
    prefix?: string;
    root?: string;
    suffix?: string;
    decomposition?: string[]; // e.g. ["im", "possible", "ment"]
  };
  examples: {
    french: string;
    english: string;
    explanation?: string;
  }[];
  culturalContext?: string; // Québec-specific context, slang, nuances
  
  // Visual Grid / Nebula Placement
  coordinates: Coordinate3D;
}

// Graph Relationship between concept nodes
export interface ConceptRelationship {
  sourceId: string;
  targetId: string;
  type: 'related' | 'derived' | 'grammar' | 'category' | 'synonym' | 'antonym';
  weight: number; // Link strength/closeness (0.0 to 1.0)
}

// Mastery / Progress state tracking for a concept (persisted locally)
export interface ConceptProgress {
  conceptId: string;
  mastery: number; // 0 (unseen) to 5 (fully mastered)
  seenState: boolean;
  reviewState: 'new' | 'learning' | 'review' | 'mastered';
  familiarityScore: number; // Fine-grained scale (e.g., 0 to 100)
  streak: number;
  attempts: number;
  correctAnswers: number;
  lastSeen: string; // ISO timestamp
}

// Single Practice Exercise representation
export interface Exercise {
  id: string;
  conceptId?: string; // The specific concept node this exercise tests (if any)
  type: ExerciseType;
  level: CEFRLevel;
  question: string;
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  hint?: string;
  explanation?: string;
  options?: string[]; // For multiple choice or drag-and-drop elements
  metadata: {
    topic: string;
    difficulty: number;
    createdAt: string;
    source: 'ai-generated' | 'curated' | 'community';
  };
}

export interface UserAnswer {
  exerciseId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in milliseconds
  timestamp: string; // ISO timestamp
}

export interface PracticeSession {
  id: string;
  startTime: string;
  endTime?: string;
  level: CEFRLevel;
  answers: UserAnswer[];
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    averageTime: number; // in ms
  };
}

export interface AIFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis?: string;
}

export interface AppSettings {
  gemini: {
    apiKey: string;
    model: string;
  };
  preferences: {
    questionsPerBatch: number;
    showExplanations: boolean;
    autoAdvance: boolean;
    hapticsEnabled: boolean;
    animationsIntensity: 'off' | 'low' | 'normal' | 'high';
    reducedMotion: boolean;
    immersionLevel: 'beginner' | 'intermediate' | 'advanced';
    colorIntensity: 'subtle' | 'vibrant';
  };
  theme: 'light' | 'dark' | 'system';
}
