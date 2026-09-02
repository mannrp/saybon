// SayBon — TEF Canada Mode: own native-stack navigator.
// See planning/TEF_MODE_DESIGN.md §2 for the full intended screen list.
// EE/writing screens land in a later phase.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TefHomeScreen } from '../screens/TefHomeScreen';
import { DrillSetupScreen } from '../screens/DrillSetupScreen';
import { DrillRunnerScreen } from '../screens/DrillRunnerScreen';
import { DrillSummaryScreen } from '../screens/DrillSummaryScreen';
import type { TefModule } from '../data/itemSchema';
import type { DrillSummary } from '../hooks/useDrillSession';

export type TefStackParamList = {
  TefHome: undefined;
  DrillSetup: undefined;
  DrillRunner: { module: TefModule; count: number };
  DrillSummary: { summary: DrillSummary };
};

const Stack = createNativeStackNavigator<TefStackParamList>();

export function TefNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TefHome" component={TefHomeScreen} />
      <Stack.Screen name="DrillSetup" component={DrillSetupScreen} />
      <Stack.Screen name="DrillRunner" component={DrillRunnerScreen} />
      <Stack.Screen name="DrillSummary" component={DrillSummaryScreen} />
    </Stack.Navigator>
  );
}
