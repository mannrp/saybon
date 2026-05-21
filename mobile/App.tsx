import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Canvas,
  Circle,
  Line,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './theme/tokens';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  // Define Skia layout coordinates relative to screen bounds
  // (Using simple coordinates for illustration)
  const nodeA = { x: 120, y: 300, level: 5 };
  const nodeB = { x: 260, y: 220, level: 3 };
  const nodeC = { x: 200, y: 420, level: 1 };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Skia GPU-accelerated graphics layer */}
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Draw subtle relationship edges between nodes */}
        <Line
          p1={vec(nodeA.x, nodeA.y)}
          p2={vec(nodeB.x, nodeB.y)}
          color={theme.border}
          strokeWidth={2}
        />
        <Line
          p1={vec(nodeB.x, nodeB.y)}
          p2={vec(nodeC.x, nodeC.y)}
          color={theme.border}
          strokeWidth={2}
        />
        <Line
          p1={vec(nodeC.x, nodeC.y)}
          p2={vec(nodeA.x, nodeA.y)}
          color={theme.border}
          strokeWidth={2}
        />

        {/* Draw floating concept nodes */}
        {/* Node A - Mastered forest green */}
        <Circle cx={nodeA.x} cy={nodeA.y} r={32} color={theme.mastery[nodeA.level as 5]}>
          <LinearGradient
            start={vec(nodeA.x - 32, nodeA.y - 32)}
            end={vec(nodeA.x + 32, nodeA.y + 32)}
            colors={[theme.mastery[nodeA.level as 5], '#A7F3D0']}
          />
        </Circle>

        {/* Node B - Muted mint-green */}
        <Circle cx={nodeB.x} cy={nodeB.y} r={24} color={theme.mastery[nodeB.level as 3]}>
          <LinearGradient
            start={vec(nodeB.x - 24, nodeB.y - 24)}
            end={vec(nodeB.x + 24, nodeB.y + 24)}
            colors={[theme.mastery[nodeB.level as 3], '#D1FAE5']}
          />
        </Circle>

        {/* Node C - Muted red/coral */}
        <Circle cx={nodeC.x} cy={nodeC.y} r={28} color={theme.mastery[nodeC.level as 1]}>
          <LinearGradient
            start={vec(nodeC.x - 28, nodeC.y - 28)}
            end={vec(nodeC.x + 28, nodeC.y + 28)}
            colors={[theme.mastery[nodeC.level as 1], '#FCA5A5']}
          />
        </Circle>
      </Canvas>

      {/* Swiss typography editorial overlay layer (Native RN UI) */}
      <View style={[styles.overlayContainer, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Saybon v2</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Offline-first French practice
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Phase 0 — Bootstrapped
          </Text>
          <Text style={[styles.cardBody, { color: theme.textMuted }]}>
            • Bare React Native 0.85.3 initialized
            {"\n"}• GPU Canvas Rendering via Skia [VERIFIED]
            {"\n"}• Reanimated, Gesture Handler, MMKV, & op-sqlite loaded
            {"\n"}• Swiss editorial design tokens configured
          </Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: theme.mastery[5] }]}>
              <Text style={styles.badgeText}>Ready to Build</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Created with care in Québec for TEF/TCF learners
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  header: {
    marginTop: SPACING.md,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginVertical: SPACING.xxl,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  cardBody: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  footerText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
  },
});

export default App;
