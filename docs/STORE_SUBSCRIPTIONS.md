# Aesthetix — Subscriptions setup (ASC · Play · RevenueCat)

Copy the identifiers from `src/subscription/storeCatalog.ts`. **Use the same strings everywhere** — a typo breaks purchases and webhooks.

## Overview

```mermaid
flowchart LR
  App["Aesthetix app"]
  RC["RevenueCat"]
  ASC["App Store Connect"]
  Play["Google Play"]
  SB["Supabase webhook"]

  App -->|purchase| RC
  RC --> ASC
  RC --> Play
  RC -->|server event| SB
  SB -->|subscription_tier| App
```

| Concept | Value |
|--------|--------|
| **Entitlements** | `starter` (weekly), `pro` (monthly), `max` (monthly max) |
| **Profile tier** | `profiles.subscription_tier` = `free` \| `starter` \| `pro` \| `max` |
| **Offering** | `default` |
| **RC package IDs** | `weekly`, `monthly`, `max` |
| **Store product IDs** | `aesthetix_weekly`, `aesthetix_monthly`, `aesthetix_monthly_max` |
| **Apple subscription group** | `aesthetix_premium` |
| **App bundle / package** | `com.physiquemax.ai` |

---

## Plans (3 paid tiers)

| App name | Billing | Product ID | Price (USD) | Capabilities |
|----------|---------|------------|-------------|--------------|
| **Starter** | Weekly | `aesthetix_weekly` | $2.99 | 1 scan/day, front + back |
| **Pro** | Monthly | `aesthetix_monthly` | $7.99 | Unlimited scans, front + back |
| **Max** | Monthly | `aesthetix_monthly_max` | $9.99 | Pro + AI coach (narrative + chat) |

There is **no annual plan** — Max is a higher monthly subscription.

---

## 1. App Store Connect (iOS)

1. **My Apps** → Aesthetix → **Subscriptions** → **+ Subscription Group**.
2. **Reference name:** `aesthetix_premium` (=`APP_STORE_SUBSCRIPTION_GROUP_ID`).
3. Add three **auto-renewable subscriptions**:

| Reference name | Product ID (critical) | Duration | Price (USD) |
|----------------|----------------------|----------|-------------|
| Aesthetix Starter | `aesthetix_weekly` | 1 week | $2.99 |
| Aesthetix Pro | `aesthetix_monthly` | 1 month | $7.99 |
| Aesthetix Max | `aesthetix_monthly_max` | 1 month | $9.99 |

4. Localizations per tier (see table above).
5. Submit subscriptions for review with the app version.

**Product IDs must match exactly** (lowercase, underscore). Do not reuse `aesthetix_yearly` from older drafts.

---

## 2. Google Play Console (Android)

1. **Monetize** → **Products** → **Subscriptions** → **Create subscription**.
2. Create three subscriptions with **Product ID** matching iOS:

| Product ID | Billing period | Price |
|------------|----------------|-------|
| `aesthetix_weekly` | Weekly | $2.99 |
| `aesthetix_monthly` | Monthly | $7.99 |
| `aesthetix_monthly_max` | Monthly | $9.99 |

3. Link each product to the matching RevenueCat entitlement (`starter` / `pro` / `max`).
4. Activate subscriptions.

---

## 3. RevenueCat

### Project & apps

1. [app.revenuecat.com](https://app.revenuecat.com) → project **Aesthetix**.
2. Add **iOS app** (bundle `com.physiquemax.ai`) and **Android app** (package `com.physiquemax.ai`).
3. Connect App Store Connect API key + Google Play service account.

### Entitlements (three tiers)

| Identifier | Product | App capabilities |
|------------|---------|------------------|
| `starter` | `aesthetix_weekly` | 1 scan/day, front + back |
| `pro` | `aesthetix_monthly` | Unlimited scans, front + back |
| `max` | `aesthetix_monthly_max` | Unlimited scans + AI coach (narrative + chat) |

Webhook maps `product_id` → `profiles.subscription_tier`.

### Products

Create products with **Store product identifier** = exact ASC/Play IDs:

- `aesthetix_weekly`
- `aesthetix_monthly`
- `aesthetix_monthly_max`

### Offering `default`

| Package identifier | Product | Entitlement |
|--------------------|---------|-------------|
| `weekly` | `aesthetix_weekly` | `starter` |
| `monthly` | `aesthetix_monthly` | `pro` |
| `max` | `aesthetix_monthly_max` | `max` |

Set **default** offering as current.

### Webhook (already on Supabase)

- URL: `https://krasjpoxoilwtmovjuho.supabase.co/functions/v1/revenuecat`
- Authorization: value from `supabase/.secrets.local` → `REVENUECAT_WEBHOOK_AUTH`

### App user ID

In the app (when IAP is enabled): `Purchases.logIn(supabaseUserId)` so `app_user_id` = UUID from `auth.users`.

---

## 4. App code mapping

| UI plan (`SubscriptionPlanId`) | RC package | Store product ID |
|----------------------------------|------------|------------------|
| `weekly` | `weekly` | `aesthetix_weekly` |
| `monthly` | `monthly` | `aesthetix_monthly` |
| `max` | `max` | `aesthetix_monthly_max` |

Defined in: `src/subscription/storeCatalog.ts`

---

## 5. Enable IAP in the app (when stores are live)

```bash
npx expo install react-native-purchases
```

```env
EXPO_PUBLIC_IAP_ENABLED=true
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

Complete `src/subscription/purchases.ts` (SDK calls). Use a **development build** (not Expo Go).

---

## Checklist before TestFlight / internal testing

- [ ] All 6 store products created (3 iOS + 3 Android) with IDs above
- [ ] RevenueCat entitlements `starter`, `pro`, `max` each linked to one product
- [ ] Offering `default` has packages `weekly` / `monthly` / `max`
- [ ] Webhook test event returns 200
- [ ] Sandbox purchase → correct `profiles.subscription_tier` in Supabase
- [ ] `EXPO_PUBLIC_IAP_ENABLED=true` only in production / EAS build profile
