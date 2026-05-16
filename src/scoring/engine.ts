import { VisualMeasurements } from '../vision/types';
import {
  averageDevelopmentOrdinal,
  physiqueScoreCeiling,
  sedentaryProfilePenalty,
  trainingRecognitionBonus,
} from './indices';

// ─── Ordinal → Score Mapping ───────────────────────────────────────────────────
// Steeper curve — each development tier is clearly separated on the 0–100 scale.
//
//   ordinal 0 →  8   untrained / no visible muscle
//   ordinal 1 → 30   minimal development
//   ordinal 2 → 52   recreational / early gym
//   ordinal 3 → 70   consistent gym-goer — clearly trained
//   ordinal 4 → 84   advanced athletic physique
//   ordinal 5 → 93   elite / stage-ready
//
// Target overall ranges after adjustments:
//   sedentary overweight:   28–42
//   untrained average:      40–52
//   regular gym-goer:       62–76
//   strong athletic:        76–88
//   elite:                  88–95
const ORDINAL_MAP = [8, 30, 52, 70, 84, 93] as const;

export function ordinalToScore(value: number | null, fallback = 15): number {
  if (value === null || value === undefined) return fallback;
  return ORDINAL_MAP[Math.min(Math.max(Math.round(value), 0), 5)];
}

// ─── Ratio Normalizer ──────────────────────────────────────────────────────────
function normalizeRatio(
  ratio: number | null,
  baseline: number,
  ceiling: number,
  cap = 100,
): number {
  if (ratio === null) return 0;
  if (ratio <= baseline) return 0;
  if (ratio >= ceiling) return cap;
  return Math.round(((ratio - baseline) / (ceiling - baseline)) * cap);
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(Math.max(Math.round(v), min), max);
}

/** Harmonic mean — weak categories pull the composite down (professional judging). */
function harmonicMean(values: number[]): number {
  const valid = values.filter((v) => v > 0);
  if (valid.length === 0) return 0;
  return valid.length / valid.reduce((acc, v) => acc + 1 / v, 0);
}

function blendArithmeticHarmonic(values: number[], harmonicWeight = 0.35): number {
  if (values.length === 0) return 0;
  const arithmetic = values.reduce((a, b) => a + b, 0) / values.length;
  const harmonic = harmonicMean(values);
  return arithmetic * (1 - harmonicWeight) + harmonic * harmonicWeight;
}

// ─── Category Score Interface ──────────────────────────────────────────────────
export interface CategoryScores {
  symmetry: number;
  aesthetics: number;
  muscularity: number;
  conditioning: number;
  posture: number;
  athleticism: number;
  vTaper: number;
  proportions: number;
}

// ─── Category Score Computation ────────────────────────────────────────────────
export function computeCategoryScores(m: VisualMeasurements): CategoryScores {

  const symmetry = clamp(
    ordinalToScore(m.leftRightSymmetry) * 0.65 +
    ordinalToScore(m.shoulderAlignment) * 0.20 +
    ordinalToScore(m.vTaperVisibility)  * 0.15,
  );

  const ratioContrib = normalizeRatio(m.shoulderToWaistRatio, 1.0, 1.75);
  const vTaper = clamp(
    m.shoulderToWaistRatio !== null
      ? ratioContrib * 0.65 + ordinalToScore(m.vTaperVisibility) * 0.35
      : ordinalToScore(m.vTaperVisibility),
  );

  const aesthetics = clamp(
    vTaper * 0.35 +
    symmetry * 0.25 +
    ordinalToScore(m.shoulderRoundness) * 0.22 +
    ordinalToScore(m.chestDevelopment) * 0.18,
  );

  const devOrdinals: number[] = [
    m.chestDevelopment,
    m.shoulderRoundness,
    m.shoulderWidth,
    m.armThickness,
    m.forearmDevelopment,
    m.trapDevelopment,
    m.absDefinition,
    ...(m.backWidth !== null ? [m.backWidth] : []),
    ...(m.quadDevelopment !== null ? [m.quadDevelopment] : []),
    ...(m.calfDevelopment !== null ? [m.calfDevelopment] : []),
    ...(m.gluteDevelopment !== null ? [m.gluteDevelopment] : []),
  ];
  const devScores = devOrdinals.map((v) => ordinalToScore(v));
  const muscularity = devScores.length > 0
    ? clamp(blendArithmeticHarmonic(devScores, 0.40))
    : 10;

  const conditioning = clamp(
    ordinalToScore(m.absDefinition) * 0.38 +
    ordinalToScore(m.muscularSeparation) * 0.32 +
    ordinalToScore(m.vascularity) * 0.08 +
    ordinalToScore(5 - m.waistSoftness) * 0.22,
  );

  const posture = clamp(
    ordinalToScore(m.shoulderAlignment) * 0.35 +
    ordinalToScore(m.headPosition) * 0.35 +
    ordinalToScore(m.spinalCurvature) * 0.30,
  );

  const athleticism = clamp(
    muscularity * 0.40 +
    conditioning * 0.40 +
    posture * 0.20,
  );

  const proportions = clamp(
    symmetry * 0.40 +
    vTaper * 0.35 +
    ordinalToScore(m.shoulderRoundness) * 0.25,
  );

  return { symmetry, aesthetics, muscularity, conditioning, posture, athleticism, vTaper, proportions };
}

// ─── Body Fat Multiplier ───────────────────────────────────────────────────────
export function bodyFatMultiplier(bodyFatMid: number): number {
  if (bodyFatMid <= 13) return 1.0;
  if (bodyFatMid <= 16) return 0.96;
  if (bodyFatMid <= 19) return 0.91;
  if (bodyFatMid <= 22) return 0.86;
  if (bodyFatMid <= 25) return 0.80;
  if (bodyFatMid <= 28) return 0.74;
  if (bodyFatMid <= 32) return 0.68;
  return 0.62;
}

// ─── Overall Score ─────────────────────────────────────────────────────────────
// Professional composite: development + conditioning weighted heavily,
// with profile-specific bonuses/penalties for trained vs sedentary physiques.
export function computeOverallScore(
  cat: CategoryScores,
  visibleMuscleScores: number[],
  measurements: VisualMeasurements,
  bodyFatMid?: number,
): number {
  const muscleAvg =
    visibleMuscleScores.length > 0
      ? blendArithmeticHarmonic(visibleMuscleScores, 0.30)
      : cat.muscularity;

  const structural = clamp(
    cat.symmetry * 0.38 +
    cat.proportions * 0.37 +
    cat.posture * 0.25,
  );

  const developmentBlock = clamp(
    cat.muscularity * 0.45 +
    muscleAvg * 0.55,
  );

  const compositionBlock = cat.conditioning;

  let raw = clamp(
    developmentBlock * 0.38 +
    compositionBlock * 0.30 +
    cat.aesthetics * 0.17 +
    structural * 0.15,
  );

  const devAvg = averageDevelopmentOrdinal(measurements);
  raw += trainingRecognitionBonus(measurements);
  raw -= sedentaryProfilePenalty(measurements);

  if (bodyFatMid !== undefined) {
    raw *= bodyFatMultiplier(bodyFatMid);
  }

  const ceiling = physiqueScoreCeiling(devAvg, cat.conditioning, bodyFatMid ?? 20);
  raw = Math.min(raw, ceiling);

  return clamp(raw);
}

// ─── Potential Score ───────────────────────────────────────────────────────────
export function computePotentialScore(
  currentScore: number,
  visibleMuscleScores: number[],
  bodyFatMax: number,
): number {
  const bfBonus = bodyFatMax > 22 ? 14 : bodyFatMax > 17 ? 9 : bodyFatMax > 13 ? 5 : 3;
  const weakest = visibleMuscleScores.length > 0 ? Math.min(...visibleMuscleScores) : currentScore;
  const improvementBonus = Math.max(0, 85 - weakest) * 0.28;
  return clamp(Math.round(currentScore + bfBonus + improvementBonus), currentScore + 3, 98);
}

// ─── Debug Metrics ─────────────────────────────────────────────────────────────
export function logScoringDebug(
  measurements: VisualMeasurements,
  categoryScores: CategoryScores,
  overallScore: number,
): void {
  if (!__DEV__) return;

  const devAvg = averageDevelopmentOrdinal(measurements);

  console.group('[PhysiqueAnalysis] Scoring Pipeline');
  console.log('📐 Pose type:', measurements.poseType);
  console.log('👁 Visible regions:', measurements.visibleRegions.join(', '));
  console.log('📏 Shoulder/waist ratio:', measurements.shoulderToWaistRatio);
  console.log('📊 Development avg (0–5):', devAvg.toFixed(2));
  console.log('🏋️ Training bonus:', trainingRecognitionBonus(measurements));
  console.log('⚠️ Sedentary penalty:', sedentaryProfilePenalty(measurements));
  console.log('📊 Development signals:', {
    chest: measurements.chestDevelopment,
    shoulders: measurements.shoulderRoundness,
    arms: measurements.armThickness,
    abs: measurements.absDefinition,
    separation: measurements.muscularSeparation,
    waistSoftness: measurements.waistSoftness,
  });
  console.log('🏆 Category scores:', categoryScores);
  console.log('💯 Overall score:', overallScore);
  console.groupEnd();
}
