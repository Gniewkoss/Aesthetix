import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

// ─── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: {
    primary: '#000000',
    secondary: '#080808',
    card: '#0F0F0F',
    elevated: '#161616',
  },

  // Accents
  cyan: '#00F5FF',
  cyanDim: 'rgba(0,245,255,0.15)',
  cyanBorder: 'rgba(0,245,255,0.3)',

  purple: '#7B2FBE',
  purpleDim: 'rgba(123,47,190,0.15)',
  purpleBorder: 'rgba(123,47,190,0.3)',

  pink: '#FF006E',
  pinkDim: 'rgba(255,0,110,0.15)',
  pinkBorder: 'rgba(255,0,110,0.3)',

  green: '#06FFA5',
  greenDim: 'rgba(6,255,165,0.15)',
  greenBorder: 'rgba(6,255,165,0.3)',

  orange: '#FF6B00',
  orangeDim: 'rgba(255,107,0,0.15)',

  yellow: '#FFD600',
  yellowDim: 'rgba(255,214,0,0.15)',

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.65)',
    muted: 'rgba(255,255,255,0.35)',
    disabled: 'rgba(255,255,255,0.2)',
  },

  // Glass
  glass: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    bgStrong: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.15)',
  },

  // Score colours (0-100)
  score: {
    elite: '#06FFA5',    // 90-100
    great: '#00F5FF',    // 75-89
    good: '#7B2FBE',     // 60-74
    average: '#FF6B00',  // 45-59
    poor: '#FF006E',     // 0-44
  },
} as const;

// ─── Gradients ─────────────────────────────────────────────────────────────────
export const GRADIENTS = {
  primary: ['#7B2FBE', '#00F5FF'] as const,
  premium: ['#FF006E', '#7B2FBE', '#00F5FF'] as const,
  success: ['#06FFA5', '#00F5FF'] as const,
  danger: ['#FF006E', '#FF6B00'] as const,
  dark: ['#161616', '#0A0A0A'] as const,
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
  score: {
    elite: ['#06FFA5', '#00C896'] as const,
    great: ['#00F5FF', '#0080FF'] as const,
    good: ['#7B2FBE', '#5B1F9E'] as const,
    average: ['#FF6B00', '#CC5500'] as const,
    poor: ['#FF006E', '#CC0058'] as const,
  },
};

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
  cyan: {
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  purple: {
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ─── Helper: score colour ──────────────────────────────────────────────────────
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
