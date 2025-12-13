import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { getStoredTheme, saveTheme } from './useTheme';
import type { ThemePreference } from '../types';

/**
 * **Feature: vocabulary-heatmap, Property 6: Theme Persistence Round-Trip**
 * **Validates: Requirements 7.3**
 * 
 * *For any* theme preference stored ('light', 'dark', 'system'), 
 * retrieving settings SHALL return the same theme value.
 */

// Mock IndexedDB for testing
const mockStorage: { theme?: ThemePreference } = {};

vi.mock('../utils/storage', () => ({
  settingsStorage: {
    get: vi.fn(async () => {
      if (mockStorage.theme === undefined) return undefined;
      return { theme: mockStorage.theme };
    }),
    update: vi.fn(async (settings: { theme: ThemePreference }) => {
      mockStorage.theme = settings.theme;
    }),
  },
}));

// Arbitrary for ThemePreference
const themePreferenceArb = fc.constantFrom<ThemePreference>('light', 'dark', 'system');

describe('Theme Persistence', () => {
  beforeEach(() => {
    // Reset mock storage before each test
    mockStorage.theme = undefined;
  });

  /**
   * Property 6: Theme Persistence Round-Trip
   * For any theme preference stored ('light', 'dark', 'system'),
   * retrieving settings SHALL return the same theme value.
   */
  it('Property 6: Theme Persistence Round-Trip - stored theme equals retrieved theme', async () => {
    await fc.assert(
      fc.asyncProperty(themePreferenceArb, async (theme) => {
        // Store the theme
        await saveTheme(theme);
        
        // Retrieve the theme
        const retrievedTheme = await getStoredTheme();
        
        // The retrieved theme should equal the stored theme
        expect(retrievedTheme).toBe(theme);
      }),
      { numRuns: 100 }
    );
  });

  it('should return system as default when no theme is stored', async () => {
    const theme = await getStoredTheme();
    expect(theme).toBe('system');
  });

  it('should persist light theme correctly', async () => {
    await saveTheme('light');
    const theme = await getStoredTheme();
    expect(theme).toBe('light');
  });

  it('should persist dark theme correctly', async () => {
    await saveTheme('dark');
    const theme = await getStoredTheme();
    expect(theme).toBe('dark');
  });

  it('should persist system theme correctly', async () => {
    await saveTheme('system');
    const theme = await getStoredTheme();
    expect(theme).toBe('system');
  });
});
