// Saybon v2 — Zustand Settings Store (MMKV Backed)
import { create } from 'zustand';
import { mmkvStorage } from '../db/database';
import type { AppSettings } from '../content/schema';

// Default App Settings System
const DEFAULT_SETTINGS: AppSettings = {
  gemini: {
    apiKey: '',
    model: 'gemini-1.5-flash',
  },
  preferences: {
    questionsPerBatch: 5,
    showExplanations: true,
    autoAdvance: true,
    hapticsEnabled: true,
    animationsIntensity: 'normal',
    reducedMotion: false,
    immersionLevel: 'beginner',
    colorIntensity: 'vibrant',
  },
  theme: 'system',
};

const SETTINGS_KEY = 'saybon_app_settings_v2';

interface SettingsStore extends AppSettings {
  setGeminiApiKey: (apiKey: string) => void;
  setGeminiModel: (model: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updatePreference: <K extends keyof AppSettings['preferences']>(
    key: K,
    value: AppSettings['preferences'][K]
  ) => void;
  resetSettings: () => void;
}

// Synchronous loading of initial settings from MMKV
const getInitialSettings = (): AppSettings => {
  const stored = mmkvStorage.getString(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(stored);
    return {
      gemini: { ...DEFAULT_SETTINGS.gemini, ...parsed.gemini },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...parsed.preferences },
      theme: parsed.theme || DEFAULT_SETTINGS.theme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettingsToMMKV = (settings: AppSettings) => {
  mmkvStorage.set(SETTINGS_KEY, JSON.stringify(settings));
};

export const useSettingsStore = create<SettingsStore>((set) => {
  const initial = getInitialSettings();

  return {
    ...initial,

    setGeminiApiKey: (apiKey) =>
      set((state) => {
        const next = {
          ...state,
          gemini: { ...state.gemini, apiKey },
        };
        saveSettingsToMMKV(next);
        return next;
      }),

    setGeminiModel: (model) =>
      set((state) => {
        const next = {
          ...state,
          gemini: { ...state.gemini, model },
        };
        saveSettingsToMMKV(next);
        return next;
      }),

    setTheme: (theme) =>
      set((state) => {
        const next = {
          ...state,
          theme,
        };
        saveSettingsToMMKV(next);
        return next;
      }),

    updatePreference: (key, value) =>
      set((state) => {
        const next = {
          ...state,
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        };
        saveSettingsToMMKV(next);
        return next;
      }),

    resetSettings: () =>
      set(() => {
        saveSettingsToMMKV(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }),
  };
});
