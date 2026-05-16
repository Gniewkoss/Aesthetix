import { VisualMeasurements } from '../vision/types';
import { MuscleGroups, MuscleGroupAnalysis } from '../types';
import { ordinalToScore } from './engine';

function notVisible(): MuscleGroupAnalysis {
  return { visible: false, score: 0, strengths: [], weaknesses: [], recommendations: [] };
}

function clamp(v: number): number {
  return Math.min(Math.max(Math.round(v), 0), 100);
}

function emptyVisible(score: number): MuscleGroupAnalysis {
  return { visible: true, score, strengths: [], weaknesses: [], recommendations: [] };
}

// ─── Region Presence Detection ─────────────────────────────────────────────────
// GPT uses varied terminology; check for any of several known aliases.
function hasRegion(regions: string[], ...aliases: string[]): boolean {
  const lower = regions.map((r) => r.toLowerCase());
  return aliases.some((alias) => lower.some((r) => r.includes(alias)));
}

// ─── Pose-Aware Region Detection ──────────────────────────────────────────────
// poseType is the most authoritative signal (set by the extraction model).
// Region label matching is the fallback for ambiguous/mixed labels.
// Wide alias lists cover the many ways GPT may describe the same body area.

function detectRegions(m: VisualMeasurements): {
  hasFront: boolean;
  hasBack: boolean;
  hasLegs: boolean;
  hasArms: boolean;
  hasShoulder: boolean;
} {
  const regions = m.visibleRegions;
  const pose    = m.poseType;

  // Front: front pose OR regions that only appear when facing camera
  const hasFront =
    pose === 'front' ||
    pose === 'mixed' ||
    hasRegion(regions,
      'front', 'chest', 'anterior', 'torso', 'abs', 'abdominal',
      'pectoral', 'waist', 'sternum', 'navel',
    );

  // Back: back pose OR any back-specific region label.
  // GPT may use anatomical terms like latissimus, rhomboid, trapezius, erector.
  const hasBack =
    pose === 'back'  ||
    pose === 'mixed' ||
    hasRegion(regions,
      'back', 'rear', 'posterior', 'lats', 'lat', 'latissimus',
      'rhomboid', 'erector', 'spinal', 'lumbar', 'dorsal',
      'teres', 'infraspinatus',
    );

  // Legs: any lower-body label
  const hasLegs = hasRegion(regions,
    'leg', 'quad', 'calf', 'calves', 'lower body', 'thigh',
    'hamstring', 'shin', 'tibialis', 'vastus', 'rectus femoris',
  );

  // Arms: distinct from front torso (user may only show arms, no chest)
  const hasArms =
    hasFront ||
    hasRegion(regions,
      'arm', 'bicep', 'tricep', 'forearm', 'elbow', 'upper arm',
      'brachial', 'brachii',
    );

  // Shoulders: visible from both front and back
  const hasShoulder =
    hasFront || hasBack ||
    hasRegion(regions, 'shoulder', 'delt', 'deltoid', 'acromion');

  return { hasFront, hasBack, hasLegs, hasArms, hasShoulder };
}

// ─── Back Score Fallback ───────────────────────────────────────────────────────
// When back is detected from poseType but back_width / lat_flare measurements are
// missing (GPT failed to extract them), proxy values from related measurements.
// Traps are always visible from behind; shoulder width correlates with lat spread.
function backWidthFallback(m: VisualMeasurements): number {
  return m.backWidth !== null ? ordinalToScore(m.backWidth)
                              : ordinalToScore(m.trapDevelopment);
}
function latFlareFallback(m: VisualMeasurements): number {
  return m.latFlare !== null ? ordinalToScore(m.latFlare)
                             : ordinalToScore(m.shoulderWidth);
}

// ─── Per-Muscle Scoring ────────────────────────────────────────────────────────
export function scoreMuscleGroups(m: VisualMeasurements): MuscleGroups {
  const { hasFront, hasBack, hasLegs, hasArms, hasShoulder } = detectRegions(m);

  if (__DEV__) {
    console.log('[PhysiqueAnalysis] Region detection:', {
      poseType: m.poseType,
      hasFront, hasBack, hasLegs, hasArms, hasShoulder,
      visibleRegions: m.visibleRegions,
    });
  }

  // ── Shoulders ──────────────────────────────────────────────────────────────
  const shouldersScore = hasShoulder
    ? clamp(
        ordinalToScore(m.shoulderRoundness) * 0.40 +
        ordinalToScore(m.shoulderWidth)     * 0.40 +
        ordinalToScore(m.leftRightSymmetry) * 0.20,
      )
    : 0;

  // ── Chest ──────────────────────────────────────────────────────────────────
  const chestScore = hasFront
    ? clamp(
        ordinalToScore(m.chestDevelopment)   * 0.70 +
        ordinalToScore(m.muscularSeparation) * 0.30,
      )
    : 0;

  // ── Biceps ─────────────────────────────────────────────────────────────────
  const bicepsScore = hasArms
    ? clamp(
        ordinalToScore(m.armThickness)       * 0.65 +
        ordinalToScore(m.muscularSeparation) * 0.20 +
        ordinalToScore(m.vascularity)        * 0.15,
      )
    : 0;

  // ── Triceps ────────────────────────────────────────────────────────────────
  const tricepsScore = hasArms
    ? clamp(
        ordinalToScore(m.armThickness)       * 0.70 +
        ordinalToScore(m.muscularSeparation) * 0.30,
      )
    : 0;

  // ── Back ───────────────────────────────────────────────────────────────────
  // Uses fallback proxies when explicit back measurements are missing.
  const backScore = hasBack
    ? clamp(
        backWidthFallback(m) * 0.45 +
        latFlareFallback(m)  * 0.35 +
        ordinalToScore(m.muscularSeparation) * 0.20,
      )
    : 0;

  // ── Traps ─────────────────────────────────────────────────────────────────
  const trapsScore = hasShoulder || hasBack
    ? clamp(
        ordinalToScore(m.trapDevelopment) * 0.80 +
        ordinalToScore(m.shoulderWidth)   * 0.20,
      )
    : 0;

  // ── Abs ───────────────────────────────────────────────────────────────────
  const absScore = hasFront
    ? clamp(
        ordinalToScore(m.absDefinition)      * 0.65 +
        ordinalToScore(m.obliqueDevelopment) * 0.20 +
        ordinalToScore(m.muscularSeparation) * 0.15,
      )
    : 0;

  // ── Forearms ──────────────────────────────────────────────────────────────
  const forearmsScore = hasArms
    ? clamp(
        ordinalToScore(m.forearmDevelopment) * 0.70 +
        ordinalToScore(m.vascularity)        * 0.30,
      )
    : 0;

  // ── Quads ─────────────────────────────────────────────────────────────────
  const quadsScore = hasLegs && m.quadDevelopment !== null
    ? clamp(
        ordinalToScore(m.quadDevelopment)    * 0.80 +
        ordinalToScore(m.muscularSeparation) * 0.20,
      )
    : 0;

  // ── Calves ────────────────────────────────────────────────────────────────
  const calvesScore = hasLegs && m.calfDevelopment !== null
    ? clamp(
        ordinalToScore(m.calfDevelopment)   * 0.85 +
        ordinalToScore(m.leftRightSymmetry) * 0.15,
      )
    : 0;

  // ── Glutes ────────────────────────────────────────────────────────────────
  const glutesScore = hasBack && m.gluteDevelopment !== null
    ? clamp(ordinalToScore(m.gluteDevelopment))
    : 0;

  return {
    shoulders: hasShoulder           ? emptyVisible(shouldersScore) : notVisible(),
    chest:     hasFront              ? emptyVisible(chestScore)     : notVisible(),
    biceps:    hasArms               ? emptyVisible(bicepsScore)    : notVisible(),
    triceps:   hasArms               ? emptyVisible(tricepsScore)   : notVisible(),
    back:      hasBack               ? emptyVisible(backScore)      : notVisible(),
    traps:     hasShoulder || hasBack? emptyVisible(trapsScore)     : notVisible(),
    abs:       hasFront              ? emptyVisible(absScore)       : notVisible(),
    forearms:  hasArms               ? emptyVisible(forearmsScore)  : notVisible(),
    quads:     hasLegs               ? emptyVisible(quadsScore)     : notVisible(),
    calves:    hasLegs               ? emptyVisible(calvesScore)    : notVisible(),
    glutes:    hasBack               ? emptyVisible(glutesScore)    : notVisible(),
  };
}
