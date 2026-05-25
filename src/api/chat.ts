import { supabase, isSupabaseConfigured } from './supabase';
import { PhysiqueAnalysis } from '../types';

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${session?.access_token ?? ANON_KEY}`,
  };
}

// Builds a rich system prompt from the user's physique analysis.
// Injected as the system message so every chat turn has full context.
export function buildChatSystemContext(analysis: PhysiqueAnalysis): string {
  const topPriorities = analysis.improvementPlan
    .slice(0, 3)
    .map((p) => p.area)
    .join(', ');

  const weakMuscles = Object.entries(analysis.muscleGroups)
    .filter(([, g]) => g.visible && g.score < 55)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([key]) => key)
    .join(', ');

  const issueList = analysis.issuesDetected
    .slice(0, 3)
    .map((i) => i.title)
    .join(', ');

  return `You are Max, an elite AI physique coach. Respond concisely (2–4 sentences unless detail is asked for). Be direct, specific, and motivating — never vague. Tailor every answer to this user's actual data.

User's physique snapshot:
• Overall score: ${analysis.overallScore}/100 — ${analysis.summary?.slice(0, 120) ?? ''}
• Body fat: ${analysis.bodyFatRange}
• Top priority areas: ${topPriorities || 'general development'}
• Weakest visible muscle groups: ${weakMuscles || 'none identified'}
• Issues detected: ${issueList || 'none significant'}
• Predicted potential score: ${analysis.predictedPotentialScore}/100

Never invent numbers. If you're unsure, say so. Focus on actionable steps.`;
}

// Returns context-aware suggested questions based on the analysis.
export function getSuggestedQuestions(analysis: PhysiqueAnalysis): string[] {
  const questions: string[] = [];

  const topArea = analysis.improvementPlan[0]?.area ?? analysis.priorityAreas[0];
  if (topArea) questions.push(`How do I improve my ${topArea.toLowerCase()}?`);

  if (analysis.vTaperScore < 65) questions.push('How do I build a better V-taper?');

  if (analysis.bodyFat > 18) {
    questions.push('Best approach to cut body fat?');
  } else {
    questions.push('How to bulk without losing definition?');
  }

  if (analysis.symmetryScore < 65) questions.push('How do I fix muscle imbalances?');

  questions.push('Best training split for my physique?');
  questions.push(`How long to reach ${analysis.predictedPotentialScore} potential?`);

  return questions.slice(0, 4);
}

// Generates a contextual opening message shown before any user interaction.
export function getWelcomeMessage(analysis: PhysiqueAnalysis): string {
  const tier = analysis.overallScore >= 70 ? 'solid' : analysis.overallScore >= 50 ? 'developing' : 'early';
  const topArea = analysis.improvementPlan[0]?.area ?? analysis.priorityAreas[0] ?? 'overall development';
  return `Hey! I've analysed your latest scan — you're at ${analysis.overallScore}/100, a ${tier} foundation. Your biggest lever right now is **${topArea}**. Ask me anything about training, nutrition, or how to hit your ${analysis.predictedPotentialScore} potential.`;
}

export async function callChatMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemContext: string,
): Promise<string> {
  if (USE_MOCK || !isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    return getMockResponse(messages[messages.length - 1]?.content ?? '');
  }

  const resp = await fetch(`${FUNCTIONS_URL}/chat`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ messages, systemContext }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    // Function not deployed yet — fall back to local mock so the UI keeps working.
    // Run `supabase functions deploy chat` to enable real AI responses.
    if (resp.status === 404 || resp.status === 405) {
      console.warn('[chat] Edge function not found — using mock response. Deploy with: supabase functions deploy chat');
      return getMockResponse(messages[messages.length - 1]?.content ?? '');
    }
    throw new Error(data.error ?? data.msg ?? 'Chat request failed');
  }

  return data.message as string;
}

function getMockResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('shoulder') || q.includes('v-taper') || q.includes('width')) {
    return "For V-taper, lateral raises are your #1 move — 4×15 with a 2-second pause at the top. Pair with overhead press 2× per week and cable laterals for the pump. Shoulders respond fast, expect visible change in 6–8 weeks if you're consistent.";
  }
  if (q.includes('leg') || q.includes('quad') || q.includes('sweep')) {
    return "Quads are your biggest visual gap. Hit hack squats and leg press twice a week with full ROM. The quad sweep comes from outer quad development — sissy squats and leg extensions with toes slightly inward will nail it. This alone could push your score up 5–8 points.";
  }
  if (q.includes('diet') || q.includes('nutrition') || q.includes('eat') || q.includes('food') || q.includes('calori')) {
    return "At your body fat range, aim for 1g protein per lb of bodyweight and stay within 200–300 kcal above maintenance. Prioritise whole foods — lean meats, rice, oats, vegetables. Meal timing matters less than total daily intake; just be consistent.";
  }
  if (q.includes('chest') || q.includes('pec')) {
    return "Incline barbell press should be your chest anchor — it targets the upper chest which gives you the most visual fullness. Follow with cable flyes to maintain tension at peak contraction. 3–4 sets of each, twice a week.";
  }
  if (q.includes('split') || q.includes('program') || q.includes('routine')) {
    return "A Push/Pull/Legs 6-day split suits your profile well — high frequency on weak points without killing recovery. Hit shoulders and arms on every push day, prioritise legs 2× per week. Rest one full day.";
  }
  if (q.includes('potential') || q.includes('long') || q.includes('reach')) {
    return "Reaching your potential score is realistically 18–24 months of focused training. The first 6 months will show the most dramatic change if you fix your priority areas consistently. Track your scans monthly so you can see the delta.";
  }
  if (q.includes('cut') || q.includes('fat') || q.includes('lean')) {
    return "For your cut, a 400–500 kcal daily deficit works best — enough to drop fat without sacrificing muscle. Keep protein high (1g/lb), reduce carbs on rest days, and avoid cardio that eats into muscle. 8–12 weeks is a clean cut cycle.";
  }
  if (q.includes('bulk') || q.includes('mass') || q.includes('size')) {
    return "Lean bulk: 200–300 kcal surplus, not more. You'll gain muscle without excessive fat. Track weekly weigh-ins — aim for 0.5–1lb per week. If you're gaining faster, drop calories slightly.";
  }
  if (q.includes('imbalance') || q.includes('symmetry')) {
    return "For symmetry, always start compound movements with your weaker side. Use dumbbells instead of barbells for 60% of your isolation work — it forces each side to move independently. Reassess in 8 weeks.";
  }

  return "Great question. Based on your scan data, the most impactful thing you can do right now is address your priority areas consistently over the next 8–12 weeks. Progressive overload is the engine — track every session and add weight or reps each week.";
}
