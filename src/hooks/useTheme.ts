import { useState, useEffect, useCallback } from 'react';
import { settingsStorage } from '../utils/storage';
import type { ThemePreference } from '../types';

type ResolvedTheme = 'light' | 'dark';

interface UseThemeReturn {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

/**
 * Detects the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  } catch {
    // matchMedia not supported in older browsers
    return 'light';
  }
}

/**
 * Resolves the actual theme to apply based on preference
 */
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Applies the theme to the document
 */
function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Hook for managing theme state with persistence to IndexedDB
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Load saved theme preference on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const settings = await settingsStorage.get();
        const savedTheme = settings?.theme ?? 'system';
        setThemeState(savedTheme);
        const resolved = resolveTheme(savedTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
      } catch {
        // Fallback to system preference if storage fails
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    }
    loadTheme();
  }, []);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    function handleChange(e: MediaQueryListEvent) {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Persist to IndexedDB
    try {
      const currentSettings = await settingsStorage.get();
      await settingsStorage.update({
        ...getDefaultSettings(),
        ...currentSettings,
        theme: newTheme,
      });
    } catch (error) {
      console.error('Failed to persist theme preference:', error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme: ThemePreference = resolvedTheme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

/**
 * Returns default app settings
 */
function getDefaultSettings() {
  return {
    aiProvider: 'gemini' as const,
    gemini: {
      apiKey: '',
      model: 'gemini-2.0-flash',
    },
    preferences: {
      questionsPerBatch: 5,
      showExplanations: true,
      autoAdvance: false,
      soundEffects: true,
    },
    privacy: {
      shareAnonymousData: false,
    },
    theme: 'system' as ThemePreference,
  };
}

/**
 * Standalone function to get theme from storage (for use outside React)
 */
export async function getStoredTheme(): Promise<ThemePreference> {
  try {
    const settings = await settingsStorage.get();
    return settings?.theme ?? 'system';
  } catch {
    return 'system';
  }
}

/**
 * Standalone function to save theme to storage (for use outside React)
 */
export async function saveTheme(theme: ThemePreference): Promise<void> {
  const currentSettings = await settingsStorage.get();
  await settingsStorage.update({
    ...getDefaultSettings(),
    ...currentSettings,
    theme,
  });
}
