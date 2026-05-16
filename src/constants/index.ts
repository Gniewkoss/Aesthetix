import { MuscleGroupKey, PhysiqueRank } from '../types';

// ─── Muscle Group Meta ─────────────────────────────────────────────────────────
export const MUSCLE_GROUP_META: Record<
  MuscleGroupKey,
  { label: string; emoji: string; bodyPart: string }
> = {
  shoulders: { label: 'Shoulders', emoji: '🏔️', bodyPart: 'Upper Body' },
  chest: { label: 'Chest', emoji: '💪', bodyPart: 'Upper Body' },
  biceps: { label: 'Biceps', emoji: '💪', bodyPart: 'Arms' },
  triceps: { label: 'Triceps', emoji: '💪', bodyPart: 'Arms' },
  back: { label: 'Back', emoji: '🔱', bodyPart: 'Upper Body' },
  traps: { label: 'Traps', emoji: '🦬', bodyPart: 'Upper Body' },
  abs: { label: 'Abs', emoji: '⚡', bodyPart: 'Core' },
  forearms: { label: 'Forearms', emoji: '🦾', bodyPart: 'Arms' },
  quads: { label: 'Quads', emoji: '🦵', bodyPart: 'Legs' },
  calves: { label: 'Calves', emoji: '🦵', bodyPart: 'Legs' },
  glutes: { label: 'Glutes', emoji: '🍑', bodyPart: 'Legs' },
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
  Beginner: { minXP: 0, color: '#666', icon: '🌱', gradient: ['#444', '#666'] },
  Bronze: { minXP: 500, color: '#CD7F32', icon: '🥉', gradient: ['#8B4513', '#CD7F32'] },
  Silver: { minXP: 1500, color: '#C0C0C0', icon: '🥈', gradient: ['#808080', '#C0C0C0'] },
  Gold: { minXP: 3500, color: '#FFD700', icon: '🥇', gradient: ['#B8860B', '#FFD700'] },
  Platinum: { minXP: 7000, color: '#00F5FF', icon: '💠', gradient: ['#00A0FF', '#00F5FF'] },
  Diamond: { minXP: 12000, color: '#7B2FBE', icon: '💎', gradient: ['#4B0082', '#7B2FBE'] },
  Elite: { minXP: 20000, color: '#FF006E', icon: '⚡', gradient: ['#CC0058', '#FF006E'] },
  Legendary: { minXP: 35000, color: '#06FFA5', icon: '👑', gradient: ['#00C896', '#06FFA5'] },
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
