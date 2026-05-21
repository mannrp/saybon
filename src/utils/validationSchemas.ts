import { z } from 'zod';
import type { Exercise, AIFeedback } from '../types';

export const CEFRLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const ExerciseTypeSchema = z.enum([
  'conjugation',
  'fill-blank',
  'translation',
  'vocabulary',
  'grammar'
]);

export const ExerciseSchema = z.object({
  id: z.string().optional(),
  type: ExerciseTypeSchema,
  level: CEFRLevelSchema,
  question: z.string(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  acceptableAnswers: z.array(z.string()).default([]),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  metadata: z.object({
    topic: z.string().default('vocabulary'),
    difficulty: z.number().default(3),
    createdAt: z.string().optional(),
    source: z.string().default('ai-generated')
  }).passthrough()
}).passthrough();

export const ExercisesResponseSchema = z.object({
  exercises: z.array(ExerciseSchema)
}).passthrough();

export const VocabularyItemSchema = z.object({
  english: z.string(),
  french: z.string(),
  topic: z.string().default('vocabulary'),
  difficulty: z.number().default(3)
}).passthrough();

export const VocabularyResponseSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema)
}).passthrough();

export const ConjugationItemSchema = z.object({
  verb: z.string(),
  tense: z.string(),
  person: z.string(),
  answer: z.string(),
  topic: z.string().default('conjugation'),
  difficulty: z.number().default(3)
}).passthrough();

export const ConjugationResponseSchema = z.object({
  conjugations: z.array(ConjugationItemSchema)
}).passthrough();

export const AIFeedbackSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  detailedAnalysis: z.string().default('')
}).passthrough();

/**
 * Safe parsers with runtime recovery options
 */
export function safeParseExercises(jsonText: string): { exercises: Exercise[] } {
  try {
    const raw = JSON.parse(jsonText);
    const parsed = ExercisesResponseSchema.parse(raw);
    return parsed as { exercises: Exercise[] };
  } catch (error) {
    console.error('Zod exercise parsing failed:', error, jsonText);
    throw new Error('AI exercise response failed validation check');
  }
}

export function safeParseVocabulary(jsonText: string): z.infer<typeof VocabularyResponseSchema> {
  try {
    const raw = JSON.parse(jsonText);
    return VocabularyResponseSchema.parse(raw);
  } catch (error) {
    console.error('Zod vocabulary parsing failed:', error, jsonText);
    throw new Error('AI vocabulary response failed validation check');
  }
}

export function safeParseConjugation(jsonText: string): z.infer<typeof ConjugationResponseSchema> {
  try {
    const raw = JSON.parse(jsonText);
    return ConjugationResponseSchema.parse(raw);
  } catch (error) {
    console.error('Zod conjugation parsing failed:', error, jsonText);
    throw new Error('AI conjugation response failed validation check');
  }
}

export function safeParseAnalysis(jsonText: string): AIFeedback {
  try {
    const raw = JSON.parse(jsonText);
    return AIFeedbackSchema.parse(raw) as AIFeedback;
  } catch (error) {
    console.error('Zod analysis parsing failed:', error, jsonText);
    return {
      strengths: [],
      weaknesses: [],
      recommendations: ['Unable to validate AI feedback schema. Please try again.'],
      detailedAnalysis: 'Analysis could not be completed.'
    };
  }
}
