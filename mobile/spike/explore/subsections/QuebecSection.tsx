import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';

export function QuebecSection() {
  const { theme } = useAppTheme();

  return (
    <View style={styles.quebecSection}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        QUÉBEC FRENCH
      </Text>

      <View style={styles.dualGrid}>
        {/* Vernacular Phrase Card */}
        <View style={[styles.slangCard, { backgroundColor: theme.secondaryContainer, borderColor: theme.border }]}>
          <View style={styles.slangCardHeader}>
            <Text style={[styles.slangIcon, { color: theme.primary }]}>◇</Text>
            <Text style={[styles.slangLabel, { color: theme.textMuted }]}>VERNACULAR</Text>
          </View>
          <Text style={[styles.slangTitle, { color: theme.text }]}>C'est le fun</Text>
          <Text style={[styles.slangSubtitle, { color: theme.textMuted }]}>
            Literal: It's the fun. Meaning: It's enjoyable.
          </Text>
          <View style={[styles.miniDivider, { backgroundColor: theme.border }]} />
          <Text style={[styles.slangBody, { color: theme.textMuted }]}>
            Used universally across the province, this phrase bridges the gap between English roots and French structure.
          </Text>
        </View>

        {/* Office culture Phrase Card */}
        <View style={[styles.slangCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <View style={styles.slangCardHeader}>
            <Text style={[styles.slangIcon, { color: theme.primary }]}>◈</Text>
            <Text style={[styles.slangLabel, { color: theme.textMuted }]}>OFFICE CULTURE</Text>
          </View>
          <Text style={[styles.slangTitle, { color: theme.text }]}>Fin de semaine</Text>
          <Text style={[styles.slangSubtitle, { color: theme.textMuted }]}>
            Quebec's preferred 'Weekend'.
          </Text>
          <View style={[styles.miniDivider, { backgroundColor: theme.border }]} />
          <Text style={[styles.slangBody, { color: theme.textMuted }]}>
            A respectful nod to linguistic preservation in professional correspondence.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quebecSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.md,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  slangCard: {
    flex: 1,
    padding: SPACING.md + 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  slangCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  slangIcon: {
    fontSize: 16,
  },
  slangLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    opacity: 0.6,
  },
  slangTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 17,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: 2,
  },
  slangSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 14,
    marginBottom: SPACING.sm,
  },
  miniDivider: {
    height: 1,
    width: 32,
    marginVertical: SPACING.sm,
    opacity: 0.4,
  },
  slangBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
  },
});
