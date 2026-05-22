// Saybon v2 — Practice Flow Layer (Overlay Panel)
// A beautiful tactile exercise workspace designed with Swiss grotesk details.
// Features auto-focusing entries, glassmorphic feedback banners, and animated metrics.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/tokens';
import type { ConceptNode, Exercise } from '../../core/content/schema';
import { generateOfflineExercises } from '../../core/content/exerciseGenerator';
import { validateAnswer } from '../../core/validation/answerValidator';
import { triggerHaptic } from '../../core/validation/haptics';
import { useSessionStore } from '../../core/store/useSessionStore';
import { useProgressStore } from '../../core/store/useProgressStore';

interface PracticeFlowProps {
  conceptId?: string | null;
  conceptIds?: string[];
  onClose: () => void;
}

export function PracticeFlow({ conceptId, conceptIds, onClose }: PracticeFlowProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // ── Database Access ─────────────────────────────────────────────────────────
  const { concepts } = useProgressStore();
  const { startSession, recordAnswer, activeSession, clearSession } = useSessionStore();

  const activeConcepts = useMemo(() => {
    if (conceptIds && conceptIds.length > 0) {
      return concepts.filter((c) => conceptIds.includes(c.id));
    }
    if (conceptId) {
      const c = concepts.find((c) => c.id === conceptId);
      return c ? [c] : [];
    }
    return [];
  }, [concepts, conceptId, conceptIds]);

  // ── Exercises State ──────────────────────────────────────────────────────────
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // Timer tracking for metrics
  const exerciseStartTime = useRef<number>(Date.now());
  const inputRef = useRef<TextInput>(null);

  // ── Initialize Session & Exercises ──────────────────────────────────────────
  useEffect(() => {
    if (activeConcepts.length > 0) {
      const generated = activeConcepts.flatMap((c) => generateOfflineExercises(c));
      const shuffled = generated.sort(() => Math.random() - 0.5);
      setExercises(shuffled);
      setCurrentIndex(0);
      
      const baseLevel = activeConcepts[0]?.level || 'A1';
      startSession(baseLevel);
      exerciseStartTime.current = Date.now();
    }
    return () => {
      clearSession();
    };
  }, [activeConcepts]);

  const currentExercise = exercises[currentIndex];

  const concept = useMemo(() => {
    if (!currentExercise) return activeConcepts[0] || null;
    return activeConcepts.find((c) => c.id === currentExercise.conceptId) || null;
  }, [activeConcepts, currentExercise]);

  // ── Dynamic Offline Distractor Generation ───────────────────────────────────
  // Pick random distractors for multiple choice or fill-blank options
  const generatedOptions = useMemo(() => {
    if (!currentExercise || !concept) return [];
    if (currentExercise.options && currentExercise.options.length > 0) {
      return currentExercise.options;
    }

    // Pick 3 random distractors from same level
    const sameLevelConcepts = concepts.filter(
      (c) => c.level === concept.level && c.id !== concept.id
    );
    const shuffled = sameLevelConcepts.sort(() => Math.random() - 0.5);
    const correctVal = currentExercise.type === 'vocabulary' ? concept.english : concept.french;

    const distractors = shuffled
      .slice(0, 3)
      .map((c) => (currentExercise.type === 'vocabulary' ? c.english : c.french));

    // Combine and shuffle
    return [correctVal, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentExercise, concept, concepts]);

  // ── Auto-focus input when entering a text-type exercise ──────────────────────
  useEffect(() => {
    if (currentExercise && (currentExercise.type === 'translation' || currentExercise.type === 'vocabulary') && !isAnswered) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [currentExercise, isAnswered]);

  if (!concept || exercises.length === 0 || !currentExercise) {
    return null;
  }

  // ── Handle Action (Check / Submit) ──────────────────────────────────────────
  const handleCheck = () => {
    if (isAnswered) return;

    const finalAnswer =
      currentExercise.type === 'gender-recognition' || currentExercise.type === 'fill-blank'
        ? selectedOption || ''
        : userAnswerText;

    if (!finalAnswer.trim()) return;

    const result = validateAnswer(finalAnswer, currentExercise);
    setIsCorrect(result.isCorrect);
    setIsFuzzy(result.isFuzzyMatch || false);
    setIsAnswered(true);

    // Sensory response
    if (result.isCorrect) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }

    // Record to persistent Zustand & SQLite store
    const timeSpent = Date.now() - exerciseStartTime.current;
    recordAnswer({
      exerciseId: currentExercise.id,
      conceptId: concept?.id,
      userAnswerText: finalAnswer,
      isCorrect: result.isCorrect,
      timeSpentMs: timeSpent,
    });
  };

  // ── Handle Next Step ────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswerText('');
      setSelectedOption(null);
      setIsAnswered(false);
      exerciseStartTime.current = Date.now();
    } else {
      setShowComplete(true);
      triggerHaptic('success');
    }
  };

  // ── Animated complete metrics ───────────────────────────────────────────────
  const correctCount = activeSession?.stats.correctAnswers ?? 0;
  const totalCount = exercises.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const avgTime = activeSession?.stats.averageTime ? (activeSession.stats.averageTime / 1000).toFixed(1) : '0';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.accent,
                  width: `${((currentIndex + (isAnswered ? 1 : 0)) / exercises.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            {currentIndex + 1} / {exercises.length}
          </Text>
        </View>
        <Text style={[styles.levelBadge, { color: theme.textMuted, borderColor: theme.border }]}>
          {concept?.level}
        </Text>
      </View>

      {!showComplete ? (
        <View style={styles.workspace}>
          {/* Exercise card */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
            <Text style={[styles.exerciseCategory, { color: theme.textMuted }]}>
              {currentExercise.type.replace('-', ' ').toUpperCase()}
            </Text>
            <Text style={[styles.questionText, { color: theme.text }]}>
              {currentExercise.question}
            </Text>
            {currentExercise.hint && !isAnswered && (
              <Text style={[styles.hintText, { color: theme.textMuted }]}>
                Aide : {currentExercise.hint}
              </Text>
            )}
            {isAnswered && concept?.morphology?.decomposition && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.morphologyContainer}>
                <Text style={[styles.morphologyTitle, { color: theme.textMuted }]}>
                  DÉCOMPOSITION DU MOT
                </Text>
                <View style={styles.morphologyRow}>
                  {concept.morphology.decomposition.map((part, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.morphologyBubble,
                        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.morphologyPartText, { color: theme.text }]}>
                        {part}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Interactive input templates */}
          <View style={styles.inputArea}>
            {currentExercise.type === 'gender-recognition' ? (
              <View style={styles.genderContainer}>
                {['Masculin', 'Féminin'].map((opt) => {
                  const isSel = selectedOption === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[
                        styles.genderTile,
                        {
                          backgroundColor: isSel ? theme.accent + '22' : theme.surface,
                          borderColor: isSel ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => {
                        if (!isAnswered) {
                          setSelectedOption(opt);
                          triggerHaptic('selection');
                        }
                      }}
                      disabled={isAnswered}
                    >
                      <Text style={[styles.genderTitleText, { color: theme.text }]}>
                        {opt}
                      </Text>
                      <Text style={[styles.genderSubText, { color: theme.textMuted }]}>
                        {opt === 'Masculin' ? 'le / un' : 'la / une'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : currentExercise.type === 'fill-blank' ? (
              <View style={styles.optionsGrid}>
                {generatedOptions.map((opt) => {
                  const isSel = selectedOption === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[
                        styles.optionTile,
                        {
                          backgroundColor: isSel ? theme.accent + '22' : theme.surface,
                          borderColor: isSel ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => {
                        if (!isAnswered) {
                          setSelectedOption(opt);
                          triggerHaptic('selection');
                        }
                      }}
                      disabled={isAnswered}
                    >
                      <Text style={[styles.optionText, { color: theme.text }]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                style={[
                  styles.inputField,
                  {
                    color: theme.text,
                    borderColor: isAnswered ? theme.border : theme.accent,
                    backgroundColor: theme.surface,
                  },
                ]}
                placeholder="Écrivez votre réponse ici…"
                placeholderTextColor={theme.textMuted + '88'}
                value={userAnswerText}
                onChangeText={(t) => {
                  if (!isAnswered) setUserAnswerText(t);
                }}
                editable={!isAnswered}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleCheck}
              />
            )}
          </View>

          {/* Action button */}
          {!isAnswered ? (
            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    (currentExercise.type === 'gender-recognition' || currentExercise.type === 'fill-blank'
                      ? selectedOption
                      : userAnswerText.trim())
                      ? theme.text
                      : theme.border,
                },
              ]}
              onPress={handleCheck}
              disabled={
                !(currentExercise.type === 'gender-recognition' || currentExercise.type === 'fill-blank'
                  ? selectedOption
                  : userAnswerText.trim())
              }
            >
              <Text
                style={[
                  styles.submitButtonText,
                  {
                    color:
                      (currentExercise.type === 'gender-recognition' || currentExercise.type === 'fill-blank'
                        ? selectedOption
                        : userAnswerText.trim())
                        ? theme.background
                        : theme.textMuted,
                  },
                ]}
              >
                Valider
              </Text>
            </Pressable>
          ) : (
            <View style={styles.nextContainer}>
              {/* Feedback banner (spring overlay) */}
              <Animated.View
                entering={SlideInDown.springify().damping(20)}
                style={[
                  styles.feedbackBanner,
                  {
                    backgroundColor: isCorrect
                      ? isDarkMode
                        ? '#064E3B'
                        : '#DEF7EC'
                      : isDarkMode
                      ? '#7F1D1D'
                      : '#FDE8E8',
                    borderColor: isCorrect
                      ? isDarkMode
                        ? '#047857'
                        : '#31C48D'
                      : isDarkMode
                      ? '#B81D1D'
                      : '#F05252',
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.feedbackTitle,
                      { color: isCorrect ? (isDarkMode ? '#A7F3D0' : '#03543F') : isDarkMode ? '#FCA5A5' : '#9B1C1C' },
                    ]}
                  >
                    {isCorrect ? (isFuzzy ? 'Presque parfait !' : 'Excellent !') : 'À réviser'}
                  </Text>
                  {!isCorrect && (
                    <Text style={[styles.correctAnswerLabel, { color: isDarkMode ? '#FCA5A5' : '#9B1C1C' }]}>
                      Réponse correcte : {currentExercise.correctAnswer}
                    </Text>
                  )}
                  {currentExercise.explanation && (
                    <Text
                      style={[
                        styles.feedbackExplanation,
                        { color: isCorrect ? (isDarkMode ? '#A7F3D0' : '#03543F') : isDarkMode ? '#FCA5A5' : '#9B1C1C' },
                      ]}
                    >
                      {currentExercise.explanation}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.continueButton,
                    { backgroundColor: isCorrect ? (isDarkMode ? '#047857' : '#0E9F6E') : isDarkMode ? '#B81D1D' : '#E02424' },
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.continueButtonText}>Continuer</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </View>
      ) : (
        /* Complete session screen overlay */
        <Animated.View entering={FadeIn.duration(400)} style={styles.completeScreen}>
          <Text style={[styles.completeEmoji, { color: theme.accent }]}>✨</Text>
          <Text style={[styles.completeTitle, { color: theme.text }]}>Entraînement Terminé !</Text>
          <Text style={[styles.completeSubtitle, { color: theme.textMuted }]}>
            {activeConcepts.length > 1
              ? `Votre esprit se renforce avec ${activeConcepts.length} concepts`
              : `Votre esprit se renforce avec « ${concept?.french} »`}
          </Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricValue, { color: theme.text }]}>{accuracy}%</Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Précision</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricValue, { color: theme.text }]}>{avgTime}s</Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Vitesse moy.</Text>
            </View>
          </View>

          <Pressable style={[styles.doneButton, { backgroundColor: theme.text }]} onPress={onClose}>
            <Text style={[styles.doneButtonText, { color: theme.background }]}>
              Retourner à l'univers
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  levelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  workspace: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingBottom: SPACING.xl,
  },
  card: {
    marginTop: SPACING.md,
  },
  exerciseCategory: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  questionText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },
  inputField: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderTile: {
    flex: 1,
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  genderTitleText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  genderSubText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  optionsGrid: {
    gap: SPACING.md,
  },
  optionTile: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  nextContainer: {
    width: '100%',
  },
  feedbackBanner: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  feedbackTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 2,
  },
  correctAnswerLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 4,
  },
  feedbackExplanation: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 16,
  },
  continueButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  completeScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  completeSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    height: 100,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  morphologyContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // pure structural spacer, styling is in bubbles
  },
  morphologyTitle: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  morphologyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  morphologyBubble: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
  },
  morphologyPartText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    letterSpacing: 0.5,
  },
});
