// Core type definitions for Rapide French Practice App

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExerciseType = 
  | 'conjugation'
  | 'fill-blank'
  | 'translation'
  | 'vocabulary'
  | 'grammar';

export type AIProviderType = 'gemini' | 'ollama' | 'custom';

// Placeholder interfaces - will be expanded in later tasks
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

export interface UserAnswer {
  exerciseId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: string;
}

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
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis?: string;
}

export interface AppSettings {
  aiProvider: 'gemini'; // MVP: Only Gemini support
  gemini: {
    apiKey: string;
    model: string;
  };
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

export interface GenerationParams {
  level: CEFRLevel;
  type: ExerciseType;
  count: number;
  topic?: string;
}

export interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback>;
}
