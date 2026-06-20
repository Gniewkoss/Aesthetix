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
  storeProductIdForPlan,
} from './storeCatalog';
import type { SubscriptionPlanId } from './subscription';
import { trackEvent } from '../lib/errorTracking';
import {
  isPaidTier,
  maxScansPerDayForTier,
  maxTier,
  tierFromPlanId,
  tierFromProductId,
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

/** Tier from the active store subscription products (not stale entitlements / promo DB). */
export function tierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  const activeProducts = info.activeSubscriptions ?? [];
  if (activeProducts.length > 0) {
    let tier: SubscriptionTier = 'free';
    for (const productId of activeProducts) {
      tier = maxTier(tier, tierFromProductId(productId));
    }
    if (isPaidTier(tier)) return tier;
  }

  const active = info.entitlements.active;
  if (active[REVENUECAT_ENTITLEMENT_IDS.starter]?.isActive) return 'starter';
  if (active[REVENUECAT_ENTITLEMENT_IDS.pro]?.isActive) return 'pro';
  if (active[REVENUECAT_ENTITLEMENT_IDS.max]?.isActive) return 'max';

  let best: SubscriptionTier = 'free';
  for (const ent of Object.values(active)) {
    if (!ent?.isActive) continue;
    best = maxTier(best, tierFromProductId(ent.productIdentifier));
  }
  return best;
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
  const rcTier = tierFromCustomerInfo(info);
  const localTier = useAuthStore.getState().user?.subscriptionTier ?? 'free';
  // Optimistic flash so UI lights up the instant the purchase sheet returns.
  await applyTierToAuth(maxTier(localTier, rcTier));
  // Server is authoritative; rcTier is the device-truth floor so a fresh purchase stays
  // Premium until the webhook lands, and an expired entitlement (rcTier='free') lets the
  // server downgrade in-session instead of pinning the stale paid tier.
  await refreshPremiumFromServer(rcTier);
  return useAuthStore.getState().user?.subscriptionTier ?? rcTier;
}

async function loadPurchases() {
  assertNativePlatform();
  try {
    return await import('react-native-purchases');
  } catch {
    throw new Error(EXPO_GO_HINT);
  }
}

function packageIdentifiersForPlan(planId: SubscriptionPlanId): Set<string> {
  const rcId = revenueCatPackageIdForPlan(planId);
  return new Set([
    rcId,
    rcId.toLowerCase(),
    rcId.toUpperCase(),
    `$rc_${rcId}`,
    `$rc_${rcId.toLowerCase()}`,
    // RevenueCat preset labels (capitalized).
    rcId === 'weekly' ? 'Weekly' : rcId === 'monthly' ? 'Monthly' : 'Max',
  ]);
}

function findPackage(
  packages: PurchasesPackage[] | undefined,
  planId: SubscriptionPlanId,
): PurchasesPackage | null {
  if (!packages?.length) return null;

  const ids = packageIdentifiersForPlan(planId);
  const byIdentifier = packages.find(
    (p) => ids.has(p.identifier) || ids.has(p.identifier.toLowerCase()),
  );
  if (byIdentifier) return byIdentifier;

  const storeProductId = storeProductIdForPlan(planId);
  return (
    packages.find(
      (p) =>
        p.product.identifier === storeProductId
        || p.product.identifier.toLowerCase() === storeProductId,
    ) ?? null
  );
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
    if (await Purchases.isAnonymous()) return;
    const info = await Purchases.logOut();
    await syncCustomerInfo(info);
  } catch {
    // RC may still warn if logout races with configure — safe to ignore.
  }
}

export async function purchasePlan(planId: SubscriptionPlanId): Promise<SubscriptionTier> {
  if (!IAP_ENABLED) return 'free';

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

  trackEvent('purchase_started', { planId });
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const tier = tierFromPlanId(planId);
    const rcTier = tierFromCustomerInfo(customerInfo);
    if (!isPaidTier(rcTier) && !isPaidTier(tier)) {
      trackEvent('purchase_failed', { planId, reason: 'entitlement_not_active' });
      throw new Error('Purchase completed but entitlement not active yet. Try Restore purchases in a moment.');
    }
    await applyTierToAuth(tier);
    trackEvent('purchase_completed', { planId, tier });
    return tier;
  } catch (err) {
    if (isUserCancelled(err)) {
      trackEvent('purchase_cancelled', { planId });
      throw new Error('Purchase cancelled.');
    }
    const msg = err instanceof Error ? err.message : 'Purchase failed.';
    trackEvent('purchase_failed', { planId, reason: msg });
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

/**
 * Reconcile the auth store with the server (profiles is the persisted source of truth,
 * written by the RevenueCat webhook). The server read is AUTHORITATIVE — it may
 * downgrade (e.g. a subscription that expired mid-session), which the old maxTier-only
 * logic could never do.
 *
 * `optimisticFloor` is the tier we KNOW is valid on-device right now (the active
 * RevenueCat entitlement). It keeps Premium lit immediately after a purchase while the
 * webhook is still in flight, without permanently pinning a stale tier: once the device
 * entitlement is gone the floor drops to 'free' and the server value wins.
 */
export async function refreshPremiumFromServer(
  optimisticFloor: SubscriptionTier = 'free',
): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user?.id || !isSupabaseConfigured) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium, subscription_tier')
    .eq('id', user.id)
    .single();

  if (error || data == null) {
    if (__DEV__) console.warn('[purchases] refreshPremiumFromServer failed', error?.message);
    return isPaidTier(user.subscriptionTier);
  }

  const serverTier = (data.subscription_tier as SubscriptionTier | null)
    ?? (data.is_premium ? 'pro' : 'free');
  // Authoritative server value, floored by a known-active device entitlement.
  const effectiveTier = maxTier(serverTier, optimisticFloor);
  const current = useAuthStore.getState().user;
  if (
    current
    && (current.subscriptionTier !== effectiveTier || current.isPremium !== isPaidTier(effectiveTier))
  ) {
    useAuthStore.setState({
      user: {
        ...current,
        subscriptionTier: effectiveTier,
        isPremium: isPaidTier(effectiveTier),
        maxScansPerDay: maxScansPerDayForTier(effectiveTier),
      },
    });
  }
  return isPaidTier(serverTier);
}

/** Poll Supabase until the RevenueCat webhook updates profiles (scan API reads server tier). */
export async function waitForServerPremiumActivation(maxAttempts = 16): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await refreshPremiumFromServer()) {
      if (__DEV__) console.log('[purchases] server premium confirmed', { attempt: i });
      return true;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (__DEV__) console.warn('[purchases] server premium not confirmed after polling');
  return false;
}

/** @deprecated Use waitForServerPremiumActivation — local tier is optimistic and unreliable. */
export async function waitForPremiumActivation(maxAttempts = 8): Promise<boolean> {
  return waitForServerPremiumActivation(maxAttempts);
}
