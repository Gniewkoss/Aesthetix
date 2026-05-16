import { MuscleGroupAnalysis, PhysiqueAnalysis } from '../types';

const notVisibleMuscle = (): MuscleGroupAnalysis => ({
  visible: false,
  score: 0,
  strengths: [],
  weaknesses: [],
  recommendations: [],
});

// ─── Mock Analysis ─────────────────────────────────────────────────────────────
// Scores are computed by running the real scoring engine against a representative
// set of visual measurements for a solid front-facing upper body physique at ~14% BF.
// When engine calibration changes, run src/api/openai.ts in __DEV__ mode to get
// fresh scores and update this object accordingly.
export const MOCK_ANALYSIS: PhysiqueAnalysis = {
  id: 'mock_001',
  createdAt: new Date().toISOString(),
  imageUris: [],
  visibleBodyParts: ['chest', 'shoulders', 'arms', 'abs', 'waist', 'traps', 'forearms'],
  notVisibleBodyParts: ['back', 'legs', 'glutes'],

  overallScore: 78,
  bodyFat: 14,
  bodyFatRange: '13–17%',
  muscularity: 77,
  aestheticsScore: 79,
  proportionsScore: 80,
  symmetryScore: 83,
  vTaperScore: 74,
  postureScore: 91,
  athleticismScore: 79,

  summary:
    'Solid upper body development with above-average V-taper and strong postural alignment (91/100). Chest and shoulder roundness score well at 78–82. Core conditioning at 72 is the primary limiting factor — reducing body fat 3–4% would unlock significant aesthetic gains across all visible metrics.',

  glowUpPrediction:
    'With a 300–400 kcal daily deficit over 12–16 weeks, you could reach 10–12% body fat and push your conditioning score above 85. Prioritising rear delt work and weighted ab training alongside the cut would elevate aesthetics from 79 toward 88+. Realistic 6-month overall score projection: 85–88.',

  predictedPotentialScore: 91,
  priorityAreas: ['abs', 'forearms', 'traps'],

  muscleGroups: {
    shoulders: {
      visible: true,
      score: 82,
      strengths: ['Above-average shoulder width creating strong V-taper frame', 'Good 3D roundness from front angle'],
      weaknesses: ['Rear delts likely underdeveloped relative to front delts (not visible from front pose)'],
      recommendations: ['Face pulls 3×15 twice per week', 'Rear delt dumbbell rows', 'Band pull-aparts daily'],
    },
    chest: {
      visible: true,
      score: 78,
      strengths: ['Good overall chest mass and thickness', 'Decent upper-chest development'],
      weaknesses: ['Inner-chest separation not fully visible at current body fat', 'Lower chest outline softer than ideal'],
      recommendations: ['Incline barbell press as primary movement', 'Cable crossovers for inner-chest detail', 'Weighted dips for lower-chest sweep'],
    },
    biceps: {
      visible: true,
      score: 78,
      strengths: ['Good arm thickness relative to frame', 'Decent muscle belly length'],
      weaknesses: ['Brachialis needs development for fuller arm look', 'Peak definition will improve with lower body fat'],
      recommendations: ['Incline dumbbell curls for peak development', 'Hammer curls for brachialis thickness', 'Spider curls 2×/week'],
    },
    triceps: {
      visible: true,
      score: 78,
      strengths: ['Arm overall thickness suggests decent tricep mass'],
      weaknesses: ['Horseshoe shape not sharply visible at current conditioning', 'Lateral head separation needs work'],
      recommendations: ['Overhead cable extensions for long-head stretch', 'Rope pushdowns for horseshoe definition', 'Close-grip bench press'],
    },
    back: {
      visible: false,
      score: 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
    traps: {
      visible: true,
      score: 72,
      strengths: ['Visible trap development from front view', 'Good shoulder-to-neck transition'],
      weaknesses: ['Upper trap dominant — mid and lower traps likely underdeveloped', 'Trap thickness needs improvement'],
      recommendations: ['Face pulls and cable Y-raises for mid/lower traps', 'Reduce shrug volume, increase rowing', 'Scapular retraction exercises'],
    },
    abs: {
      visible: true,
      score: 70,
      strengths: ['Good rectus abdominis shape and structure', 'Oblique development is present'],
      weaknesses: ['Body fat at current level (13–17%) obscuring full definition', 'No visible muscle separation between abs'],
      recommendations: ['Primary fix: reduce body fat to 10–12% through diet', 'Weighted cable crunches for ab thickness', 'Oblique cable work: Pallof press, woodchops'],
    },
    forearms: {
      visible: true,
      score: 70,
      strengths: ['Decent forearm-to-upper-arm proportion', 'Some venous visibility'],
      weaknesses: ['Forearm mass below upper arm development', 'Forearm-to-bicep ratio will look better at lower body fat'],
      recommendations: ['Reverse curls 3×12 twice per week', 'Farmer carries for grip and forearm density', 'Wrist curls superset with reverse wrist curls'],
    },
    quads: notVisibleMuscle(),
    calves: notVisibleMuscle(),
    glutes: notVisibleMuscle(),
  },

  issuesDetected: [
    {
      id: 'issue_bf',
      title: 'Body Fat Above Aesthetic Threshold',
      description:
        'Estimated body fat of 13–17% is limiting visible muscle definition. Cutting to 10–12% would significantly sharpen aesthetics score and reveal the underlying muscle structure.',
      severity: 'medium',
      category: 'composition',
    },
    {
      id: 'issue_rear_delt',
      title: 'Rear Deltoid Development Suspected',
      description:
        'Front pose only — rear delts not directly visible. However, shoulder roundness relative to width suggests a likely front-delt dominant imbalance common in chest-heavy training.',
      severity: 'low',
      category: 'balance',
    },
    {
      id: 'issue_forearm_ratio',
      title: 'Forearm-to-Upper-Arm Ratio',
      description:
        'Forearm development (70) is 12 points below bicep/tricep scores (78). This proportion gap is visible and breaks the visual flow of the arm from elbow to wrist.',
      severity: 'low',
      category: 'proportion',
    },
  ],

  improvementPlan: [
    {
      priority: 1,
      area: 'Body Composition',
      action: '300–400 calorie deficit daily, 2.2g protein per kg bodyweight, 3× cardio/week',
      timeframe: '12–16 weeks',
      expectedResult: 'Drop to 10–12% body fat, abs become clearly visible, conditioning score +10–15 pts',
    },
    {
      priority: 2,
      area: 'Core Development',
      action: 'Weighted cable crunches, Pallof press, ab wheel rollouts 3×/week',
      timeframe: '8–12 weeks',
      expectedResult: 'Improved abs structural thickness; definition increases as body fat drops',
    },
    {
      priority: 3,
      area: 'Forearms',
      action: 'Reverse curls, farmer carries, wrist curl superset — 3 sessions/week',
      timeframe: '12–16 weeks',
      expectedResult: 'Proportional forearm development, better arm aesthetic flow',
    },
    {
      priority: 4,
      area: 'Traps – Mid/Lower',
      action: 'Face pulls, band pull-aparts, cable Y-raises — daily light work',
      timeframe: '6–8 weeks',
      expectedResult: 'Improved posture appearance, better shoulder-to-neck aesthetic',
    },
  ],

  dietaryRecommendations: [
    {
      category: 'Protein',
      recommendation: 'Target 175–200g protein daily (2.2g/kg bodyweight)',
      rationale:
        'Muscle preservation during a caloric deficit at your development level requires high protein. Current muscle scores are good — protect them during the cut.',
    },
    {
      category: 'Calories',
      recommendation: 'Eat at a 300–400 calorie deficit (maintenance minus 350)',
      rationale:
        'Aggressive cuts lose muscle. A modest deficit preserves strength and fullness in shoulders and chest while shedding the fat limiting your conditioning score.',
    },
    {
      category: 'Carbohydrates',
      recommendation: 'Carb-cycle: higher carbs on training days, lower on rest days',
      rationale:
        'Optimises muscle glycogen for training performance and accelerates fat oxidation on rest days without sacrificing strength.',
    },
    {
      category: 'Supplementation',
      recommendation: 'Creatine monohydrate 5g/day, Vitamin D3 4000IU, Omega-3 3g/day',
      rationale:
        'Creatine supports strength preservation during the cut. D3 and omega-3 have strong evidence for body composition and hormonal health.',
    },
  ],
};

// ─── Mock History ──────────────────────────────────────────────────────────────
export const MOCK_HISTORY: PhysiqueAnalysis[] = [
  {
    ...MOCK_ANALYSIS,
    id: 'mock_history_1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 71,
    bodyFat: 17,
    bodyFatRange: '16–20%',
    symmetryScore: 77,
    vTaperScore: 67,
    aestheticsScore: 72,
    muscularity: 71,
    postureScore: 84,
  } as PhysiqueAnalysis,
  {
    ...MOCK_ANALYSIS,
    id: 'mock_history_2',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 75,
    bodyFat: 16,
    bodyFatRange: '14–18%',
    symmetryScore: 80,
    vTaperScore: 71,
    aestheticsScore: 76,
    muscularity: 74,
  } as PhysiqueAnalysis,
  {
    ...MOCK_ANALYSIS,
    id: 'mock_history_3',
    createdAt: new Date().toISOString(),
    overallScore: 78,
    bodyFat: 14,
    bodyFatRange: '13–17%',
    symmetryScore: 83,
    vTaperScore: 74,
    aestheticsScore: 79,
    muscularity: 77,
  } as PhysiqueAnalysis,
];

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
