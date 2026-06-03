# Subscriptions & IAP

## Dev (default)

```env
EXPO_PUBLIC_IAP_ENABLED=false
EXPO_PUBLIC_USE_MOCK_API=true   # optional; also forces local mock when no Supabase
```

Premium uses **local simulation** in `useSubscriptionStore` — no App Store / Play account required.

## Production (later)

**Full console checklist:** [`docs/STORE_SUBSCRIPTIONS.md`](../../docs/STORE_SUBSCRIPTIONS.md)

**Identifiers (do not change):**

| | |
|--|--|
| Entitlements | `starter` (weekly), `pro` (monthly), `max` (monthly max) |
| Tiers | See `src/subscription/tiers.ts` |
| Store product IDs | `aesthetix_weekly`, `aesthetix_monthly`, `aesthetix_monthly_max` |
| RC offering | `default` · packages `weekly`, `monthly`, `max` |

Source of truth: `src/subscription/storeCatalog.ts`

1. Create products in App Store Connect + Play Console (IDs above).
2. Configure RevenueCat entitlement + offering (see doc).
3. `npx expo install react-native-purchases`
4. Set keys and enable IAP:

```env
EXPO_PUBLIC_IAP_ENABLED=true
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

5. `src/subscription/purchases.ts` — RevenueCat SDK (`configure`, `logIn`, `purchasePackage`, `restorePurchases`).
6. Webhook: `supabase/functions/revenuecat` → sets `profiles.subscription_tier`, `is_premium`, and `subscriptions`.

**Polish setup guide:** [`docs/PAYMENTS_PL.md`](../../docs/PAYMENTS_PL.md)
