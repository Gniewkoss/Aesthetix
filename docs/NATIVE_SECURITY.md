# Native security: SSL pinning + Sentry

These features require a **custom native build** (not Expo Go).

## Quick start

```bash
npm install
npx expo prebuild          # generates ios/ + android/ with plugins
npx expo run:ios           # or: eas build --profile development
```

Set in `.env` for runtime:

```env
EXPO_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
```

For EAS production builds (pinning on):

```env
EXPO_PUBLIC_SSL_PINNING_ENABLED=true   # set automatically in eas.json production profile
```

Optional EAS build secrets (source maps / debug symbols upload):

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

---

## SSL pinning (Supabase)

**What:** Only trusts pinned public keys for `*.supabase.co` (defense-in-depth on top of TLS).

**When active:** `EXPO_PUBLIC_SSL_PINNING_ENABLED=true` at **prebuild** time (`eas build --profile production`).

**Files:**

- `plugins/withSslPinning.js` — Android `network_security_config.xml`, iOS `NSPinnedDomains`
- `plugins/sslPinningPins.js` — SPKI SHA-256 hashes (rotate before `expiration`)

**Regenerate pins** (before cert rotation):

```bash
chmod +x scripts/generate-ssl-pins.sh
./scripts/generate-ssl-pins.sh krasjpoxoilwtmovjuho.supabase.co
```

Update `plugins/sslPinningPins.js`, then `npx expo prebuild --clean`.

### Verify with MITM proxy (production build)

1. Build with `production` profile (pinning on).
2. Install on device; configure Charles / mitmproxy **without** installing your CA on the device.
3. Open app → sign in / run scan.
4. **Expected:** Supabase requests **fail** (pin mismatch or connection error).
5. Build with `development` profile (`SSL_PINNING_ENABLED=false`) → same proxy → requests **succeed** (TLS only, no pinning).

Pinning does **not** block non-Supabase hosts (e.g. Sentry ingest uses separate TLS).

---

## Sentry native crashes

**What:** Unhandled JS + native crashes reported when `EXPO_PUBLIC_SENTRY_DSN` is set.

**Expo Go:** Sentry native module unavailable — funnel falls back to console (by design).

**Production / dev client:**

1. `@sentry/react-native/expo` in `app.config.js` plugins.
2. `metro.config.js` wrapped with `withSentryConfig`.
3. `App.tsx` wrapped with `Sentry.wrap` (non–Expo Go).
4. `initErrorTracking()` enables native crash handling.

### Test crash (dev client only)

Temporarily add a button calling `Sentry.captureException(new Error('test'))` or native crash — confirm event in Sentry dashboard.

---

## Profiles (eas.json)

| Profile | SSL pinning | Typical use |
|---------|-------------|---------------|
| `development` | off | Daily dev, MITM debugging |
| `preview` | off | Internal QA |
| `production` | on | TestFlight / Play release |
