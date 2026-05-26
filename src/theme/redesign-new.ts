import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = { width, height };

/**
 * PHYSIQUEMAX REDESIGN v2: VIBRANT & BLOCK-BASED
 *
 * Design Strategy: Bold, energetic, athletic aesthetic
 * Colors: Orange (#F97316) + Green (#22C55E) + Dark bg (#1F2937)
 * Typography: Barlow (athletic, condensed, action-oriented)
 * Layout: Bento box grid, 48px+ gaps, large type
 * Vibe: Startup energy, fitness enthusiasm, data confidence
 */

// ─── COLOR PALETTE: VIBRANT & ENERGETIC ────────────────────────────────────
export const COLORS_NEW = {
  // Primary accent — ENERGY ORANGE (high contrast, eye-catching)
  primary: '#F97316',      // Vibrant orange — main CTA, highlights
  primaryDark: '#EA580C',  // Darker orange for pressed state
  primaryLight: '#FBA555', // Lighter orange for backgrounds

  // Success/Positive — STRONG GREEN (achievement, progress)
  success: '#22C55E',      // Vibrant green — good scores, improvements
  successDark: '#16A34A',  // Darker green for pressed state
  successLight: '#86EFAC', // Lighter green for backgrounds

  // Background hierarchy
  bg: {
    primary: '#1F2937',    // Dark grey — main background
    secondary: '#111827',  // Darker — elevated surfaces
    card: '#374151',       // Lighter grey — cards, containers
    hover: '#4B5563',      // For hover states
  },

  // Text hierarchy — high contrast
  text: {
    primary: '#FFFFFF',    // Pure white — headings, important
    secondary: '#F3F4F6',  // Off-white — body text
    muted: '#D1D5DB',      // Grey — secondary labels
    disabled: '#9CA3AF',   // Light grey — disabled
  },

  // Status colors (traffic light system)
  status: {
    elite: '#22C55E',      // Green — elite/excellent
    great: '#3B82F6',      // Blue — great/good
    good: '#8B5CF6',       // Purple — good
    average: '#F59E0B',    // Amber — average
    poor: '#EF4444',       // Red — poor/needs work
  },

  // Borders
  border: {
    light: 'rgba(255,255,255,0.1)',    // Subtle dividers
    default: 'rgba(255,255,255,0.2)',  // Standard borders
    strong: 'rgba(255,255,255,0.3)',   // Prominent borders
    orange: 'rgba(249,115,22,0.4)',    // Orange accent border
    green: 'rgba(34,197,94,0.4)',      // Green accent border
  },
} as const;

// ─── TYPOGRAPHY: MANROPE (MODERN, BOLD, READABLE) ──────────────────────
export const FONTS_NEW = {
  // Font families
  family: {
    heading: 'Manrope',            // Bold — punchy, athletic
    display: 'Manrope',            // Extra large — hero numbers
    body: 'Manrope',               // Regular — body text, readable
  },

  // Type scale (aggressive, large)
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 32,      // Large section headers
    '3xl': 40,      // Big hero numbers
    '4xl': 56,      // HUGE hero numbers
    '5xl': 72,      // MASSIVE score displays
  },

  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  lineHeight: {
    tight: 1.1,     // Headlines — tight
    normal: 1.4,    // Body — comfortable
    relaxed: 1.65,  // Large text — spacious
  },
};

// ─── SPACING SYSTEM: 48PX+ GAPS (BENTO BOX STYLE) ─────────────────────────
export const SPACING_NEW = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,       // LARGE gap between sections (bento box)
  '4xl': 64,       // HUGE gap for visual breaks
  '5xl': 80,       // Maximum breathing room
};

// ─── BORDER RADIUS: ROUNDED BUT MODERN ──────────────────────────────────────
export const RADIUS_NEW = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ─── SHADOWS: ELEVATED, CRISP, MODERN ───────────────────────────────────────
export const SHADOWS_NEW = {
  // Subtle elevation
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Medium elevation (cards)
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Large elevation (modals)
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  // Orange glow (accent)
  orange: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },

  // Green glow (success)
  green: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
};

// ─── GRADIENTS: BOLD, ENERGETIC ────────────────────────────────────────────
export const GRADIENTS_NEW = {
  // Orange to darker orange
  primary: [COLORS_NEW.primary, COLORS_NEW.primaryDark] as const,

  // Green to darker green
  success: [COLORS_NEW.success, COLORS_NEW.successDark] as const,

  // Orange + Green (hero sections)
  heroOrange: [COLORS_NEW.primary, COLORS_NEW.primaryLight] as const,
  heroGreen: [COLORS_NEW.success, COLORS_NEW.successLight] as const,

  // Dark gradient background
  bg: [COLORS_NEW.bg.primary, COLORS_NEW.bg.secondary] as const,
};

// ─── LAYOUT SYSTEM: BENTO BOX (LARGE GAPS, MODULAR) ────────────────────────
export const LAYOUT_NEW = {
  // Screen padding
  screenPad: 16,           // Minimal edge margin
  screenPadLarge: 24,      // Generous edge margin

  // Section gaps (bento box style)
  sectionGap: 48,          // LARGE gap between sections
  sectionGapSmall: 32,     // Standard section gap
  cardGap: 16,             // Gap between cards in section

  // Card styling
  cardPad: 20,             // Generous internal padding
  cardRadius: 16,          // Modern rounded corners

  // Component sizing
  buttonHeight: 52,        // Large, touch-friendly buttons
  buttonHeightSmall: 44,   // Standard button height
  inputHeight: 52,         // Large input fields
  headerHeight: 60,        // Header/navbar height

  // Content sizing
  maxContentWidth: 600,    // For forms, narrow content
  maxSectionWidth: 900,    // For dashboards

  // Touch targets
  minTouchTarget: 44,      // iOS HIG minimum
};

// ─── BUTTON VARIANTS: 4 CORE TYPES ─────────────────────────────────────────
export type ButtonVariantNew = 'primary' | 'secondary' | 'ghost' | 'destructive';

export const BUTTON_STYLES_NEW: Record<ButtonVariantNew, {
  bg: string;
  text: string;
  border?: string;
  shadow?: boolean;
}> = {
  primary: {
    bg: COLORS_NEW.primary,
    text: '#FFFFFF',
    shadow: true,
  },
  secondary: {
    bg: COLORS_NEW.bg.card,
    text: COLORS_NEW.text.primary,
    border: COLORS_NEW.border.default,
  },
  ghost: {
    bg: 'transparent',
    text: COLORS_NEW.text.primary,
  },
  destructive: {
    bg: COLORS_NEW.status.poor,
    text: '#FFFFFF',
    shadow: true,
  },
};

// ─── CARD VARIANTS: MINIMAL, BENTO-STYLE ───────────────────────────────────
export type CardVariantNew = 'default' | 'accent' | 'success' | 'muted';

export const CARD_STYLES_NEW: Record<CardVariantNew, {
  bg: string;
  border: string;
  highlight?: string;
}> = {
  default: {
    bg: COLORS_NEW.bg.card,
    border: COLORS_NEW.border.default,
  },
  accent: {
    bg: COLORS_NEW.bg.card,
    border: COLORS_NEW.border.orange,
    highlight: COLORS_NEW.primary,
  },
  success: {
    bg: COLORS_NEW.bg.card,
    border: COLORS_NEW.border.green,
    highlight: COLORS_NEW.success,
  },
  muted: {
    bg: COLORS_NEW.bg.secondary,
    border: COLORS_NEW.border.light,
  },
};

// ─── ANIMATION TIMING: SNAPPY, RESPONSIVE ──────────────────────────────────
export const ANIMATION = {
  fast: 150,       // Micro-interactions
  standard: 300,   // Page transitions
  slow: 500,       // Large animations
};

// ─── EXPORT AS NEW SYSTEM ──────────────────────────────────────────────────
export const REDESIGN = {
  COLORS: COLORS_NEW,
  FONTS: FONTS_NEW,
  SPACING: SPACING_NEW,
  RADIUS: RADIUS_NEW,
  SHADOWS: SHADOWS_NEW,
  GRADIENTS: GRADIENTS_NEW,
  LAYOUT: LAYOUT_NEW,
  ANIMATION,
  BUTTON_STYLES: BUTTON_STYLES_NEW,
  CARD_STYLES: CARD_STYLES_NEW,
};
