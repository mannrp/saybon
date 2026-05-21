// Saybon v2 — Tactile Haptic Vibration Feedback Utility
// Uses React Native's built-in Vibration engine to trigger
// fine-tuned sensory patterns offline for correct, incorrect, and interactive states.

import { Vibration, Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

// Micro-patterns for cross-platform subtle sensory design
const PATTERNS = {
  // A tiny, crisp tick
  selection: Platform.select({
    ios: [0, 4],
    android: [0, 8],
    default: [0, 5],
  }),

  // Double warm pulse for correct validations
  success: Platform.select({
    ios: [0, 10, 60, 12],
    android: [0, 15, 50, 20],
    default: [0, 12, 50, 15],
  }),

  // Triple sharp warning rumble for incorrect entries
  error: Platform.select({
    ios: [0, 60, 40, 60, 40, 80],
    android: [0, 80, 50, 80, 50, 100],
    default: [0, 70, 45, 70, 45, 90],
  }),
};

/**
 * Triggers a custom vibration sequence if haptics are enabled in preferences
 */
export function triggerHaptic(type: keyof typeof PATTERNS) {
  const preferences = useSettingsStore.getState().preferences;
  const isEnabled = preferences?.hapticsEnabled ?? true;

  if (isEnabled) {
    const pattern = PATTERNS[type];
    Vibration.vibrate(pattern, false);
  }
}
