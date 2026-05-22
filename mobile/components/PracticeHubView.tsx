// Saybon v2 — Practice Remix Hub Component (L'Atelier French Practice Studio)
// Designed strictly according to practice_generators/code.html.
// Houses stateful tactile selector blocks and a rich Sage Green generation banner.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme/tokens';
import { useProgressStore } from '../core/store/useProgressStore';

interface PracticeHubViewProps {
  onLaunchPractice: (conceptIds: string[]) => void;
}

type ModuleId = 
  | 'common' | 'weak' | 'fia'
  | 'agreements' | 'tenses' | 'subjonctif'
  | 'gender' | 'reconstruction' | 'transformations';

export function PracticeHubView({ onLaunchPractice }: PracticeHubViewProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const { concepts, progress } = useProgressStore();

  // ── Selection State ────────────────────────────────────────────────────────
  // Start with 'weak' and 'subjonctif' active to match the Stitch wireframe
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(['weak', 'subjonctif']);

  const toggleModule = (id: ModuleId) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const isSelected = (id: ModuleId) => selectedModules.includes(id);

  // ── Counts for selected groups ─────────────────────────────────────────────
  const vocabCount = ['common', 'weak', 'fia'].filter((id) => isSelected(id as ModuleId)).length;
  const grammarCount = ['agreements', 'tenses', 'subjonctif'].filter((id) => isSelected(id as ModuleId)).length;

  // ── Dynamic Remix Compilation ──────────────────────────────────────────────
  const handleLaunchRemix = () => {
    if (selectedModules.length === 0) {
      // Fallback: if nothing is selected, take 10 random concepts
      const shuffled = [...concepts].sort(() => Math.random() - 0.5).slice(0, 10);
      onLaunchPractice(shuffled.map((c) => c.id));
      return;
    }

    let compiledPool: typeof concepts = [];

    // 1. Common Words
    if (isSelected('common')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.level === 'A1')];
    }
    // 2. Weak Words
    if (isSelected('weak')) {
      const weakIds = Object.values(progress)
        .filter((p) => p.seenState && p.mastery < 3)
        .map((p) => p.conceptId);
      compiledPool = [...compiledPool, ...concepts.filter((c) => weakIds.includes(c.id))];
    }
    // 3. FIA Vocabulary
    if (isSelected('fia')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.level === 'A2')];
    }
    // 4. Agreements
    if (isSelected('agreements')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.type === 'grammar' || c.type === 'conjugation')];
    }
    // 5. Tenses
    if (isSelected('tenses')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.type === 'conjugation')];
    }
    // 6. Subjonctif
    if (isSelected('subjonctif')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.id.includes('subj') || c.french.toLowerCase().includes('que'))];
    }
    // 7. Gender (Masculine / Feminine endings)
    if (isSelected('gender')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.gender !== undefined)];
    }
    // 8. Reconstruction / Transformations (Syntax)
    if (isSelected('reconstruction') || isSelected('transformations')) {
      compiledPool = [...compiledPool, ...concepts.filter((c) => c.type === 'phrase')];
    }

    // De-duplicate the selection pool
    const uniqueIds = Array.from(new Set(compiledPool.map((c) => c.id)));
    let finalSelection = uniqueIds;

    // If pool is too small, fallback to random active concepts
    if (finalSelection.length === 0) {
      finalSelection = concepts.slice(0, 10).map((c) => c.id);
    }

    // Shuffle and cap at 10 concepts for focused calm repetition
    const shuffled = finalSelection.sort(() => Math.random() - 0.5).slice(0, 10);
    onLaunchPractice(shuffled);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.background }]}>
        <Pressable style={styles.topBarIcon}>
          <Text style={[styles.iconText, { color: theme.textMuted }]}>☰</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Studio</Text>
        <Pressable style={styles.topBarIcon}>
          <Text style={[styles.iconText, { color: theme.textMuted }]}>👤</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.primary }]}>
            Atelier de Pratique
          </Text>
          <Text style={[styles.heroDesc, { color: theme.textMuted }]}>
            Select modules to construct your intentional study session.
          </Text>
        </View>

        {/* Vocabulaire Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Vocabulaire</Text>
            <Text style={[styles.sectionBadge, { color: theme.textMuted }]}>
              {vocabCount} selected
            </Text>
          </View>

          <View style={styles.moduleList}>
            {/* Common words */}
            <Pressable
              style={[
                styles.listItem,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                isSelected('common') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
              ]}
              onPress={() => toggleModule('common')}
            >
              <View style={styles.listItemText}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>Common words</Text>
                <Text style={[styles.listItemSub, { color: theme.textMuted }]}>Core lexical frequency</Text>
              </View>
              <Text style={[styles.checkIcon, { color: isSelected('common') ? theme.primary : theme.outline }]}>
                {isSelected('common') ? '●' : '○'}
              </Text>
            </Pressable>

            {/* Weak words */}
            <Pressable
              style={[
                styles.listItem,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                isSelected('weak') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
              ]}
              onPress={() => toggleModule('weak')}
            >
              <View style={styles.listItemText}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>Weak words</Text>
                <Text style={[styles.listItemSub, { color: theme.textMuted }]}>Based on recent errors</Text>
              </View>
              <Text style={[styles.checkIcon, { color: isSelected('weak') ? theme.primary : theme.outline }]}>
                {isSelected('weak') ? '●' : '○'}
              </Text>
            </Pressable>

            {/* FIA Vocabulary */}
            <Pressable
              style={[
                styles.listItem,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                isSelected('fia') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
              ]}
              onPress={() => toggleModule('fia')}
            >
              <View style={styles.listItemText}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>FIA Vocabulary</Text>
                <Text style={[styles.listItemSub, { color: theme.textMuted }]}>Academic & Formal terms</Text>
              </View>
              <Text style={[styles.checkIcon, { color: isSelected('fia') ? theme.primary : theme.outline }]}>
                {isSelected('fia') ? '●' : '○'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Grammaire Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Grammaire</Text>
            <Text style={[styles.sectionBadge, { color: theme.textMuted }]}>
              {grammarCount} selected
            </Text>
          </View>

          <View style={styles.moduleList}>
            {/* Agreements / Tenses in columns */}
            <View style={styles.dualGrid}>
              <Pressable
                style={[
                  styles.gridItem,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  isSelected('agreements') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
                ]}
                onPress={() => toggleModule('agreements')}
              >
                <Text style={[styles.gridItemIcon, { color: theme.textMuted }]}>🔗</Text>
                <Text style={[styles.gridItemLabel, { color: theme.text }]}>Agreements</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.gridItem,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  isSelected('tenses') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
                ]}
                onPress={() => toggleModule('tenses')}
              >
                <Text style={[styles.gridItemIcon, { color: theme.textMuted }]}>🕒</Text>
                <Text style={[styles.gridItemLabel, { color: theme.text }]}>Tenses</Text>
              </Pressable>
            </View>

            {/* Le Subjonctif */}
            <Pressable
              style={[
                styles.listItem,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                isSelected('subjonctif') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
              ]}
              onPress={() => toggleModule('subjonctif')}
            >
              <View style={styles.listItemText}>
                <Text style={[styles.listItemTitle, styles.serifItalic, { color: theme.text }]}>Le Subjonctif</Text>
                <Text style={[styles.listItemSub, { color: theme.textMuted }]}>Mood & dependency</Text>
              </View>
              <Text style={[styles.checkIcon, { color: isSelected('subjonctif') ? theme.primary : theme.outline }]}>
                {isSelected('subjonctif') ? '●' : '○'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Gender & Syntaxe */}
        <View style={styles.dualSectionGrid}>
          {/* Genre Column */}
          <View style={styles.sectionColumn}>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Genre</Text>
            </View>
            <Pressable
              style={[
                styles.cardButton,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                isSelected('gender') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
              ]}
              onPress={() => toggleModule('gender')}
            >
              <Text style={[styles.cardButtonTitle, { color: theme.text }]}>Masculine / Feminine</Text>
              <Text style={[styles.cardButtonSub, { color: theme.textMuted }]}>Endings & Logic</Text>
            </Pressable>
          </View>

          {/* Syntaxe Column */}
          <View style={styles.sectionColumn}>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Syntaxe</Text>
            </View>
            <View style={styles.syntaxStack}>
              <Pressable
                style={[
                  styles.syntaxButton,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  isSelected('reconstruction') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
                ]}
                onPress={() => toggleModule('reconstruction')}
              >
                <Text style={[styles.syntaxButtonText, { color: theme.text }]}>Reconstruction</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.syntaxButton,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  isSelected('transformations') && { backgroundColor: isDarkMode ? '#222520' : '#f1f3ef', borderColor: theme.primary }
                ]}
                onPress={() => toggleModule('transformations')}
              >
                <Text style={[styles.syntaxButtonText, { color: theme.text }]}>Transformations</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Remix Action Card */}
        <View style={[styles.remixBanner, { backgroundColor: isDarkMode ? theme.surfaceContainer : theme.primary }]}>
          <Text style={[styles.remixTitle, { color: COLORS.light.background }]}>
            Générer la Session
          </Text>
          <Text style={[styles.remixSub, { color: isDarkMode ? theme.textMuted : 'rgba(249, 249, 247, 0.8)' }]}>
            Combining {selectedModules.length} selected modules for your tailored French practice.
          </Text>
          
          <Pressable 
            style={[styles.remixBtn, { backgroundColor: COLORS.light.background }]}
            onPress={handleLaunchRemix}
          >
            <Text style={[styles.remixBtnText, { color: theme.primary }]}>
              COMMENCER LE REMIX
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
  heroSection: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontStyle: 'italic',
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1.5,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  sectionBadge: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
  },
  moduleList: {
    gap: SPACING.sm + 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: 2,
  },
  serifItalic: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontStyle: 'italic',
    fontSize: 17,
  },
  listItemSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  checkIcon: {
    fontSize: 14,
    marginLeft: SPACING.md,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridItem: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gridItemIcon: {
    fontSize: 16,
  },
  gridItemLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  dualSectionGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionColumn: {
    flex: 1,
  },
  cardButton: {
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 88,
    justifyContent: 'center',
  },
  cardButtonTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 4,
  },
  cardButtonSub: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontStyle: 'italic',
    fontSize: 11,
  },
  syntaxStack: {
    gap: SPACING.sm,
  },
  syntaxButton: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
  },
  syntaxButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  remixBanner: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: SPACING.lg,
  },
  remixTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xl + 2,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.sm,
  },
  remixSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: '90%',
  },
  remixBtn: {
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remixBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.0,
  },
});
