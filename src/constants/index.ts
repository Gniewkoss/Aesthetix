import { MuscleGroupKey, PhysiqueRank } from '../types';

// ─── Muscle Group Meta ─────────────────────────────────────────────────────────
export const MUSCLE_GROUP_META: Record<
  MuscleGroupKey,
  { label: string; icon: string; bodyPart: string }
> = {
  shoulders: { label: 'Shoulders', icon: 'barbell-outline', bodyPart: 'Upper Body' },
  chest: { label: 'Chest', icon: 'body-outline', bodyPart: 'Upper Body' },
  biceps: { label: 'Biceps', icon: 'barbell-outline', bodyPart: 'Arms' },
  triceps: { label: 'Triceps', icon: 'barbell-outline', bodyPart: 'Arms' },
  back: { label: 'Back', icon: 'body-outline', bodyPart: 'Upper Body' },
  traps: { label: 'Traps', icon: 'body-outline', bodyPart: 'Upper Body' },
  abs: { label: 'Abs', icon: 'fitness-outline', bodyPart: 'Core' },
  forearms: { label: 'Forearms', icon: 'barbell-outline', bodyPart: 'Arms' },
  quads: { label: 'Quads', icon: 'walk-outline', bodyPart: 'Legs' },
  calves: { label: 'Calves', icon: 'walk-outline', bodyPart: 'Legs' },
  glutes: { label: 'Glutes', icon: 'body-outline', bodyPart: 'Legs' },
};

export const MUSCLE_GROUP_KEYS: MuscleGroupKey[] = [
  'shoulders',
  'chest',
  'biceps',
  'triceps',
  'back',
  'traps',
  'abs',
  'forearms',
  'quads',
  'calves',
  'glutes',
];

// ─── Physique Ranks ────────────────────────────────────────────────────────────
export const RANK_CONFIG: Record<
  PhysiqueRank,
  { minXP: number; color: string; icon: string; gradient: [string, string] }
> = {
  Beginner: { minXP: 0, color: '#6B7280', icon: 'leaf-outline', gradient: ['#374151', '#6B7280'] },
  Bronze: { minXP: 500, color: '#B45309', icon: 'medal-outline', gradient: ['#78350F', '#B45309'] },
  Silver: { minXP: 1500, color: '#9CA3AF', icon: 'medal-outline', gradient: ['#6B7280', '#9CA3AF'] },
  Gold: { minXP: 3500, color: '#D97706', icon: 'trophy-outline', gradient: ['#92400E', '#D97706'] },
  Platinum: { minXP: 7000, color: '#3B82F6', icon: 'trophy', gradient: ['#1D4ED8', '#3B82F6'] },
  Diamond: { minXP: 12000, color: '#8B5CF6', icon: 'diamond', gradient: ['#5B21B6', '#8B5CF6'] },
  Elite: { minXP: 20000, color: '#EF4444', icon: 'flash', gradient: ['#B91C1C', '#EF4444'] },
  Legendary: { minXP: 35000, color: '#22C55E', icon: 'star', gradient: ['#15803D', '#22C55E'] },
};

export const RANKS: PhysiqueRank[] = [
  'Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Legendary',
];

// ─── XP System ────────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  firstScan: 100,
  dailyScan: 50,
  streakBonus: 25,
  improvementBonus: 75,
  shareBonus: 30,
};

// ─── Scan Limits ──────────────────────────────────────────────────────────────
export const SCAN_LIMITS = {
  free: 1,
  premium: 999,
};

// ─── Premium Plans ────────────────────────────────────────────────────────────
export const PREMIUM_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$4.99',
    period: 'week',
    savingsPercent: null,
    features: ['Unlimited scans', 'Full analysis', 'AI coach chat'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$12.99',
    period: 'month',
    savingsPercent: 35,
    features: ['Unlimited scans', 'Full analysis', 'AI coach chat', 'Progress tracking', 'Priority support'],
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$79.99',
    period: 'year',
    savingsPercent: 60,
    features: ['Everything in Monthly', 'Glow-up predictions', 'Export reports', 'Early access'],
  },
];

// ─── OpenAI Prompt ────────────────────────────────────────────────────────────
export const PHYSIQUE_ANALYSIS_PROMPT = `You are an elite physique aesthetics coach, competitive bodybuilding judge, and sports scientist. Analyze the provided physique image(s) with expert precision.

Evaluate these dimensions:
- Overall physique aesthetics and appeal
- Muscular development and conditioning
- Body composition (estimated body fat %)
- Symmetry between left and right sides
- V-taper (shoulder-to-waist ratio)
- Posture alignment and structural integrity
- Athletic potential and functional fitness
- Each major muscle group individually
- Visible weaknesses, imbalances, and priority improvement areas

Return ONLY a valid JSON object with NO additional text, markdown, or explanation:

{
  "overall_score": <0-100>,
  "body_fat": <estimated percentage as number>,
  "muscularity": <0-100>,
  "aesthetics_score": <0-100>,
  "proportions_score": <0-100>,
  "symmetry_score": <0-100>,
  "v_taper_score": <0-100>,
  "posture_score": <0-100>,
  "athleticism_score": <0-100>,
  "muscle_groups": {
    "shoulders": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "chest": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "biceps": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "triceps": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "back": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "traps": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "abs": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "forearms": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "quads": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "calves": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] },
    "glutes": { "score": <0-100>, "strengths": [<string>], "weaknesses": [<string>], "recommendations": [<string>] }
  },
  "issues_detected": [
    { "id": "<uuid>", "title": "<issue>", "description": "<detail>", "severity": "<low|medium|high>", "category": "<proportion|symmetry|posture|composition|balance>" }
  ],
  "improvement_plan": [
    { "priority": <1-10>, "area": "<area>", "action": "<action>", "timeframe": "<timeframe>", "expected_result": "<result>" }
  ],
  "dietary_recommendations": [
    { "category": "<category>", "recommendation": "<rec>", "rationale": "<why>" }
  ],
  "priority_areas": [<string list of top 3-5 muscle groups to focus on>],
  "glow_up_prediction": "<vivid description of predicted physique transformation in 6-12 months with consistent training>",
  "predicted_potential_score": <0-100>,
  "summary": "<2-3 sentence expert assessment of overall physique>"
}`;
