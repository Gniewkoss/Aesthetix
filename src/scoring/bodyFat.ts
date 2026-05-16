import { VisualMeasurements } from '../vision/types';

// ─── Body Fat Range ────────────────────────────────────────────────────────────

export interface BodyFatRange {
  min: number;
  max: number;
  label: string; // e.g. "12–15%"
}

// ─── Body Fat Estimation ────────────────────────────────────────────────────────
// Estimates body fat range from visual conditioning indicators.
// Uses a composite "leanness" score (0-5) built from 4 independent signals.
// Outputs a RANGE rather than a false-precise single number.
//
// Leanness weights:
//   - abs definition:      35% — most reliable visible body fat marker
//   - muscular separation: 30% — striations and inter-muscle lines
//   - waist softness:      20% — inverted (soft waist = high BF = low leanness)
//   - vascularity:         15% — supporting indicator, highly individual

export function estimateBodyFatRange(m: VisualMeasurements): BodyFatRange {
  const leanness =
    m.absDefinition       * 0.35 +
    m.muscularSeparation  * 0.30 +
    (5 - m.waistSoftness) * 0.20 +
    m.vascularity         * 0.15;

  if (leanness >= 4.5) return { min: 3,  max: 6,  label: '3–6%' };
  if (leanness >= 4.0) return { min: 5,  max: 8,  label: '5–8%' };
  if (leanness >= 3.5) return { min: 7,  max: 10, label: '7–10%' };
  if (leanness >= 3.0) return { min: 10, max: 13, label: '10–13%' };
  if (leanness >= 2.5) return { min: 13, max: 17, label: '13–17%' };
  if (leanness >= 2.0) return { min: 16, max: 21, label: '16–21%' };
  if (leanness >= 1.5) return { min: 20, max: 26, label: '20–26%' };
  if (leanness >= 1.0) return { min: 25, max: 32, label: '25–32%' };
  return                       { min: 30, max: 40, label: '30–40%' };
}

export function midpointBodyFat(range: BodyFatRange): number {
  return Math.round((range.min + range.max) / 2);
}
