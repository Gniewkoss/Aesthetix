import { PhysiqueAnalysis } from '../types';

export const MOCK_ANALYSIS: PhysiqueAnalysis = {
  id: 'mock_001',
  createdAt: new Date().toISOString(),
  imageUris: [],
  overallScore: 73,
  bodyFat: 15,
  muscularity: 68,
  aestheticsScore: 71,
  proportionsScore: 66,
  symmetryScore: 74,
  vTaperScore: 79,
  postureScore: 72,
  athleticismScore: 70,
  summary:
    'Solid upper body development with a naturally good V-taper frame. Legs and posterior chain need significant attention to balance the physique. Conditioning could be improved by reducing body fat 3-4% to reveal current muscularity.',
  glowUpPrediction:
    'With 6-12 months of focused leg training, progressive overload on compound lifts, and a caloric deficit of 300-500 kcal/day, you could achieve a physique score of 85+. Expect visible quad separation, enhanced V-taper, and a lean, athletic look that turns heads.',
  predictedPotentialScore: 87,
  priorityAreas: ['quads', 'calves', 'back', 'shoulders'],
  muscleGroups: {
    shoulders: {
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
      score: 65,
      strengths: ['Decent trap development', 'Some lat width visible'],
      weaknesses: ['Lacks thickness overall', 'Lower lats need work', 'No visible Christmas tree'],
      recommendations: [
        'Prioritize deadlifts and bent-over rows',
        'Add straight-arm pulldowns for lat activation',
        'Include rack pulls for lower back thickness',
        'Increase rowing volume significantly',
      ],
    },
    traps: {
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
      score: 58,
      strengths: ['Decent vein visibility'],
      weaknesses: ['Lacking overall size and thickness', 'Forearm-to-upper-arm ratio off'],
      recommendations: [
        'Add wrist curls and reverse curls',
        'Include farmer carries',
        'Grip training 3x/week',
      ],
    },
    quads: {
      score: 52,
      strengths: ['Natural leg length is aesthetic'],
      weaknesses: [
        'Significant underdevelopment vs upper body',
        'No quad sweep visible',
        'VMO (teardrop) lacking',
        'Classic upper/lower body imbalance',
      ],
      recommendations: [
        'Prioritize legs: 2x per week minimum',
        'Squat depth: focus on ATG squats',
        'Add leg press and hack squats',
        'Include walking lunges for sweep',
        'This is the #1 priority area',
      ],
    },
    calves: {
      score: 48,
      strengths: ['Good ankle structure'],
      weaknesses: [
        'Severely underdeveloped relative to quads',
        'No separation between gastrocnemius heads',
        'Looks disproportionate from behind',
      ],
      recommendations: [
        'Train calves daily: standing and seated',
        'Full range of motion — deep stretch is key',
        'High volume: 20-25 reps per set',
        '3-4 exercises per session',
      ],
    },
    glutes: {
      score: 55,
      strengths: ['Decent hip structure'],
      weaknesses: [
        'Flat glutes when viewed from side',
        'No glute-ham tie-in visible',
        'Underdeveloped relative to frame',
      ],
      recommendations: [
        'Add hip thrusts as primary movement',
        'Include Bulgarian split squats',
        'Add glute kickbacks and cable pull-throughs',
        'Focus on mind-muscle connection',
      ],
    },
  },
  issuesDetected: [
    {
      id: 'issue_1',
      title: 'Significant Lower Body Lag',
      description:
        'Upper body development significantly outpaces lower body. This creates visual imbalance and is a classic "chicken leg" pattern that reduces overall aesthetic score.',
      severity: 'high',
      category: 'proportion',
    },
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
      area: 'Legs (Quads & Calves)',
      action: '2x legs per week, prioritize squats, hack squats, leg press, daily calf raises',
      timeframe: '8-12 weeks',
      expectedResult: 'Visible quad sweep, reduced upper/lower body imbalance, improved aesthetics from front',
    },
    {
      priority: 2,
      area: 'Body Composition',
      action: '300-400 calorie deficit daily, prioritize protein 2.2g/kg, cardio 3x/week',
      timeframe: '12-16 weeks',
      expectedResult: 'Drop to 10-12% body fat, reveal abs and muscle striations, score +8-12 points',
    },
    {
      priority: 3,
      area: 'Back Thickness',
      action: 'Add heavy barbell rows, deadlifts weekly, increase rowing volume by 40%',
      timeframe: '10-14 weeks',
      expectedResult: 'Visible back thickness, Christmas tree development, stronger V-taper',
    },
    {
      priority: 4,
      area: 'Rear Delts & Posture',
      action: 'Daily face pulls, band pull-aparts, rear delt focus in every push session',
      timeframe: '6-8 weeks',
      expectedResult: 'More 3D shoulder appearance, improved posture, reduced forward rounding',
    },
    {
      priority: 5,
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
