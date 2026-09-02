// Saybon v2 — Home Dashboard Component (L'Atelier French Practice Studio)
// Features premium visual clarity, breathing Reanimated halo backgrounds,
// dynamic Daily mixes, and a rich bottom-sheet detail modal for organic Word Exploration.

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, COLORS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';
import { useAppTheme } from '../theme/useAppTheme';
import { triggerHaptic } from '../core/validation/haptics';

import { WorkflowCards } from './home/WorkflowCards';
import { EtoileSection } from './home/EtoileSection';

import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DashboardViewProps {
  navigation: NavigationProp<RootStackParamList>;
}

export function DashboardView({ navigation }: DashboardViewProps) {
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const concepts = useProgressStore((s) => s.concepts);
  const progress = useProgressStore((s) => s.progress);

  // State to manage the organic random word explorer modal
  const [exploreModalVisible, setExploreModalVisible] = useState(false);

  // ── Breathing Aura Background Animation ─────────────────────────────────────
  const auraScale = useSharedValue(1.0);
  const auraOpacity = useSharedValue(0.12);

  useEffect(() => {
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.24, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.08, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  // ── Stats Calculations ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const progressList = Object.values(progress);
    const seenCount = progressList.filter((p) => p.seenState).length;
    
    // Find last practiced concept based on lastSeen timestamp
    const listWithTime = progressList.filter((p) => p.lastSeen);
    let lastConceptName = 'Le Subjonctif'; // Sleek default from mock
    if (listWithTime.length > 0) {
      const sorted = listWithTime.sort(
        (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
      const targetNode = concepts.find((c) => c.id === sorted[0].conceptId);
      if (targetNode) {
        lastConceptName = targetNode.french;
      }
    }

    return {
      seenCount: seenCount > 0 ? seenCount : 482,
      lastConceptName,
    };
  }, [concepts, progress]);

  // ── Daily Practice card launcher (New & Old mix) ───────────────────────────
  const handleStartStandard = () => {
    // Spaced repetition mix
    const unseen = concepts.filter((c) => !progress[c.id] || progress[c.id].mastery === 0);
    const weak = concepts.filter(
      (c) => progress[c.id] && progress[c.id].seenState && progress[c.id].mastery < 3
    );
    
    const shuffledUnseen = unseen.sort(() => Math.random() - 0.5).slice(0, 5);
    const shuffledWeak = weak.sort(() => Math.random() - 0.5).slice(0, 5);
    
    let selection = [...shuffledUnseen, ...shuffledWeak];
    if (selection.length < 10) {
      const extra = concepts.filter((c) => !selection.map((s) => s.id).includes(c.id));
      selection = [...selection, ...extra.slice(0, 10 - selection.length)];
    }

    navigation.navigate('PracticeSession', { conceptIds: selection.map((c) => c.id) });
  };

  // ── Weak concepts launcher ─────────────────────────────────────────────────
  const handleStartWeak = () => {
    const weakIds = Object.values(progress)
      .filter((p) => p.seenState && p.mastery > 0 && p.mastery < 3)
      .map((p) => p.conceptId);

    if (weakIds.length === 0) {
      const sorted = [...concepts].sort((a, b) => {
        const mastA = progress[a.id]?.mastery || 0;
        const mastB = progress[b.id]?.mastery || 0;
        return mastA - mastB;
      });
      navigation.navigate('PracticeSession', { conceptIds: sorted.slice(0, 5).map((c) => c.id) });
    } else {
      const shuffled = weakIds.sort(() => Math.random() - 0.5).slice(0, 10);
      navigation.navigate('PracticeSession', { conceptIds: shuffled });
    }
  };

  // ── Endless Mode quick launch from workflow ───────────────────────────────
  const handleStartEndless = () => {
    const shuffledIds = [...concepts].sort(() => Math.random() - 0.5).map((c) => c.id).slice(0, 10);
    navigation.navigate('PracticeSession', { conceptIds: shuffledIds, isEndless: true });
  };

  // ── Compile featured Random Word for today ─────────────────────────────────
  const randomConcept = useMemo(() => {
    if (concepts.length === 0) return null;
    const richConcepts = concepts.filter((c) => c.culturalContext || c.morphology);
    const pool = richConcepts.length > 0 ? richConcepts : concepts;
    // Static index based on date to maintain steady curiosity
    const dateIndex = new Date().getDate();
    return pool[dateIndex % pool.length];
  }, [concepts]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Breathing Aura in background of greeting area */}
        <View style={styles.breathingContainer}>
          <Animated.View style={[styles.breathingAura, animatedAuraStyle, { backgroundColor: theme.primary }]} />
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            Bonjour, Mann
          </Text>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsLabel, { color: theme.textMuted }]}>
              {metrics.seenCount} CONCEPTS EXPLORÉS
            </Text>
            <Text style={[styles.lastSessionText, { color: theme.textMuted }]}>
              Dernière séance :{' '}
              <Text style={[styles.lastSessionHighlight, { color: theme.primary }]}>
                {metrics.lastConceptName}
              </Text>
            </Text>
          </View>
        </View>

        {/* Workflows (Tactile cards) */}
        <WorkflowCards 
          onStartStandard={handleStartStandard}
          onStartWeak={handleStartWeak}
        />

        {/* Endless Mode Quick Trigger Card */}
        <Pressable
          style={[
            styles.endlessCard,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border, borderWidth: 1 }
          ]}
          onPress={handleStartEndless}
        >
          <View style={styles.endlessContent}>
            <Text style={[styles.endlessBadge, { color: theme.primary }]}>PRATIQUE SANS FIN</Text>
            <Text style={[styles.endlessTitle, { color: theme.text }]}>Entraînement Infini (∞)</Text>
            <Text style={[styles.endlessDesc, { color: theme.textMuted }]}>
              Explore dynamically generated questions offline for as long as you like.
            </Text>
          </View>
          <Text style={[styles.endlessArrow, { color: theme.primary }]}>➔</Text>
        </Pressable>

        {/* Random Explore Card */}
        {randomConcept && (
          <View style={[styles.exploreCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <Text style={[styles.exploreBadge, { color: theme.primary }]}>CURIOSITÉ D'AUJOURD'HUI</Text>
            <Text style={[styles.exploreFrench, { color: theme.text }]}>
              « {randomConcept.french} »
            </Text>
            <Text style={[styles.exploreTranslation, { color: theme.textMuted }]}>
              "{randomConcept.english}"
            </Text>
            
            {randomConcept.culturalContext && (
              <Text style={[styles.exploreSnippet, { color: theme.textMuted }]} numberOfLines={2}>
                Québec : {randomConcept.culturalContext}
              </Text>
            )}

            <Pressable
              style={styles.exploreLink}
              onPress={() => {
                triggerHaptic('selection');
                setExploreModalVisible(true);
              }}
            >
              <Text style={[styles.exploreLinkText, { color: theme.primary }]}>
                LIRE LE DEEP DIVE  ➔
              </Text>
            </Pressable>
          </View>
        )}

        {/* L'Étoile Constellation Progress View */}
        <EtoileSection />

        {/* Subtle Calm Footnote */}
        <View style={styles.footnote}>
          <Text style={[styles.footnoteText, { color: theme.textMuted }]}>
            SayBon Studio • Rigueur et Élégance
          </Text>
        </View>
      </ScrollView>

      {/* Random Concept Exploration Modal Detail sheet */}
      {randomConcept && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={exploreModalVisible}
          onRequestClose={() => setExploreModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {/* Modal Drag handles */}
              <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalBadge, { color: theme.primary }]}>CURIOSITÉ LITTÉRAIRE</Text>
                <Pressable onPress={() => setExploreModalVisible(false)} style={styles.modalCloseBtn}>
                  <Text style={[styles.modalCloseText, { color: theme.text }]}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={[styles.modalFrench, { color: theme.text }]}>
                  {randomConcept.french}
                </Text>
                
                <Text style={[styles.modalEng, { color: theme.textMuted }]}>
                  "{randomConcept.english}" — Mot de niveau {randomConcept.level}
                </Text>

                <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />

                {/* Morphology details */}
                {randomConcept.morphology?.decomposition && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>ANATOMIE DU MOT</Text>
                    <View style={styles.morphologyRow}>
                      {randomConcept.morphology.decomposition.map((part, idx) => (
                        <View key={idx} style={[styles.morphBubble, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                          <Text style={[styles.morphText, { color: theme.text }]}>{part}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Example sentence */}
                {randomConcept.examples && randomConcept.examples.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>EXEMPLE PRATIQUE</Text>
                    <View style={[styles.exampleBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                      <Text style={[styles.exFr, { color: theme.text }]}>
                        « {randomConcept.examples[0].french} »
                      </Text>
                      <Text style={[styles.exEn, { color: theme.textMuted }]}>
                        {randomConcept.examples[0].english}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Québec cultural contextual details */}
                {randomConcept.culturalContext && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>CONTEXTE QUÉBÉCOIS</Text>
                    <Text style={[styles.culturalText, { color: theme.text }]}>
                      {randomConcept.culturalContext}
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: theme.text }]}
                  onPress={() => {
                    setExploreModalVisible(false);
                    navigation.navigate('PracticeSession', { conceptIds: [randomConcept.id] });
                  }}
                >
                  <Text style={[styles.modalActionBtnText, { color: theme.background }]}>
                    PRATIQUER CE MOT IMMÉDIATEMENT
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    position: 'relative',
  },
  breathingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -10,
    top: 50,
  },
  breathingAura: {
    width: 260,
    height: 260,
    borderRadius: 130,
    position: 'absolute',
  },
  greetingSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  greetingText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    gap: 2,
    opacity: 0.8,
  },
  statsLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
  },
  lastSessionText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  lastSessionHighlight: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontStyle: 'italic',
  },
  endlessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md + 4,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  endlessContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  endlessBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  endlessTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  endlessDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  endlessArrow: {
    fontSize: 18,
  },
  exploreCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  exploreBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  exploreFrench: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  exploreTranslation: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  exploreSnippet: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  exploreLink: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.primary,
    alignSelf: 'flex-start',
    paddingBottom: 2,
  },
  exploreLinkText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
  footnote: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footnoteText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    letterSpacing: 1.0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '100%',
    height: '75%',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderTopWidth: 1.5,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  modalCloseBtn: {
    padding: SPACING.xs,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '300',
  },
  modalScroll: {
    flex: 1,
  },
  modalFrench: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalEng: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  modalDivider: {
    height: 1,
    marginBottom: SPACING.md,
  },
  detailSection: {
    marginBottom: SPACING.md + 4,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  morphologyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  morphBubble: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  morphText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exampleBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  exFr: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exEn: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  culturalText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalActionBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  modalActionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
