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

// ─── Stage 1 Prompt: Visual Measurement Extraction ────────────────────────────
// GPT-4o is used ONLY to extract observable visual measurements from the image.
// It outputs ordinal scales and ratio estimates — NOT scores, NOT evaluations.
// All scoring happens downstream in the deterministic TypeScript engine.
export const VISUAL_MEASUREMENT_PROMPT = `You are a computer vision analyst examining physique images.

Your ONLY job is to extract objective visual measurements. Do NOT score, do NOT evaluate quality, do NOT judge. Just observe and measure.

━━━ MULTI-IMAGE HANDLING ━━━
If MULTIPLE images are provided:
• Examine ALL images carefully before responding.
• visible_regions and not_visible_regions must reflect the COMBINED set across ALL images.
• pose_type must be "mixed" if different images show different orientations (e.g. front + back).
• For measurement fields, use the most clearly visible image for each body part.
• NEVER skip an image. If one image shows the back and another shows the front, both must be analyzed.

━━━ BACK POSE DETECTION — CRITICAL ━━━
When ANY image shows a back pose (person facing away from camera):
• ALWAYS set pose_type to "back" (single image) or "mixed" (combined with other poses).
• ALWAYS include "back" in visible_regions.
• ALWAYS provide a numeric value (not null) for back_width, lat_flare, trap_development, and glute_development if visible.
• Back pose indicators: spine visible, shoulder blades visible, rear deltoids visible, lats visible, no chest or abs.

━━━ ORDINAL SCALE REFERENCE ━━━
Use for all development fields. Calibrate against a realistic population of gym-goers:
  0 = absent / completely flat — no detectable muscle (untrained or covered)
  1 = minimal — barely visible, clearly early-stage or sedentary
  2 = moderate — clearly present muscle, regular gym-goer who trains consistently; some definition
  3 = good — noticeably above average, clearly athletic physique, visible muscularity from a distance
  4 = excellent — advanced, impressive, near-competitive physique that stands out
  5 = elite — world-class, competition-ready bodybuilder (extremely rare, use only for the top 0.1%)

Most people who train regularly and look athletic sit between 2 and 3.
A clearly muscular person who people notice in everyday life is a 3.

━━━ OUTPUT FORMAT ━━━
Output ONLY valid JSON with exactly these fields, no extra keys or text:

{
  "pose_type": "<front|back|side|mixed> — use 'mixed' when multiple images show different orientations",
  "visible_regions": ["<combined list across ALL images: chest, shoulders, abs, back, arms, legs, glutes, etc.>"],
  "not_visible_regions": ["<body areas not visible in ANY of the provided images>"],

  "shoulder_to_waist_ratio": <decimal e.g. 1.4 means shoulders 40% wider than waist — use front image — null if not measurable>,
  "shoulder_to_hip_ratio": <decimal or null>,
  "waist_to_hip_ratio": <decimal or null>,

  "chest_development": <0-5>,
  "shoulder_roundness": <0-5, roundness and 3D projection of deltoids — assess from most revealing angle>,
  "shoulder_width": <0-5, width relative to torso>,
  "arm_thickness": <0-5, overall upper arm visual mass>,
  "forearm_development": <0-5>,
  "trap_development": <0-5 — use back image if available, otherwise front>,
  "back_width": <0-5 from back image — use trap and shoulder width as proxy if back image is ambiguous — null ONLY if no back pose at all>,
  "abs_definition": <0-5, visibility and sharpness of abdominal outline>,
  "oblique_development": <0-5>,
  "quad_development": <0-5 or null if legs not visible in any image>,
  "calf_development": <0-5 or null if calves not visible in any image>,
  "glute_development": <0-5 from back image — null only if truly not visible>,

  "muscular_separation": <0-5, overall inter-muscle line visibility across all visible images>,
  "vascularity": <0-5, visible veins>,
  "waist_softness": <0-5 where 0=very lean hard waist, 5=very soft high-bodyfat waist>,

  "posture_shoulder_alignment": <0-5 where 5=perfectly level, 0=severe tilt>,
  "posture_head_position": <0-5 where 5=perfect neutral, 0=severe forward head posture>,
  "spinal_curvature": <0-5 where 5=ideal natural curve, 0=severe deviation — assess from back or side image if available>,

  "left_right_symmetry": <0-5 where 5=perfect bilateral symmetry>,
  "v_taper_visibility": <0-5 where 5=dramatic V-silhouette, 0=no taper or reverse taper — use best available angle>,
  "lat_flare": <0-5, lat spread width visible from back — must be numeric (not null) when back pose is present>
}

━━━ MEASUREMENT RULES ━━━
• Use null ONLY when the body part is genuinely not visible in any provided image
• Use whole integers only (0, 1, 2, 3, 4, 5) for all ordinal scales
• Ratios use one decimal place (e.g. 1.4, 1.6) and must be plausible (typically 1.0–2.0)
• Aim for accuracy — match what you actually see, not the most pessimistic reading
• Most people who work out regularly will fall in the 2–3 range for development
• A clearly muscular, above-average physique is a 3, not a 2
• Only use 5 for world-class athletes or professional bodybuilders in peak condition
• When multiple images show the same body part, use the best visible angle`;

// ─── Stage 2 Prompt: AI Coaching Layer ────────────────────────────────────────
// Receives pre-computed scores and outputs ONLY narrative coaching text.
// It MUST NOT invent or alter any score — it only interprets provided numbers.
import { MuscleGroups, IssueDetected } from '../types';
import { CategoryScores } from '../scoring/engine';

export function buildCoachingPrompt(
  categoryScores: CategoryScores,
  muscleGroups: MuscleGroups,
  bodyFatRange: string,
  issues: IssueDetected[],
  visibleRegions: string[],
  notVisibleRegions: string[],
): string {
  const muscleLines = (Object.entries(muscleGroups) as [string, MuscleGroups[keyof MuscleGroups]][])
    .filter(([, g]) => g.visible && g.score > 0)
    .map(([k, g]) => `  ${k}: ${g.score}/100`)
    .join('\n');

  const issueLines = issues.length > 0
    ? issues.map((i) => `  - ${i.title} [${i.severity}]`).join('\n')
    : '  None detected';

  return `You are an elite physique coach and former competitive bodybuilding judge (20+ years experience).

The scores below were computed by a deterministic computer vision pipeline. Your role is to interpret them with expert coaching commentary. Do NOT change, question, or re-compute any number.

═══ COMPUTED PHYSIQUE SCORES ═══
Category scores:
  Symmetry:     ${categoryScores.symmetry}/100
  Aesthetics:   ${categoryScores.aesthetics}/100
  Muscularity:  ${categoryScores.muscularity}/100
  Conditioning: ${categoryScores.conditioning}/100
  Posture:      ${categoryScores.posture}/100
  Athleticism:  ${categoryScores.athleticism}/100
  V-Taper:      ${categoryScores.vTaper}/100
  Proportions:  ${categoryScores.proportions}/100

Estimated body fat range: ${bodyFatRange}

Visible muscle group scores:
${muscleLines || '  (no visible muscles recorded)'}

Detected structural issues:
${issueLines}

Visible regions: ${visibleRegions.join(', ') || 'unknown'}
Not in frame:    ${notVisibleRegions.join(', ') || 'all visible'}
════════════════════════════════

Your task: write expert coaching commentary based on these metrics.

Return ONLY valid JSON (no markdown, no extra text):
{
  "summary": "<2-3 sentences: expert physique assessment referencing specific computed scores>",
  "muscle_groups": {
    "shoulders": { "strengths": ["<if score > 68, list 1-2 genuine strengths>"], "weaknesses": ["<if score < 68, list 1-2 honest weaknesses>"], "recommendations": ["<1-2 specific exercises>"] },
    "chest":     { "strengths": [], "weaknesses": [], "recommendations": [] },
    "biceps":    { "strengths": [], "weaknesses": [], "recommendations": [] },
    "triceps":   { "strengths": [], "weaknesses": [], "recommendations": [] },
    "back":      { "strengths": [], "weaknesses": [], "recommendations": [] },
    "traps":     { "strengths": [], "weaknesses": [], "recommendations": [] },
    "abs":       { "strengths": [], "weaknesses": [], "recommendations": [] },
    "forearms":  { "strengths": [], "weaknesses": [], "recommendations": [] },
    "quads":     { "strengths": [], "weaknesses": [], "recommendations": [] },
    "calves":    { "strengths": [], "weaknesses": [], "recommendations": [] },
    "glutes":    { "strengths": [], "weaknesses": [], "recommendations": [] }
  },
  "glow_up_prediction": "<specific 6-12 month transformation based on the weakest scores above>",
  "dietary_recommendations": [
    { "category": "<Protein|Calories|Carbohydrates|Supplementation|Nutrient Timing>", "recommendation": "<specific actionable recommendation>", "rationale": "<why it applies to this physique's scores>" }
  ]
}

Rules:
- Return empty arrays for muscles that are not in the visible list
- Score > 78 = clear strength worth mentioning
- Score < 55 = genuine weakness needing direct address
- 55-78 = room to improve but not critically weak
- Dietary recommendations: provide exactly 3-4 entries
- Tone: expert and analytical, not motivational or excessively positive
- Summary must cite at least two specific computed score numbers`;
}
