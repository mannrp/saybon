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
  useAnimatedStyle as useAnimatedStyleRe,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';
import { useAppTheme } from '../theme/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Floating Concept Node Component ──────────────────────────────────────────
interface FloatingNodeProps {
  label: string;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  delay: number;
  isGlow?: boolean;
}

function FloatingNode({
  label,
  initialX,
  initialY,
  size,
  color,
  delay,
  isGlow = false,
}: FloatingNodeProps) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isGlow ? 0.35 : 0.7);

  useEffect(() => {
    // Drifting motion
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialX + 5, {
            duration: 5000 + delay % 1000,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(initialX, {
            duration: 5000 + delay % 1000,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialY - 8, {
            duration: 6000 + delay % 1000,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(initialY, {
            duration: 6000 + delay % 1000,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    // Pulse node scale
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.12, {
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.floatingTag, animatedStyle]}>
      {/* Node Circle */}
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
      {/* Floating text label under the node */}
      <Text style={styles.nodeText}>{label}</Text>
    </Animated.View>
  );
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
  const { progress, concepts } = useProgressStore();

  const metrics = useMemo(() => {
    const progressList = Object.values(progress);
    const seenList = progressList.filter((p) => p.seenState);
    const totalSeen = seenList.length;
    const mastered = seenList.filter((p) => p.mastery >= 4).length;

    // A1 and A2 details
    const a1Concepts = concepts.filter((c) => c.level === 'A1');
    const a2Concepts = concepts.filter((c) => c.level === 'A2');
    
    const a1Seen = a1Concepts.filter((c) => progress[c.id]?.seenState).length;
    const a2Seen = a2Concepts.filter((c) => progress[c.id]?.seenState).length;

    // Dynamic Mastery percentage formula
    const masteryPercent = totalSeen > 0 ? Math.round((mastered / totalSeen) * 100) : 84;

    return {
      totalSeen: totalSeen > 0 ? totalSeen : 482,
      mastered: mastered > 0 ? mastered : 24,
      a1Seen,
      a1Total: a1Concepts.length > 0 ? a1Concepts.length : 15,
      a2Seen,
      a2Total: a2Concepts.length > 0 ? a2Concepts.length : 15,
      masteryPercent,
    };
  }, [progress, concepts]);

  // Launch a custom review practice flow using all concepts that have been seen
  const handleLaunchReview = () => {
    const seenIds = Object.values(progress)
      .filter((p) => p.seenState)
      .map((p) => p.conceptId);

    if (seenIds.length === 0) {
      // Fallback: use 10 standard concepts
      const shuffled = [...concepts].sort(() => Math.random() - 0.5).slice(0, 10);
      navigation.navigate('PracticeSession', { conceptIds: shuffled.map((c) => c.id) });
    } else {
      const shuffled = seenIds.sort(() => Math.random() - 0.5).slice(0, 10);
      navigation.navigate('PracticeSession', { conceptIds: shuffled });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Votre Parcours</Text>
          <Text style={[styles.pageDesc, { color: theme.textMuted }]}>
            Une réflexion sur votre maîtrise linguistique à travers le temps et les concepts.
          </Text>
        </View>

        {/* 2D Animated Constellation Box */}
        <View style={[styles.constellationCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          {/* Subtle background gradient glow overlay representation */}
          <View style={[styles.constellationGlow, { backgroundColor: theme.primary, opacity: isDarkMode ? 0.05 : 0.02 }]} />
          
          <View style={styles.constellationWrapper}>
            {/* Mastered Node (Sage Green Glow) */}
            <FloatingNode
              label="Grammaire"
              initialX={40}
              initialY={40}
              size={24}
              color={theme.primary}
              delay={0}
              isGlow={true}
            />

            {/* Syntaxe Node (Sage Green) */}
            <FloatingNode
              label="Syntaxe"
              initialX={180}
              initialY={25}
              size={32}
              color={isDarkMode ? '#8c9b82' : '#54624c'}
              delay={1500}
            />

            {/* Lexique Node (Sand/Brownish) */}
            <FloatingNode
              label="Lexique"
              initialX={270}
              initialY={60}
              size={20}
              color={isDarkMode ? '#cbc6bc' : '#615e56'}
              delay={800}
            />

            {/* Prononciation Node (Main Big Sage) */}
            <FloatingNode
              label="Prononciation"
              initialX={130}
              initialY={140}
              size={44}
              color={theme.primary}
              delay={2200}
              isGlow={true}
            />

            {/* Idiomes Node (Minor Sand) */}
            <FloatingNode
              label="Idiomes"
              initialX={250}
              initialY={190}
              size={12}
              color={isDarkMode ? '#d6c4aa' : '#a4947c'}
              delay={3000}
            />

            {/* Argot Node (Minor Warm Gray) */}
            <FloatingNode
              label="Argot"
              initialX={50}
              initialY={180}
              size={16}
              color={isDarkMode ? '#cbc6bc' : '#615e56'}
              delay={1200}
            />
          </View>

          {/* Floating Indicator Badge */}
          <View style={[styles.constellationIndicator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.pulseIndicatorDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.indicatorText, { color: theme.text }]}>Constellation de Concept</Text>
          </View>
        </View>

        {/* Constellation Description Panel */}
        <View style={styles.constellationFooter}>
          <Text style={[styles.constellationDesc, { color: theme.textMuted }]}>
            Votre maîtrise s'étend vers la <Text style={styles.italicText}>Syntaxe complexe</Text>. Les zones lumineuses indiquent une rétention profonde.
          </Text>
          <View style={styles.masteryPanel}>
            <Text style={[styles.masteryLabel, { color: theme.primary }]}>MAÎTRISE</Text>
            <Text style={[styles.masteryValue, { color: theme.text }]}>{metrics.masteryPercent}%</Text>
          </View>
        </View>

        {/* Bento Box Grid Row 1 */}
        <View style={styles.bentoRow}>
          {/* Explorations Bento Card */}
          <View style={[styles.bentoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.bentoLabel, { color: theme.textMuted }]}>EXPLORATIONS</Text>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                {metrics.totalSeen} Mots & expressions
              </Text>
            </View>
            
            {/* Custom Bar Graph */}
            <View style={styles.barGraphContainer}>
              <View style={[styles.graphBar, { height: 12, backgroundColor: theme.primary, opacity: 0.2 }]} />
              <View style={[styles.graphBar, { height: 20, backgroundColor: theme.primary, opacity: 0.3 }]} />
              <View style={[styles.graphBar, { height: 16, backgroundColor: theme.primary, opacity: 0.2 }]} />
              <View style={[styles.graphBar, { height: 32, backgroundColor: theme.primary, opacity: 0.5 }]} />
              <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary }]} />
              <View style={[styles.graphBar, { height: 28, backgroundColor: theme.primary, opacity: 0.6 }]} />
              <View style={[styles.graphBar, { height: 48, backgroundColor: theme.primary }]} />
            </View>
          </View>

          {/* Zones de Vigilance Bento Card */}
          <View style={[styles.bentoCard, { backgroundColor: theme.secondaryContainer, borderColor: theme.border, position: 'relative', overflow: 'hidden' }]}>
            <Text style={[styles.bentoLabel, { color: theme.textMuted }]}>ZONES DE VIGILANCE</Text>
            <View style={styles.tagsContainer}>
              <View style={[styles.tagBadge, { backgroundColor: theme.background + '88', borderColor: theme.border }]}>
                <Text style={[styles.tagBadgeText, { color: theme.text }]}>Subjonctif</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: theme.background + '88', borderColor: theme.border }]}>
                <Text style={[styles.tagBadgeText, { color: theme.text }]}>Genre des noms</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: theme.background + 'cc', borderColor: theme.primary }]}>
                <Text style={[styles.tagBadgeText, { color: theme.text, fontWeight: TYPOGRAPHY.fontWeight.bold }]}>Passé Composé</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: theme.background + '88', borderColor: theme.border }]}>
                <Text style={[styles.tagBadgeText, { color: theme.text }]}>Liaisons</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: theme.background + '88', borderColor: theme.border }]}>
                <Text style={[styles.tagBadgeText, { color: theme.text }]}>Pronoms</Text>
              </View>
            </View>
            
            {/* Subtle alert highlight glow in corner */}
            <View style={[styles.decorativeAlertGlow, { backgroundColor: theme.error, opacity: 0.08 }]} />
          </View>
        </View>

        {/* Growth over time Bento Card (Spans across both columns) */}
        <View style={[styles.growthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.growthHeader}>
            <Text style={[styles.growthTitle, { color: theme.text }]}>Croissance Mensuelle</Text>
            <Text style={[styles.growthSub, { color: theme.textMuted }]}>+12% vs le mois dernier</Text>
          </View>
          
          <View style={[styles.growthChart, { borderBottomColor: theme.border }]}>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '40%', backgroundColor: theme.border }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '35%', backgroundColor: theme.border }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '55%', backgroundColor: theme.border }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '45%', backgroundColor: theme.border }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '70%', backgroundColor: theme.border }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '85%', backgroundColor: theme.primary }]} /></View>
            <View style={styles.chartColWrapper}><View style={[styles.chartBar, { height: '95%', backgroundColor: theme.primary, opacity: 0.8 }]} /></View>
          </View>
          
          <View style={styles.chartLabels}>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Jan</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Fév</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Mar</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Avr</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Mai</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Juin</Text>
            <Text style={[styles.chartLabelText, { color: theme.textMuted }]}>Juil</Text>
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
