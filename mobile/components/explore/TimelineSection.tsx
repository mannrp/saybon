import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';

export function TimelineSection() {
  const { theme } = useAppTheme();

  return (
    <View style={styles.timelineSection}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        TODAY I LEARNED
      </Text>

      <View style={styles.timelineContainer}>
        {/* Element 1 */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLineWrapper}>
            <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
            <View style={[styles.timelineVerticalLine, { backgroundColor: theme.border }]} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineNodeTitle, { color: theme.text }]}>
              Nuance in Negation
            </Text>
            <Text style={[styles.timelineNodeSub, { color: theme.textMuted }]}>
              "Ne pas" vs "Pas de"
            </Text>
            <Text style={[styles.timelineNodeBody, { color: theme.textMuted }]}>
              Discover how the omission of the article signifies a complete absence, a hallmark of formal Quebecois literature.
            </Text>
          </View>
        </View>

        {/* Element 2 */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLineWrapper}>
            <View style={[styles.timelineDot, { backgroundColor: theme.primaryContainer || theme.border }]} />
            {/* No line for the last element */}
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineNodeTitle, { color: theme.text }]}>
              The Silent 'E'
            </Text>
            <Text style={[styles.timelineNodeSub, { color: theme.textMuted }]}>
              Le E muet
            </Text>
            <Text style={[styles.timelineNodeBody, { color: theme.textMuted }]}>
              Why some syllables vanish in casual Montreal speech but remain vital in poetry.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.md,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  timelineLineWrapper: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 6,
  },
  timelineVerticalLine: {
    width: 1,
    flex: 1,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineNodeTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: 2,
  },
  timelineNodeSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  timelineNodeBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  },
});
