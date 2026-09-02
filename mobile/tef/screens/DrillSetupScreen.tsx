// SayBon — TEF Drill Setup
// Module picker. Only modules with content are selectable — CO/EE will show
// as locked until their relay batches (see .relay/tasks/) are integrated.

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme/tokens';
import { useTefStore } from '../store/useTefStore';
import type { TefStackParamList } from '../navigation/TefNavigator';
import type { TefModule } from '../data/itemSchema';

type Props = NativeStackScreenProps<TefStackParamList, 'DrillSetup'>;

const MODULE_INFO: Record<TefModule, { label: string; description: string }> = {
  CE: { label: 'Compréhension écrite', description: 'Reading — passages, documents, grammar in context' },
  CO: { label: 'Compréhension orale', description: 'Listening — audio not yet available' },
  EE: { label: 'Expression écrite', description: 'Writing — timed composer, not a drill' },
};

export function DrillSetupScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const itemCounts = useTefStore((s) => s.itemCounts);
  const isLoaded = useTefStore((s) => s.isLoaded);
  const loadItemCounts = useTefStore((s) => s.loadItemCounts);

  useEffect(() => {
    if (!isLoaded) loadItemCounts();
  }, [isLoaded, loadItemCounts]);

  const startDrill = (module: TefModule) => {
    navigation.navigate('DrillRunner', { module, count: 10 });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Choose a drill</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          10 items, untimed. Answers are locked in immediately so you see why.
        </Text>
      </View>

      {(Object.keys(MODULE_INFO) as TefModule[]).map((module) => {
        const count = itemCounts[module] ?? 0;
        const disabled = module !== 'CE' || count === 0;
        return (
          <Pressable
            key={module}
            disabled={disabled}
            onPress={() => startDrill(module)}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {MODULE_INFO[module].label}
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              {MODULE_INFO[module].description}
            </Text>
            <Text style={[styles.cardCount, { color: theme.primary }]}>
              {isLoaded ? `${count} items` : 'Loading…'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: SPACING.lg },
  header: { marginBottom: SPACING.lg },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
  },
  cardCount: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
