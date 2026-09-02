// Saybon v2 — Mobile Calm French Practice Studio (Root)
// Orchestrates type-safe navigation via React Navigation with native screens.

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RootNavigator } from './navigation/RootNavigator';
import { useProgressStore } from './core/store/useProgressStore';
import { useAppTheme } from './theme/useAppTheme';

function AppContent() {
  const { isDarkMode, theme } = useAppTheme();
  const isInitialized = useProgressStore((s) => s.isInitialized);
  const initialize = useProgressStore((s) => s.initialize);

  // ── Root Database Initialization ───────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
