// Store billing façade. Default build uses local dev premium only (no native IAP SDK).
//
// To enable real purchases later:
//   1. App Store Connect + Play Console products + RevenueCat offering
//   2. npx expo install react-native-purchases
//   3. EXPO_PUBLIC_IAP_ENABLED=true + RC API keys in .env
//   4. Implement the IAP_ENABLED branches below (or swap in purchases.revenuecat.ts)

import { supabase, isSupabaseConfigured } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getRevenueCatApiKey, IAP_ENABLED } from './iapConfig';
import {
  REVENUECAT_ENTITLEMENT_IDS,
  revenueCatPackageIdForPlan,
} from './storeCatalog';
import type { SubscriptionPlanId } from './subscription';
import {
  isPaidTier,
  maxScansPerDayForTier,
  type SubscriptionTier,
} from './tiers';

const IAP_NOT_READY_MSG =
  'Store billing is enabled (EXPO_PUBLIC_IAP_ENABLED=true) but react-native-purchases ' +
  'is not wired yet. Install it with: npx expo install react-native-purchases, configure ' +
  'RevenueCat, then complete src/subscription/purchases.ts.';

export async function initPurchases(): Promise<void> {
  if (!IAP_ENABLED) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn(
      '[purchases] EXPO_PUBLIC_IAP_ENABLED is true but platform RevenueCat API key is missing.',
    );
    return;
  }

  if (__DEV__) {
    console.log('[purchases] IAP flag on — native SDK integration pending.');
  }
  void apiKey;
  void REVENUECAT_ENTITLEMENT_IDS;
}

export async function syncPurchasesUser(userId: string): Promise<void> {
  if (!IAP_ENABLED) return;
  void userId;
  // Purchases.logIn(userId) when react-native-purchases is integrated.
}

export async function clearPurchasesUser(): Promise<void> {
  if (!IAP_ENABLED) return;
  // Purchases.logOut() when react-native-purchases is integrated.
}

export async function purchasePlan(_planId: SubscriptionPlanId): Promise<void> {
  if (!IAP_ENABLED) return;
  void revenueCatPackageIdForPlan(_planId);
  throw new Error(IAP_NOT_READY_MSG);
}

export async function restoreStorePurchases(): Promise<void> {
  if (!IAP_ENABLED) return;
  throw new Error(IAP_NOT_READY_MSG);
}

/** Re-read profiles.is_premium from Supabase (webhook / restore). */
export async function refreshPremiumFromServer(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user?.id || !isSupabaseConfigured) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium, subscription_tier')
    .eq('id', user.id)
    .single();

  if (error || data == null) return false;

  const tier = (data.subscription_tier as SubscriptionTier | null)
    ?? (data.is_premium ? 'pro' : 'free');
  const current = useAuthStore.getState().user;
  if (
    current
    && (current.subscriptionTier !== tier || current.isPremium !== isPaidTier(tier))
  ) {
    useAuthStore.setState({
      user: {
        ...current,
        subscriptionTier: tier,
        isPremium: isPaidTier(tier),
        maxScansPerDay: maxScansPerDayForTier(tier),
      },
    });
  }
  return isPaidTier(tier);
}

/** Poll after a store purchase until webhook updates is_premium (max ~15s). */
export async function waitForPremiumActivation(maxAttempts = 5): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await refreshPremiumFromServer()) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
