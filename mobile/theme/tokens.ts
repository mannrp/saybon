export const COLORS = {
  light: {
    background: '#FAFAF9', // Warm off-white (breathable background)
    surface: '#FFFFFF', // Clean white card surfaces
    surfaceMuted: '#F5F5F4', // Slightly darker stone grey for inset areas
    border: '#E7E5E4', // Soft grey borders
    text: '#1C1917', // Dark charcoal/stone for premium readability
    textMuted: '#78716C', // Muted stone grey for secondary text
    primary: '#0F172A', // Slate 900 for Swiss editorial accents
    accent: '#2563EB', // Electric blue for interactive highlights (rare, deliberate)
    
    // Heatmap / Mastery Levels (0 to 5)
    mastery: {
      0: '#E7E5E4', // Level 0 (Unseen): Light stone grey
      1: '#FECACA', // Level 1 (Familiarity low): Soft pastel pink-red
      2: '#FDE68A', // Level 2 (Familiarity low-medium): Soft pastel amber-yellow
      3: '#A7F3D0', // Level 3 (Familiarity medium): Soft pastel mint-green
      4: '#34D399', // Level 4 (Familiarity high): Medium emerald green
      5: '#059669', // Level 5 (Mastered): Rich glowing emerald green
    },
    
    // Feedback
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    background: '#0C0A09', // Deep warm charcoal/black
    surface: '#1C1917', // Soft warm stone dark grey surfaces
    surfaceMuted: '#292524', // Medium stone grey for inset areas
    border: '#44403C', // Warm border grey
    text: '#F5F5F4', // Warm off-white text
    textMuted: '#A8A29E', // Muted stone grey
    primary: '#F5F5F4', // Warm white accents
    accent: '#3B82F6', // Accent blue
    
    // Heatmap / Mastery Levels (0 to 5)
    mastery: {
      0: '#292524', // Level 0 (Unseen): Dark stone grey
      1: '#7F1D1D', // Level 1: Deep crimson
      2: '#78350F', // Level 2: Deep amber
      3: '#064E3B', // Level 3: Deep mint/emerald
      4: '#047857', // Level 4: Medium forest green
      5: '#10B981', // Level 5: Vibrant glowing emerald green
    },
    
    // Feedback
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'System', // System-default sans-serif, standard premium mobile typography
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 36,
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
