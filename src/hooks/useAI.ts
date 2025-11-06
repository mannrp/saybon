// Hook for managing AI provider initialization and operations
import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, GenerationParams, Exercise } from '../types';
import type { AIProvider } from '../providers/AIProvider.interface';
import { GeminiProvider } from '../providers/GeminiProvider';

export function useAI(settings: AppSettings) {
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize provider when settings change
  useEffect(() => {
    async function initializeProvider() {
      try {
        setIsReady(false);
        setError(null);

        // MVP: Only Gemini support
        if (!settings.gemini.apiKey) {
          setProvider(null);
          return;
        }

        const geminiProvider = new GeminiProvider({
          apiKey: settings.gemini.apiKey,
          model: settings.gemini.model,
        });

        setProvider(geminiProvider);
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize AI provider:', err);
        setError('Failed to initialize AI provider');
        setProvider(null);
      }
    }

    initializeProvider();
  }, [settings.gemini.apiKey, settings.gemini.model]);

  // Generate exercises
  const generateExercises = useCallback(
    async (params: GenerationParams): Promise<Exercise[]> => {
      if (!provider) {
        throw new Error('AI provider not initialized');
      }

      try {
        setError(null);
        const exercises = await provider.generateExercises(params);
        return exercises;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate exercises';
        setError(errorMessage);
        throw err;
      }
    },
    [provider]
  );

  // Test connection to AI provider
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!provider) {
      return false;
    }

    try {
      setError(null);
      const result = await provider.testConnection();
      if (!result) {
        setError('Connection test failed');
      }
      return result;
    } catch (err) {
      console.error('Connection test error:', err);
      setError('Connection test failed');
      return false;
    }
  }, [provider]);

  return {
    provider,
    isReady,
    error,
    generateExercises,
    testConnection,
  };
}
