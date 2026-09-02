// SayBon — TEF Drill Runner
// Thin shell — all state lives in useDrillSession (TEF_MODE_DESIGN.md §2's
// directory intent). Answer -> immediate lock -> RationaleSheet -> deliberate
// advance (no auto-advance, per §5.2).

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import { useDrillSession } from '../hooks/useDrillSession';
import { StimulusPane } from '../components/StimulusPane';
import { RationaleSheet } from '../components/RationaleSheet';
import type { TefStackParamList } from '../navigation/TefNavigator';

type Props = NativeStackScreenProps<TefStackParamList, 'DrillRunner'>;

export function DrillRunnerScreen({ route, navigation }: Props) {
  const { module, count } = route.params;
  const { theme } = useAppTheme();
  const session = useDrillSession({ module, count });

  React.useEffect(() => {
    if (session.status === 'complete' && session.summary) {
      navigation.replace('DrillSummary', { summary: session.summary });
    }
  }, [session.status, session.summary, navigation]);

  if (session.status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (session.status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          {session.error ?? 'Something went wrong.'}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const item = session.currentItem;
  if (!item) return null;

  const correct = session.isLocked && session.selectedOptionId === item.correctOptionId;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.progressRow}>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>
          {session.currentIndex + 1} / {session.items.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {session.currentStimulus && <StimulusPane stimulus={session.currentStimulus} />}

        <Text style={[styles.prompt, { color: theme.text }]}>{item.prompt}</Text>

        {item.options.map((option) => {
          const isSelected = session.selectedOptionId === option.id;
          const isCorrectOption = option.id === item.correctOptionId;

          let borderColor: string = theme.border;
          let backgroundColor: string = theme.surface;
          if (session.isLocked) {
            if (isCorrectOption) {
              borderColor = theme.success;
              backgroundColor = theme.surfaceMuted;
            } else if (isSelected) {
              borderColor = theme.error;
            }
          } else if (isSelected) {
            borderColor = theme.primary;
            backgroundColor = theme.surfaceMuted;
          }

          return (
            <Pressable
              key={option.id}
              disabled={session.isLocked}
              onPress={() => session.selectOption(option.id)}
              style={[styles.option, { borderColor, backgroundColor }]}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>{option.text}</Text>
            </Pressable>
          );
        })}

        {session.isLocked && (
          <RationaleSheet item={item} chosenOptionId={session.selectedOptionId} correct={correct} />
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        {!session.isLocked ? (
          <Pressable
            disabled={!session.selectedOptionId}
            onPress={session.lockAnswer}
            style={[
              styles.primaryButton,
              {
                backgroundColor: session.selectedOptionId ? theme.primary : theme.surfaceContainer,
              },
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: session.selectedOptionId ? theme.onPrimary : theme.textMuted },
              ]}
            >
              Check answer
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={session.next}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>
              {session.currentIndex + 1 >= session.items.length ? 'Finish' : 'Continue'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  errorText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  backButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  progressRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  progressText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 0.6,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  prompt: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
