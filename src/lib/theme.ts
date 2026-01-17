export const colors = {
  // Primary palette - baby blue warmth
  babyBlue: '#e8f4fc',
  sky: '#b8dff5',
  deepBlue: '#2d5a7b',
  accent: '#4a90b8',
  
  // Neutrals
  warmWhite: '#fefefe',
  softGray: '#6b8a9e',
  lightGray: '#f0f4f7',
  mediumGray: '#9bb0bf',
  
  // Semantic
  success: '#4abb8b',
  warning: '#e8a94e',
  error: '#d45d5d',
  
  // Reactions
  heart: '#e85d75',
  hug: '#f5a623',
  laugh: '#f5d523',
  wow: '#5da8e8',
  sad: '#8b9dc3',
  
  // Gamification
  streakFire: '#ff6b35',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#2d5a7b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#2d5a7b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2d5a7b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
};
