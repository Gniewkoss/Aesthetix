# Launch Readiness — Implementation Status

This tracks what was actually changed in the codebase against `AUDIT_REPORT.md`, and —
just as importantly — corrects several audit claims that did not match the real code.

**Verification baseline:** `npm run type-check` → 0 errors · `npm run test:ci` → 21/21 pass.

---

## ⚠️ Audit accuracy corrections

The audit was partly inaccurate. Before acting on it, these claims were verified against
the code and found **already implemented** or **wrong**:

| Audit claim | Reality |
|---|---|
| #5 "`delete_own_account` RPC doesn't exist" | It existed (`20260518_delete_own_account.sql`). Now *hardened* with an audit trail. |
| #3 "API key shipped via `dangerouslyAllowBrowser`" | True for a **dev-only** fallback path — but a **live key was present in `.env` under `EXPO_PUBLIC_`**, which *is* a real exposure. Fixed. |
| #8 "No rate limiting" | The `analyze` Edge Function already rate-limits per day. Auth throttling is handled natively by Supabase Auth (the audit's Redis design is wrong for this stack). |
| "OpenAI called from client / keys in client" | Backend mode already proxied OpenAI through Edge Functions; key lives in Supabase secrets. |

---

## ✅ Implemented & verified (this pass)

| # | Item | Key files |
|---|---|---|
| 3 | Removed all client-side OpenAI usage; deleted `openai` dep; scrubbed `EXPO_PUBLIC_OPENAI_API_KEY` | `src/api/openai.ts`, `src/api/chat.ts`, `.env`, `package.json` |
| 2 | Encrypted auth session at rest via Keychain/Keystore (chunked, web fallback) | `src/store/secureStorage.ts`, `src/api/supabase.ts` |
| 7 | Centralized error tracking (Sentry-ready, Expo-Go-safe), replaced silent catches | `src/lib/errorTracking.ts`, `App.tsx`, `useAuthStore.ts`, `openai.ts` |
| 11 | Error boundary around the app | `src/components/ErrorBoundary.tsx`, `App.tsx` |
| 15 | Auth input validation (email/password policy/name) | `src/lib/validation.ts`, `AuthScreen.tsx` |
| 10/12 | Image validation at pick time + downscale/compress before upload | `src/lib/imageValidation.ts`, `UploadScreen.tsx`, `backend.ts` |
| 4 | Mandatory Terms + Privacy acceptance gate before signup, with versioning | `useConsentStore.ts`, `AuthScreen.tsx`, `constants/legal.ts` |
| 5 | GDPR deletion hardened with append-only audit log + cascade | `20260530_compliance.sql` |
| 6 | Consent-gated analytics (opt-in, no SDK bundled = nothing leaks) | `src/lib/analytics.ts`, `useConsentStore.ts` |
| 9 | Prominent medical disclaimer (not-medical-advice framing) | `src/components/MedicalDisclaimer.tsx`, `constants/legal.ts` |
| 24 | `syncProfileAsync` no longer swallows DB write failures | `useAuthStore.ts` |
| 13 | Unit tests (validation + scoring), 21 passing | `src/**/__tests__/` |
| 14 | CI: type-check + test on push/PR (EAS build stub included) | `.github/workflows/ci.yml` |

> **Action required by a human (not code):** rotate the OpenAI key that was in `.env`
> — it must be considered compromised. Set the new key only in Supabase secrets:
> `supabase secrets set OPENAI_API_KEY=sk-...`. Then `supabase db push` to apply the
> compliance migration.

---

## 🟠 Requires a native build / external service / legal — cannot be coded-and-verified in Expo Go

These are **not** code-only fixes. Shipping non-functional stubs for them would be
misleading, so they are documented instead of faked:

- **#1 SSL certificate pinning.** Not supported in Expo Go and not expressible from JS
  with the Supabase fetch client. Requires a dev/prebuild + a native solution
  (`expo-build-properties` network-security-config on Android, `NSPinnedDomains` /
  TrustKit on iOS, or `react-native-ssl-pinning` for the `fetch` layer). Add at the
  config-plugin level and verify with a MITM proxy on a real build. **TLS already
  protects tokens in transit; pinning is defense-in-depth, not a missing baseline.**
- **#7 Sentry native crash reporting.** The funnel is wired and active in dev/standalone
  builds when `EXPO_PUBLIC_SENTRY_DSN` is set; full native crash capture needs the
  `@sentry/react-native` config plugin enabled at prebuild (no effect in Expo Go).
- **#4 Legal copy.** The acceptance flow + versioning are built, but the actual Privacy
  Policy / Terms content at `physiquemax.ai/{privacy,terms}` must be written/reviewed by
  counsel (GDPR/CCPA).
- **#20 Store metadata / screenshots / privacy nutrition labels.** Console/asset work.

## 🟡 Remaining HIGH items (follow-up, scoped but not yet done)

- #16 Dark-mode/system-theme support · #17 a11y labels sweep · #19 image caching ·
  #28 session timeout · #30 performance monitoring.
