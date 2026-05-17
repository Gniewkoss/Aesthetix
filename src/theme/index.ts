import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

// ─── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds — very dark neutral surfaces
  bg: {
    primary: '#080808',
    secondary: '#0F0F0F',
    card: '#141414',
    elevated: '#1C1C1E',
  },

  // Primary accent — clean electric blue (not neon)
  accent: '#3B82F6',
  accentDim: 'rgba(59,130,246,0.08)',
  accentBorder: 'rgba(59,130,246,0.18)',

  // Status colours — natural, not neon
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.08)',
  greenBorder: 'rgba(34,197,94,0.20)',

  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.20)',

  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.08)',
  redBorder: 'rgba(239,68,68,0.20)',

  purple: '#7C3AED',
  purpleDim: 'rgba(124,58,237,0.08)',
  purpleBorder: 'rgba(124,58,237,0.20)',

  // Backward-compat aliases
  cyan: '#3B82F6',
  cyanDim: 'rgba(59,130,246,0.08)',
  cyanBorder: 'rgba(59,130,246,0.18)',
  pink: '#EF4444',
  pinkDim: 'rgba(239,68,68,0.08)',
  pinkBorder: 'rgba(239,68,68,0.18)',
  orange: '#F59E0B',
  orangeDim: 'rgba(245,158,11,0.08)',
  yellow: '#F59E0B',
  yellowDim: 'rgba(245,158,11,0.08)',

  // Text hierarchy
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.60)',
    muted: 'rgba(255,255,255,0.38)',
    disabled: 'rgba(255,255,255,0.18)',
  },

  // Surfaces / glass
  glass: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.07)',
    bgStrong: 'rgba(255,255,255,0.05)',
    borderStrong: 'rgba(255,255,255,0.11)',
  },

  // Score colours — natural gradient, not neon
  score: {
    elite: '#22C55E',
    great: '#3B82F6',
    good: '#8B5CF6',
    average: '#F59E0B',
    poor: '#EF4444',
  },
} as const;

// ─── Gradients ─────────────────────────────────────────────────────────────────
export const GRADIENTS = {
  primary: ['#1D4ED8', '#3B82F6'] as const,
  premium: ['#6D28D9', '#7C3AED'] as const,
  success: ['#16A34A', '#22C55E'] as const,
  danger: ['#B91C1C', '#EF4444'] as const,
  dark: ['#1A1A1A', '#0F0F0F'] as const,
  card: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'] as const,
  score: {
    elite: ['#16A34A', '#22C55E'] as const,
    great: ['#1D4ED8', '#3B82F6'] as const,
    good: ['#5B21B6', '#8B5CF6'] as const,
    average: ['#B45309', '#F59E0B'] as const,
    poor: ['#B91C1C', '#EF4444'] as const,
  },
};

// ─── Font Families ─────────────────────────────────────────────────────────────
export const FONT_FAMILY = {
  display: 'Oswald_700Bold',
  heading: 'Oswald_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyBlack: 'Manrope_800ExtraBold',
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────────
export const FONTS = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 38,
    '4xl': 48,
    '5xl': 64,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// ─── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ─── Border Radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
};

// ─── Shadows ───────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cyan: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  purple: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Score helpers ─────────────────────────────────────────────────────────────
export function getScoreColor(score: number): string {
  if (score >= 90) return COLORS.score.elite;
  if (score >= 75) return COLORS.score.great;
  if (score >= 60) return COLORS.score.good;
  if (score >= 45) return COLORS.score.average;
  return COLORS.score.poor;
}

export function getScoreGradient(score: number): readonly [string, string] {
  if (score >= 90) return GRADIENTS.score.elite;
  if (score >= 75) return GRADIENTS.score.great;
  if (score >= 60) return GRADIENTS.score.good;
  if (score >= 45) return GRADIENTS.score.average;
  return GRADIENTS.score.poor;
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'ELITE';
  if (score >= 75) return 'GREAT';
  if (score >= 60) return 'GOOD';
  if (score >= 45) return 'AVERAGE';
  return 'NEEDS WORK';
}

/** Split long labels so they fit inside small circular gauges. */
export function getScoreLabelLines(score: number): string[] {
  const label = getScoreLabel(score);
  if (label.length <= 7) return [label];
  const words = label.split(' ');
  if (words.length > 1) return words;
  return [label];
}
