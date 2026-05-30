import { supabase, isSupabaseConfigured } from './supabase';
import { PhysiqueAnalysis } from '../types';

// SECURITY: the chat completion is proxied exclusively through the `chat` Edge
// Function so the OpenAI key never leaves the server. There is no direct-from-client
// OpenAI path — an EXPO_PUBLIC_ key would be inlined into the shipped bundle.

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

// ─── Supabase auth headers ─────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${session?.access_token ?? ANON_KEY}`,
  };
}

// ─── System context builder ────────────────────────────────────────────────────
// Injects the full physique profile so every chat reply is personalised.

export function buildChatSystemContext(analysis: PhysiqueAnalysis): string {
  const categoryScores = [
    `Muscularity ${analysis.muscularity}/100`,
    `Aesthetics ${analysis.aestheticsScore}/100`,
    `Proportions ${analysis.proportionsScore}/100`,
    `Symmetry ${analysis.symmetryScore}/100`,
    `V-Taper ${analysis.vTaperScore}/100`,
    `Posture ${analysis.postureScore}/100`,
    `Athleticism ${analysis.athleticismScore}/100`,
  ].join(' · ');

  const muscleScores = Object.entries(analysis.muscleGroups)
    .filter(([, g]) => g.visible && g.score > 0)
    .sort(([, a], [, b]) => b.score - a.score)
    .map(([k, g]) => `${k} ${g.score}`)
    .join(' · ');

  const topStrengths = Object.entries(analysis.muscleGroups)
    .filter(([, g]) => g.visible && g.strengths.length > 0)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 2)
    .flatMap(([, g]) => g.strengths.slice(0, 1))
    .join('; ');

  const topWeaknesses = Object.entries(analysis.muscleGroups)
    .filter(([, g]) => g.visible && g.weaknesses.length > 0 && g.score < 78)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .flatMap(([, g]) => g.weaknesses.slice(0, 1))
    .join('; ');

  const issueList = analysis.issuesDetected
    .map((i) => `${i.title} [${i.severity}]`)
    .join('; ') || 'none';

  const priorityList = analysis.improvementPlan
    .slice(0, 3)
    .map((p) => `#${p.priority} ${p.area} — ${p.action} (${p.timeframe})`)
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

Glow-up projection: ${analysis.glowUpPrediction?.slice(0, 250) ?? 'n/a'}
AI summary: ${analysis.summary?.slice(0, 200) ?? 'n/a'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── Suggested questions (context-aware) ──────────────────────────────────────

export function getSuggestedQuestions(analysis: PhysiqueAnalysis): string[] {
  const questions: string[] = [];

  // Based on weakest visible muscle
  const weakest = Object.entries(analysis.muscleGroups)
    .filter(([, g]) => g.visible && g.score > 0)
    .sort(([, a], [, b]) => a.score - b.score)[0];
  if (weakest) {
    questions.push(`Best exercises to bring up my ${weakest[0]}?`);
  }

  // Top priority area workout plan
  const topPriority = analysis.improvementPlan[0]?.area;
  if (topPriority) {
    questions.push(`Give me a 4-week plan for ${topPriority.toLowerCase()}`);
  }

  // Body-fat dependent question
  if (analysis.bodyFat > 17) {
    questions.push('How do I lose fat without sacrificing muscle?');
  } else if (analysis.bodyFat < 12) {
    questions.push('How do I lean bulk without gaining fat?');
  } else {
    questions.push('Should I cut or bulk to reach my potential?');
  }

  // Score gap question
  const gap = analysis.predictedPotentialScore - analysis.overallScore;
  if (gap >= 10) {
    questions.push(`How do I close the ${gap}-point gap to my potential?`);
  } else if (analysis.vTaperScore < 70) {
    questions.push('How do I improve my V-taper and waist ratio?');
  } else {
    questions.push('What training split suits my physique best?');
  }

  return questions.slice(0, 4);
}

// ─── Welcome message ───────────────────────────────────────────────────────────

export function getWelcomeMessage(analysis: PhysiqueAnalysis): string {
  const tier =
    analysis.overallScore >= 75 ? 'solid' : analysis.overallScore >= 55 ? 'developing' : 'early-stage';
  const gap = analysis.predictedPotentialScore - analysis.overallScore;
  const topArea = analysis.improvementPlan[0]?.area ?? analysis.priorityAreas[0] ?? 'overall development';
  return `Hey! I've reviewed your scan — **${analysis.overallScore}/100**, a ${tier} foundation with a **${gap}-point gap** to your ${analysis.predictedPotentialScore} potential. Your biggest lever right now is **${topArea}**. Ask me anything about training, nutrition, or how to get there.`;
}

// ─── Main entry point ──────────────────────────────────────────────────────────
// Priority: mock → Supabase edge fn → static fallback (no client-side OpenAI).

export async function callChatMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemContext: string,
): Promise<string> {
  // 1. Explicit mock mode
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
    return getMockResponse(messages[messages.length - 1]?.content ?? '');
  }

  // 2. Supabase edge function (production path — key stays server-side)
  if (isSupabaseConfigured) {
    const resp = await fetch(`${FUNCTIONS_URL}/chat`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ messages: messages.slice(-20), systemContext }),
    });
    const data = await resp.json();
    if (resp.ok) return data.message as string;
    // 404/405 means the function isn't deployed yet — degrade to the static
    // coach instead of leaking a key. Real errors surface to the caller.
    if (resp.status !== 404 && resp.status !== 405) {
      throw new Error(data.error ?? data.msg ?? 'Chat request failed');
    }
    if (__DEV__) {
      console.warn('[chat] Edge function not deployed. Deploy with: supabase functions deploy chat');
    }
  }

  // 3. Static fallback — offline / function-not-deployed dev environments
  await new Promise((r) => setTimeout(r, 800));
  return getMockResponse(messages[messages.length - 1]?.content ?? '');
}

// ─── Static responses (mock / offline fallback) ───────────────────────────────

function getMockResponse(question: string): string {
  const q = question.toLowerCase();

  // Off-topic guard
  const offTopicKeywords = ['math', 'code', '2+2', 'capital of', 'who is', 'what is the weather', 'javascript'];
  if (offTopicKeywords.some((k) => q.includes(k))) {
    return "I'm your physique coach — I only cover training, nutrition, and physique. What can I help you with?";
  }

  if (q.includes('shoulder') || q.includes('v-taper') || q.includes('width') || q.includes('delts')) {
    return "For V-taper: lateral raises 4×15 with a 2-second pause at the top are your #1 tool. Pair with overhead press twice a week. Shoulders respond fast — expect visible change in 6–8 weeks of consistent work.";
  }
  if (q.includes('leg') || q.includes('quad') || q.includes('sweep')) {
    return "Quad sweep comes from the outer quad (vastus lateralis). Hack squats and leg press with feet shoulder-width will hit it. Add leg extensions with toes slightly inward for the isolation detail. Twice per week minimum.";
  }
  if (q.includes('diet') || q.includes('nutrition') || q.includes('eat') || q.includes('food') || q.includes('calori') || q.includes('protein')) {
    return "At your body fat range, target 1g protein per lb of bodyweight and stay within 200–300 kcal above or below maintenance depending on your goal. Consistency beats perfection — same meals, same timing, seven days a week.";
  }
  if (q.includes('chest') || q.includes('pec')) {
    return "Incline barbell press is your chest priority — it builds the upper pec shelf that creates visual mass from every angle. Follow with cable flyes for peak contraction. 3–4 sets each, twice a week.";
  }
  if (q.includes('split') || q.includes('program') || q.includes('routine') || q.includes('plan')) {
    return "Push/Pull/Legs 6-day is ideal for your profile — high frequency, manageable volume. Hit your weakest muscles at the START of every session when you're fresh, not as an afterthought.";
  }
  if (q.includes('potential') || q.includes('long') || q.includes('reach') || q.includes('gap')) {
    return "Closing the gap to your potential is 18–24 months of focused training. The first 6 months bring the sharpest visible change if you lock in your priority areas. Monthly scans will show you the delta clearly.";
  }
  if (q.includes('cut') || q.includes('fat') || q.includes('lean') || q.includes('lose')) {
    return "Aim for a 400–500 kcal daily deficit, high protein (1g/lb), and reduce carbs on rest days. 8–12 weeks is a clean cut cycle. If you lose strength, your deficit is too large — dial it back 100 kcal.";
  }
  if (q.includes('bulk') || q.includes('mass') || q.includes('size') || q.includes('gain')) {
    return "Lean bulk: 200–300 kcal surplus only. Aim for 0.5–1 lb of bodyweight gain per week — faster than that and you're adding fat. High protein and heavy compound lifts every session.";
  }
  if (q.includes('imbalance') || q.includes('symmetry') || q.includes('asymmetry')) {
    return "Always start unilateral exercises with your weaker side. Use dumbbells for 60% of isolation work. Don't allow the stronger side to compensate. Reassess symmetry score in 8 weeks.";
  }
  if (q.includes('abs') || q.includes('core')) {
    return "Abs are made in the kitchen first — no training will reveal them above 15% body fat. For structure: weighted cable crunches and ab wheel rollouts twice a week. Drop 2–3% body fat and your score jumps.";
  }
  if (q.includes('sleep') || q.includes('recovery') || q.includes('rest')) {
    return "8 hours of sleep is non-negotiable for muscle synthesis — it's when GH peaks. If you're under-sleeping, you're leaving 20–30% of your gains on the table. Prioritise it as much as your training.";
  }

  return "Based on your scan data, consistently attacking your top priority areas with progressive overload over the next 8–12 weeks will move your score the most. Track every session, add weight or reps weekly, and rescan monthly.";
}
