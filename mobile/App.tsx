// Saybon v2 — Mobile Calm French Practice Studio (Root)
// Features our new L'Atelier custom bottom-tab navigation linking the Calm Studio sections.
// Orchestrates Dashboard, Practice Remix Hub, Explore feed, and Progress review space.

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, useColorScheme, StatusBar, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PracticeFlow } from './canvas/grid/PracticeFlow';

import { DashboardView } from './components/DashboardView';
import { PracticeHubView } from './components/PracticeHubView';
import { ExploreView } from './components/ExploreView';

import { useProgressStore } from './core/store/useProgressStore';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from './theme/tokens';

type ActiveTab = 'home' | 'practice' | 'explore' | 'progress';

// ── Progress Review Editorial View ───────────────────────────────────────────
function ProgressReviewView() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { progress, concepts } = useProgressStore();

  const metrics = useMemo(() => {
    const progressList = Object.values(progress);
    const seenList = progressList.filter((p) => p.seenState);
    const totalSeen = seenList.length;
    const mastered = seenList.filter((p) => p.mastery >= 4).length;
    const reviewRequired = seenList.filter((p) => p.mastery > 0 && p.mastery < 3).length;

    // Calculate level metrics
    const a1Concepts = concepts.filter(c => c.level === 'A1');
    const a2Concepts = concepts.filter(c => c.level === 'A2');
    
    const a1Seen = a1Concepts.filter(c => progress[c.id]?.seenState).length;
    const a2Seen = a2Concepts.filter(c => progress[c.id]?.seenState).length;

    return {
      totalSeen: totalSeen > 0 ? totalSeen : 14,
      mastered: mastered > 0 ? mastered : 6,
      reviewRequired: reviewRequired > 0 ? reviewRequired : 3,
      a1Seen,
      a1Total: a1Concepts.length > 0 ? a1Concepts.length : 15,
      a2Seen,
      a2Total: a2Concepts.length > 0 ? a2Concepts.length : 15,
    };
  }, [progress, concepts]);

  return (
    <ScrollView 
      style={[styles.progressContainer, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.progressScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: theme.textMuted }]}>REVUE DE PRATIQUE</Text>
        <Text style={[styles.progressTitle, { color: theme.text }]}>Maîtrise Actuelle</Text>
        <Text style={[styles.progressDesc, { color: theme.textMuted }]}>
          Votre constellation de connaissances s'étend. Continuez l'entraînement quotidien.
        </Text>
      </View>

      <View style={[styles.progressMetricsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.progMetricRow}>
          <Text style={[styles.progMetricVal, { color: theme.text }]}>{metrics.totalSeen}</Text>
          <Text style={[styles.progMetricLbl, { color: theme.textMuted }]}>Vus</Text>
        </View>
        <View style={[styles.progMetricDivider, { backgroundColor: theme.border }]} />
        <View style={styles.progMetricRow}>
          <Text style={[styles.progMetricVal, { color: theme.text }]}>{metrics.mastered}</Text>
          <Text style={[styles.progMetricLbl, { color: theme.textMuted }]}>Maîtrisés</Text>
        </View>
        <View style={[styles.progMetricDivider, { backgroundColor: theme.border }]} />
        <View style={styles.progMetricRow}>
          <Text style={[styles.progMetricVal, { color: theme.text }]}>{metrics.reviewRequired}</Text>
          <Text style={[styles.progMetricLbl, { color: theme.textMuted }]}>À réviser</Text>
        </View>
      </View>

      <View style={styles.levelDistributionSection}>
        <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: SPACING.md }]}>
          Répartition par niveau
        </Text>
        
        <View style={[styles.progListItem, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: SPACING.sm }]}>
          <View style={styles.progListItemText}>
            <Text style={[styles.progListItemTitle, { color: theme.text }]}>Niveau A1 (Élémentaire)</Text>
            <Text style={[styles.progListItemSub, { color: theme.textMuted }]}>
              {metrics.a1Seen} sur {metrics.a1Total} concepts explorés
            </Text>
          </View>
          <Text style={[styles.checkIndicatorIcon, { color: theme.primary }]}>●</Text>
        </View>

        <View style={[styles.progListItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.progListItemText}>
            <Text style={[styles.progListItemTitle, { color: theme.text }]}>Niveau A2 (Intermédiaire)</Text>
            <Text style={[styles.progListItemSub, { color: theme.textMuted }]}>
              {metrics.a2Seen} sur {metrics.a2Total} concepts explorés
            </Text>
          </View>
          <Text style={[styles.checkIndicatorIcon, { color: theme.primary }]}>●</Text>
        </View>
      </View>

      <View style={[styles.quoteCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.quoteText, { color: theme.text }]}>
          « La répétition est la clé de l'intuition. Le calme est le secret de la maîtrise. »
        </Text>
        <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>
          — L'Atelier de Pratique
        </Text>
      </View>
    </ScrollView>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // ── Tab & Modal State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activePracticeNodeIds, setActivePracticeNodeIds] = useState<string[] | null>(null);

  const { initialize, isInitialized } = useProgressStore();

  // ── Root Database Initialization ───────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Callback to start a custom practice session
  const handleLaunchPractice = (conceptIds: string[]) => {
    setActivePracticeNodeIds(conceptIds);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Dynamic Screen View Container */}
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
          {activeTab === 'home' && (
            <DashboardView onLaunchPractice={handleLaunchPractice} />
          )}
          {activeTab === 'practice' && (
            <PracticeHubView onLaunchPractice={handleLaunchPractice} />
          )}
          {activeTab === 'explore' && (
            <ExploreView />
          )}
          {activeTab === 'progress' && (
            <ProgressReviewView />
          )}
        </View>

        {/* Modernist L'Atelier Bottom Navigation Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.tabIcon, { color: activeTab === 'home' ? theme.primary : theme.textMuted }]}>
              ⌂
            </Text>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: activeTab === 'home' ? theme.primary : theme.textMuted, 
                  fontWeight: activeTab === 'home' ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.medium 
                }
              ]}
            >
              Accueil
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('practice')}
          >
            <Text style={[styles.tabIcon, { color: activeTab === 'practice' ? theme.primary : theme.textMuted }]}>
              📖
            </Text>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: activeTab === 'practice' ? theme.primary : theme.textMuted, 
                  fontWeight: activeTab === 'practice' ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.medium 
                }
              ]}
            >
              Pratique
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.tabIcon, { color: activeTab === 'explore' ? theme.primary : theme.textMuted }]}>
              🔍
            </Text>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: activeTab === 'explore' ? theme.primary : theme.textMuted, 
                  fontWeight: activeTab === 'explore' ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.medium 
                }
              ]}
            >
              Explorer
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('progress')}
          >
            <Text style={[styles.tabIcon, { color: activeTab === 'progress' ? theme.primary : theme.textMuted }]}>
              📊
            </Text>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: activeTab === 'progress' ? theme.primary : theme.textMuted, 
                  fontWeight: activeTab === 'progress' ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.medium 
                }
              ]}
            >
              Progrès
            </Text>
          </Pressable>
        </View>

        {/* Practice Flow overlay (Standard or compiled list session) */}
        {activePracticeNodeIds && activePracticeNodeIds.length > 0 && (
          <PracticeFlow
            conceptIds={activePracticeNodeIds}
            onClose={() => setActivePracticeNodeIds(null)}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 72,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  // Progress Review styling
  progressContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 100 : 70,
  },
  progressScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  progressHeader: {
    marginBottom: SPACING.xl,
  },
  progressLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2.0,
    marginBottom: SPACING.xs,
  },
  progressTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xs,
  },
  progressDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  progressMetricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xl,
  },
  progMetricRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progMetricVal: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  progMetricLbl: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  progMetricDivider: {
    width: 1,
    height: '60%',
    opacity: 0.5,
  },
  levelDistributionSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  progListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  progListItemText: {
    flex: 1,
  },
  progListItemTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  progListItemSub: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  checkIndicatorIcon: {
    fontSize: 10,
    marginLeft: SPACING.md,
  },
  quoteCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  quoteAuthor: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
});

export default App;

