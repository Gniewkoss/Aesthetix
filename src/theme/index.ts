import { Dimensions } from 'react-native';
import { type Theme } from '@react-navigation/native';
import {
  DARK_COLORS,
  DARK_GRADIENTS,
  LIGHT_COLORS,
  LIGHT_GRADIENTS,
  type ColorPalette,
} from './palettes';
import { C } from './obsidian';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

/** Live bindings — updated by ThemeProvider via applyThemeScheme(). */
export let COLORS: ColorPalette = DARK_COLORS;
export type { GradientPalette } from './palettes';
import type { GradientPalette } from './palettes';
export let GRADIENTS: GradientPalette = DARK_GRADIENTS;

export type ThemeScheme = 'light' | 'dark';

export function applyThemeScheme(scheme: ThemeScheme): void {
  COLORS = scheme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  GRADIENTS = scheme === 'light' ? LIGHT_GRADIENTS : DARK_GRADIENTS;
}

export function buildNavTheme(scheme: ThemeScheme): Theme {
  const c = scheme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  // Obsidian screens use C.canvas; keep nav/card on the same color to avoid edge bleed during transitions.
  const screenBg = C.canvas;
  return {
    dark: scheme === 'dark',
    colors: {
      primary: c.accent,
      background: screenBg,
      card: screenBg,
      text: c.text.primary,
      border: c.border.hairline,
      notification: c.red,
    },
  };
}

// ─── Font Families ─────────────────────────────────────────────────────────────
export const FONT_FAMILY = {
  display:    'PlusJakartaSans_800ExtraBold',
  heading:    'PlusJakartaSans_700Bold',
  subheading: 'PlusJakartaSans_600SemiBold',
  body:       'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold:'Manrope_600SemiBold',
  bodyBold:   'Manrope_700Bold',
  bodyBlack:  'Manrope_800ExtraBold',
} as const;

// ─── Type Scale ────────────────────────────────────────────────────────────────
export const FONTS = {
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl':28,
    '3xl':34,
    '4xl':44,
    '5xl':56,
    hero: 72,
  },
  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    extrabold:'800' as const,
    black:    '900' as const,
  },
  lineHeights: {
    tight:   1.08,   // display headlines — very compressed, brand-aligned
    normal:  1.40,
    relaxed: 1.65,
  },
};

// ─── Letter Spacing ─────────────────────────────────────────────────────────────
// The logo wordmark has very tight geometric spacing → inherit that precision
export const TRACKING = {
  display: -1.2,   // VERY tight on large display text — logo-aligned
  heading: -0.6,   // tight section headings
  body:     0,     // body text — neutral
  label:    0.4,   // UI labels — slightly open
  caps:     2.2,   // UPPERCASE micro-labels — wide and precise
} as const;

// ─── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ─── Border Radius ─────────────────────────────────────────────────────────────
// Logo has ZERO curves → UI inherits tighter, more angular corners
// Reduced from original to align with brand's geometric DNA
export const RADIUS = {
  xs:    4,
  sm:    6,    // was 8
  md:    10,   // was 12
  lg:    12,   // was 16
  xl:    14,   // was 20 — major global change
  '2xl': 18,   // was 24
  '3xl': 22,   // was 32
  full:  999,
};

// ─── Shadows ───────────────────────────────────────────────────────────────────
// More structured shadows — slight x offset mirrors the mark's diagonal energy
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.40,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.50,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  // Backward compat
  cyan: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  purple: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  cream: {
    shadowColor: '#ECECE6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
};

// ─── Layout System ─────────────────────────────────────────────────────────────
export const LAYOUT = {
  pagePad:         SPACING.xl,    // 24 — generous horizontal margins (Linear/Stripe level)
  headerTop:       SPACING.base,  // 16
  headerGap:       SPACING.xl,    // 24
  sectionGap:      SPACING['2xl'],// 32 — clear breathing room between sections
  sectionLabelGap: SPACING.sm,    // 8
  cardGap:         SPACING.sm,    // 8 — tight, purposeful gaps between cards
  cardPad:         SPACING.xl,    // 24 — generous internal card padding
  innerPad:        SPACING.base,  // 16 — nested element padding
  heroImageHeight: 300,
  /** Custom tab bar content height (excludes safe-area inset) */
  tabBarContentHeight: 56,
  /** Bottom offset for CoachBubble above the tab bar */
  coachBubbleBottom: 72,
  /** Scroll content bottom padding on tab screens (clears tab bar) */
  tabScrollBottom: 96,
  /** Minimum touch target per HIG */
  minTouchTarget: 44,
} as const;

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

export function getScoreLabelLines(score: number): string[] {
  const label = getScoreLabel(score);
  if (label.length <= 7) return [label];
  const words = label.split(' ');
  if (words.length > 1) return words;
  return [label];
}
