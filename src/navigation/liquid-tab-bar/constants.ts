import { R } from '../../theme/obsidian';

/**
 * Layout matched to Apple Music floating tab bar (iOS 26 reference).
 * - 16pt side margins (full-width pill between edges)
 * - Bottom: safeArea.bottom minus reduction (sits lower than default safe-zone lift)
 * - ~54pt content row, ~48pt inner selection capsule
 */

/** Horizontal inset from screen edges (Apple Music floating group) */
export const BAR_HORIZONTAL_MARGIN = 16;

/** Extra nudge above physical bottom (0 = as low as reduction allows) */
export const BAR_FLOAT_BOTTOM = 0;

/** Pull bar down vs full safe-area inset (smaller = lower on screen) */
export const BAR_SAFE_INSET_REDUCTION = 12;

/** Simulator / no home indicator */
export const BAR_MIN_BOTTOM = 10;

export const GLASS_PAD_H = 5;
export const GLASS_PAD_V = 5;

/** Selection capsule merges with bar material */
export const GLASS_MERGE_SPACING = 10;

/** Horizontal pad around icon + label inside selection capsule */
export const DROP_PAD_X = 14;

/** Content row inside the glass shell */
export const BAR_ROW_HEIGHT = 56;

/** Inner active capsule (almost full row height) */
export const DROP_HEIGHT = 52;
export const DROP_INSET_V = (BAR_ROW_HEIGHT - DROP_HEIGHT) / 2;
export const DROP_RADIUS = DROP_HEIGHT / 2;

export const GLASS_RADIUS = R.pill;

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
