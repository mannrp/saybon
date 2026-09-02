// SayBon — TEF Rationale Sheet
// Shows why the correct answer is right AND why the chosen wrong answer is
// wrong. Per TEF_MODE_DESIGN.md §3.3, this is the differentiating feature —
// every free TEF app stops at "here's the right answer"; this is the one
// moment where the drill actually teaches something.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import type { TefItem } from '../data/itemSchema';

interface RationaleSheetProps {
  item: TefItem;
  chosenOptionId: string | null;
  correct: boolean;
}

export function RationaleSheet({ item, chosenOptionId, correct }: RationaleSheetProps) {
  const { theme } = useAppTheme();
  const chosenText = item.options.find((o) => o.id === chosenOptionId)?.text;
  const distractorNote =
    !correct && chosenOptionId ? item.distractorRationales[chosenOptionId] : null;

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: theme.surface,
          borderColor: correct ? theme.success : theme.error,
        },
      ]}
    >
      <Text
        style={[
          styles.verdict,
          { color: correct ? theme.success : theme.error },
        ]}
      >
        {correct ? 'Correct' : 'Not quite'}
      </Text>

      {!correct && chosenText && (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: theme.textMuted }]}>
            Why "{chosenText}" is wrong
          </Text>
          <Text style={[styles.blockBody, { color: theme.text }]}>{distractorNote}</Text>
        </View>
      )}

      <View style={styles.block}>
        <Text style={[styles.blockLabel, { color: theme.textMuted }]}>Why the answer is right</Text>
        <Text style={[styles.blockBody, { color: theme.text }]}>{item.rationale}</Text>
      </View>

      {item.skillTags.length > 0 && (
        <View style={styles.tagRow}>
          {item.skillTags.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, { backgroundColor: theme.surfaceContainer }]}
            >
              <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  verdict: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  block: {
    marginBottom: SPACING.sm,
  },
  blockLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  blockBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tagChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
});
