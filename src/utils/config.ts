import type { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'gemini',
  gemini: {
    apiKey: '',
    model: 'gemini-2.5-flash-lite',
  },
  preferences: {
    questionsPerBatch: 10,
    showExplanations: true,
    autoAdvance: false,
    soundEffects: true,
  },
  privacy: {
    shareAnonymousData: false,
  },
  theme: 'system',
};
