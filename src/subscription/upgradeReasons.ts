import type { SubscriptionPlanId } from './storeCatalog';
import type { SubscriptionTier } from './tiers';
import { hasAiCoach, hasUnlimitedScans } from './tiers';

export type UpgradeReason = 'scan_limit' | 'back_pose' | 'ai_coach' | 'generic';

export interface UpgradeCopy {
  headline: string;
  subheadline: string;
  heroIcon: 'scan' | 'body' | 'chat' | 'sparkles';
}

const COPY: Record<UpgradeReason, UpgradeCopy> = {
  scan_limit: {
    headline: 'Keep scanning.\nKeep improving.',
    subheadline: 'You’ve hit the free limit. Pick a plan and unlock your next physique check-in.',
    heroIcon: 'scan',
  },
  back_pose: {
    headline: 'See your back.\nScore it all.',
    subheadline: 'Back analysis reveals width, traps, and symmetry you can’t judge from the front alone.',
    heroIcon: 'body',
  },
  ai_coach: {
    headline: 'Your AI coach\nis waiting.',
    subheadline: 'Get personalized training notes, diet cues, and unlimited chat based on your scan.',
    heroIcon: 'chat',
  },
  generic: {
    headline: 'Train smarter\nwith Aesthetix.',
    subheadline: 'Unlock deeper scans, full-body analysis, and coaching built on your real physique data.',
    heroIcon: 'sparkles',
  },
};

export function getUpgradeCopy(reason: UpgradeReason | undefined): UpgradeCopy {
  return COPY[reason ?? 'generic'];
}

export function suggestedPlanForReason(reason: UpgradeReason | undefined): SubscriptionPlanId {
  switch (reason) {
    case 'ai_coach':
      return 'max';
    case 'back_pose':
      return 'monthly';
    case 'scan_limit':
      return 'monthly';
    default:
      return 'max';
  }
}

/** Order plans for the paywall (recommended first). */
export function paywallPlanOrder(
  reason: UpgradeReason | undefined,
  tier: SubscriptionTier,
): SubscriptionPlanId[] {
  if (reason === 'ai_coach' || (tier === 'pro' && !hasAiCoach(tier))) {
    return ['max', 'monthly', 'weekly'];
  }
  if (reason === 'scan_limit' && tier === 'free') {
    return ['monthly', 'max', 'weekly'];
  }
  if (reason === 'back_pose' && tier === 'free') {
    return ['monthly', 'max', 'weekly'];
  }
  if (tier === 'starter') {
    return ['monthly', 'max', 'weekly'];
  }
  return ['max', 'monthly', 'weekly'];
}

export function badgeForPlan(
  planId: SubscriptionPlanId,
  order: SubscriptionPlanId[],
): string | null {
  if (planId === order[0]) return 'RECOMMENDED';
  if (planId === 'max') return 'AI COACH';
  if (planId === 'monthly') return 'BEST VALUE';
  return null;
}

export function isPlanSufficient(
  planId: SubscriptionPlanId,
  reason: UpgradeReason | undefined,
): boolean {
  switch (planId) {
    case 'weekly':
      return reason === 'back_pose';
    case 'monthly':
      return reason !== 'ai_coach';
    case 'max':
      return true;
    default:
      return false;
  }
}

export function tierMeetsReason(tier: SubscriptionTier, reason: UpgradeReason | undefined): boolean {
  switch (reason) {
    case 'ai_coach':
      return hasAiCoach(tier);
    case 'back_pose':
      return tier !== 'free';
    case 'scan_limit':
      return hasUnlimitedScans(tier) || tier === 'starter';
    default:
      return tier !== 'free';
  }
}
