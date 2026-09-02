import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { EtoileCluster } from '../EtoileCluster';

export const EtoileSection = React.memo(function EtoileSection() {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <View style={styles.etoileSection}>
      <Text style={[styles.etoileLabel, { color: theme.textMuted }]}>MAÎTRISE ACTUELLE</Text>
      <View style={styles.etoileClusterContainer}>
        <EtoileCluster theme={theme} isDarkMode={isDarkMode} />
      </View>
      <Text style={[styles.etoileSubtitle, { color: theme.textMuted }]}>
        Votre constellation de connaissances s'étend. Continuez l'exploration quotidienne.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  etoileSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  etoileLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.lg,
  },
  etoileClusterContainer: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etoileSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: SPACING.md,
    lineHeight: 18,
    opacity: 0.6,
  },
});
