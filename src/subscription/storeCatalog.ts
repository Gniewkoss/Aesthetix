/**
 * Single source of truth for App Store, Google Play, and RevenueCat identifiers.
 * Use the exact strings below in all three consoles — do not rename after launch.
 */

export type SubscriptionPlanId = 'weekly' | 'monthly' | 'max';

// ─── RevenueCat ───────────────────────────────────────────────────────────────

/**
 * RevenueCat entitlements (one per tier). Attach each store product to its entitlement.
 * Webhook maps product_id → profiles.subscription_tier.
 */
export const REVENUECAT_ENTITLEMENT_IDS = {
  starter: 'starter',
  pro: 'pro',
  max: 'max',
} as const;

/** @deprecated Use REVENUECAT_ENTITLEMENT_IDS — kept for IAP scaffold imports */
export const REVENUECAT_ENTITLEMENT_ID = REVENUECAT_ENTITLEMENT_IDS.pro;

/** Primary offering shown via Purchases.getOfferings().current */
export const REVENUECAT_OFFERING_ID = 'default' as const;

/**
 * Package identifiers inside the `default` offering (RevenueCat dashboard → Offerings).
 * Code selects packages by these keys — they are NOT the App Store / Play product IDs.
 */
export const REVENUECAT_PACKAGE_IDS: Record<SubscriptionPlanId, string> = {
  weekly: 'weekly',
  monthly: 'monthly',
  max: 'max',
};

// ─── Store product IDs (Apple + Google) ───────────────────────────────────────

/**
 * Subscription product IDs — must match exactly in:
 * - App Store Connect → Subscriptions
 * - Google Play Console → Subscriptions
 * - RevenueCat → Products (linked to each package)
 */
export const STORE_PRODUCT_IDS: Record<SubscriptionPlanId, string> = {
  weekly: 'aesthetix_weekly',
  monthly: 'aesthetix_monthly',
  max: 'aesthetix_monthly_max',
};

/** App Store Connect subscription group reference name */
export const APP_STORE_SUBSCRIPTION_GROUP_ID = 'aesthetix_premium';

// ─── Suggested list prices (USD) — set in each store console ─────────────────

export const STORE_SUGGESTED_PRICES_USD: Record<
  SubscriptionPlanId,
  { price: string; period: string; trialDays: number }
> = {
  weekly: { price: '1.99', period: '1 week', trialDays: 0 },
  monthly: { price: '4.99', period: '1 month', trialDays: 0 },
  max: { price: '6.99', period: '1 month', trialDays: 0 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_PLAN_IDS: SubscriptionPlanId[] = ['weekly', 'monthly', 'max'];

const PLAN_BY_STORE_PRODUCT_ID = Object.fromEntries(
  (Object.entries(STORE_PRODUCT_IDS) as [SubscriptionPlanId, string][]).map(([plan, id]) => [
    id,
    plan,
  ]),
) as Record<string, SubscriptionPlanId>;

export function planIdFromStoreProductId(productId: string | null | undefined): SubscriptionPlanId {
  if (!productId) return 'monthly';
  const exact = PLAN_BY_STORE_PRODUCT_ID[productId];
  if (exact) return exact;

  const lower = productId.toLowerCase();
  if (lower.includes('week')) return 'weekly';
  if (lower.includes('max')) return 'max';
  if (lower.includes('month')) return 'monthly';
  return 'monthly';
}

export function storeProductIdForPlan(planId: SubscriptionPlanId): string {
  return STORE_PRODUCT_IDS[planId];
}

export function revenueCatPackageIdForPlan(planId: SubscriptionPlanId): string {
  return REVENUECAT_PACKAGE_IDS[planId];
}
