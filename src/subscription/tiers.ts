import type { SubscriptionPlanId } from './subscription';
import { STORE_PRODUCT_IDS } from './storeCatalog';

/** Server + client gate for scan/coach capabilities. */
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'max';

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = ['free', 'starter', 'pro', 'max'];

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  max: 'Max',
};

/** weekly = 1 scan/day · monthly = unlimited · max monthly = unlimited + AI coach */
export function tierFromPlanId(planId: SubscriptionPlanId): SubscriptionTier {
  switch (planId) {
    case 'weekly':
      return 'starter';
    case 'monthly':
      return 'pro';
    case 'max':
      return 'max';
    default:
      return 'pro';
  }
}

export function tierFromProductId(productId: string | null | undefined): SubscriptionTier {
  if (!productId) return 'free';

  const exact = (Object.entries(STORE_PRODUCT_IDS) as [SubscriptionPlanId, string][]).find(
    ([, id]) => id === productId,
  );
  if (exact) return tierFromPlanId(exact[0]);

  const lower = productId.toLowerCase();
  if (lower.includes('week')) return 'starter';
  if (lower.includes('max')) return 'max';
  if (lower.includes('month')) return 'pro';
  return 'pro';
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  max: 3,
};

/** Prefer the higher tier (e.g. keep RC optimistic tier until webhook catches up). */
export function maxTier(a: SubscriptionTier, b: SubscriptionTier): SubscriptionTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

export function hasUnlimitedScans(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'max';
}

export function hasDailyScanAllowance(tier: SubscriptionTier): boolean {
  return tier === 'starter';
}

/** AI coach chat — Max only. */
export function hasAiCoachChat(tier: SubscriptionTier): boolean {
  return tier === 'max';
}

/** LLM coaching narrative (summary, diet copy, glow-up) — all paid tiers. */
export function hasAiCoachNarrative(tier: SubscriptionTier): boolean {
  return isPaidTier(tier);
}

/** @deprecated Use hasAiCoachChat */
export function hasAiCoach(tier: SubscriptionTier): boolean {
  return hasAiCoachChat(tier);
}

export function canUseBackPose(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}

export function maxScansPerDayForTier(tier: SubscriptionTier): number {
  if (hasUnlimitedScans(tier)) return 999;
  if (tier === 'starter') return 1;
  return 1;
}

export interface ScanQuotaUser {
  subscriptionTier: SubscriptionTier;
  freeScanUsed: boolean;
  scansToday: number;
}

export function canStartScan(user: ScanQuotaUser): boolean {
  const { subscriptionTier: tier, freeScanUsed, scansToday } = user;
  if (hasUnlimitedScans(tier)) return true;
  if (tier === 'starter') return scansToday < 1;
  return !freeScanUsed;
}
