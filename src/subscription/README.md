# Subscriptions & IAP

## Dev (default)

```env
EXPO_PUBLIC_IAP_ENABLED=false
EXPO_PUBLIC_USE_MOCK_API=true   # optional; also forces local mock when no Supabase
```

Premium uses **local simulation** in `useSubscriptionStore` — no App Store / Play account required.

## Production (later)

1. Create products in App Store Connect + Play Console.
2. Configure RevenueCat entitlement `premium` and packages `weekly` / `monthly` / `yearly`.
3. `npx expo install react-native-purchases`
4. Set keys and enable IAP:

```env
EXPO_PUBLIC_IAP_ENABLED=true
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

5. Implement `Purchases.configure`, `logIn`, `purchasePackage`, `restorePurchases` in `purchases.ts` (stubs throw until done).
6. Webhook: `supabase/functions/revenuecat` → sets `profiles.is_premium` and `subscriptions` table.
