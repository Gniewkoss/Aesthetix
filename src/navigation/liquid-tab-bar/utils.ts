import { DROP_PAD_X } from './constants';
import type { HighlightRect, TabMetrics } from './types';

export function highlightFromMetrics(m: TabMetrics | undefined): HighlightRect {
  if (!m || m.contentW <= 0) return { x: 0, width: 0 };
  return {
    x: m.tabX + m.contentX - DROP_PAD_X,
    width: m.contentW + DROP_PAD_X * 2,
  };
}
