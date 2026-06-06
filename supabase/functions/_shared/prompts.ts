// Shared prompt builders for Edge Functions — mirrors src/constants/index.ts and
// src/api/chat.ts so the server assembles LLM context from trusted structured data.

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

export interface CoachMuscleGroup {
  score: number;
  visible: boolean;
}

export interface CoachIssue {
  title: string;
  severity: string;
}

export function buildCoachingPrompt(input: {
  categoryScores: CategoryScores;
  muscleGroups: Record<string, CoachMuscleGroup>;
  bodyFatRange: string;
  issues: CoachIssue[];
  visibleRegions: string[];
  notVisibleRegions: string[];
}): string {
  const { categoryScores, muscleGroups, bodyFatRange, issues, visibleRegions, notVisibleRegions } = input;

  const muscleLines = Object.entries(muscleGroups)
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
- Be specific and reference the actual numbers provided`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildChatSystemContext(analysis: Record<string, any>): string {
  const categoryScores = [
    `Muscularity ${analysis.muscularity}/100`,
    `Aesthetics ${analysis.aestheticsScore}/100`,
    `Proportions ${analysis.proportionsScore}/100`,
    `Symmetry ${analysis.symmetryScore}/100`,
    `V-Taper ${analysis.vTaperScore}/100`,
    `Posture ${analysis.postureScore}/100`,
    `Athleticism ${analysis.athleticismScore}/100`,
  ].join(' · ');

  const muscleGroups = analysis.muscleGroups ?? {};
  const muscleScores = Object.entries(muscleGroups)
    .filter(([, g]: [string, any]) => g?.visible && g?.score > 0)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.score - a.score)
    .map(([k, g]: [string, any]) => `${k} ${g.score}`)
    .join(' · ');

  const topStrengths = Object.entries(muscleGroups)
    .filter(([, g]: [string, any]) => g?.visible && g?.strengths?.length > 0)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.score - a.score)
    .slice(0, 2)
    .flatMap(([, g]: [string, any]) => g.strengths.slice(0, 1))
    .join('; ');

  const topWeaknesses = Object.entries(muscleGroups)
    .filter(([, g]: [string, any]) => g?.visible && g?.weaknesses?.length > 0 && g.score < 78)
    .sort(([, a]: [string, any], [, b]: [string, any]) => a.score - b.score)
    .slice(0, 3)
    .flatMap(([, g]: [string, any]) => g.weaknesses.slice(0, 1))
    .join('; ');

  const issues = Array.isArray(analysis.issuesDetected) ? analysis.issuesDetected : [];
  const issueList = issues
    .map((i: { title?: string; severity?: string }) => `${i.title} [${i.severity}]`)
    .join('; ') || 'none';

  const plan = Array.isArray(analysis.improvementPlan) ? analysis.improvementPlan : [];
  const priorityList = plan
    .slice(0, 3)
    .map((p: { priority?: number; area?: string; action?: string; timeframe?: string }) =>
      `#${p.priority} ${p.area} — ${p.action} (${p.timeframe})`)
    .join('\n  ');

  return `You are Max, an elite AI physique coach built into the Aesthetix app. Your ONLY job is to answer questions about fitness, bodybuilding, strength training, physique, nutrition, body composition, recovery, sleep, and physical health.

If a user asks something completely unrelated (maths, coding, general trivia, etc.), respond with: "I'm your physique coach — I only cover training, nutrition, and physique. What can I help you with?" Do NOT answer off-topic questions.

Respond concisely: 2–4 sentences unless the user explicitly asks for a detailed plan. Be direct, specific, and reference the user's actual numbers when relevant.

━━ THIS USER'S PHYSIQUE DATA ━━
Overall: ${analysis.overallScore}/100 → Potential: ${analysis.predictedPotentialScore}/100
Body fat: ${analysis.bodyFatRange}

Category breakdown: ${categoryScores}
Muscle scores (visible): ${muscleScores}

Key strengths: ${topStrengths || 'none noted'}
Key weaknesses: ${topWeaknesses || 'none noted'}
Issues detected: ${issueList}

Priority plan:
  ${priorityList}

Glow-up projection: ${String(analysis.glowUpPrediction ?? 'n/a').slice(0, 250)}
AI summary: ${String(analysis.summary ?? 'n/a').slice(0, 200)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
