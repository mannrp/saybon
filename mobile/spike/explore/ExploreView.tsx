import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';
import { useAppTheme } from '../theme/useAppTheme';

import { CuratedTodayHero } from './explore/CuratedTodayHero';
import { TimelineSection } from './explore/TimelineSection';
import { QuebecSection } from './explore/QuebecSection';
import { WordAnatomySection } from './explore/WordAnatomySection';

import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

interface ExploreViewProps {
  navigation: NavigationProp<RootStackParamList>;
}

export function ExploreView({ navigation }: ExploreViewProps) {
  const { theme } = useAppTheme();
  const concepts = useProgressStore((s) => s.concepts);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 1. Precompute normalized lowercase search strings once
  const searchIndex = useMemo(() => {
    return concepts.map((c) => ({
      concept: c,
      normalized: `${c.french} ${c.english} ${c.culturalContext || ''} ${c.morphology?.root || ''}`.toLowerCase(),
    }));
  }, [concepts]);

  // 2. Debounce search query by 150ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Fast substring search over precomputed index, capped at 50 results
  const filteredConcepts = useMemo(() => {
    if (!debouncedQuery) return [];
    const matches: typeof concepts = [];
    for (let i = 0; i < searchIndex.length; i++) {
      if (searchIndex[i].normalized.includes(debouncedQuery)) {
        matches.push(searchIndex[i].concept);
        if (matches.length >= 50) break;
      }
    }
    return matches;
  }, [debouncedQuery, searchIndex]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
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
        <CuratedTodayHero />

        {/* Today I Learned (Timeline) */}
        <TimelineSection />

        {/* Québec French Section */}
        <QuebecSection />

        {/* Word Anatomy Box */}
        <WordAnatomySection />

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
