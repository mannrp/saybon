// Saybon v2 — Concept Explorer & Deep Dive Overlay
// A breathtaking editorial explorer sheet presenting grammatical structures,
// contextual sentence cards, morphological roots, and Québec-specific cultural notes.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/tokens';
import type { ConceptNode } from '../../core/content/schema';
import { useProgressStore } from '../../core/store/useProgressStore';

interface ConceptExplorerProps {
  conceptId: string;
  onClose: () => void;
  onStartPractice: () => void;
}

export function ConceptExplorer({
  conceptId,
  onClose,
  onStartPractice,
}: ConceptExplorerProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const concepts = useProgressStore((s) => s.concepts);
  const progress = useProgressStore((s) => s.progress);

  const concept = useMemo(
    () => concepts.find((c) => c.id === conceptId),
    [concepts, conceptId]
  );

  const nodeProgress = useMemo(() => progress[conceptId], [progress, conceptId]);

  if (!concept) return null;

  // Custom visual mappings for parts of speech
  const conceptTypeLabel =
    concept.type === 'fia'
      ? 'Fait au Québec'
      : concept.type.toUpperCase();

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(22).stiffness(160)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.explorerSheet,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          paddingBottom: insets.bottom + SPACING.lg,
        },
      ]}
    >
      {/* Editorial Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.typeBadge, { color: theme.textMuted }]}>
            {conceptTypeLabel} • {concept.level}
          </Text>
          <Text
            style={[
              styles.serifWord,
              { color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
            ]}
          >
            {concept.french}
          </Text>
        </View>
        <Pressable
          style={[styles.closeIconBg, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
          onPress={onClose}
        >
          <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
        {/* Core meaning block */}
        <View style={styles.meaningSection}>
          <Text style={[styles.meaningLabel, { color: theme.textMuted }]}>SIGNIFICATION</Text>
          <Text style={[styles.meaningText, { color: theme.text }]}>{concept.english}</Text>
          {concept.gender && (
            <Text style={[styles.genderTag, { color: theme.accent, backgroundColor: theme.accent + '15' }]}>
              NOM {concept.gender === 'M' ? 'MASCULIN (un/le)' : 'FÉMININ (une/la)'}
            </Text>
          )}
        </View>

        {/* Québec Specific Cultural Context nuance card */}
        {concept.culturalContext && (
          <View
            style={[
              styles.cultureCard,
              {
                backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2F6',
                borderColor: isDarkMode ? '#312E81' : '#CBD5E1',
              },
            ]}
          >
            <View style={styles.cultureHeader}>
              <Text style={styles.cultureTitle}>USAGE QUÉBÉCOIS ⚜️</Text>
            </View>
            <Text style={[styles.cultureBody, { color: theme.text }]}>
              {concept.culturalContext}
            </Text>
          </View>
        )}

        {/* Morphology breakdown section */}
        {concept.morphology && concept.morphology.decomposition && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MORPHOLOGIE ET COMPOSANTS</Text>
            <View style={styles.morphologyRow}>
              {concept.morphology.decomposition.map((part, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.morphologyBubble,
                    { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.morphologyText, { color: theme.text }]}>{part}</Text>
                </View>
              ))}
            </View>
            {concept.morphology.root && (
              <Text style={[styles.morphologyRootText, { color: theme.textMuted }]}>
                Racine d'origine : <Text style={{ color: theme.text, fontWeight: 'bold' }}>{concept.morphology.root}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Contextual Examples section */}
        {concept.examples && concept.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PHRASES D'EXEMPLES</Text>
            {concept.examples.map((example, idx) => (
              <View
                key={idx}
                style={[
                  styles.exampleCard,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.exampleFrench, { color: theme.text }]}>
                  {example.french}
                </Text>
                <Text style={[styles.exampleEnglish, { color: theme.textMuted }]}>
                  {example.english}
                </Text>
                {example.explanation && (
                  <Text style={[styles.exampleExplanation, { color: theme.accent }]}>
                    Nuance : {example.explanation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Spaced repetition status tracking */}
        <View style={[styles.section, styles.srSection, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MÉTRIQUES SPATIALES</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {nodeProgress?.mastery ?? 0} / 5
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Maîtrise</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {nodeProgress?.streak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Série actuelle</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {nodeProgress?.attempts ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Entraînements</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.practiceButton, { backgroundColor: theme.text }]}
          onPress={onStartPractice}
        >
          <Text style={[styles.practiceButtonText, { color: theme.background }]}>
            Lancer l'entraînement →
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  explorerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderTopWidth: 1.5,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  typeBadge: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  serifWord: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '300',
  },
  scrollableContent: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  meaningSection: {
    marginVertical: SPACING.md,
  },
  meaningLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
  },
  meaningText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: 4,
  },
  genderTag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 2,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
  cultureCard: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  cultureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cultureTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.2,
    color: '#3B82F6',
  },
  cultureBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  morphologyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  morphologyBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
  },
  morphologyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  morphologyRootText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  exampleCard: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  exampleFrench: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: 22,
  },
  exampleEnglish: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  exampleExplanation: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  srSection: {
    borderTopWidth: 1,
    paddingTop: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  footer: {
    marginTop: SPACING.sm,
  },
  practiceButton: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  practiceButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
