import React, { useState } from 'react';
import { StyleSheet, useColorScheme, StatusBar, View, Text, Pressable, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GridCanvas } from './canvas/grid/GridCanvas';
import { ConceptExplorer } from './canvas/grid/ConceptExplorer';
import { PracticeFlow } from './canvas/grid/PracticeFlow';
import { NebulaCanvas } from './canvas/nebula/NebulaCanvas';
import { useGridStore } from './core/store/useGridStore';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from './theme/tokens';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const [activeExplorerNodeId, setActiveExplorerNodeId] = useState<string | null>(null);
  const [activePracticeNodeId, setActivePracticeNodeId] = useState<string | null>(null);

  const { currentMode, setMode } = useGridStore();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {currentMode === '2D' ? (
          <GridCanvas
            onNodeSelect={(nodeId) => {
              setActiveExplorerNodeId(nodeId);
            }}
          />
        ) : (
          <NebulaCanvas
            onNodeSelect={(nodeId) => {
              setActiveExplorerNodeId(nodeId);
            }}
          />
        )}

        {/* Persistent Editorial Mode Toggle */}
        <Pressable
          style={[
            styles.toggleButton,
            {
              backgroundColor: theme.surface + 'D0',
              borderColor: theme.border,
              top: Platform.OS === 'ios' ? 54 : 42,
            },
          ]}
          onPress={() => {
            setMode(currentMode === '2D' ? '3D' : '2D');
          }}
        >
          <Text style={[styles.toggleText, { color: theme.text }]}>
            {currentMode === '2D' ? '🌌 L\'Espace' : '🗺️ Le Plan'}
          </Text>
        </Pressable>

        {activeExplorerNodeId && (
          <ConceptExplorer
            conceptId={activeExplorerNodeId}
            onClose={() => setActiveExplorerNodeId(null)}
            onStartPractice={() => {
              const nodeToPractice = activeExplorerNodeId;
              setActiveExplorerNodeId(null);
              setActivePracticeNodeId(nodeToPractice);
            }}
          />
        )}

        {activePracticeNodeId && (
          <PracticeFlow
            conceptId={activePracticeNodeId}
            onClose={() => setActivePracticeNodeId(null)}
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
  toggleButton: {
    position: 'absolute',
    right: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
});

export default App;
