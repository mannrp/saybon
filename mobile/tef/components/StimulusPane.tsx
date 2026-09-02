// SayBon — TEF Stimulus Pane
// Renders the passage/document/transcript a question refers to, persisting
// on screen while its questions are answered (TEF_MODE_DESIGN.md §3.1 — the
// reason stimulus and item are separate tables in the first place).

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import type { TefStimulus } from '../data/itemSchema';

const KIND_LABEL: Record<TefStimulus['kind'], string> = {
  article: 'ARTICLE',
  ad: 'PETITE ANNONCE',
  email: 'COURRIEL',
  notice: 'AVIS',
  dialogue: 'DIALOGUE (AUDIO NON DISPONIBLE)',
  announcement: 'ANNONCE (AUDIO NON DISPONIBLE)',
};

export function StimulusPane({ stimulus }: { stimulus: TefStimulus }) {
  const { theme } = useAppTheme();
  const isAudio = stimulus.module === 'CO';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.kindLabel, { color: theme.textMuted }]}>
        {KIND_LABEL[stimulus.kind]}
      </Text>
      {stimulus.title && (
        <Text style={[styles.title, { color: theme.text }]}>{stimulus.title}</Text>
      )}
      {isAudio && !stimulus.audioAssetId && (
        <View style={[styles.audioNotice, { borderColor: theme.border }]}>
          <Text style={[styles.audioNoticeText, { color: theme.textMuted }]}>
            No audio recorded yet — reading the transcript below instead.
          </Text>
        </View>
      )}
      <ScrollView style={styles.bodyScroll} nestedScrollEnabled>
        <Text style={[styles.body, { color: theme.text }]}>{stimulus.body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    maxHeight: 260,
  },
  kindLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginBottom: SPACING.sm,
  },
  audioNotice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  audioNoticeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  body: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
});
