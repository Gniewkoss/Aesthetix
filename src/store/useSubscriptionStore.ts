import { create } from 'zustand';
import { loadUserItem, saveUserItem, saveItem } from './storage';
import { useAuthStore } from './useAuthStore';
import { isSupabaseConfigured } from '../api/supabase';
import { IAP_ENABLED, usesLocalSubscriptionMock } from '../subscription/iapConfig';
import {
  purchasePlan,
  refreshPremiumFromServer,
  restoreStorePurchases,
  waitForPremiumActivation,
} from '../subscription/purchases';
import { fetchSubscriptionFromServer } from '../subscription/serverSubscription';
import {
  Subscription,
  SubscriptionPlanId,
  addPeriod,
  computeTrialEnd,
  isSubscriptionActive,
  normalizeSubscription,
} from '../subscription/subscription';
import {
  isPaidTier,
  maxScansPerDayForTier,
  tierFromPlanId,
  type SubscriptionTier,
} from '../subscription/tiers';

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

async function syncSubscriptionTier(tier: SubscriptionTier): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const updated = {
    ...user,
    subscriptionTier: tier,
    isPremium: isPaidTier(tier),
    maxScansPerDay: maxScansPerDayForTier(tier),
  };
  useAuthStore.setState({ user: updated });

  // In mock/dev mode (no Supabase) we persist locally so the flag survives reloads.
  if (!isSupabaseConfigured) {
    await saveItem('user', updated);
    return;
  }

  // With Supabase configured we do NOT write profiles.is_premium from the client.
  // It is server-owned: the RLS trigger blocks client writes, and the real value is
  // set by the revenuecat Edge Function on a verified store-billing event. The local
  // setState above is optimistic only and is overwritten by the DB on next session
  // hydrate (fetchUserFromSession reads is_premium).
}

function applyPremiumFromSubscription(sub: Subscription | null): void {
  const active = isSubscriptionActive(sub);
  const tier = active && sub ? tierFromPlanId(sub.planId) : 'free';
  void syncSubscriptionTier(tier);
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
      const fromServer = IAP_ENABLED ? await fetchSubscriptionFromServer(userId) : null;
      const stored = fromServer ?? (await loadUserItem<Subscription>(userId, 'subscription'));
      const normalized = normalizeSubscription(stored);
      set({ subscription: normalized, hydrated: true });
      applyPremiumFromSubscription(normalized);

      if (IAP_ENABLED) {
        await refreshPremiumFromServer();
      }

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

    if (usesLocalSubscriptionMock()) {
      // Dev / mock: local trial simulation. Does not write profiles.is_premium on Supabase.
      const sub = buildNewSubscription(planId);
      set({ subscription: sub });
      persistSubscription(sub, userId);
      applyPremiumFromSubscription(sub);
      return;
    }

    await purchasePlan(planId);
    const activated = await waitForPremiumActivation();
    if (!activated) {
      throw new Error(
        'Purchase submitted. Premium may take a moment to activate — reopen the app or tap Restore.',
      );
    }
    await get().hydrate(userId);
  },

  changePlan: async (planId) => {
    if (IAP_ENABLED) {
      throw new Error(
        'To change your plan, use your App Store or Google Play subscription settings.',
      );
    }

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
    if (IAP_ENABLED) {
      throw new Error(
        'To cancel, open your App Store or Google Play subscription settings.',
      );
    }

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
    if (IAP_ENABLED) {
      throw new Error(
        'To turn auto-renew back on, use your App Store or Google Play subscription settings.',
      );
    }

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

    if (!usesLocalSubscriptionMock()) {
      await restoreStorePurchases();
      await refreshPremiumFromServer();
      await get().hydrate(userId);
      const isPremium = useAuthStore.getState().user?.isPremium;
      if (isPremium) {
        return { restored: true, message: 'Your Premium subscription has been restored.' };
      }
      return { restored: false, message: 'No active subscription found for this account.' };
    }

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
