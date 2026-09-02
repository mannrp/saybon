// SayBon — TEF Item & Stimulus Schemas
// Shared verbatim between the app (tef/data/tefDb.ts) and the dev-machine
// content pipeline (scripts/tef/generateItems.ts, validateItems.ts). Do not
// fork this file — the generator and the app must agree on shape exactly.

import { z } from 'zod';
import { ALL_SKILL_TAGS } from './skillTags';
import { MAX_NCLC, MIN_NCLC } from './nclcScale';

export const TEF_MODULES = ['CE', 'CO', 'EE'] as const;
export type TefModule = (typeof TEF_MODULES)[number];

export const TEF_ITEM_TYPES = [
  'doc-match', // short practical doc (ad, notice, email) + 1 MCQ
  'passage-mcq', // 150-300 word text + several MCQs
  'gap-fill', // grammar/lexis in context, 4 options
  'text-order', // reorder sentences into a coherent text
  'register-match', // pick the phrase fitting situation/register
  'audio-mcq', // CO — inert until audioAssetId is populated
] as const;
export type TefItemType = (typeof TEF_ITEM_TYPES)[number];

export const STIMULUS_KINDS = [
  'article',
  'ad',
  'email',
  'notice',
  'dialogue',
  'announcement',
] as const;
export type StimulusKind = (typeof STIMULUS_KINDS)[number];

export const REVIEW_STATUSES = [
  'generated',
  'auto-validated',
  'human-reviewed',
  'flagged',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const skillTagSchema = z.enum(ALL_SKILL_TAGS as unknown as [string, ...string[]]);

const nclcBandSchema = z.number().int().min(MIN_NCLC).max(MAX_NCLC);

export const tefStimulusSchema = z.object({
  id: z.string().min(1),
  module: z.enum(TEF_MODULES),
  kind: z.enum(STIMULUS_KINDS),
  title: z.string().nullable(),
  body: z.string().min(1), // for CO this is the transcript
  wordCount: z.number().int().positive(),
  audioAssetId: z.string().nullable(), // CO-ready, null today
  targetBand: nclcBandSchema,
  sourceModel: z.string().min(1),
  reviewStatus: z.enum(REVIEW_STATUSES),
});
export type TefStimulus = z.infer<typeof tefStimulusSchema>;

export const tefOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export type TefOption = z.infer<typeof tefOptionSchema>;

export const tefItemSchema = z.object({
  id: z.string().min(1), // e.g. 'ce-gapfill-0001'
  module: z.enum(TEF_MODULES),
  itemType: z.enum(TEF_ITEM_TYPES),
  stimulusId: z.string().nullable(), // null for standalone gap-fills
  prompt: z.string().min(1),
  options: z.array(tefOptionSchema).min(2),
  correctOptionId: z.string().min(1),
  rationale: z.string().min(1), // why the key is right, citing the text
  distractorRationales: z.record(z.string(), z.string()), // why each other option is wrong
  skillTags: z.array(skillTagSchema).min(1),
  targetBand: nclcBandSchema,
  sourceModel: z.string().min(1),
  reviewStatus: z.enum(REVIEW_STATUSES),
});
export type TefItem = z.infer<typeof tefItemSchema>;

export const tefWritingPromptSchema = z.object({
  id: z.string().min(1),
  section: z.enum(['A', 'B']), // A = fait divers, B = opinion
  brief: z.string().min(1),
  leadIn: z.string().nullable(), // Section A supplies the article opening
  minWords: z.number().int().positive(), // A: 80, B: 200
  suggestedMinutes: z.number().int().positive(), // A: 20, B: 40
  targetBand: nclcBandSchema,
});
export type TefWritingPrompt = z.infer<typeof tefWritingPromptSchema>;

export const tefResponseSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  chosenOptionId: z.string().nullable(), // null = timed out / skipped
  correct: z.boolean(),
  elapsedMs: z.number().int().nonnegative(),
  sessionId: z.string().min(1),
  answeredAt: z.number().int().positive(),
});
export type TefResponse = z.infer<typeof tefResponseSchema>;

export const tefEssaySchema = z.object({
  id: z.string().min(1),
  promptId: z.string().min(1),
  body: z.string(),
  wordCount: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  offlineReport: z.string().nullable(), // JSON, see tef/scoring/writingReport.ts
  aiFeedback: z.string().nullable(), // JSON, null unless BYOK grading ran
  submittedAt: z.number().int().positive(),
});
export type TefEssay = z.infer<typeof tefEssaySchema>;
