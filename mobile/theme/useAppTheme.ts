import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { COLORS } from './tokens';

/**
 * Custom React hook that returns the active theme tokens and mode flag
 * strictly respecting the MMKV-backed Zustand Settings store user preference.
 */
export function useAppTheme() {
  const systemColorScheme = useColorScheme();
  const userThemePreference = useSettingsStore((state) => state.theme);

  const isDarkMode = 
    userThemePreference === 'system'
      ? systemColorScheme === 'dark'
      : userThemePreference === 'dark';

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return { isDarkMode, theme };
}
