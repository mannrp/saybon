// Saybon v2 — Editorial Explore Page Component (L'Atelier French Practice Studio)
// Designed strictly according to explore_discovery/code.html.
// Combines modern search with gorgeous Swiss/L'Atelier typography and word breakdowns.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';

export function ExploreView() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { concepts } = useProgressStore();
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filtered search for convenience ────────────────────────────────────────
  const filteredConcepts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return concepts.filter(
      (c) =>
        c.french.toLowerCase().includes(query) ||
        c.english.toLowerCase().includes(query) ||
        (c.culturalContext && c.culturalContext.toLowerCase().includes(query)) ||
        (c.morphology?.root && c.morphology.root.toLowerCase().includes(query))
    );
  }, [searchQuery, concepts]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.background }]}>
        <Pressable style={styles.topBarIcon}>
          <Text style={[styles.iconText, { color: theme.textMuted }]}>☰</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Studio</Text>
        <Pressable style={styles.topBarIcon}>
          <Text style={[styles.iconText, { color: theme.textMuted }]}>👤</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>
            CURIOSITÉS LITTÉRAIRES
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            L'Exploration
          </Text>
          <Text style={[styles.headerDesc, { color: theme.textMuted }]}>
            Wander slow. Examine structural word roots or local Québécois expressions.
          </Text>
        </View>

        {/* Minimalist Search Input */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={[
              styles.searchField,
              {
                color: theme.text,
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
            placeholder="Rechercher un mot, un préfixe, un sens…"
            placeholderTextColor={theme.textMuted + '88'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Search Results Dropdown/List if active */}
        {searchQuery.trim().length > 0 && (
          <View style={[styles.resultsSection, { borderColor: theme.border }]}>
            <Text style={[styles.resultsTitle, { color: theme.textMuted }]}>
              RÉSULTATS DE RECHERCHE ({filteredConcepts.length})
            </Text>
            {filteredConcepts.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Aucun concept trouvé pour « {searchQuery} »
              </Text>
            ) : (
              filteredConcepts.map((c) => (
                <View key={c.id} style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.resultFrench, { color: theme.text }]}>{c.french}</Text>
                  <Text style={[styles.resultEnglish, { color: theme.textMuted }]}>{c.english}</Text>
                  {c.culturalContext && (
                    <Text style={[styles.resultContext, { color: theme.textMuted }]}>{c.culturalContext}</Text>
                  )}
                </View>
              ))
            )}
            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: SPACING.md }]} />
          </View>
        )}

        {/* Curated Today Hero Card */}
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

          {/* Minimalist spiral graphic mockup representing the Spiral staircase photograph */}
          <View style={[styles.curatedGraphic, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.graphicText, { color: theme.primary, opacity: 0.15 }]}>
              🌀 L'Atelier de Structure
            </Text>
          </View>

          <Pressable style={styles.deepDiveLink}>
            <Text style={[styles.deepDiveText, { color: theme.primary }]}>
              READ THE DEEP DIVE  ➔
            </Text>
          </Pressable>
        </View>

        {/* Today I Learned (Timeline) */}
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
                <View style={[styles.timelineDot, { backgroundColor: theme.primaryContainer }]} />
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

        {/* Québec French Section */}
        <View style={styles.quebecSection}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            QUÉBEC FRENCH
          </Text>

          <View style={styles.dualGrid}>
            {/* Vernacular Phrase Card */}
            <View style={[styles.slangCard, { backgroundColor: theme.secondaryContainer, borderColor: theme.border }]}>
              <View style={styles.slangCardHeader}>
                <Text style={[styles.slangIcon, { color: theme.primary }]}>💬</Text>
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
                <Text style={[styles.slangIcon, { color: theme.primary }]}>💼</Text>
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

        {/* Word Anatomy Box */}
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

        {/* Calm Footnote */}
        <View style={styles.footnote}>
          <Text style={[styles.footnoteText, { color: theme.textMuted }]}>
            L'Atelier • Exploration Intentionnelle
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    height: Platform.OS === 'ios' ? 100 : 70,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    zIndex: 10,
  },
  topBarTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  topBarIcon: {
    padding: SPACING.xs,
  },
  iconText: {
    fontSize: 20,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  headerDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  searchWrapper: {
    marginBottom: SPACING.xl,
  },
  searchField: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
  },
  resultsSection: {
    marginBottom: SPACING.lg,
  },
  resultsTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
    marginBottom: SPACING.sm,
  },
  resultCard: {
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  resultFrench: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  resultEnglish: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    marginBottom: 4,
  },
  resultContext: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  curatedCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
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
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
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
  quebecSection: {
    marginBottom: SPACING.xl,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  slangCard: {
    flex: 1,
    padding: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
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
  anatomyCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    shadowColor: 'rgba(84, 98, 76, 0.05)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
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
  footnote: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footnoteText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    letterSpacing: 1.0,
  },
});
