# Płatności — co zrobić, żeby działało (Apple Pay, karta, Google Pay)

Aplikacja **nie przyjmuje kart bezpośrednio**. Płatności idą przez:

**RevenueCat → App Store (iOS) / Google Play (Android)**

Użytkownik w oknie systemowym wybiera **Apple Pay**, kartę, saldo Apple / Google itd. — to obsługuje Apple/Google, nie my.

Kod w repo jest już podłączony (`react-native-purchases`). Ty musisz skonfigurować konta sklepowe i klucze.

---

## Szybka checklista

### 1. Konta (jednorazowo)

| Krok | Gdzie |
|------|--------|
| Konto Apple Developer (99 USD/rok) | [developer.apple.com](https://developer.apple.com) |
| Konto Google Play Developer (25 USD jednorazowo) | [play.google.com/console](https://play.google.com/console) |
| RevenueCat (darmowy tier na start) | [app.revenuecat.com](https://app.revenuecat.com) |

### 2. Produkty w sklepach

Dokładne ID (muszą być **identyczne** wszędzie):

| Plan | Product ID | Cena |
|------|------------|------|
| Starter | `aesthetix_weekly` | $2.99 / tydzień |
| Pro | `aesthetix_monthly` | $7.99 / miesiąc |
| Max | `aesthetix_monthly_max` | $9.99 / miesiąc |

Szczegóły: [`STORE_SUBSCRIPTIONS.md`](./STORE_SUBSCRIPTIONS.md)

### 3. RevenueCat

1. Projekt **Aesthetix**, aplikacje iOS + Android (`ai.aesthetix.app`).
2. Połącz **App Store Connect API** i **Google Play service account**.
3. **Entitlements:** `starter`, `pro`, `max` — każdy z właściwym product ID.
4. **Offering** `default` z pakietami: `weekly`, `monthly`, `max` (te stringi = `REVENUECAT_PACKAGE_IDS` w kodzie).
5. Skopiuj klucze API: **iOS** `appl_…`, **Android** `goog_…`.

### 4. Supabase (webhook)

```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH="losowy-długi-sekret"
supabase functions deploy revenuecat --no-verify-jwt
```

W RevenueCat → Integrations → Webhooks:

- URL: `https://TWOJ-PROJEKT.supabase.co/functions/v1/revenuecat`
- Authorization: ten sam sekret co wyżej

Webhook ustawia `profiles.subscription_tier` i `is_premium` po zakupie.

### 5. Zmienne w aplikacji

W `.env` (lub EAS Secrets na produkcji):

```env
EXPO_PUBLIC_IAP_ENABLED=true
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxx
EXPO_PUBLIC_USE_MOCK_API=false
```

Na czas developmentu UI możesz zostawić `EXPO_PUBLIC_IAP_ENABLED=false` — wtedy plan jest symulowany lokalnie.

### 6. Build (ważne)

**Expo Go nie obsługuje płatności.** Potrzebujesz native builda:

```bash
npx expo prebuild
npx expo run:ios
# lub
eas build --profile development
```

### 7. Test zakupu

1. iOS: Sandbox tester w App Store Connect → Users and Access → Sandbox.
2. Zaloguj się w aplikacji kontem Supabase.
3. Paywall lub Profile → Subscription → wybierz plan → systemowy sheet płatności.
4. Po zakupie: webhook → profil `pro` / `max` / `starter` w Supabase.

---

## Co robi „Restore purchases”

Przywraca subskrypcję powiązaną z **Apple ID / kontem Google** na tym urządzeniu i synchronizuje ją z kontem Aesthetix (przez RevenueCat `logIn(userId)`).

---

## Typowe problemy

| Problem | Rozwiązanie |
|---------|-------------|
| „Plan not in offering” | W RC: offering `default` + pakiety `weekly`/`monthly`/`max` |
| Zakup OK, tier dalej free | Webhook RC → Supabase; sprawdź logi funkcji `revenuecat` |
| Crash w Expo Go | Użyj `expo run:ios`, nie Expo Go |
| Brak Apple Pay | Włączone w Ustawieniach Apple ID; sandbox czasem tylko karta testowa |

---

## Pliki w kodzie

| Plik | Rola |
|------|------|
| `src/subscription/purchases.ts` | RevenueCat: buy, restore, logIn |
| `src/subscription/storeCatalog.ts` | ID produktów i pakietów |
| `src/store/useSubscriptionStore.ts` | subscribe / changePlan |
| `supabase/functions/revenuecat/index.ts` | Webhook → tier w bazie |
