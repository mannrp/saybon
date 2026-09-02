// Saybon v2 — Tactile Genre Swipe Arena (Masculin / Féminin Tinder Game)
// An elegant, distraction-free card swiper designed with premium typography.
// Swipe Right -> Masculin (Sky Blue). Swipe Left -> Féminin (Rose/Pink).
// Aligned strictly with SKILL.md rules: UI-thread animations (Reanimated), Gesture Handler, and Safe Area context.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { useProgressStore } from '../../core/store/useProgressStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/tokens';
import { triggerHaptic } from '../../core/validation/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface GenreSwipeFlowProps {
  navigation: any;
}

export function GenreSwipeFlow({ navigation }: GenreSwipeFlowProps) {
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const concepts = useProgressStore((s) => s.concepts);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);

  // 1. Gather all noun concepts with explicit gender
  const nouns = useMemo(() => {
    const gendered = concepts.filter((c) => c.gender === 'M' || c.gender === 'F');
    return gendered.sort(() => Math.random() - 0.5);
  }, [concepts]);

  // 2. Play state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [history, setHistory] = useState<{ word: string; gender: 'M' | 'F'; isCorrect: boolean }[]>([]);

  const activeNoun = nouns[currentIndex] || null;
  const nextNoun = nouns[currentIndex + 1] || null;

  // 3. UI-thread Reanimated shared values for smooth 60fps gestures
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // 4. JS-thread state updates (called from UI-thread on complete gesture)
  const completeSwipe = (chosenGender: 'M' | 'F') => {
    if (!activeNoun) return;

    const isCorrectChoice = activeNoun.gender === chosenGender;
    recordAnswer(activeNoun.id, isCorrectChoice).catch((err) =>
      console.warn("Could not record swipe progress:", err)
    );

    // Play tactile responses
    if (isCorrectChoice) {
      triggerHaptic('success');
      setScore((s) => s + 1);
      setStreak((st) => {
        const nextSt = st + 1;
        if (nextSt > maxStreak) setMaxStreak(nextSt);
        return nextSt;
      });
    } else {
      triggerHaptic('error');
      setStreak(0);
    }

    setHistory((h) => [
      ...h,
      { word: activeNoun.french, gender: activeNoun.gender as 'M' | 'F', isCorrect: isCorrectChoice },
    ]);

    // Advance to next noun
    translateX.value = 0;
    translateY.value = 0;
    
    if (currentIndex + 1 < Math.min(nouns.length, 20)) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowSummary(true);
    }
  };

  // 5. GestureDetector - 100% Native Gesture handling
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe Right -> Masculin (M)
        translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 150 }, () => {
          runOnJS(completeSwipe)('M');
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe Left -> Féminin (F)
        translateX.value = withTiming(-SCREEN_WIDTH - 100, { duration: 150 }, () => {
          runOnJS(completeSwipe)('F');
        });
      } else {
        // Snap back using gentle spring physics on the UI-thread
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const handleManualPress = (chosenGender: 'M' | 'F') => {
    const targetX = chosenGender === 'M' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    translateX.value = withTiming(targetX, { duration: 200 }, () => {
      runOnJS(completeSwipe)(chosenGender);
    });
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setShowSummary(false);
    setHistory([]);
    translateX.value = 0;
    translateY.value = 0;
  };

  // 6. Interpolated UI-thread styles for beautiful indicators and color shifts
  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-8, 0, 8],
      Extrapolate.CLAMP
    );

    // Smooth gradient transitions between pink / neutral / blue
    const opacityFem = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 4, -30, 0],
      [1, 0.15, 0],
      Extrapolate.CLAMP
    );

    const opacityMasc = interpolate(
      translateX.value,
      [0, 30, SCREEN_WIDTH / 4],
      [0, 0.15, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const animatedFemIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH / 4, -40, 0], [1, 0.2, 0], Extrapolate.CLAMP),
  }));

  const animatedMascIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 40, SCREEN_WIDTH / 4], [0, 0.2, 1], Extrapolate.CLAMP),
  }));

  const currentCount = history.length;
  const totalCount = Math.min(nouns.length, 20);

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Arène du Genre</Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
        </View>
      </View>

      {!showSummary && activeNoun ? (
        <View style={styles.container}>
          {/* Top Info Bar */}
          <View style={styles.indicatorRow}>
            <Text style={[styles.progressText, { color: theme.textMuted }]}>
              MOT {currentCount + 1} SUR {totalCount}
            </Text>
            {streak > 1 && (
              <Text style={[styles.streakBadge, { color: theme.primary, borderColor: theme.border }]}>
                🔥 STREAK: {streak}
              </Text>
            )}
          </View>

          {/* Core Interactive Card Deck */}
          <View style={styles.deck}>
            {/* Background card mockup for visual depth */}
            {nextNoun && (
              <View style={[styles.card, styles.backCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} pointerEvents="none">
                <Text style={[styles.backCardTitle, { color: theme.textMuted }]}>
                  {nextNoun.french}
                </Text>
              </View>
            )}

            {/* Main Interactive swipe card wrapped in modern GestureDetector */}
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? theme.surface : '#FFFFFF',
                    borderColor: theme.border,
                  },
                  animatedCardStyle,
                ]}
              >
                {/* Overlaid Indicators when Swiping (animated on the UI-thread) */}
                <Animated.View style={[styles.indicator, styles.indicatorFeminine, animatedFemIndicatorStyle]}>
                  <Text style={styles.indicatorText}>FÉMININ</Text>
                  <Text style={styles.indicatorSub}>la / une</Text>
                </Animated.View>

                <Animated.View style={[styles.indicator, styles.indicatorMasculine, animatedMascIndicatorStyle]}>
                  <Text style={styles.indicatorText}>MASCULIN</Text>
                  <Text style={styles.indicatorSub}>le / un</Text>
                </Animated.View>

                {/* Central Noun content */}
                <View style={styles.cardContent}>
                  <Text style={[styles.nounLabel, { color: theme.textMuted }]}>QUEL EST LE GENRE ?</Text>
                  <Text style={[styles.nounWord, { color: theme.text }]}>
                    {activeNoun.french}
                  </Text>
                  <Text style={[styles.nounTranslation, { color: theme.textMuted }]}>
                    "{activeNoun.english}"
                  </Text>
                </View>
                
                <Text style={[styles.swipeHint, { color: theme.textMuted }]}>
                  ◀ Glissez à gauche pour F  |  Glissez à droite pour M ▶
                </Text>
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Quick Click Buttons for Accessibility & Touch backup */}
          <View style={styles.buttonActionRow}>
            <Pressable
              style={[styles.actionBtn, styles.btnFem, { backgroundColor: '#FDE8E8', borderColor: '#F05252' }]}
              onPress={() => handleManualPress('F')}
            >
              <Text style={[styles.btnText, { color: '#9B1C1C' }]}>♀ FÉMININ</Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionBtn, styles.btnMasc, { backgroundColor: '#E1EFFE', borderColor: '#3F83F8' }]}
              onPress={() => handleManualPress('M')}
            >
              <Text style={[styles.btnText, { color: '#1E40AF' }]}>♂ MASCULIN</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Arena Completion Summary Screen */
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryIcon}>🏆</Text>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Session Terminée !</Text>
          <Text style={[styles.summarySubtitle, { color: theme.textMuted }]}>
            Votre précision de genre s'affine pas à pas.
          </Text>

          <View style={styles.metricsBox}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {score} / {totalCount}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Correction</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {maxStreak}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Max Streak</Text>
            </View>
          </View>

          {/* History details */}
          <Text style={[styles.historyHeader, { color: theme.textMuted }]}>HISTORIQUE DES MOTS</Text>
          <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {history.map((h, idx) => (
              <View key={idx} style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.historyWordText, { color: theme.text }]}>
                  {h.word}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.historyGenderTag, {
                    color: h.gender === 'M' ? '#1E40AF' : '#9B1C1C',
                    backgroundColor: h.gender === 'M' ? '#E1EFFE' : '#FDE8E8'
                  }]}>
                    {h.gender === 'M' ? 'Masculin' : 'Féminin'}
                  </Text>
                  <Text style={{ fontSize: 13 }}>{h.isCorrect ? '✅' : '❌'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable style={[styles.restartBtn, { backgroundColor: theme.text }]} onPress={handleReset}>
            <Text style={[styles.restartBtnText, { color: theme.background }]}>Recommencer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  progressText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
  streakBadge: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  deck: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING.md,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  backCard: {
    transform: [{ scale: 0.96 }, { translateY: 12 }],
    zIndex: -1,
  },
  backCardTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    opacity: 0.2,
  },
  indicator: {
    position: 'absolute',
    top: 20,
    borderWidth: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    transform: [{ rotate: '-15deg' }],
  },
  indicatorFeminine: {
    left: 20,
    borderColor: '#F05252',
  },
  indicatorMasculine: {
    right: 20,
    borderColor: '#3F83F8',
    transform: [{ rotate: '15deg' }],
  },
  indicatorText: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1.0,
  },
  indicatorSub: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nounLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    opacity: 0.7,
  },
  nounWord: {
    fontSize: 36,
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nounTranslation: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  swipeHint: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
  },
  buttonActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFem: {},
  btnMasc: {},
  btnText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  summaryIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  metricsBox: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  metricCard: {
    flex: 1,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 10,
  },
  historyHeader: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  historyScroll: {
    width: '100%',
    maxHeight: 180,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xl,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyWordText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyGenderTag: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.xs,
  },
  restartBtn: {
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  restartBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
