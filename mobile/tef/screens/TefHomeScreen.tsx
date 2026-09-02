// SayBon — TEF Canada Mode: Home Screen
// Shows the unverified-scale notice (mandatory per TEF_MODE_DESIGN.md §6.1),
// item counts, and — once CE has content — a way into the drill loop
// (§5: DrillSetup -> DrillRunner -> DrillSummary).

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import { useTefStore } from '../store/useTefStore';
import { isNclcScaleVerified, NCLC_SCALE_SOURCE } from '../data/nclcScale';
import type { TefStackParamList } from '../navigation/TefNavigator';

type Props = NativeStackScreenProps<TefStackParamList, 'TefHome'>;

export function TefHomeScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const itemCounts = useTefStore((s) => s.itemCounts);
  const isLoaded = useTefStore((s) => s.isLoaded);
  const loadItemCounts = useTefStore((s) => s.loadItemCounts);

  useEffect(() => {
    loadItemCounts();
  }, [loadItemCounts]);

  const totalItems = (itemCounts.CE ?? 0) + (itemCounts.CO ?? 0) + (itemCounts.EE ?? 0);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>
            IMMIGRATION FRANÇAISE
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>TEF Canada</Text>
          <Text style={[styles.headerDesc, { color: theme.textMuted }]}>
            Focused drills for Compréhension écrite, Compréhension orale, and
            Expression écrite. Targeting NCLC 7.
          </Text>
        </View>

        {!isNclcScaleVerified() && (
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.noticeTitle, { color: theme.text }]}>
              Unverified NCLC scale
            </Text>
            <Text style={[styles.noticeBody, { color: theme.textMuted }]}>
              Band thresholds are a working draft and have not yet been checked
              against the official IRCC scale. No band estimate will be shown
              until this is verified.
            </Text>
            <Text style={[styles.noticeSource, { color: theme.textMuted }]}>
              {NCLC_SCALE_SOURCE}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Content status</Text>
          {!isLoaded ? (
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>Loading…</Text>
          ) : totalItems === 0 ? (
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>
              No items yet. The content pipeline (scripts/tef/generateItems.ts)
              has not been run. This screen will list drills once items exist.
            </Text>
          ) : (
            <>
              <Text style={[styles.cardBody, { color: theme.textMuted }]}>
                CE: {itemCounts.CE ?? 0} · CO: {itemCounts.CO ?? 0} · EE: {itemCounts.EE ?? 0}
              </Text>
            </>
          )}
        </View>

        {isLoaded && (itemCounts.CE ?? 0) > 0 && (
          <Pressable
            onPress={() => navigation.navigate('DrillSetup')}
            style={[styles.startButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.startButtonText, { color: theme.onPrimary }]}>Start a drill</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  headerLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    marginBottom: SPACING.sm,
  },
  headerDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
  },
  notice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noticeTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  noticeBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  noticeSource: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  cardBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  startButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  startButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
