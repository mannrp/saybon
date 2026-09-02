import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';
import { useAppTheme } from '../theme/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categories, getConceptCategory } from '../core/content/categoryMap';
import type { ConceptNode, ConceptProgress } from '../core/content/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Real-data derivation helpers ─────────────────────────────────────────────
// Everything below reads from the actual progress/concepts store. No fixed
// numbers, no decorative placeholder content — see
// planning/SAYBON_TECHNICAL_AUDIT.md §14 for why that was a problem here.

const WEEKDAY_LABELS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

/** Whole calendar days between an ISO timestamp and today (0 = today). */
function daysAgo(isoDate: string): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return Infinity;
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  return Math.round((startOfToday.getTime() - startOfThen.getTime()) / 86400000);
}

function useProgressMetrics(
  progress: Record<string, ConceptProgress>,
  concepts: ConceptNode[]
) {
  return useMemo(() => {
    const progressList = Object.values(progress);
    const seenList = progressList.filter((p) => p.seenState);
    const totalSeen = seenList.length;
    const mastered = seenList.filter((p) => p.mastery >= 4).length;
    const masteryPercent = totalSeen > 0 ? Math.round((mastered / totalSeen) * 100) : 0;

    // Mastery distribution (0-5) — replaces the old fixed 7-bar decoration
    // with a real histogram of where the learner's seen vocabulary sits.
    const masteryBuckets = [0, 0, 0, 0, 0, 0];
    for (const p of seenList) {
      const idx = Math.min(5, Math.max(0, p.mastery));
      masteryBuckets[idx]++;
    }
    const maxBucket = Math.max(1, ...masteryBuckets);

    // Weakest categories the learner has actually attempted — replaces the
    // hardcoded "Subjonctif / Genre des noms / ..." grammar tags, which
    // named things the app has no per-concept data to actually measure.
    // Categorization and thresholds noted inline below.
    const categoryStats: Record<string, { totalMastery: number; count: number; name: string }> = {};
    for (const concept of concepts) {
      const p = progress[concept.id];
      if (!p || p.attempts < 1) continue;
      const catId = getConceptCategory(concept.french, concept.english, concept.id);
      if (!catId) continue;
      const meta = categories.find((c) => c.id === catId);
      if (!meta) continue;
      if (!categoryStats[catId]) {
        categoryStats[catId] = { totalMastery: 0, count: 0, name: meta.name };
      }
      categoryStats[catId].totalMastery += p.mastery;
      categoryStats[catId].count += 1;
    }
    // Require at least 2 attempted concepts in a category before it's
    // reported as a weak spot — one lucky/unlucky answer isn't a pattern.
    const weakestCategories = Object.values(categoryStats)
      .filter((c) => c.count >= 2)
      .map((c) => ({ name: c.name, avgMastery: c.totalMastery / c.count }))
      .sort((a, b) => a.avgMastery - b.avgMastery)
      .slice(0, 5);

    // Top categories by seen-concept count — feeds the constellation nodes
    // below in place of fixed "Grammaire/Syntaxe/Prononciation" labels the
    // corpus has no data to back (every seed concept is type: "word").
    const seenCategoryCounts: Record<string, number> = {};
    for (const concept of concepts) {
      if (!progress[concept.id]?.seenState) continue;
      const catId = getConceptCategory(concept.french, concept.english, concept.id);
      if (!catId) continue;
      seenCategoryCounts[catId] = (seenCategoryCounts[catId] || 0) + 1;
    }
    const topCategories = Object.entries(seenCategoryCounts)
      .map(([id, count]) => ({
        id,
        count,
        name: categories.find((c) => c.id === id)?.name ?? id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // This week's activity, from each concept's lastSeen date. This counts
    // distinct concepts last touched per day, not total review actions —
    // the schema only stores a concept's most recent review, not a full
    // history, so that's the honest ceiling on what this can represent.
    const weekCounts = new Array(7).fill(0); // index 6 = today, 0 = 6 days ago
    for (const p of seenList) {
      if (!p.lastSeen) continue;
      const d = daysAgo(p.lastSeen);
      if (d >= 0 && d < 7) weekCounts[6 - d]++;
    }
    const today = new Date();
    const weekLabels = weekCounts.map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return WEEKDAY_LABELS_FR[date.getDay()];
    });
    const weekTotal = weekCounts.reduce((a, b) => a + b, 0);
    const weekMax = Math.max(1, ...weekCounts);

    return {
      totalSeen,
      mastered,
      masteryPercent,
      masteryBuckets,
      maxBucket,
      weakestCategories,
      topCategories,
      weekCounts,
      weekLabels,
      weekTotal,
      weekMax,
    };
  }, [progress, concepts]);
}

// ── Floating Concept Node Component ──────────────────────────────────────────
interface FloatingNodeProps {
  label: string;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  phase: number;
  clock: SharedValue<number>;
  isGlow?: boolean;
}

const FloatingNode = React.memo(function FloatingNode({
  label,
  initialX,
  initialY,
  size,
  color,
  phase,
  clock,
  isGlow = false,
}: FloatingNodeProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const t = clock.value + phase;
    const tx = initialX + Math.sin(t) * 5;
    const ty = initialY + Math.cos(t * 2) * 6;
    const s = 1 + Math.sin(t * 3) * 0.06;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: s },
      ],
    };
  });

  return (
    <Animated.View style={[styles.floatingTag, animatedStyle]}>
      <View
        style={[
          styles.nodeCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderColor: color,
          },
          isGlow && styles.glowStyle,
        ]}
      />
      <Text style={styles.nodeText}>{label}</Text>
    </Animated.View>
  );
});

// Fixed layout slots (position/phase/glow) the top real categories are
// mapped onto, by index — purely spatial, not data.
const NODE_SLOTS = [
  { initialX: 40, initialY: 40, phase: 0, isGlow: true },
  { initialX: 180, initialY: 25, phase: 1.2, isGlow: false },
  { initialX: 270, initialY: 60, phase: 2.4, isGlow: false },
  { initialX: 130, initialY: 140, phase: 3.6, isGlow: true },
  { initialX: 250, initialY: 190, phase: 4.8, isGlow: false },
  { initialX: 50, initialY: 180, phase: 5.5, isGlow: false },
];

function nodeSize(count: number, maxCount: number): number {
  const minSize = 16;
  const maxSize = 44;
  if (maxCount <= 0) return minSize;
  return Math.round(minSize + (maxSize - minSize) * (count / maxCount));
}

// ── Main Progress View Component ─────────────────────────────────────────────
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

interface ProgressReviewViewProps {
  navigation: NavigationProp<RootStackParamList>;
}

export function ProgressReviewView({
  navigation,
}: ProgressReviewViewProps) {
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const progress = useProgressStore((s) => s.progress);
  const concepts = useProgressStore((s) => s.concepts);

  const floatClock = useSharedValue(0);

  useEffect(() => {
    floatClock.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 7000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [floatClock]);

  const metrics = useProgressMetrics(progress, concepts);
  const maxNodeCount = metrics.topCategories[0]?.count ?? 0;

  const handleLaunchReview = () => {
    const seenIds = Object.values(progress)
      .filter((p) => p.seenState)
      .map((p) => p.conceptId);

    if (seenIds.length === 0) {
      const fallbackConcepts = concepts.slice(0, 10);
      navigation.navigate('PracticeSession', {
        conceptIds: fallbackConcepts.map((c) => c.id),
      });
      return;
    }

    navigation.navigate('PracticeSession', {
      conceptIds: seenIds.slice(0, 20),
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Votre Parcours</Text>
          <Text style={[styles.pageDesc, { color: theme.textMuted }]}>
            Une réflexion sur votre maîtrise linguistique à travers le temps et les concepts.
          </Text>
        </View>

        {/* 2D Animated Constellation Box — nodes are the learner's real top categories */}
        <View style={[styles.constellationCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <View style={[styles.constellationGlow, { backgroundColor: theme.primary, opacity: isDarkMode ? 0.05 : 0.02 }]} />

          <View style={styles.constellationWrapper}>
            {metrics.topCategories.length === 0 ? (
              <View style={styles.emptyConstellation}>
                <Text style={[styles.emptyConstellationText, { color: theme.textMuted }]}>
                  Pratiquez quelques concepts pour voir apparaître votre constellation.
                </Text>
              </View>
            ) : (
              metrics.topCategories.map((cat, i) => {
                const slot = NODE_SLOTS[i % NODE_SLOTS.length];
                const color = slot.isGlow
                  ? theme.primary
                  : i % 2 === 0
                  ? (isDarkMode ? '#8c9b82' : '#54624c')
                  : (isDarkMode ? '#cbc6bc' : '#615e56');
                return (
                  <FloatingNode
                    key={cat.id}
                    label={cat.name}
                    initialX={slot.initialX}
                    initialY={slot.initialY}
                    size={nodeSize(cat.count, maxNodeCount)}
                    color={color}
                    phase={slot.phase}
                    clock={floatClock}
                    isGlow={slot.isGlow}
                  />
                );
              })
            )}
          </View>

          <View style={[styles.constellationIndicator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.pulseIndicatorDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.indicatorText, { color: theme.text }]}>Constellation de Concept</Text>
          </View>
        </View>

        {/* Constellation Description Panel */}
        <View style={styles.constellationFooter}>
          <Text style={[styles.constellationDesc, { color: theme.textMuted }]}>
            {metrics.topCategories[0] ? (
              <>
                Votre exploration s'oriente vers{' '}
                <Text style={styles.italicText}>{metrics.topCategories[0].name}</Text>. Les zones
                lumineuses indiquent une pratique plus fréquente.
              </>
            ) : (
              'Votre constellation se dessinera au fil de vos pratiques.'
            )}
          </Text>
          <View style={styles.masteryPanel}>
            <Text style={[styles.masteryLabel, { color: theme.primary }]}>MAÎTRISE</Text>
            <Text style={[styles.masteryValue, { color: theme.text }]}>{metrics.masteryPercent}%</Text>
          </View>
        </View>

        {/* Bento Box Grid Row 1 */}
        <View style={styles.bentoRow}>
          {/* Explorations Bento Card — real mastery-level distribution */}
          <View style={[styles.bentoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.bentoLabel, { color: theme.textMuted }]}>EXPLORATIONS</Text>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                {metrics.totalSeen} Mots & expressions
              </Text>
            </View>

            <View style={styles.barGraphContainer}>
              {metrics.masteryBuckets.map((count, i) => (
                <View
                  key={i}
                  style={[
                    styles.graphBar,
                    {
                      height: Math.max(2, (count / metrics.maxBucket) * 48),
                      backgroundColor: theme.primary,
                      opacity: 0.25 + (i / 5) * 0.75,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Zones de Vigilance Bento Card — real weakest attempted categories */}
          <View style={[styles.bentoCard, { backgroundColor: theme.secondaryContainer, borderColor: theme.border, position: 'relative', overflow: 'hidden' }]}>
            <Text style={[styles.bentoLabel, { color: theme.textMuted }]}>ZONES DE VIGILANCE</Text>
            {metrics.weakestCategories.length === 0 ? (
              <Text style={[styles.emptyZonesText, { color: theme.textMuted }]}>
                Pas encore assez de données — continuez à pratiquer.
              </Text>
            ) : (
              <View style={styles.tagsContainer}>
                {metrics.weakestCategories.map((cat, i) => (
                  <View
                    key={cat.name}
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: i === 0 ? theme.background + 'cc' : theme.background + '88',
                        borderColor: i === 0 ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        { color: theme.text, fontWeight: i === 0 ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.regular },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.decorativeAlertGlow, { backgroundColor: theme.error, opacity: 0.08 }]} />
          </View>
        </View>

        {/* This-week activity Bento Card (spans both columns) — real, from lastSeen */}
        <View style={[styles.growthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.growthHeader}>
            <Text style={[styles.growthTitle, { color: theme.text }]}>Cette semaine</Text>
            <Text style={[styles.growthSub, { color: theme.textMuted }]}>
              {metrics.weekTotal > 0
                ? `${metrics.weekTotal} mot${metrics.weekTotal > 1 ? 's' : ''} revu${metrics.weekTotal > 1 ? 's' : ''}`
                : 'Aucune révision cette semaine'}
            </Text>
          </View>

          <View style={[styles.growthChart, { borderBottomColor: theme.border }]}>
            {metrics.weekCounts.map((count, i) => (
              <View key={i} style={styles.chartColWrapper}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${Math.max(4, (count / metrics.weekMax) * 100)}%`,
                      backgroundColor: i === 6 ? theme.primary : theme.border,
                      opacity: i === 6 ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.chartLabels}>
            {metrics.weekLabels.map((label, i) => (
              <Text key={i} style={[styles.chartLabelText, { color: theme.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* Ralph Waldo Emerson Reflection Prompt */}
        <View style={styles.reflectionSection}>
          <Text style={[styles.quoteText, { color: theme.text }]}>
            « La langue est une ville pour l'édification de laquelle chaque être humain a apporté une pierre. »
          </Text>
          <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>Ralph Waldo Emerson</Text>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: isDarkMode ? theme.surfaceContainer : theme.primary }]}
            onPress={handleLaunchReview}
          >
            <Text style={[styles.actionBtnText, { color: COLORS.light.background }]}>
              Réviser les acquis
            </Text>
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
  titleSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xs,
  },
  pageDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  constellationCard: {
    width: '100%',
    aspectRatio: 1.15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  constellationGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  constellationWrapper: {
    width: 320,
    height: 240,
    position: 'relative',
  },
  emptyConstellation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyConstellationText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  floatingTag: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    borderWidth: 1,
    opacity: 0.9,
  },
  glowStyle: {
    shadowColor: '#54624c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  nodeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: 4,
    opacity: 0.8,
  },
  constellationIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  pulseIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  indicatorText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  constellationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  constellationDesc: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  italicText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontStyle: 'italic',
  },
  masteryPanel: {
    alignItems: 'flex-end',
  },
  masteryLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
    marginBottom: 2,
  },
  masteryValue: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 32,
    lineHeight: 32,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bentoCard: {
    flex: 1,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  bentoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  bentoTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  barGraphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 48,
    paddingBottom: 2,
  },
  graphBar: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
  },
  emptyZonesText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  decorativeAlertGlow: {
    position: 'absolute',
    bottom: -32,
    right: -32,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  growthCard: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    marginBottom: SPACING.xl,
  },
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  growthTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 18,
  },
  growthSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  growthChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  chartColWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: BORDER_RADIUS.xs,
    borderTopRightRadius: BORDER_RADIUS.xs,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  chartLabelText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
  },
  reflectionSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  quoteText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  quoteAuthor: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    opacity: 0.6,
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    width: '80%',
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
});
