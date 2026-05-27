import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';

export function WordAnatomySection() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.anatomyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.anatomyLabel, { color: theme.textMuted }]}>WORD ANATOMY</Text>
      
      <View style={styles.anatomyCore}>
        <Text style={[styles.anatomyWord, { color: theme.primary }]}>Bienveillance</Text>
        <View style={styles.decompositionRow}>
          <View style={[styles.partBubble, { borderColor: theme.border }]}>
            <Text style={[styles.partText, { color: theme.textMuted }]}>BIEN-</Text>
          </View>
          <View style={[styles.partBubble, { borderColor: theme.border }]}>
            <Text style={[styles.partText, { color: theme.textMuted }]}>-VEILLANCE</Text>
          </View>
        </View>
      </View>

      <View style={styles.anatomyDetails}>
        <Text style={[styles.anatomyRootText, { color: theme.text }]}>
          From Latin <Text style={styles.serifItalic}>benevolentia</Text> (well-wishing).
        </Text>
        <Text style={[styles.anatomyExplainText, { color: theme.textMuted }]}>
          Tracing the transformation of 'care' from a medieval courtly virtue to a pillar of modern social ethics.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anatomyCard: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    marginBottom: SPACING.xl,
  },
  anatomyLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  anatomyCore: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  anatomyWord: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    letterSpacing: -1,
  },
  decompositionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  partBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  partText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  anatomyDetails: {
    alignItems: 'center',
    gap: 4,
  },
  anatomyRootText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
  },
  serifItalic: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  anatomyExplainText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
