import { VisualMeasurements } from '../vision/types';

/** Average 0–5 muscle-development ordinal across all reported regions. */
export function averageDevelopmentOrdinal(m: VisualMeasurements): number {
  const ordinals: number[] = [
    m.chestDevelopment,
    m.shoulderRoundness,
    m.shoulderWidth,
    m.armThickness,
    m.forearmDevelopment,
    m.trapDevelopment,
    m.absDefinition,
    m.obliqueDevelopment,
    ...(m.backWidth !== null ? [m.backWidth] : []),
    ...(m.quadDevelopment !== null ? [m.quadDevelopment] : []),
    ...(m.calfDevelopment !== null ? [m.calfDevelopment] : []),
    ...(m.gluteDevelopment !== null ? [m.gluteDevelopment] : []),
  ];
  return ordinals.reduce((a, b) => a + b, 0) / ordinals.length;
}

/** 0–5 leanness index from definition and waist signals. */
export function leannessOrdinal(m: VisualMeasurements): number {
  return (
    m.absDefinition * 0.40 +
    m.muscularSeparation * 0.35 +
    (5 - m.waistSoftness) * 0.25
  );
}

/**
 * Rewards clearly trained physiques (visible muscle + separation).
 * Diminishes at high development so strong athletes don't cluster at 100.
 */
export function trainingRecognitionBonus(m: VisualMeasurements): number {
  const dev = averageDevelopmentOrdinal(m);
  const lean = leannessOrdinal(m);
  const sep = m.muscularSeparation;

  let bonus = 0;
  if (dev >= 3.2 && lean >= 2.5) bonus = 10;
  else if (dev >= 2.8 && sep >= 2) bonus = 8;
  else if (dev >= 2.4 && sep >= 2) bonus = 6;
  else if (dev >= 2.0 && sep >= 2) bonus = 4;
  else if (dev >= 2.0 && sep >= 1 && lean >= 1.5) bonus = 2;

  if (bonus > 0 && dev >= 4.0) bonus = Math.round(bonus * 0.5);
  else if (bonus > 0 && dev >= 3.5) bonus = Math.round(bonus * 0.7);

  return bonus;
}

/**
 * Penalises untrained, high-body-fat profiles.
 * Returns 0–10 penalty points.
 */
export function sedentaryProfilePenalty(m: VisualMeasurements): number {
  const dev = averageDevelopmentOrdinal(m);

  if (dev <= 0.9 && m.waistSoftness >= 4) return 10;
  if (dev <= 1.2 && m.waistSoftness >= 4 && m.absDefinition <= 1) return 7;
  if (dev <= 1.4 && m.waistSoftness >= 3 && m.absDefinition <= 1) return 4;
  return 0;
}

/**
 * Caps overall score when development and body composition are mismatched.
 * High-end ceiling scales with conditioning and body fat — avoids clustering at 86–87.
 */
export function physiqueScoreCeiling(
  devAvg: number,
  conditioning: number,
  bodyFatMid: number,
): number {
  let ceiling = 100;

  if (devAvg <= 1.3 && bodyFatMid >= 22) ceiling = Math.min(ceiling, 44);
  else if (devAvg <= 1.6 && bodyFatMid >= 20) ceiling = Math.min(ceiling, 50);

  if (conditioning < 35) ceiling = Math.min(ceiling, conditioning + 18);
  if (conditioning < 25) ceiling = Math.min(ceiling, conditioning + 12);

  const compositionCeiling = Math.round(
    68 +
    Math.min(devAvg, 5) * 3.4 +
    conditioning * 0.16 -
    Math.max(0, bodyFatMid - 9) * 2.1,
  );
  ceiling = Math.min(ceiling, compositionCeiling);

  return ceiling;
}

/**
 * Rewards leanness + separation; penalises soft waist hiding muscle.
 * Spreads scores between two similarly muscular but different-composition physiques.
 */
export function compositionContrastAdjustment(m: VisualMeasurements): number {
  const lean = leannessOrdinal(m);
  let adj = 0;

  if (lean >= 4.2 && m.muscularSeparation >= 4 && m.waistSoftness <= 1) adj += 7;
  else if (lean >= 3.6 && m.muscularSeparation >= 3 && m.waistSoftness <= 2) adj += 4;
  else if (lean >= 3.0 && m.muscularSeparation >= 2) adj += 1;

  if (m.waistSoftness >= 4 && m.absDefinition <= 2) adj -= 8;
  else if (m.waistSoftness >= 3 && m.absDefinition <= 3) adj -= 5;
  else if (m.waistSoftness >= 2 && m.absDefinition <= 2) adj -= 3;

  return adj;
}
