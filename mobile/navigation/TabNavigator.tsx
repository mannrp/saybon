import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../theme/useAppTheme';
import { TYPOGRAPHY, SPACING } from '../theme/tokens';
import { TabParamList } from './types';

import { DashboardView } from '../components/DashboardView';
import { PracticeHubView } from '../components/PracticeHubView';
import { TefNavigator } from '../tef/navigation/TefNavigator';
import { ProgressReviewView } from '../components/ProgressReviewView';

const Tab = createBottomTabNavigator<TabParamList>();

const HeaderLeft = React.memo(function HeaderLeft({ color }: { color: string }) {
  return (
    <Text style={[styles.wordmark, { color }]}>
      SayBon
    </Text>
  );
});

const HeaderRight = React.memo(function HeaderRight({
  color,
  onPress,
}: {
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.headerRightButton}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <Text style={[styles.iconText, { color }]}>⚙</Text>
    </Pressable>
  );
});

const CustomTabBar = React.memo(function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();

  return (
    <View 
      style={[
        styles.tabBar, 
        { 
          backgroundColor: theme.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        }
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let icon = '◇';
        let label = 'Accueil';

        if (route.name === 'Home') {
          icon = '◇';
          label = 'Accueil';
        } else if (route.name === 'Practice') {
          icon = '□';
          label = 'Pratique';
        } else if (route.name === 'Tef') {
          icon = '△';
          label = 'TEF';
        } else if (route.name === 'Progress') {
          icon = '○';
          label = 'Progrès';
        }

        const isLast = index === state.routes.length - 1;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabItem, 
              !isLast && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }
            ]}
          >
            <Text style={[styles.tabIcon, { color: isFocused ? theme.primary : theme.textMuted }]}>
              {icon}
            </Text>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? theme.primary : theme.textMuted, 
                  fontWeight: isFocused ? TYPOGRAPHY.fontWeight.bold : TYPOGRAPHY.fontWeight.medium 
                }
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

export function TabNavigator() {
  const { theme } = useAppTheme();

  const renderTabBar = React.useCallback(
    (props: BottomTabBarProps) => <CustomTabBar {...props} />,
    []
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: 'Studio',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.fontFamily.serif,
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.bold,
          color: theme.text,
        },
        headerLeft: () => <HeaderLeft color={theme.primary} />,
        headerRight: () => (
          <HeaderRight
            color={theme.textMuted}
            onPress={() => navigation.getParent()?.navigate('Settings')}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardView} />
      <Tab.Screen name="Practice" component={PracticeHubView} />
      <Tab.Screen name="Tef" component={TefNavigator} />
      <Tab.Screen name="Progress" component={ProgressReviewView} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
    height: 52,
    paddingBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
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
  wordmark: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.md,
  },
  headerRightButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  iconText: {
    fontSize: 20,
  },
});
