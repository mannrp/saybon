import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, COLORS } from '../../theme/tokens';

export function CuratedTodayHero() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.curatedCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <Text style={[styles.curatedBadge, { color: theme.primary }]}>
        CURATED TODAY
      </Text>
      <Text style={[styles.curatedTitle, { color: theme.text }]}>
        The Art of Precision:{'\n'}
        <Text style={styles.serifItalicBold}>C’est vs Il est</Text>
      </Text>
      <Text style={[styles.curatedDesc, { color: theme.textMuted }]}>
        A definitive guide to mastering the subtle shift between identification and description. Explore the historical divergence of these two pillars of French syntax.
      </Text>

      {/* Minimalist spiral graphic mockup */}
      <View style={[styles.curatedGraphic, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.graphicText, { color: theme.primary, opacity: 0.15 }]}>
          ◈ L'Atelier de Structure
        </Text>
      </View>

      <Pressable style={styles.deepDiveLink}>
        <Text style={[styles.deepDiveText, { color: theme.primary }]}>
          READ THE DEEP DIVE  ➔
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  curatedCard: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    marginBottom: SPACING.xl,
  },
  curatedBadge: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  curatedTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  serifItalicBold: {
    fontStyle: 'italic',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  curatedDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  curatedGraphic: {
    height: 120,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  graphicText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 14,
    fontStyle: 'italic',
  },
  deepDiveLink: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.primary,
    alignSelf: 'flex-start',
    paddingBottom: 2,
  },
  deepDiveText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
});
