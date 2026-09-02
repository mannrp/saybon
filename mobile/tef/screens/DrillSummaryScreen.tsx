// SayBon — TEF Drill Summary
// Accuracy, per-skill breakdown, median response time, one named next
// action — per TEF_MODE_DESIGN.md §5.3: "one action, not a menu."

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import type { TefStackParamList } from '../navigation/TefNavigator';

type Props = NativeStackScreenProps<TefStackParamList, 'DrillSummary'>;

export function DrillSummaryScreen({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const { summary } = route.params;

  const skillEntries = Object.entries(summary.perSkillTag).sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.headline, { color: theme.text }]}>
        {Math.round(summary.accuracy * 100)}%
      </Text>
      <Text style={[styles.subline, { color: theme.textMuted }]}>
        {summary.correctCount} of {summary.totalItems} correct · median{' '}
        {(summary.medianResponseMs / 1000).toFixed(1)}s per item
      </Text>

      {skillEntries.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>By skill</Text>
          {skillEntries.map(([tag, s]) => (
            <View key={tag} style={styles.skillRow}>
              <Text style={[styles.skillTag, { color: theme.text }]}>{tag}</Text>
              <Text style={[styles.skillScore, { color: theme.textMuted }]}>
                {s.correct}/{s.total}
              </Text>
            </View>
          ))}
        </View>
      )}

      {summary.weakestTag && (
        <View
          style={[
            styles.nextActionCard,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.nextActionLabel, { color: theme.textMuted }]}>NEXT UP</Text>
          <Text style={[styles.nextActionBody, { color: theme.text }]}>
            Your weakest tag is{' '}
            <Text style={{ fontWeight: TYPOGRAPHY.fontWeight.bold }}>{summary.weakestTag.tag}</Text>{' '}
            ({Math.round(summary.weakestTag.accuracy * 100)}% correct). The next drill will
            prioritize it.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => navigation.replace('DrillSetup')}
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Another drill</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.popToTop()}
        style={[styles.secondaryButton, { borderColor: theme.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  headline: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.display,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  subline: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  skillTag: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  skillScore: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  nextActionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  nextActionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
  },
  nextActionBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});
