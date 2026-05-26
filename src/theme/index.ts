import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

// ─── Logo DNA ──────────────────────────────────────────────────────────────────
// Mark: angular blade shape, 135° diagonal (lower-left → upper-right)
// Color: cream #ECECE6 on pure black — MONOCHROMATIC brand identity
// Geometry: zero curves, all sharp angles, bold and thick forms
// Character: athletic, precise, premium
// → UI inherits: tight radii, sharp borders, cream brand accents,
//   135° diagonal gradients, strong contrast, restrained color usage

// ─── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // ── Brand mark color — THE identity color from the SVG logo
  cream: '#ECECE6',
  creamDim: 'rgba(236,236,230,0.07)',
  creamBorder: 'rgba(236,236,230,0.13)',
  creamStrong: 'rgba(236,236,230,0.18)',

  // ── Backgrounds — near-pure black with very slight blue-black depth
  bg: {
    primary:   '#060609',  // base layer — pure dark
    secondary: '#0B0B0F',  // structural layer
    card:      '#0F0F15',  // card surface
    elevated:  '#161620',  // modal/elevated
  },

  // ── Primary interaction accent — electric blue (kept, it's the action color)
  accent: '#3B82F6',
  accentDim: 'rgba(59,130,246,0.08)',
  accentBorder: 'rgba(59,130,246,0.18)',

  // ── Secondary accent — indigo (sharper, more precise than purple)
  indigo: '#6366F1',
  indigoDim: 'rgba(99,102,241,0.08)',
  indigoBorder: 'rgba(99,102,241,0.18)',

  // ── Status
  green:   '#22C55E',
  greenDim:   'rgba(34,197,94,0.08)',
  greenBorder:'rgba(34,197,94,0.20)',

  amber:   '#F59E0B',
  amberDim:   'rgba(245,158,11,0.08)',
  amberBorder:'rgba(245,158,11,0.20)',

  red:     '#EF4444',
  redDim:   'rgba(239,68,68,0.08)',
  redBorder:'rgba(239,68,68,0.20)',

  // ── Backward-compat aliases (for existing screens not yet migrated)
  purple:     '#6366F1',   // → indigo now
  purpleDim:  'rgba(99,102,241,0.08)',
  purpleBorder:'rgba(99,102,241,0.18)',
  cyan:       '#3B82F6',
  cyanDim:    'rgba(59,130,246,0.08)',
  cyanBorder: 'rgba(59,130,246,0.18)',
  pink:       '#EF4444',
  pinkDim:    'rgba(239,68,68,0.08)',
  pinkBorder: 'rgba(239,68,68,0.18)',
  orange:     '#F59E0B',
  orangeDim:  'rgba(245,158,11,0.08)',
  yellow:     '#F59E0B',
  yellowDim:  'rgba(245,158,11,0.08)',

  // ── Text hierarchy — primary is cream (the logo's own color), not cold white
  text: {
    primary:  '#ECECE6',
    secondary:'rgba(236,236,230,0.55)',
    muted:    'rgba(236,236,230,0.32)',
    disabled: 'rgba(236,236,230,0.16)',
  },

  // ── Borders — three clearly differentiated tiers
  border: {
    hairline: 'rgba(255,255,255,0.06)',
    subtle:   'rgba(255,255,255,0.09)',
    default:  'rgba(255,255,255,0.13)',
    strong:   'rgba(255,255,255,0.20)',
  },

  // ── Glass / translucent surfaces
  glass: {
    bg:          'rgba(255,255,255,0.04)',
    border:      'rgba(255,255,255,0.09)',
    bgStrong:    'rgba(255,255,255,0.07)',
    borderStrong:'rgba(255,255,255,0.14)',
  },

  // ── Score colors
  score: {
    elite:   '#22C55E',
    great:   '#3B82F6',
    good:    '#8B5CF6',
    average: '#F59E0B',
    poor:    '#EF4444',
  },
} as const;

// ─── Gradients ─────────────────────────────────────────────────────────────────
// Diagonal direction (135°) mirrors the mark's blade sweep: start={x:0,y:1} end={x:1,y:0}
export const GRADIENTS = {
  // Primary gradients — deep to vivid, used for interactive buttons
  primary:   ['#1E40AF', '#3B82F6'] as const,
  premium:   ['#4338CA', '#6366F1'] as const,  // indigo (was purple)
  success:   ['#15803D', '#22C55E'] as const,
  danger:    ['#B91C1C', '#EF4444'] as const,
  dark:      ['#161620', '#0F0F15'] as const,
  card:      ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const,

  // Cream ambient — the brand identity color, very restrained
  cream:     ['rgba(236,236,230,0.14)', 'rgba(236,236,230,0.02)', 'transparent'] as const,

  // Diagonal accent sweep — matches the 135° mark blade angle
  diagonalBlue: ['rgba(59,130,246,0.18)', 'rgba(99,102,241,0.06)', 'transparent'] as const,
  diagonalCream:['rgba(236,236,230,0.10)', 'rgba(236,236,230,0.02)', 'transparent'] as const,

  // Score gradients
  score: {
    elite:   ['#15803D', '#22C55E'] as const,
    great:   ['#1E40AF', '#3B82F6'] as const,
    good:    ['#5B21B6', '#8B5CF6'] as const,
    average: ['#B45309', '#F59E0B'] as const,
    poor:    ['#B91C1C', '#EF4444'] as const,
  },
};

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
