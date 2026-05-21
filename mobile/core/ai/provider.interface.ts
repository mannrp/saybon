import type { Exercise, UserAnswer, AIFeedback, CEFRLevel, ExerciseType } from '../content/schema';

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
  analyzeBatch(
    answers: UserAnswer[],
    exercises: Map<string, Exercise>
  ): Promise<AIFeedback>;
}
