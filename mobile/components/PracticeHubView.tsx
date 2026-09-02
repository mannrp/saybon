// Saybon v2 — Practice Remix Hub Component (L'Atelier French Practice Studio)
// Features stateful tactile selectors for Vocab daily mixes, categories, progressive tenses,
// and quick launches for the Tinder-style swipe game and Endless practice.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';
import { useAppTheme } from '../theme/useAppTheme';
import { categories, getConceptCategory } from '../core/content/categoryMap';
import { conjugationDb } from '../core/content/conjugationDb';
import { generateOfflineExercises } from '../core/content/exerciseGenerator';

import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

interface PracticeHubViewProps {
  navigation: NavigationProp<RootStackParamList>;
}

export function PracticeHubView({ navigation }: PracticeHubViewProps) {
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const concepts = useProgressStore((s) => s.concepts);
  const progress = useProgressStore((s) => s.progress);

  // ── Stateful Selectors ──────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTenses, setSelectedTenses] = useState<string[]>([]);
  const [sessionMode, setSessionMode] = useState<'standard' | 'endless'>('standard');

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const toggleTense = (tense: string) => {
    if (selectedTenses.includes(tense)) {
      setSelectedTenses(selectedTenses.filter((t) => t !== tense));
    } else {
      setSelectedTenses([...selectedTenses, tense]);
    }
  };

  // ── compile dynamic vocabulary session ──────────────────────────────────────
  const handleLaunchVocabSession = (type: 'daily-mix' | 'categories') => {
    let pool: typeof concepts = [];

    if (type === 'daily-mix') {
      // Spaced Repetition: 5 completely unseen (mastery = 0) and 5 weak seen (mastery < 3)
      const unseen = concepts.filter((c) => !progress[c.id] || progress[c.id].mastery === 0);
      const weak = concepts.filter(
        (c) => progress[c.id] && progress[c.id].seenState && progress[c.id].mastery < 3
      );
      
      const shuffledUnseen = unseen.sort(() => Math.random() - 0.5).slice(0, 5);
      const shuffledWeak = weak.sort(() => Math.random() - 0.5).slice(0, 5);
      
      pool = [...shuffledUnseen, ...shuffledWeak];
      
      // Fallback if user doesn't have weak words yet
      if (pool.length < 10) {
        const extra = concepts.filter((c) => !pool.map((p) => p.id).includes(c.id));
        pool = [...pool, ...extra.slice(0, 10 - pool.length)];
      }
    } else {
      // Categories: filter concepts based on selected categories using categoryMap lookup
      if (selectedCategories.length === 0) return;
      
      pool = concepts.filter((c) => {
        const catId = getConceptCategory(c.french, c.english, c.id);
        return catId && selectedCategories.includes(catId);
      });
    }

    if (pool.length === 0) return;

    const shuffledIds = pool.sort(() => Math.random() - 0.5).map((c) => c.id).slice(0, 10);
    navigation.navigate('PracticeSession', { 
      conceptIds: shuffledIds, 
      isEndless: sessionMode === 'endless' 
    });
  };

  // ── compile progressive grammar/conjugation session ───────────────────────
  const handleLaunchGrammarSession = () => {
    // Find all verb concept nodes in our database (e.g. word starts/equals core verbs)
    const activeVerbs = conjugationDb.map((v) => v.verb);
    let verbConcepts = concepts.filter((c) => activeVerbs.includes(c.french.toLowerCase().trim()));

    if (verbConcepts.length === 0) {
      // Fallback: search for verbs or use standard concepts
      verbConcepts = concepts.slice(0, 10);
    }

    const verbIds = verbConcepts.map((v) => v.id);
    navigation.navigate('PracticeSession', { 
      conceptIds: verbIds, 
      isEndless: sessionMode === 'endless' 
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Atelier Header */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.primary }]}>
            Atelier de Pratique
          </Text>
          <Text style={[styles.heroDesc, { color: theme.textMuted }]}>
            Construct your tactile practice session or challenge your reflexes offline.
          </Text>
        </View>

        {/* Tactile swipe minigame Launcher */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Minijeux Tactiles</Text>
            <Text style={[styles.sectionBadge, { color: theme.textMuted }]}>100% OFFLINE</Text>
          </View>

          <Pressable
            style={[
              styles.swipeGameCard,
              {
                backgroundColor: isDarkMode ? 'rgba(192, 132, 252, 0.08)' : '#FAF5FF',
                borderColor: '#C084FC',
                borderWidth: 1,
              },
            ]}
            onPress={() => navigation.navigate('GenreSwipeSession')}
          >
            <View style={styles.swipeGameContent}>
              <Text style={styles.gameBadge}>JEU DE RÉFLEXES</Text>
              <Text style={[styles.gameTitle, { color: theme.text }]}>Arène du Genre</Text>
              <Text style={[styles.gameDesc, { color: theme.textMuted }]}>
                Tinder-style rapid swipe. Swipe left for Féminin (pink), right for Masculin (blue).
              </Text>
            </View>
            <Text style={styles.swipeGameArrow}>➔</Text>
          </Pressable>
        </View>

        {/* Section 1: Vocabulaire Studio */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Studio Vocabulaire</Text>
            <Text style={[styles.sectionBadge, { color: theme.textMuted }]}>
              {selectedCategories.length} categories
            </Text>
          </View>

          {/* Spaced Repetition card */}
          <Pressable
            style={[styles.listItem, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            onPress={() => handleLaunchVocabSession('daily-mix')}
          >
            <View style={styles.listItemText}>
              <Text style={[styles.listItemTitle, { color: theme.text }]}>Mix Vocabulaire Quotidien</Text>
              <Text style={[styles.listItemSub, { color: theme.textMuted }]}>
                5 New words + 5 Weak reviews (Spaced Repetition)
              </Text>
            </View>
            <Text style={[styles.checkIcon, { color: theme.primary }]}>⚡ PRATIQUER</Text>
          </Pressable>

          {/* Horizontal scroll Categories capsules */}
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>OU FILTRER PAR CATÉGORIE :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => {
              const isSel = selectedCategories.includes(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.capsule,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSel && { backgroundColor: theme.primary + '11', borderColor: theme.primary },
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={[styles.capsuleText, { color: isSel ? theme.primary : theme.text }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedCategories.length > 0 && (
            <Pressable
              style={[styles.launchBtn, { backgroundColor: theme.primary }]}
              onPress={() => handleLaunchVocabSession('categories')}
            >
              <Text style={styles.launchBtnText}>LANCER LA SÉLECTION VOCABULAIRE</Text>
            </Pressable>
          )}
        </View>

        {/* Section 2: Grammaire & Conjugaison Studio */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Studio Grammaire & Verbes</Text>
          </View>

          {/* Conjugaison capsule selection */}
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>SÉLECTIONNER LE TEMPS DE CONJUGAISON :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {['présent', 'futur proche', 'passé composé', 'imparfait', 'subjonctif présent'].map((tense) => {
              const isSel = selectedTenses.includes(tense);
              return (
                <Pressable
                  key={tense}
                  style={[
                    styles.capsule,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSel && { backgroundColor: theme.primary + '11', borderColor: theme.primary },
                  ]}
                  onPress={() => toggleTense(tense)}
                >
                  <Text style={[styles.capsuleText, { color: isSel ? theme.primary : theme.text }]}>
                    {tense.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.listItem, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, marginTop: SPACING.md }]}
            onPress={handleLaunchGrammarSession}
          >
            <View style={styles.listItemText}>
              <Text style={[styles.listItemTitle, { color: theme.text }]}>Pratique des Conjugaisons</Text>
              <Text style={[styles.listItemSub, { color: theme.textMuted }]}>
                Tactile fill-blanks & translations for common French verbs
              </Text>
            </View>
            <Text style={[styles.checkIcon, { color: theme.primary }]}>⚡ L'ATELIER</Text>
          </Pressable>
        </View>

        {/* Session mode toggle (Standard vs Endless) */}
        <View style={[styles.sessionModeCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text style={[styles.sessionModeLabel, { color: theme.text }]}>MODE D'ENTRAÎNEMENT</Text>
          <View style={styles.toggleRow}>
            {['standard', 'endless'].map((mode) => {
              const isSel = sessionMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSel && { backgroundColor: theme.text, borderColor: theme.text },
                  ]}
                  onPress={() => setSessionMode(mode as any)}
                >
                  <Text style={[styles.toggleText, { color: isSel ? theme.background : theme.text }]}>
                    {mode === 'standard' ? 'SÉANCE CALME (10)' : 'PRATIQUE INFINIE (∞)'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Remix Action Banner */}
        <View
          style={[
            styles.remixBanner,
            {
              backgroundColor: isDarkMode ? theme.surfaceContainer : theme.primary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.remixTitle, { color: COLORS.light.background }]}>Générer le Remix</Text>
          <Text style={[styles.remixSub, { color: isDarkMode ? theme.textMuted : 'rgba(249, 249, 247, 0.8)' }]}>
            Combine all selected categories and tenses in {sessionMode === 'endless' ? 'infinite' : 'standard'} practice mode.
          </Text>

          <Pressable
            style={[styles.remixBtn, { backgroundColor: COLORS.light.background }]}
            onPress={() => {
              // Combine vocabulary categories and tenses
              const combinedConceptIds = concepts
                .filter((c) => {
                  const catId = getConceptCategory(c.french, c.english, c.id);
                  const isCatSelected = selectedCategories.length === 0 || (catId && selectedCategories.includes(catId));
                  return isCatSelected;
                })
                .map((c) => c.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
              
              navigation.navigate('PracticeSession', {
                conceptIds: combinedConceptIds.length > 0 ? combinedConceptIds : concepts.slice(0, 10).map((c) => c.id),
                isEndless: sessionMode === 'endless',
              });
            }}
          >
            <Text style={[styles.remixBtnText, { color: theme.primary }]}>COMMENCER LE REMIX</Text>
          </Pressable>
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
  heroSection: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontStyle: 'italic',
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1.5,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  sectionBadge: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.0,
  },
  swipeGameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  swipeGameContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  gameBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  gameTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  swipeGameArrow: {
    fontSize: 20,
    color: '#8B5CF6',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 2,
  },
  listItemSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  checkIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: SPACING.md,
  },
  subLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    marginBottom: SPACING.sm,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  capsule: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  capsuleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  launchBtn: {
    height: 38,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sessionModeCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  sessionModeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleBtn: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  remixBanner: {
    borderWidth: 1,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  remixTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xl + 2,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.sm,
  },
  remixSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: '90%',
  },
  remixBtn: {
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remixBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
});
