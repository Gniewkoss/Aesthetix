import { VisualMeasurements } from '../vision/types';

// ─── Ordinal → Score Mapping ───────────────────────────────────────────────────
// Maps 0-5 development ordinal to 0-100 score.
// Non-linear: reflects that elite-level development (4→5) is exponentially harder.
const ORDINAL_MAP = [5, 22, 42, 62, 78, 95] as const;

export function ordinalToScore(value: number | null, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  return ORDINAL_MAP[Math.min(Math.max(Math.round(value), 0), 5)];
}

// ─── Ratio Normalizer ──────────────────────────────────────────────────────────
// Maps a width ratio to 0-100 score.
// E.g. shoulder-to-waist: 1.0 (no taper) → 0, 1.75+ (extreme taper) → 100.
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

  // SYMMETRY — bilateral balance + structural alignment
  const symmetry = clamp(
    ordinalToScore(m.leftRightSymmetry) * 0.60 +
    ordinalToScore(m.shoulderAlignment) * 0.25 +
    ordinalToScore(m.vTaperVisibility) * 0.15,
  );

  // V-TAPER — measured ratio is primary signal; visual estimate supplements
  const ratioContrib = normalizeRatio(m.shoulderToWaistRatio, 1.0, 1.75);
  const vTaper = clamp(
    m.shoulderToWaistRatio !== null
      ? ratioContrib * 0.65 + ordinalToScore(m.vTaperVisibility) * 0.35
      : ordinalToScore(m.vTaperVisibility),
  );

  // AESTHETICS — V-taper silhouette + symmetry + upper body development
  const aesthetics = clamp(
    vTaper * 0.35 +
    symmetry * 0.25 +
    ordinalToScore(m.shoulderRoundness) * 0.20 +
    ordinalToScore(m.chestDevelopment) * 0.20,
  );

  // MUSCULARITY — average of all visible development ordinals
  const devValues: number[] = [
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
  const muscularity = devValues.length > 0
    ? clamp(devValues.reduce((acc, v) => acc + ordinalToScore(v), 0) / devValues.length)
    : 0;

  // CONDITIONING — body composition quality signals
  // waistSoftness is inverted: soft waist = high BF = low conditioning score
  const conditioning = clamp(
    ordinalToScore(m.absDefinition) * 0.30 +
    ordinalToScore(m.muscularSeparation) * 0.30 +
    ordinalToScore(m.vascularity) * 0.15 +
    ordinalToScore(5 - m.waistSoftness) * 0.25,
  );

  // POSTURE — structural alignment quality
  const posture = clamp(
    ordinalToScore(m.shoulderAlignment) * 0.35 +
    ordinalToScore(m.headPosition) * 0.35 +
    ordinalToScore(m.spinalCurvature) * 0.30,
  );

  // ATHLETICISM — derived composite (not an independent LLM guess)
  const athleticism = clamp(
    muscularity * 0.35 +
    conditioning * 0.35 +
    posture * 0.30,
  );

  // PROPORTIONS — shape and balance across visible regions
  const proportions = clamp(
    symmetry * 0.40 +
    vTaper * 0.35 +
    ordinalToScore(m.shoulderRoundness) * 0.25,
  );

  return { symmetry, aesthetics, muscularity, conditioning, posture, athleticism, vTaper, proportions };
}

// ─── Overall Score ─────────────────────────────────────────────────────────────
// 60% from category-level scores, 40% from individual visible muscle group scores.
// Both sides must agree to push the overall score high — prevents gaming either path.
export function computeOverallScore(
  cat: CategoryScores,
  visibleMuscleScores: number[],
): number {
  const categoryScore =
    cat.symmetry    * 0.15 +
    cat.aesthetics  * 0.25 +
    cat.muscularity * 0.25 +
    cat.conditioning * 0.20 +
    cat.posture     * 0.15;

  const muscleAvg =
    visibleMuscleScores.length > 0
      ? visibleMuscleScores.reduce((a, b) => a + b, 0) / visibleMuscleScores.length
      : categoryScore;

  return clamp(categoryScore * 0.60 + muscleAvg * 0.40);
}

// ─── Potential Score ───────────────────────────────────────────────────────────
// Deterministic estimate of how high the score could reach with optimal training
// and body composition. Based on: current score + BF reduction room + weakest links.
export function computePotentialScore(
  currentScore: number,
  visibleMuscleScores: number[],
  bodyFatMax: number,
): number {
  // Bonus from losing excess body fat (fat reveals underlying muscle)
  const bfBonus = bodyFatMax > 22 ? 14 : bodyFatMax > 17 ? 9 : bodyFatMax > 13 ? 5 : 3;

  // Bonus from improving the weakest visible muscles toward ~83
  const weakest = visibleMuscleScores.length > 0 ? Math.min(...visibleMuscleScores) : currentScore;
  const improvementBonus = Math.max(0, 83 - weakest) * 0.30;

  return clamp(Math.round(currentScore + bfBonus + improvementBonus), currentScore + 2, 98);
}
