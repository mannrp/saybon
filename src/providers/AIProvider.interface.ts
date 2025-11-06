// AI Provider interface for exercise generation
import type { Exercise, GenerationParams, AIFeedback, UserAnswer } from '../types';

export interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateExercises(params: GenerationParams): Promise<Exercise[]>;
  analyzeBatch?(answers: UserAnswer[]): Promise<AIFeedback>; // Optional for MVP
}
