// Saybon v2 — Configuration / Settings Screen Component
// Connects directly to our Zustand MMKV useSettingsStore to configure study params and Gemini API.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { useAppTheme } from '../theme/useAppTheme';

type SettingsModalProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsModal({ navigation }: SettingsModalProps) {
  const { isDarkMode, theme } = useAppTheme();

  // Store variables via granular selectors
  const storeTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const preferences = useSettingsStore((s) => s.preferences);
  const updatePreference = useSettingsStore((s) => s.updatePreference);
  const gemini = useSettingsStore((s) => s.gemini);
  const setGeminiApiKey = useSettingsStore((s) => s.setGeminiApiKey);
  const setGeminiModel = useSettingsStore((s) => s.setGeminiModel);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  // Local state for api key to avoid writing on every keystroke
  const [apiKeyLocal, setApiKeyLocal] = useState(gemini.apiKey);

  useEffect(() => {
    setApiKeyLocal(gemini.apiKey);
  }, [gemini.apiKey]);

  // Save local API key on blur
  const handleApiKeyBlur = () => {
    setGeminiApiKey(apiKeyLocal);
  };

  const batchSizes = [5, 10, 15, 20];
  const themes = ['light', 'dark', 'system'] as const;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Settings Header */}
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>Configuration</Text>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.closeIcon, { color: theme.textMuted }]}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>THÈME DE L'ATELIER</Text>
          <View style={styles.buttonGroup}>
            {themes.map((t) => {
              const isActive = storeTheme === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.groupBtn,
                    { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setTheme(t)}
                >
                  <Text
                    style={[
                      styles.groupBtnText,
                      { color: isActive ? COLORS.light.background : theme.textMuted },
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>PRÉFÉRENCES DE SESSION</Text>

          {/* Questions count */}
          <View style={styles.prefItem}>
            <View>
              <Text style={[styles.prefTitle, { color: theme.text }]}>Taille du lot</Text>
              <Text style={[styles.prefSub, { color: theme.textMuted }]}>Nombre de concepts par séance</Text>
            </View>
            <View style={styles.miniGroup}>
              {batchSizes.map((size) => {
                const isActive = preferences.questionsPerBatch === size;
                return (
                  <Pressable
                    key={size}
                    style={[
                      styles.miniBtn,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => updatePreference('questionsPerBatch', size)}
                  >
                    <Text
                      style={[
                        styles.miniBtnText,
                        { color: isActive ? COLORS.light.background : theme.textMuted },
                      ]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Explanations Toggle */}
          <View style={[styles.toggleItem, { borderBottomColor: theme.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.prefTitle, { color: theme.text }]}>Explications grammaticales</Text>
              <Text style={[styles.prefSub, { color: theme.textMuted }]}>Afficher la décomposition détaillée</Text>
            </View>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : theme.background}
              value={preferences.showExplanations}
              onValueChange={(val) => updatePreference('showExplanations', val)}
            />
          </View>

          {/* Auto Advance Toggle */}
          <View style={[styles.toggleItem, { borderBottomColor: theme.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.prefTitle, { color: theme.text }]}>Avancement automatique</Text>
              <Text style={[styles.prefSub, { color: theme.textMuted }]}>Passer au concept suivant après validation</Text>
            </View>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : theme.background}
              value={preferences.autoAdvance}
              onValueChange={(val) => updatePreference('autoAdvance', val)}
            />
          </View>

          {/* Haptics Toggle */}
          <View style={[styles.toggleItem, { borderBottomColor: theme.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.prefTitle, { color: theme.text }]}>Retours haptiques</Text>
              <Text style={[styles.prefSub, { color: theme.textMuted }]}>Vibrations tactiles lors des interactions</Text>
            </View>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : theme.background}
              value={preferences.hapticsEnabled}
              onValueChange={(val) => updatePreference('hapticsEnabled', val)}
            />
          </View>
        </View>

        {/* Gemini Config Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>OFFLINE COGNITION (GEMINI)</Text>
          <Text style={[styles.cognitionDesc, { color: theme.textMuted }]}>
            SayBon executes locally. Configure an optional API key to generate contextual grammar drill remixes when offline buffers deplete.
          </Text>

          {/* API Key field */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Clé API Gemini</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
              placeholder="AIzaSy..."
              placeholderTextColor={theme.textMuted + '88'}
              value={apiKeyLocal}
              onChangeText={setApiKeyLocal}
              onBlur={handleApiKeyBlur}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Model Selection */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Modèle</Text>
            <View style={styles.buttonGroup}>
              {['gemini-1.5-flash', 'gemini-1.5-pro'].map((m) => {
                const isActive = gemini.model === m;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.groupBtn,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setGeminiModel(m)}
                  >
                    <Text
                      style={[
                        styles.groupBtnText,
                        { color: isActive ? COLORS.light.background : theme.textMuted },
                      ]}
                    >
                      {m.replace('gemini-1.5-', '').toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Reset settings button */}
        <Pressable
          style={[styles.resetBtn, { borderColor: theme.error }]}
          onPress={() => {
            resetSettings();
            setApiKeyLocal('');
          }}
        >
          <Text style={[styles.resetBtnText, { color: theme.error }]}>RÉINITIALISER LES PARAMÈTRES</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  sheetTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 18,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  groupBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  prefTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  prefSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    marginTop: 2,
  },
  miniGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  miniBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  toggleText: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  cognitionDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
    gap: 6,
  },
  inputLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  textInput: {
    width: '100%',
    height: 42,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
  },
  resetBtn: {
    height: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resetBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
});
