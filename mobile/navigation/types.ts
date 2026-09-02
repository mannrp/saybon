import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Tef: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  PracticeSession: { conceptIds: string[]; isEndless?: boolean };
  GenreSwipeSession: undefined;
  Settings: undefined;
};

