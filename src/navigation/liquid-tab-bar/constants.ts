/**
 * Apple Music floating tab bar tokens (iOS 26).
 * Outer bar: darker, more translucent glass.
 * Inner selection: lighter, more opaque frosted pill; accent only on icon + label.
 */

export const BAR_HORIZONTAL_MARGIN = 16;

export const BAR_FLOAT_BOTTOM = 0;
export const BAR_SAFE_INSET_REDUCTION = 12;
export const BAR_MIN_BOTTOM = 10;

export const GLASS_PAD_H = 6;
export const GLASS_PAD_V = 5;

export const GLASS_MERGE_SPACING = 8;

export const DROP_PAD_X = 16;

export const BAR_ROW_HEIGHT = 56;
export const DROP_HEIGHT = 52;
export const DROP_INSET_V = (BAR_ROW_HEIGHT - DROP_HEIGHT) / 2;
export const DROP_RADIUS = DROP_HEIGHT / 2;

/** Exact capsule radius (half height) — prevents square side border glitches */
export const BAR_GLASS_HEIGHT = BAR_ROW_HEIGHT + GLASS_PAD_V * 2;
export const BAR_GLASS_RADIUS = BAR_GLASS_HEIGHT / 2;
export const GLASS_RADIUS = BAR_GLASS_RADIUS;

/** Outer bar — lighter translucent shell */
export const BAR_GLASS_TINT = 'rgba(255,255,255,0.028)';
export const BAR_GLASS_BORDER = 'rgba(255,255,255,0.14)';

/** Inner selection — lighter & more opaque than bar */
export const SELECTION_GLASS_TINT = 'rgba(255,255,255,0.28)';
export const SELECTION_GLASS_BORDER = 'rgba(255,255,255,0.14)';
export const SELECTION_FALLBACK_TOP = 'rgba(255,255,255,0.34)';
export const SELECTION_FALLBACK_MID = 'rgba(255,255,255,0.20)';
export const SELECTION_FALLBACK_BOTTOM = 'rgba(255,255,255,0.12)';

/** Glide between tabs — smooth liquid slide */
export const SPRING_DROP_GLIDE = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
};

/** Width morph while moving */
export const SPRING_DROP_MORPH = {
  damping: 18,
  stiffness: 290,
  mass: 0.48,
};

/** Compress beat — short, eased (no long hold) */
export const DROP_SQUASH_MS = 72;

/** Water rebound — softer, visible overshoot */
export const SPRING_DROP_REBOUND_Y = {
  damping: 11,
  stiffness: 400,
  mass: 0.34,
};

export const SPRING_DROP_REBOUND_X = {
  damping: 13,
  stiffness: 380,
  mass: 0.36,
};

export const SPRING_DROP_OPACITY_SETTLE = {
  damping: 20,
  stiffness: 360,
  mass: 0.34,
};

/** Gelatin wobble — fluid, slightly slower */
export const SPRING_DROP_JIGGLE = {
  damping: 16,
  stiffness: 360,
  mass: 0.3,
};

export const SPRING_DROP_JIGGLE_END = {
  damping: 22,
  stiffness: 320,
  mass: 0.32,
};

export const DROP_SQUASH_SCALE_X = 1.09;
export const DROP_SQUASH_SCALE_Y = 0.91;

export const DROP_JIGGLE_SCALE_Y_PEAK = 1.01;
export const DROP_JIGGLE_SCALE_Y_DIP = 0.991;
export const DROP_JIGGLE_SCALE_Y_TAIL = 1.004;
export const DROP_JIGGLE_SCALE_X_DIP = 0.993;
export const DROP_JIGGLE_SCALE_X_PEAK = 1.008;
export const DROP_JIGGLE_SCALE_X_TAIL = 0.997;
export const DROP_JIGGLE_ROTATE_PEAK_DEG = 0.42;
export const DROP_JIGGLE_ROTATE_DIP_DEG = -0.26;
export const DROP_JIGGLE_ROTATE_TAIL_DEG = 0.1;

export const SPRING_TAB_ICON = {
  damping: 24,
  stiffness: 340,
  mass: 0.52,
};
