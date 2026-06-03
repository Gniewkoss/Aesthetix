// Store billing via RevenueCat → App Store / Google Play.
// Apple Pay, cards, and other methods are chosen by the system in the native purchase sheet.

import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getRevenueCatApiKey, IAP_ENABLED } from './iapConfig';
import {
  REVENUECAT_ENTITLEMENT_IDS,
  REVENUECAT_OFFERING_ID,
  revenueCatPackageIdForPlan,
} from './storeCatalog';
import type { SubscriptionPlanId } from './subscription';
import {
  isPaidTier,
  maxScansPerDayForTier,
  type SubscriptionTier,
} from './tiers';

let configured = false;

const EXPO_GO_HINT =
  'Płatności wymagają builda deweloperskiego (nie Expo Go). Uruchom: npx expo run:ios lub EAS build.';

function assertNativePlatform(): void {
  if (Platform.OS === 'web') {
    throw new Error('Subskrypcje nie są dostępne w przeglądarce. Użyj aplikacji na iOS lub Android.');
  }
}

/** Highest active entitlement wins (max > pro > starter). */
export function tierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  const active = info.entitlements.active;
  if (active[REVENUECAT_ENTITLEMENT_IDS.max]?.isActive) return 'max';
  if (active[REVENUECAT_ENTITLEMENT_IDS.pro]?.isActive) return 'pro';
  if (active[REVENUECAT_ENTITLEMENT_IDS.starter]?.isActive) return 'starter';
  return 'free';
}

async function applyTierToAuth(tier: SubscriptionTier): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  useAuthStore.setState({
    user: {
      ...user,
      subscriptionTier: tier,
      isPremium: isPaidTier(tier),
      maxScansPerDay: maxScansPerDayForTier(tier),
    },
  });
}

async function syncCustomerInfo(info: CustomerInfo): Promise<SubscriptionTier> {
  const tier = tierFromCustomerInfo(info);
  await applyTierToAuth(tier);
  await refreshPremiumFromServer();
  return tier;
}

async function loadPurchases() {
  assertNativePlatform();
  try {
    return await import('react-native-purchases');
  } catch {
    throw new Error(EXPO_GO_HINT);
  }
}

function findPackage(
  packages: PurchasesPackage[] | undefined,
  planId: SubscriptionPlanId,
): PurchasesPackage | null {
  if (!packages?.length) return null;
  const rcId = revenueCatPackageIdForPlan(planId);
  return packages.find((p) => p.identifier === rcId) ?? null;
}

function isUserCancelled(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  if ('userCancelled' in err && (err as { userCancelled?: boolean }).userCancelled) return true;
  const code = (err as { code?: string }).code;
  return code === 'PURCHASE_CANCELLED' || code === '1';
}

export async function initPurchases(): Promise<void> {
  if (!IAP_ENABLED) return;
  if (configured) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn('[purchases] EXPO_PUBLIC_IAP_ENABLED=true but RevenueCat API key is missing.');
    return;
  }

  assertNativePlatform();

  const { default: Purchases, LOG_LEVEL } = await loadPurchases();

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
  configured = true;

  Purchases.addCustomerInfoUpdateListener((info) => {
    void syncCustomerInfo(info);
  });
}

export async function syncPurchasesUser(userId: string): Promise<void> {
  if (!IAP_ENABLED || !configured) return;

  const { default: Purchases } = await loadPurchases();
  const { customerInfo } = await Purchases.logIn(userId);
  await syncCustomerInfo(customerInfo);
}

export async function clearPurchasesUser(): Promise<void> {
  if (!IAP_ENABLED || !configured) return;

  const { default: Purchases } = await loadPurchases();
  try {
    const info = await Purchases.logOut();
    await syncCustomerInfo(info);
  } catch {
    // Anonymous RC user after logout is fine.
  }
}

export async function purchasePlan(planId: SubscriptionPlanId): Promise<void> {
  if (!IAP_ENABLED) return;

  if (!configured) {
    await initPurchases();
  }
  if (!configured) {
    throw new Error('Payments are not configured. Add RevenueCat API keys to .env');
  }

  const { default: Purchases } = await loadPurchases();
  const offerings = await Purchases.getOfferings();
  const offering = offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID];

  if (!offering) {
    throw new Error(
      `No "${REVENUECAT_OFFERING_ID}" offering in RevenueCat. Check dashboard → Offerings.`,
    );
  }

  const pkg = findPackage(offering.availablePackages, planId);
  if (!pkg) {
    throw new Error(
      `Plan "${planId}" is not in the current offering. Link product ${revenueCatPackageIdForPlan(planId)} in RevenueCat.`,
    );
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const tier = await syncCustomerInfo(customerInfo);
    if (!isPaidTier(tier)) {
      throw new Error('Purchase completed but entitlement not active yet. Try Restore purchases in a moment.');
    }
  } catch (err) {
    if (isUserCancelled(err)) {
      throw new Error('Purchase cancelled.');
    }
    const msg = err instanceof Error ? err.message : 'Purchase failed.';
    throw new Error(msg);
  }
}

export async function restoreStorePurchases(): Promise<void> {
  if (!IAP_ENABLED) return;

  if (!configured) {
    await initPurchases();
  }

  const { default: Purchases } = await loadPurchases();
  const info = await Purchases.restorePurchases();
  await syncCustomerInfo(info);
}

/** Re-read profiles from Supabase (webhook is source of truth after purchase). */
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

/** Poll after purchase until webhook updates Supabase (max ~15s). */
export async function waitForPremiumActivation(maxAttempts = 8): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await refreshPremiumFromServer()) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const tier = useAuthStore.getState().user?.subscriptionTier ?? 'free';
  return isPaidTier(tier);
}
