import { Easing } from 'react-native-reanimated';

// ─── Press interactions ────────────────────────────────────────────────────────
// Fast, athletic response — minimal bounce, confident release
export const SPRING_PRESS = {
  damping: 22,
  stiffness: 520,
  mass: 0.5,
} as const;

// ─── UI entrance / tab transitions ────────────────────────────────────────────
// Snappy but not instant — enough personality to feel premium
export const SPRING_UI = {
  damping: 24,
  stiffness: 320,
  mass: 0.55,
} as const;

// ─── Data / progress fills ─────────────────────────────────────────────────────
// Smooth deceleration curve — matches chart and bar fill animations
export const TIMING_FILL = {
  duration: 900,
  easing: Easing.out(Easing.cubic),
} as const;

// ─── Fast reveal ───────────────────────────────────────────────────────────────
// Tab indicator expand, badge fade — very quick
export const TIMING_FAST = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
} as const;

// ─── Standard reveal ──────────────────────────────────────────────────────────
// Overlay state changes, pill bg opacity
export const TIMING_STD = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
} as const;

// ─── Screen entrance stagger ──────────────────────────────────────────────────
// Max 6 items. Base duration for FadeInDown. Cap total at 250ms.
export const STAGGER_BASE_MS = 350;  // per-item animation duration
export const STAGGER_STEP_MS = 50;   // offset per step (50 × 5 = 250ms max)
export const STAGGER_MAX_ITEMS = 6;

export function staggerDelay(index: number): number {
  return Math.min(index, STAGGER_MAX_ITEMS - 1) * STAGGER_STEP_MS;
}

// ─── Press scale targets ──────────────────────────────────────────────────────
export const SCALE_PRESS_IN  = 0.964;
export const SCALE_PRESS_OUT = 1.0;

// ─── Tab item animation ───────────────────────────────────────────────────────
export const TAB_ICON_SCALE_ACTIVE   = 1.0;
export const TAB_ICON_SCALE_INACTIVE = 0.86;
