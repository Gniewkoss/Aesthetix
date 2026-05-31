import { create } from 'zustand';
import { loadUserItem, saveUserItem, saveItem } from './storage';
import { useAuthStore } from './useAuthStore';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import {
  Subscription,
  SubscriptionPlanId,
  addPeriod,
  computeTrialEnd,
  isSubscriptionActive,
  normalizeSubscription,
} from '../subscription/subscription';

interface SubscriptionState {
  subscription: Subscription | null;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  subscribe: (planId: SubscriptionPlanId) => Promise<void>;
  changePlan: (planId: SubscriptionPlanId) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateAutoRenew: () => Promise<void>;
  restorePurchases: () => Promise<{ restored: boolean; message: string }>;
  reset: () => void;
}

function persistSubscription(sub: Subscription | null, userId: string): void {
  void saveUserItem(userId, 'subscription', sub);
}

async function syncPremiumFlag(isPremium: boolean): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const updated = { ...user, isPremium };
  useAuthStore.setState({ user: updated });

  if (!isSupabaseConfigured) {
    await saveItem('user', updated);
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', user.id);

  if (error) console.warn('[subscription] premium sync failed', error);
}

function applyPremiumFromSubscription(sub: Subscription | null): void {
  void syncPremiumFlag(isSubscriptionActive(sub));
}

function buildNewSubscription(planId: SubscriptionPlanId): Subscription {
  const now = new Date();
  const trialEnd = computeTrialEnd(now);
  const periodEnd = addPeriod(trialEnd, planId);

  return {
    planId,
    status: 'trialing',
    startedAt: now.toISOString(),
    trialEndsAt: trialEnd.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    autoRenew: true,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  hydrated: false,

  hydrate: async (userId) => {
    try {
      const stored = await loadUserItem<Subscription>(userId, 'subscription');
      const normalized = normalizeSubscription(stored);
      set({ subscription: normalized, hydrated: true });
      applyPremiumFromSubscription(normalized);

      if (normalized?.status === 'expired' && stored && stored.status !== 'expired') {
        persistSubscription(normalized, userId);
      }
    } catch (err) {
      console.warn('[subscription] hydrate failed', err);
      set({ subscription: null, hydrated: true });
    }
  },

  subscribe: async (planId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('You must be signed in to subscribe.');

    const sub = buildNewSubscription(planId);
    set({ subscription: sub });
    persistSubscription(sub, userId);
    applyPremiumFromSubscription(sub);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);
      if (error) throw new Error('Could not activate Premium. Check your connection and try again.');
    }
  },

  changePlan: async (planId) => {
    const { subscription } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!userId || !subscription || !isSubscriptionActive(subscription)) {
      throw new Error('No active subscription to change.');
    }

    const now = new Date();
    const updated: Subscription = {
      ...subscription,
      planId,
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      currentPeriodEnd: addPeriod(now, planId).toISOString(),
      autoRenew: true,
      cancelledAt: undefined,
    };

    set({ subscription: updated });
    persistSubscription(updated, userId);
    applyPremiumFromSubscription(updated);
  },

  cancelSubscription: async () => {
    const { subscription } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!userId || !subscription || !isSubscriptionActive(subscription)) {
      throw new Error('No active subscription to cancel.');
    }

    const updated: Subscription = {
      ...subscription,
      status: 'cancelled',
      autoRenew: false,
      cancelledAt: new Date().toISOString(),
    };

    set({ subscription: updated });
    persistSubscription(updated, userId);
    applyPremiumFromSubscription(updated);
  },

  reactivateAutoRenew: async () => {
    const { subscription } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!userId || !subscription || !isSubscriptionActive(subscription)) {
      throw new Error('No active subscription to reactivate.');
    }

    const updated: Subscription = {
      ...subscription,
      status:
        subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date()
          ? 'trialing'
          : 'active',
      autoRenew: true,
      cancelledAt: undefined,
    };

    set({ subscription: updated });
    persistSubscription(updated, userId);
    applyPremiumFromSubscription(updated);
  },

  restorePurchases: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('You must be signed in to restore purchases.');

    const stored = await loadUserItem<Subscription>(userId, 'subscription');
    const normalized = normalizeSubscription(stored);

    if (normalized && isSubscriptionActive(normalized)) {
      set({ subscription: normalized });
      persistSubscription(normalized, userId);
      applyPremiumFromSubscription(normalized);
      return { restored: true, message: 'Your Premium subscription has been restored.' };
    }

    // Server-side is_premium is the source of truth (set only by service-role Edge
    // Functions / the store-billing webhook). If it says the account is Premium we
    // report that, but we must NOT fabricate a plan + billing dates we don't know —
    // the real plan/renewal detail is reconciled by the store-billing provider once
    // IAP is wired (see ManageSubscription notes). Until then the UI shows "Premium"
    // from the auth store's isPremium flag with no invented renewal date.
    const isPremium = useAuthStore.getState().user?.isPremium;
    if (isPremium) {
      return { restored: true, message: 'Premium access is active on this account.' };
    }

    return { restored: false, message: 'No previous subscription found for this account.' };
  },

  reset: () => set({ subscription: null, hydrated: false }),
}));
