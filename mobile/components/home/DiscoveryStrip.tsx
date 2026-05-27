import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TILItem {
  id: string;
  category: string;
  title: string;
  body: string;
  frenchExample?: string;
  englishExample?: string;
  bgOverride?: string;
}

const DISCOVERY_ITEMS: TILItem[] = [
  {
    id: 'ce-dont',
    category: 'DEEP GRAMMAR',
    title: 'Why ‘ce dont’ exists',
    body: 'Discover why "dont" replaces objects of "de", and how it handles neutral antecedents.',
    frenchExample: 'C\'est ce dont j\'ai besoin.',
    englishExample: 'That is what I need.',
    bgOverride: '#f3e0c4', // Pale Golden Sand
  },
  {
    id: 'quebec-office',
    category: 'CULTURAL INSIGHT',
    title: 'Québec office vocabulary',
    body: 'Master corporate terminology like "fin de semaine" and formal Quebecois business greetings.',
    frenchExample: 'Bonne fin de semaine !',
    englishExample: 'Have a good weekend!',
    bgOverride: '#e7e2d7', // Pale Grey-Sand
  },
  {
    id: 'anatomy-morph',
    category: 'WORD ANATOMY',
    title: 'Anatomy of Bienveillance',
    body: 'Trace the Latin roots of care from courtly virtue to modern social ethics.',
    frenchExample: 'Bien + veillance',
    englishExample: 'Well-wishing / Care',
    bgOverride: '#8c9b82', // Medium Sage
  }
];

export function DiscoveryStrip() {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <View style={styles.discoverySection}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        DISCOVERY
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH - SPACING.lg * 2 - 12 + SPACING.md}
        snapToAlignment="start"
        contentContainerStyle={styles.discoveryStrip}
      >
        {DISCOVERY_ITEMS.map((item) => {
          const itemBg = isDarkMode ? '#181816' : '#fcfbfa';
          return (
            <View 
              key={item.id} 
              style={[
                styles.tilCard, 
                { 
                  backgroundColor: itemBg, 
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#252522' : '#111111',
                }
              ]}
            >
              {/* Glowing Antique Gold Accent Top Bar */}
              <View style={styles.tilGoldTopBar} />

              <View style={styles.tilHeader}>
                <Text style={[styles.tilCategory, { color: isDarkMode ? '#d6c4aa' : '#cfac62' }]}>
                  {item.category}
                </Text>
                <Text style={styles.tilHeaderStar}>✦</Text>
              </View>
              <Text style={[styles.tilTitle, { color: theme.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.tilBody, { color: theme.textMuted }]}>
                {item.body}
              </Text>

              {item.frenchExample && (
                <View style={[styles.tilExampleBox, { backgroundColor: isDarkMode ? theme.surfaceMuted : 'rgba(207, 172, 98, 0.06)' }]}>
                  <Text style={[styles.tilExampleFr, { color: theme.text }]}>
                    « {item.frenchExample} »
                  </Text>
                  {item.englishExample && (
                    <Text style={[styles.tilExampleEn, { color: theme.textMuted }]}>
                      {item.englishExample}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  discoverySection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.md,
  },
  discoveryStrip: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  tilCard: {
    width: SCREEN_WIDTH - SPACING.lg * 2 - 12,
    padding: SPACING.lg,
    paddingTop: SPACING.lg + 6,
    minHeight: 250,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  tilHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tilCategory: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
  },
  tilTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg + 2,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  tilBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  tilExampleBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  tilExampleFr: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 2,
  },
  tilExampleEn: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    opacity: 0.8,
  },
  tilGoldTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: '#cfac62',
    shadowColor: '#cfac62',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  tilHeaderStar: {
    fontSize: 10,
    color: '#cfac62',
  },
});
