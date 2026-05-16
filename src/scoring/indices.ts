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
 * Returns 0–18 bonus points.
 */
export function trainingRecognitionBonus(m: VisualMeasurements): number {
  const dev = averageDevelopmentOrdinal(m);
  const lean = leannessOrdinal(m);
  const sep = m.muscularSeparation;

  if (dev >= 3.2 && lean >= 2.5) return 20;
  if (dev >= 2.8 && sep >= 2) return 16;
  if (dev >= 2.4 && sep >= 2) return 12;
  if (dev >= 2.0 && sep >= 2) return 8;
  if (dev >= 2.0 && sep >= 1 && lean >= 1.5) return 4;
  return 0;
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

  return ceiling;
}
