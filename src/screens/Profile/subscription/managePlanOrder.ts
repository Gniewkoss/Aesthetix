import type { SubscriptionPlanId } from '../../../subscription/subscription';

/** Plan order for Manage Subscription + change-plan sheet (Pro first). */
export const MANAGE_PLAN_ORDER: SubscriptionPlanId[] = ['monthly', 'max', 'weekly'];

export function managePlanBadge(
  planId: SubscriptionPlanId,
  currentPlanId?: SubscriptionPlanId | null,
): string | null {
  if (currentPlanId && planId === currentPlanId) return 'CURRENT';
  if (planId === 'monthly') return 'RECOMMENDED';
  if (planId === 'max') return 'AI COACH';
  return null;
}
