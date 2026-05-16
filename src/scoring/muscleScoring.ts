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

// ─── Region Presence Helpers ───────────────────────────────────────────────────
// GPT can label regions with different names; we check for any of several aliases.
function hasRegion(regions: string[], ...aliases: string[]): boolean {
  const lower = regions.map((r) => r.toLowerCase());
  return aliases.some((alias) => lower.some((r) => r.includes(alias)));
}

// ─── Per-Muscle Scoring ────────────────────────────────────────────────────────
// Each formula uses a small set of directly relevant visual measurements.
// Weights reflect how much each indicator actually contributes to that muscle's
// visual impression in a physique assessment context.

export function scoreMuscleGroups(m: VisualMeasurements): MuscleGroups {
  const regions = m.visibleRegions;

  const hasFront  = hasRegion(regions, 'chest', 'front', 'torso', 'abs', 'anterior');
  const hasBack   = hasRegion(regions, 'back', 'rear', 'posterior', 'lats', 'lat');
  const hasLegs   = hasRegion(regions, 'leg', 'quad', 'calf', 'lower body', 'thigh');
  const hasArms   = hasRegion(regions, 'arm', 'bicep', 'forearm', 'elbow');
  const hasShoulder = hasRegion(regions, 'shoulder', 'delt', 'deltoid') || hasFront || hasBack;

  // ── Shoulders ──────────────────────────────────────────────────────────────
  // Visible from front or back. Score = roundness (3D look) + width + symmetry.
  const shouldersScore = hasShoulder
    ? clamp(
        ordinalToScore(m.shoulderRoundness) * 0.40 +
        ordinalToScore(m.shoulderWidth)     * 0.40 +
        ordinalToScore(m.leftRightSymmetry) * 0.20,
      )
    : 0;

  // ── Chest ──────────────────────────────────────────────────────────────────
  // Front-only. Development + definition. Separation bonus from conditioning.
  const chestScore = hasFront
    ? clamp(
        ordinalToScore(m.chestDevelopment) * 0.70 +
        ordinalToScore(m.muscularSeparation) * 0.30,
      )
    : 0;

  // ── Biceps ─────────────────────────────────────────────────────────────────
  // Arm thickness (peak mass) + separation + vascularity for conditioning look.
  const bicepsScore = hasFront || hasArms
    ? clamp(
        ordinalToScore(m.armThickness) * 0.65 +
        ordinalToScore(m.muscularSeparation) * 0.20 +
        ordinalToScore(m.vascularity) * 0.15,
      )
    : 0;

  // ── Triceps ────────────────────────────────────────────────────────────────
  // Slightly more weighted toward mass; separation is still important.
  const tricepsScore = hasFront || hasArms
    ? clamp(
        ordinalToScore(m.armThickness) * 0.70 +
        ordinalToScore(m.muscularSeparation) * 0.30,
      )
    : 0;

  // ── Back ───────────────────────────────────────────────────────────────────
  // Back pose only. Width (lat flare) dominates the visual impression.
  const backScore = hasBack
    ? clamp(
        (m.backWidth !== null ? ordinalToScore(m.backWidth) : 0) * 0.45 +
        (m.latFlare  !== null ? ordinalToScore(m.latFlare)  : 0) * 0.35 +
        ordinalToScore(m.muscularSeparation) * 0.20,
      )
    : 0;

  // ── Traps ─────────────────────────────────────────────────────────────────
  // Visible from front (upper traps at neck) or back (full trap). Width helps.
  const trapsScore = hasShoulder || hasBack
    ? clamp(
        ordinalToScore(m.trapDevelopment) * 0.80 +
        ordinalToScore(m.shoulderWidth)   * 0.20,
      )
    : 0;

  // ── Abs ───────────────────────────────────────────────────────────────────
  // Front-only. Ab definition is the dominant signal; obliques add width.
  const absScore = hasFront
    ? clamp(
        ordinalToScore(m.absDefinition) * 0.65 +
        ordinalToScore(m.obliqueDevelopment) * 0.20 +
        ordinalToScore(m.muscularSeparation) * 0.15,
      )
    : 0;

  // ── Forearms ──────────────────────────────────────────────────────────────
  // Vascularity is a strong visual cue for forearm development and leanness.
  const forearmsScore = hasFront || hasArms
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
        ordinalToScore(m.calfDevelopment)    * 0.85 +
        ordinalToScore(m.leftRightSymmetry)  * 0.15,
      )
    : 0;

  // ── Glutes ────────────────────────────────────────────────────────────────
  const glutesScore = hasBack && m.gluteDevelopment !== null
    ? clamp(ordinalToScore(m.gluteDevelopment))
    : 0;

  return {
    shoulders: hasShoulder           ? emptyVisible(shouldersScore) : notVisible(),
    chest:     hasFront              ? emptyVisible(chestScore)     : notVisible(),
    biceps:    hasFront || hasArms   ? emptyVisible(bicepsScore)    : notVisible(),
    triceps:   hasFront || hasArms   ? emptyVisible(tricepsScore)   : notVisible(),
    back:      hasBack               ? emptyVisible(backScore)      : notVisible(),
    traps:     hasShoulder || hasBack? emptyVisible(trapsScore)     : notVisible(),
    abs:       hasFront              ? emptyVisible(absScore)       : notVisible(),
    forearms:  hasFront || hasArms   ? emptyVisible(forearmsScore)  : notVisible(),
    quads:     hasLegs               ? emptyVisible(quadsScore)     : notVisible(),
    calves:    hasLegs               ? emptyVisible(calvesScore)    : notVisible(),
    glutes:    hasBack               ? emptyVisible(glutesScore)    : notVisible(),
  };
}
