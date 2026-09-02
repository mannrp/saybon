import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import { useProgressStore } from '../../core/store/useProgressStore';
import type { ConceptNode } from '../../core/content/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TILItem {
  id: string;
  category: string;
  title: string;
  body: string;
  frenchExample?: string;
  englishExample?: string;
}

const CARD_BACKGROUNDS = ['#f3e0c4', '#e7e2d7', '#8c9b82'];

/**
 * Builds real "Today I Learned" cards from the actual concept corpus —
 * word-anatomy cards from concepts with morphology data, and cultural-insight
 * cards from concepts with culturalContext (currently 0/800 — see
 * .relay/tasks/0008-quebec-cultural-context.md, not yet integrated — this
 * category appears automatically once that content lands, no code change
 * needed). No fabricated copy: a category with nothing real behind it is
 * simply absent from the rotation rather than filled with placeholder text.
 */
function buildDiscoveryItems(concepts: ConceptNode[]): TILItem[] {
  const withCulture = concepts.filter((c) => c.culturalContext);
  const withMorphology = concepts.filter(
    (c) => c.morphology?.decomposition && c.morphology.decomposition.length > 0
  );

  // Deterministic per-day pick so the strip feels like "today's discoveries"
  // rather than reshuffling on every render — same spirit as the Dashboard's
  // daily concept hero.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );

  const items: TILItem[] = [];

  if (withCulture.length > 0) {
    const pick = withCulture[dayOfYear % withCulture.length];
    items.push({
      id: `culture-${pick.id}`,
      category: 'CULTURAL INSIGHT',
      title: `À propos de « ${pick.french} »`,
      body: pick.culturalContext!,
      frenchExample: pick.examples[0]?.french,
      englishExample: pick.examples[0]?.english,
    });
  }

  const morphPicks: ConceptNode[] = [];
  for (let i = 0; i < Math.min(2, withMorphology.length); i++) {
    const idx = (dayOfYear + i * 7) % withMorphology.length;
    const candidate = withMorphology[idx];
    if (!morphPicks.find((c) => c.id === candidate.id)) morphPicks.push(candidate);
  }
  for (const concept of morphPicks) {
    const parts = concept.morphology!.decomposition!;
    items.push({
      id: `morph-${concept.id}`,
      category: 'WORD ANATOMY',
      title: `Anatomy of "${concept.french}"`,
      body: `Break "${concept.french}" (${concept.english}) into ${parts.join(' + ')} to see how the word is built.`,
      frenchExample: concept.examples[0]?.french,
      englishExample: concept.examples[0]?.english,
    });
  }

  return items;
}

export const DiscoveryStrip = React.memo(function DiscoveryStrip() {
  const { isDarkMode, theme } = useAppTheme();
  const concepts = useProgressStore((s) => s.concepts);

  const items = useMemo(() => buildDiscoveryItems(concepts), [concepts]);

  if (items.length === 0) return null;

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
        {items.map((item, i) => {
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
                },
              ]}
            >
              <View
                style={[
                  styles.tilGoldTopBar,
                  { backgroundColor: CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length] },
                ]}
              />

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
});

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
