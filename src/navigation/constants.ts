import { C } from '../theme/obsidian';

/** Full-bleed backdrop for stacks/tabs — must match screen root backgrounds. */
export const NAV_SCREEN_BACKGROUND = C.canvas;

export const NAV_CONTENT_STYLE = {
  flex: 1,
  backgroundColor: NAV_SCREEN_BACKGROUND,
} as const;
