// ════════════════════════════════════════════════════════════════════════════
// OBSIDIAN — Aesthetix Design System v2 ("VOLT" direction)
// ════════════════════════════════════════════════════════════════════════════
// Dark-first, data-as-hero, single-accent system. This module is intentionally
// SELF-CONTAINED and separate from the legacy `theme/index.ts` so it can be
// adopted screen-by-screen without disturbing un-migrated screens.
//
// Fonts: maps onto the families already loaded in App.tsx (Plus Jakarta Sans +
// Manrope). The spec's eventual target is Geist / Geist Mono — when those are
// added to the font loader, only the `FONTS` map below needs to change.
// ════════════════════════════════════════════════════════════════════════════

import { TextStyle, ViewStyle } from 'react-native';

// ─── Font families (mapped to currently-loaded fonts) ───────────────────────────
const FONTS = {
  sans600: 'PlusJakartaSans_600SemiBold',
  sans700: 'PlusJakartaSans_700Bold',
  body400: 'Manrope_400Regular',
  body500: 'Manrope_500Medium',
  body600: 'Manrope_600SemiBold',
  body700: 'Manrope_700Bold',
} as const;

// ─── Color — dark (primary mode) ────────────────────────────────────────────────
export const C = {
  // Canvas & surfaces
  canvas:   '#0A0B0D',
  surface1: '#121317',
  surface2: '#191B20',
  surface3: '#212429',

  // Ink (warm cream-white — brand DNA)
  text:     '#F5F4F0',
  text2:    'rgba(245,244,240,0.64)',
  text3:    'rgba(245,244,240,0.40)',
  textDis:  'rgba(245,244,240,0.22)',

  // Borders
  border:   'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.10)',
  borderHi: 'rgba(255,255,255,0.16)',

  // Accent — Volt (the single functional accent)
  volt:       '#C7F940',
  voltInk:    '#0A0B0D',
  voltDim:    'rgba(199,249,64,0.12)',
  voltBorder: 'rgba(199,249,64,0.30)',
  voltGlow:   'rgba(199,249,64,0.55)',

  // Semantic (desaturated so the accent stays dominant)
  success: '#58D68D',
  warning: '#F4B740',
  danger:  '#FF5C5C',
  info:    '#5B9DFF',
} as const;

// ─── Score spectrum (0–100) ─────────────────────────────────────────────────────
const SCORE_RAMP = [
  { min: 85, label: 'Elite',      color: '#C7F940' },
  { min: 70, label: 'Strong',     color: '#8B7BFF' },
  { min: 55, label: 'Solid',      color: '#5B9DFF' },
  { min: 40, label: 'Developing', color: '#F4B740' },
  { min: 0,  label: 'Needs Work', color: '#FF5C5C' },
] as const;

export function scoreColor(score: number): string {
  return (SCORE_RAMP.find((t) => score >= t.min) ?? SCORE_RAMP[SCORE_RAMP.length - 1]).color;
}
export function scoreTier(score: number): string {
  return (SCORE_RAMP.find((t) => score >= t.min) ?? SCORE_RAMP[SCORE_RAMP.length - 1]).label;
}

// ─── Spacing — 4pt base, 8pt rhythm ─────────────────────────────────────────────
export const S = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
} as const;

export const LAYOUT = {
  screenX:    20,  // horizontal screen margin
  cardPad:    20,  // card interior
  tilePad:    16,  // dense interior
  cardGap:    12,  // between stacked cards
  sectionGap: 32,  // between sections
  inlineGap:  8,   // icon ↔ label
  touchMin:   44,
} as const;

// ─── Radius — large & concentric ────────────────────────────────────────────────
export const R = {
  xs: 8, sm: 12, md: 16, lg: 20, xl: 28, '2xl': 36, pill: 999,
} as const;

// ─── Typography scale (exact) ───────────────────────────────────────────────────
// Numeric tokens use tabular figures so animating values don't reflow.
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const T = {
  heroNum: { fontFamily: FONTS.sans700, fontSize: 60, lineHeight: 60, letterSpacing: -1.6, ...tabular } as TextStyle,
  h1:      { fontFamily: FONTS.sans700, fontSize: 34, lineHeight: 38, letterSpacing: -1.0 } as TextStyle,
  title:   { fontFamily: FONTS.sans600, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 } as TextStyle,
  cardTitle:{ fontFamily: FONTS.sans600, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 } as TextStyle,
  body:    { fontFamily: FONTS.body400, fontSize: 16, lineHeight: 24, letterSpacing: 0 } as TextStyle,
  bodySm:  { fontFamily: FONTS.body400, fontSize: 14, lineHeight: 20, letterSpacing: 0 } as TextStyle,
  label:   { fontFamily: FONTS.body600, fontSize: 13, lineHeight: 16, letterSpacing: 0.1 } as TextStyle,
  caption: { fontFamily: FONTS.body500, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 } as TextStyle,
  overline:{ fontFamily: FONTS.body700, fontSize: 11, lineHeight: 14, letterSpacing: 0.8 } as TextStyle,
  metric:  { fontFamily: FONTS.sans600, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, ...tabular } as TextStyle,
  metricSm:{ fontFamily: FONTS.sans600, fontSize: 16, lineHeight: 20, letterSpacing: -0.2, ...tabular } as TextStyle,
} as const;

/** Primary volt CTA label — optical vertical center in fixed-height buttons */
export const BTN_LABEL: TextStyle = {
  fontFamily: FONTS.body600,
  fontSize: 15,
  lineHeight: 20,
  letterSpacing: 0.1,
  includeFontPadding: false,
  textAlign: 'center',
};

/** Numeric score inside circular muscle badges */
export const SCORE_CIRCLE_TEXT: TextStyle = {
  fontFamily: FONTS.sans600,
  fontSize: 17,
  lineHeight: 20,
  letterSpacing: -0.2,
  includeFontPadding: false,
  textAlign: 'center',
  ...tabular,
};

// ─── Elevation (dark: surface-step + border + reserved glow) ────────────────────
export const E = {
  card: {
    backgroundColor: C.surface1,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  raised: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  // Reserved glow — only the live score, primary CTA, and active nav.
  glow: {
    shadowColor: C.volt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
} as const;
