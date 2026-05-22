import { Platform } from 'react-native';

export const COLORS = {
  light: {
    background: '#f9f9f7', // Warm Cream background
    surface: '#ffffff', // Clean white paper surfaces
    surfaceMuted: '#f4f4f2', // surface-container-low
    surfaceContainer: '#eeeeec', // surface-container
    border: 'rgba(117, 120, 112, 0.15)', // Soft outline/15% border
    outline: '#757870', // Solid outline
    text: '#1a1c1b', // Charcoal for premium readability (on-surface)
    textMuted: '#615e56', // Warm Stone Gray (secondary)
    primary: '#54624c', // Sage Green primary
    onPrimary: '#ffffff',
    primaryContainer: '#8c9b82',
    secondary: '#615e56',
    secondaryContainer: '#e7e2d7', // Pale gray-sand (secondary-container)
    tertiary: '#6a5c47',
    tertiaryFixed: '#f3e0c4', // Pale Golden Sand (tertiary-fixed)
    accent: '#54624c', // Sage Green for highlights
    
    // Mastery levels (0 to 5) corresponding to Sage green tones
    mastery: {
      0: '#eeeeec', // Unseen
      1: '#e7e2d7', // Low familiar (pale warm sand)
      2: '#bccbb0', // Light sage
      3: '#8c9b82', // Medium sage
      4: '#54624c', // High sage
      5: '#26321f', // Deep dark sage
    },
    
    success: '#54624c',
    error: '#ba1a1a',
    warning: '#6a5c47',
  },
  dark: {
    background: '#121210', // Deep soft charcoal paper
    surface: '#1c1c1a', // Soft warm dark charcoal cards
    surfaceMuted: '#252522', // Darker container low
    surfaceContainer: '#2a2a27', // Dark container
    border: 'rgba(197, 200, 190, 0.15)', // Light outline variant border
    outline: '#c5c8be',
    text: '#f9f9f7', // Warm Ivory text
    textMuted: '#cbc6bc', // Muted fixed dim gray
    primary: '#bccbb0', // Sage Green fixed dim accent
    onPrimary: '#131f0d',
    primaryContainer: '#3d4b36',
    secondary: '#cbc6bc',
    secondaryContainer: '#49473f', // Dark warm sand
    tertiary: '#d6c4aa',
    tertiaryFixed: '#d6c4aa',
    accent: '#bccbb0',
    
    mastery: {
      0: '#252522',
      1: '#49473f',
      2: '#3d4b36',
      3: '#8c9b82',
      4: '#bccbb0',
      5: '#d8e7cb',
    },
    
    success: '#bccbb0',
    error: '#ffdad6',
    warning: '#f3e0c4',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  xs: 2,
  sm: 4, // 4px (0.25rem) radius for cards/inputs as per L'Atelier spec
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const TYPOGRAPHY = {
  fontFamily: {
    sans: Platform.OS === 'ios' ? 'System' : 'sans-serif', // DM Sans equivalent
    serif: Platform.OS === 'ios' ? 'Georgia' : 'serif', // EB Garamond equivalent
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 28, // headline-lg-mobile (28px)
    display: 48, // display-lg (48px)
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const ANIMATION = {
  spring: {
    gentle: {
      damping: 15,
      mass: 0.8,
      stiffness: 120,
    },
    bouncy: {
      damping: 10,
      mass: 0.5,
      stiffness: 150,
    },
    snappy: {
      damping: 20,
      mass: 1.0,
      stiffness: 300,
    }
  },
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  }
};

