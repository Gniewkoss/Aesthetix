import { R } from '../../theme/obsidian';

/** Inner padding of the glass pill */
export const GLASS_PAD_H = 6;
export const GLASS_PAD_V = 5;

/** Distance at which bar + selection pill merge (native liquid glass) */
export const GLASS_MERGE_SPACING = 14;

/** Horizontal padding around icon + label inside the liquid drop */
export const DROP_PAD_X = 16;

/** Floating bar inset from screen edges */
export const BAR_H_INSET = 16;

/** Minimum bottom safe-area padding */
export const BAR_MIN_BOTTOM = 12;

export const GLASS_RADIUS = R.pill;
export const DROP_RADIUS = R.pill;

/** iOS-like spring — position glide with gentle settle */
export const SPRING_DROP_GLIDE = {
  damping: 24,
  stiffness: 260,
  mass: 0.58,
};

/** Slightly softer spring for width morph (liquid stretch) */
export const SPRING_DROP_MORPH = {
  damping: 22,
  stiffness: 235,
  mass: 0.62,
};

/** Quick squash/stretch pulse at the start of a tab change */
export const SPRING_DROP_SQUASH = {
  damping: 16,
  stiffness: 520,
  mass: 0.38,
};

export const SPRING_DROP_SETTLE = {
  damping: 24,
  stiffness: 340,
  mass: 0.52,
};

export const SPRING_TAB_ICON = {
  damping: 24,
  stiffness: 340,
  mass: 0.52,
};
