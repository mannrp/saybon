// Saybon v2 — Jest Test Environment Setup
// Mock configurations for native UI thread engines and C++ modules (Skia, Reanimated, Gesture Handler).

import 'react-native-gesture-handler/jestSetup';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Worklets
jest.mock('react-native-worklets', () => {
  const createSerializableMock = (val) => val;
  createSerializableMock.set = () => {};
  createSerializableMock.get = () => {};
  const serializableMappingCacheMock = {
    set: () => {},
    get: () => {},
    has: () => false,
  };
  return {
    __esModule: true,
    Worklets: {
      createRunOnJS: (fn) => fn,
      createRunOnUI: (fn) => fn,
      createContext: () => ({}),
      createSharedValue: (val) => ({ value: val }),
    },
    createSerializable: createSerializableMock,
    serializableMappingCache: serializableMappingCacheMock,
    isWorklet: () => false,
    isWorkletFunction: () => false,
    scheduleOnUI: (fn) => fn,
    RuntimeKind: { ReactNative: 1, Web: 2 },
  };
});

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const SafeAreaInsetsContext = React.createContext(inset);
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaInsetsContext,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaView: ({ children, style }) => React.createElement('View', { style }, children),
  };
});

// Mock MMKV Hot Cache
jest.mock('react-native-mmkv', () => {
  return {
    createMMKV: () => ({
      set: () => {},
      getString: () => null,
      getNumber: () => null,
      getBoolean: () => null,
      delete: () => {},
    }),
  };
});

// Mock Skia GPU Canvas
jest.mock('@shopify/react-native-skia', () => {
  return {
    Canvas: ({ children }) => children,
    Circle: () => null,
    Line: () => null,
    Points: () => null,
    Text: () => null,
    matchFont: () => ({}),
    vec: (x, y) => ({ x, y }),
    RadialGradient: () => null,
    Group: ({ children }) => children,
  };
});

// Mock OP-SQLite
jest.mock('@op-engineering/op-sqlite', () => {
  return {
    open: () => ({
      execute: async () => ({ rows: { _array: [] } }),
      executeBatch: async () => {},
      transaction: async (cb) => {
        await cb({
          execute: async () => ({ rows: { _array: [] } }),
        });
      },
    }),
  };
});
