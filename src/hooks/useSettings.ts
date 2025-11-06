// Hook for managing app settings with IndexedDB persistence
import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types';
import { settingsStorage } from '../utils/storage';

// Default settings for MVP (Gemini only)
const DEFAULT_SETTINGS: AppSettings = {
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
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from IndexedDB on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const stored = await settingsStorage.get();
        if (stored) {
          setSettings(stored);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Save settings to IndexedDB
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await settingsStorage.update(newSettings);
      setSettings(newSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
      throw err;
    }
  }, []);

  // Update API key for Gemini
  const setAPIKey = useCallback(
    async (apiKey: string) => {
      const newSettings: AppSettings = {
        ...settings,
        gemini: {
          ...settings.gemini,
          apiKey,
        },
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Check if configuration is valid (has API key)
  const hasValidConfig = useCallback((): boolean => {
    return settings.gemini.apiKey.trim().length > 0;
  }, [settings]);

  // Update preferences
  const updatePreferences = useCallback(
    async (preferences: Partial<AppSettings['preferences']>) => {
      const newSettings: AppSettings = {
        ...settings,
        preferences: {
          ...settings.preferences,
          ...preferences,
        },
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    setAPIKey,
    hasValidConfig,
    updatePreferences,
  };
}
