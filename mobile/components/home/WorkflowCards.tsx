import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';

interface WorkflowCardsProps {
  onStartStandard: () => void;
  onStartWeak: () => void;
}

export function WorkflowCards({ onStartStandard, onStartWeak }: WorkflowCardsProps) {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <View style={styles.workflowSection}>
      {/* Continue Practice Card (Flux de travail) */}
      <Pressable 
        style={[
          styles.continueCard, 
          { 
            backgroundColor: isDarkMode ? 'rgba(188, 203, 176, 0.08)' : '#FFFFFF', 
            borderColor: theme.primary,
            borderWidth: 1,
          }
        ]}
        onPress={onStartStandard}
      >
        {/* Elegant Sage Pattern Background Overlay */}
        <View style={styles.patternContainer}>
          <View style={[styles.patternCircle, { borderColor: isDarkMode ? 'rgba(188, 203, 176, 0.16)' : 'rgba(84, 98, 76, 0.16)' }]} />
          <View style={[styles.patternCircle2, { borderColor: isDarkMode ? 'rgba(188, 203, 176, 0.12)' : 'rgba(84, 98, 76, 0.12)' }]} />
          <View style={[styles.patternDiamond, { borderColor: isDarkMode ? 'rgba(188, 203, 176, 0.14)' : 'rgba(84, 98, 76, 0.14)' }]}>
            <Text style={{ color: isDarkMode ? 'rgba(188, 203, 176, 0.14)' : 'rgba(84, 98, 76, 0.14)', fontSize: 72 }}>◇</Text>
          </View>
        </View>

        <View style={[styles.continueHeader, { zIndex: 1 }]}>
          <Text style={[styles.workflowBadge, { color: theme.primary }]}>
            FLUX DE TRAVAIL
          </Text>
          <Text style={[styles.continueTitle, { color: theme.text }]}>
            Continuer la pratique
          </Text>
        </View>
        
        <View style={[styles.continueFooter, { zIndex: 1 }]}>
          <Text style={[styles.continueActionText, { color: theme.textMuted }]}>
            REPRENDRE OÙ VOUS ÉTIEZ
          </Text>
          <Text style={[styles.continueArrow, { color: theme.primary }]}> ➔</Text>
        </View>
      </Pressable>

      {/* Concepts fragiles Card */}
      <Pressable 
        style={[
          styles.continueCard, 
          { 
            backgroundColor: theme.surfaceMuted, 
            borderColor: theme.border,
            borderWidth: 1,
            minHeight: 130,
          }
        ]}
        onPress={onStartWeak}
      >
        <View style={styles.continueHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs }}>
            <Text style={[styles.workflowBadge, { color: theme.primary, marginBottom: 0 }]}>
              SÉANCE DE RATTRAPAGE
            </Text>
            <Text style={{ fontSize: 9, color: theme.primary }}>⬨</Text>
          </View>
          <Text style={[styles.continueTitle, { color: theme.text, fontSize: 20, lineHeight: 24 }]}>
            Concepts fragiles
          </Text>
          <Text style={[styles.gridCardDesc, { color: theme.textMuted, marginTop: 4, maxWidth: '85%' }]}>
            Renforcer vos points faibles basés sur vos dernières erreurs.
          </Text>
        </View>
        
        <View style={[styles.continueFooter, { marginTop: SPACING.md }]}>
          <Text style={[styles.continueActionText, { color: theme.textMuted }]}>
            RÉVISER LES CONCEPTS INCERTAINS
          </Text>
          <Text style={[styles.continueArrow, { color: theme.primary }]}> ➔</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  workflowSection: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  continueCard: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  continueHeader: {
    flex: 1,
  },
  workflowBadge: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  continueTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    maxWidth: '80%',
    lineHeight: 32,
  },
  continueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  continueActionText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
  continueArrow: {
    fontSize: 10,
  },
  gridCardDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.8,
  },
  patternContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 0,
  },
  patternCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    right: -40,
    top: -50,
  },
  patternCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    right: 20,
    bottom: -40,
  },
  patternDiamond: {
    position: 'absolute',
    left: -20,
    bottom: -20,
    transform: [{ rotate: '45deg' }],
  },
});
