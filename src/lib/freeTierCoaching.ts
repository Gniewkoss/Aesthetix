import { CoachingResponse } from '../types';
import { CategoryScores } from '../scoring/engine';

/** Deterministic placeholder when Premium AI coaching is not available. */
export function buildFreeTierCoaching(categoryScores: CategoryScores): CoachingResponse {
  const top = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(', ');

  return {
    summary:
      `Scores are ready (${top || 'see category breakdown'}). Upgrade to Premium for AI muscle notes, diet plan, and coach chat.`,
    muscle_groups: {},
    glow_up_prediction: 'Premium unlocks a personalized 6–12 month transformation forecast.',
    dietary_recommendations: [],
  };
}
