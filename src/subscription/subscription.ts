import { PREMIUM_PLANS } from '../constants';
import type { SubscriptionPlanId } from './storeCatalog';

export type { SubscriptionPlanId };
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'cancelled' | 'expired';

export interface Subscription {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  trialEndsAt?: string;
  cancelledAt?: string;
}

export const TRIAL_DAYS = 3;

export function getPlanById(planId: string) {
  return PREMIUM_PLANS.find((p) => p.id === planId) ?? PREMIUM_PLANS[1];
}

export function addPeriod(date: Date, planId: SubscriptionPlanId): Date {
  const next = new Date(date);
  if (planId === 'weekly') next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export function computeTrialEnd(from = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

export function isSubscriptionActive(sub: Subscription | null | undefined): boolean {
  if (!sub || sub.status === 'none' || sub.status === 'expired') return false;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}

export function normalizeSubscription(sub: Subscription | null | undefined): Subscription | null {
  if (!sub) return null;
  if (!isSubscriptionActive(sub)) {
    return { ...sub, status: 'expired', autoRenew: false };
  }
  return sub;
}

export function formatSubscriptionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export type SubscriptionDisplayStatus = 'active' | 'expiring' | 'cancelled' | 'none';

export function getSubscriptionDisplayStatus(
  sub: Subscription | null | undefined,
): SubscriptionDisplayStatus {
  if (!sub || sub.status === 'none' || sub.status === 'expired') return 'none';
  if (!isSubscriptionActive(sub)) return 'cancelled';
  if (sub.status === 'cancelled' || !sub.autoRenew) return 'expiring';
  return 'active';
}

export function getStatusLabel(sub: Subscription | null, isPremium: boolean): string {
  const display = getSubscriptionDisplayStatus(sub);
  if (display === 'none') return isPremium ? 'Premium' : 'Free plan';
  if (display === 'cancelled') return 'Expired';
  if (sub?.status === 'trialing') return 'Free trial';
  if (display === 'expiring') return 'Expiring';
  return 'Active';
}

export function getNextBillingLabel(
  sub: Subscription | null,
  displayStatus: SubscriptionDisplayStatus,
): { label: string; date: string | null } {
  if (!sub || displayStatus === 'none' || displayStatus === 'cancelled') {
    return { label: 'Next billing', date: null };
  }
  if (sub.status === 'trialing' && sub.trialEndsAt) {
    return { label: 'First charge on', date: sub.trialEndsAt };
  }
  if (displayStatus === 'expiring') {
    return { label: 'Access ends', date: sub.currentPeriodEnd };
  }
  return { label: 'Next renewal', date: sub.currentPeriodEnd };
}

export const FREE_PLAN_LIMITS = [
  '1 front-photo scan (lifetime, per account & device)',
  'Improvement plan from your scan data',
  'Back pose, daily scans & coach chat on paid plans',
];

export const PAID_TIER_SUMMARY = [
  { tier: 'Starter', price: '$1.99/wk', detail: '1 scan per day · front + back' },
  { tier: 'Pro', price: '$4.99/mo', detail: 'Unlimited scans · AI coach plan' },
  { tier: 'Max', price: '$6.99/mo', detail: 'Everything in Pro + coach chat' },
] as const;
