import { R } from '../../theme/obsidian';

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

/** Active pill horizontal padding (Apple “Ekran główny” style) */
export const DROP_PAD_X = 16;

export const BAR_ROW_HEIGHT = 56;
export const DROP_HEIGHT = 52;
export const DROP_INSET_V = (BAR_ROW_HEIGHT - DROP_HEIGHT) / 2;
export const DROP_RADIUS = DROP_HEIGHT / 2;

export const GLASS_RADIUS = R.pill;

/** Outer bar — dark translucent shell */
export const BAR_GLASS_TINT = 'rgba(255,255,255,0.055)';
export const BAR_GLASS_BORDER = 'rgba(255,255,255,0.20)';

/** Inner selection — lighter & more opaque than bar (Apple active highlight) */
export const SELECTION_GLASS_TINT = 'rgba(255,255,255,0.28)';
export const SELECTION_GLASS_BORDER = 'rgba(255,255,255,0.14)';
export const SELECTION_FALLBACK_TOP = 'rgba(255,255,255,0.34)';
export const SELECTION_FALLBACK_MID = 'rgba(255,255,255,0.20)';
export const SELECTION_FALLBACK_BOTTOM = 'rgba(255,255,255,0.12)';

export const SPRING_DROP_GLIDE = {
  damping: 24,
  stiffness: 260,
  mass: 0.58,
};

export const SPRING_DROP_MORPH = {
  damping: 22,
  stiffness: 235,
  mass: 0.62,
};

export const SPRING_TAB_ICON = {
  damping: 24,
  stiffness: 340,
  mass: 0.52,
};
