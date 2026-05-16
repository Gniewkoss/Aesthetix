import { MuscleGroupAnalysis, PhysiqueAnalysis } from '../types';

const notVisibleMuscle = (): MuscleGroupAnalysis => ({
  visible: false,
  score: 0,
  strengths: [],
  weaknesses: [],
  recommendations: [],
});

export const MOCK_ANALYSIS: PhysiqueAnalysis = {
  id: 'mock_001',
  createdAt: new Date().toISOString(),
  imageUris: [],
  visibleBodyParts: ['chest', 'shoulders', 'arms', 'abs', 'waist', 'traps', 'forearms'],
  notVisibleBodyParts: ['back', 'legs', 'glutes'],
  overallScore: 73,
  bodyFat: 14,
  bodyFatRange: '13–17%',
  muscularity: 68,
  aestheticsScore: 71,
  proportionsScore: 66,
  symmetryScore: 74,
  vTaperScore: 79,
  postureScore: 72,
  athleticismScore: 70,
  summary:
    'Solid front-facing upper body development with a naturally good V-taper frame. Chest and shoulders show above-average development. Conditioning could be improved by reducing body fat 3-4% to reveal current ab definition.',
  glowUpPrediction:
    'With 6-12 months of progressive overload on pressing movements, targeted rear-delt work, and a caloric deficit of 300-500 kcal/day, you could achieve a visible upper-body score of 85+. Expect sharper chest separation, rounder shoulders, and a lean, athletic torso.',
  predictedPotentialScore: 87,
  priorityAreas: ['abs', 'triceps', 'shoulders'],
  muscleGroups: {
    shoulders: {
      visible: true,
      score: 78,
      strengths: ['Good width creating V-taper illusion', 'Decent front delt development'],
      weaknesses: ['Rear delts underdeveloped', 'Lateral head lacks roundness'],
      recommendations: [
        'Add 3×15 lateral raises 3x/week',
        'Prioritize rear delt flyes and face pulls',
        'Include overhead press variations',
      ],
    },
    chest: {
      visible: true,
      score: 71,
      strengths: ['Good upper chest development', 'Decent thickness'],
      weaknesses: ['Lower chest lacks definition', 'Inner chest gap visible'],
      recommendations: [
        'Add incline press as primary movement',
        'Include cable crossovers for inner chest',
        'Improve mind-muscle connection during pressing',
      ],
    },
    biceps: {
      visible: true,
      score: 75,
      strengths: ['Good peak development', 'Decent size for frame'],
      weaknesses: ['Brachialis underdeveloped', 'Lacking fullness at bottom'],
      recommendations: [
        'Add hammer curls for brachialis',
        'Include spider curls for bicep peak',
        'Slow down eccentric phase',
      ],
    },
    triceps: {
      visible: true,
      score: 69,
      strengths: ['Long head has decent development'],
      weaknesses: ['Horseshoe shape not visible', 'Lateral head needs work'],
      recommendations: [
        'Prioritize overhead tricep extensions',
        'Add cable pushdowns with rope',
        'Include close-grip bench press',
      ],
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
      strengths: ['Good overall trap development', 'Creates strong neck-to-shoulder line'],
      weaknesses: ['Upper traps dominate, mid/lower traps weak'],
      recommendations: [
        'Add face pulls and band pull-aparts',
        'Include scapular retraction exercises',
        'Reduce shrug volume, increase rowing',
      ],
    },
    abs: {
      visible: true,
      score: 61,
      strengths: ['Good rectus abdominis shape', 'Core is functional'],
      weaknesses: ['Body fat obscuring definition', 'Obliques underdeveloped', 'No visible striations'],
      recommendations: [
        'Primary focus: reduce body fat to 10-12%',
        'Add oblique work: Russian twists, side planks',
        'Include weighted ab exercises for thickness',
      ],
    },
    forearms: {
      visible: true,
      score: 58,
      strengths: ['Decent vein visibility'],
      weaknesses: ['Lacking overall size and thickness', 'Forearm-to-upper-arm ratio off'],
      recommendations: [
        'Add wrist curls and reverse curls',
        'Include farmer carries',
        'Grip training 3x/week',
      ],
    },
    quads: notVisibleMuscle(),
    calves: notVisibleMuscle(),
    glutes: notVisibleMuscle(),
  },
  issuesDetected: [
    {
      id: 'issue_2',
      title: 'Body Fat Above Aesthetic Threshold',
      description:
        'Estimated body fat of ~15% is preventing muscle definition from showing. Cutting to 10-12% would dramatically reveal the musculature underneath.',
      severity: 'medium',
      category: 'composition',
    },
    {
      id: 'issue_3',
      title: 'Rear Delt Weakness',
      description:
        'Rear deltoids are visibly underdeveloped compared to front and lateral heads, causing rounded-forward shoulder appearance.',
      severity: 'medium',
      category: 'balance',
    },
    {
      id: 'issue_4',
      title: 'Slight Forward Head Posture',
      description:
        'Head position is slightly anterior to optimal alignment. Likely caused by tight pecs and weak posterior chain.',
      severity: 'low',
      category: 'posture',
    },
    {
      id: 'issue_5',
      title: 'Forearm-to-Arm Ratio Imbalance',
      description: 'Forearms appear underdeveloped relative to upper arm size, breaking the visual flow of the arm.',
      severity: 'low',
      category: 'proportion',
    },
  ],
  improvementPlan: [
    {
      priority: 1,
      area: 'Body Composition',
      action: '300-400 calorie deficit daily, prioritize protein 2.2g/kg, cardio 3x/week',
      timeframe: '12-16 weeks',
      expectedResult: 'Drop to 10-12% body fat, reveal abs and muscle striations, score +8-12 points',
    },
    {
      priority: 2,
      area: 'Rear Delts & Posture',
      action: 'Daily face pulls, band pull-aparts, rear delt focus in every push session',
      timeframe: '6-8 weeks',
      expectedResult: 'More 3D shoulder appearance, improved posture, reduced forward rounding',
    },
    {
      priority: 3,
      area: 'Triceps & Chest',
      action: 'Prioritize incline press, cable crossovers, and overhead tricep extensions',
      timeframe: '8-10 weeks',
      expectedResult: 'Improved chest fullness and arm definition from the front',
    },
    {
      priority: 4,
      area: 'Forearm Development',
      action: 'Daily grip work, reverse curls, wrist curls, farmer carries',
      timeframe: '12-16 weeks',
      expectedResult: 'Proportional forearm-to-arm ratio, enhanced arm aesthetics',
    },
  ],
  dietaryRecommendations: [
    {
      category: 'Protein',
      recommendation: 'Target 180-200g protein daily',
      rationale:
        'At your muscle mass level, maximizing protein synthesis requires ~2.2g per kg bodyweight to preserve muscle during the fat loss phase.',
    },
    {
      category: 'Calories',
      recommendation: 'Eat at 300-400 calorie deficit (maintenance minus ~350)',
      rationale: 'Aggressive cuts sacrifice muscle. Slow and steady at this intake preserves your existing development while dropping fat.',
    },
    {
      category: 'Carbohydrates',
      recommendation: 'Carb cycle: high on training days, low on rest days',
      rationale: 'Optimizes muscle glycogen for training performance while accelerating fat oxidation on rest days.',
    },
    {
      category: 'Supplementation',
      recommendation: 'Creatine 5g/day, Vitamin D3 4000IU, Omega-3 3g/day',
      rationale: 'These three have the strongest evidence base for physique development and hormonal optimization.',
    },
  ],
};

export const MOCK_HISTORY: PhysiqueAnalysis[] = [
  {
    ...MOCK_ANALYSIS,
    id: 'mock_history_1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 67,
    bodyFat: 18,
    symmetryScore: 70,
    vTaperScore: 74,
  },
  {
    ...MOCK_ANALYSIS,
    id: 'mock_history_2',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 70,
    bodyFat: 16,
    symmetryScore: 72,
    vTaperScore: 76,
  },
  {
    ...MOCK_ANALYSIS,
    id: 'mock_001',
    createdAt: new Date().toISOString(),
    overallScore: 73,
    bodyFat: 15,
    symmetryScore: 74,
    vTaperScore: 79,
  },
];

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
