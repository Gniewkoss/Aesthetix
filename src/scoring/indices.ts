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

  // High-end realism — 95+ only for near-stage conditioning + development
  if (devAvg >= 4.5 && conditioning >= 90 && bodyFatMid <= 11) {
    ceiling = Math.min(ceiling, 95);
  } else if (devAvg >= 4.0 && conditioning >= 86) {
    ceiling = Math.min(ceiling, 91);
  } else if (devAvg >= 3.5) {
    ceiling = Math.min(ceiling, 87);
  } else if (devAvg >= 3.2) {
    ceiling = Math.min(ceiling, 83);
  }

  return ceiling;
}
