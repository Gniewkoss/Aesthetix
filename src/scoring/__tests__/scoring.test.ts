import { VisualMeasurements } from '../../vision/types';
import { computeCategoryScores, computeOverallScore } from '../engine';
import { estimateBodyFatRange, midpointBodyFat } from '../bodyFat';

// Builder with neutral defaults; override per test to model trained vs untrained.
function measurements(overrides: Partial<VisualMeasurements> = {}): VisualMeasurements {
  return {
    poseType: 'front',
    visibleRegions: ['chest', 'shoulders', 'arms', 'abs'],
    notVisibleRegions: [],
    shoulderToWaistRatio: 1.4,
    shoulderToHipRatio: 1.3,
    waistToHipRatio: 0.85,
    chestDevelopment: 3,
    shoulderRoundness: 3,
    shoulderWidth: 3,
    armThickness: 3,
    forearmDevelopment: 3,
    trapDevelopment: 3,
    backWidth: 3,
    absDefinition: 3,
    obliqueDevelopment: 3,
    quadDevelopment: 3,
    calfDevelopment: 3,
    gluteDevelopment: 3,
    muscularSeparation: 3,
    vascularity: 2,
    waistSoftness: 2,
    shoulderAlignment: 4,
    headPosition: 4,
    spinalCurvature: 4,
    leftRightSymmetry: 4,
    vTaperVisibility: 3,
    latFlare: 3,
    ...overrides,
  };
}

describe('computeCategoryScores', () => {
  it('keeps every category within 0–100', () => {
    const scores = computeCategoryScores(measurements());
    for (const value of Object.values(scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('scores a trained physique higher than an untrained one (differentiation)', () => {
    const untrained = computeCategoryScores(
      measurements({ chestDevelopment: 0, shoulderWidth: 0, armThickness: 0, absDefinition: 0, muscularSeparation: 0 }),
    );
    const trained = computeCategoryScores(
      measurements({ chestDevelopment: 5, shoulderWidth: 5, armThickness: 5, absDefinition: 5, muscularSeparation: 5 }),
    );
    expect(trained.muscularity).toBeGreaterThan(untrained.muscularity);
  });
});

describe('computeOverallScore', () => {
  it('returns a bounded 0–100 score', () => {
    const m = measurements();
    const cat = computeCategoryScores(m);
    const bf = midpointBodyFat(estimateBodyFatRange(m));
    const overall = computeOverallScore(cat, [70, 65, 72], m, bf);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(100);
  });
});

describe('estimateBodyFatRange', () => {
  it('produces a valid ordered range with a percentage label', () => {
    const range = estimateBodyFatRange(measurements());
    expect(range.min).toBeLessThanOrEqual(range.max);
    expect(range.label).toMatch(/\d+.*\d+%/);
  });

  it('estimates higher body fat for a softer waist / no definition', () => {
    const lean = midpointBodyFat(estimateBodyFatRange(measurements({ waistSoftness: 0, absDefinition: 5, muscularSeparation: 5 })));
    const soft = midpointBodyFat(estimateBodyFatRange(measurements({ waistSoftness: 5, absDefinition: 0, muscularSeparation: 0 })));
    expect(soft).toBeGreaterThan(lean);
  });
});
