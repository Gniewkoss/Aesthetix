// Centralized error + crash reporting.
//
// Goals:
//  - One funnel for every caught error (replaces scattered `console.warn`).
//  - Sentry in real builds, but ZERO crash risk in Expo Go (where Sentry's native
//    module is unavailable). Sentry only initializes when:
//      1. EXPO_PUBLIC_SENTRY_DSN is set, AND
//      2. we are NOT inside the Expo Go client.
//    Otherwise we degrade to console logging (dev) / silent capture buffer (prod).
//
// Native crash capture requires a prebuild/EAS build with `@sentry/react-native/expo`
// in app.config.js (see docs/NATIVE_SECURITY.md). Does NOT work in Expo Go.

import { isExpoGo } from './runtime';

type Sentry = typeof import('@sentry/react-native');

let sentry: Sentry | null = null;
let initialized = false;

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENV = process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production');

export async function initErrorTracking(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!DSN || isExpoGo) {
    if (__DEV__ && !DSN) console.log('[errorTracking] No EXPO_PUBLIC_SENTRY_DSN — using console reporter.');
    return;
  }

  try {
    const mod = (await import('@sentry/react-native')) as Sentry;
    mod.init({
      dsn: DSN,
      environment: ENV,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      sendDefaultPii: false,
      enableNative: true,
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,
      attachStacktrace: true,
    });
    sentry = mod;
  } catch (err) {
    if (__DEV__) console.warn('[errorTracking] Sentry init skipped:', err);
  }
}

/** Associate subsequent events with a user (id only — never email/PII). */
export function setUserContext(userId: string | null): void {
  sentry?.setUser(userId ? { id: userId } : null);
}

/** Report a handled error with optional structured context. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (sentry) {
    sentry.captureException(err, context ? { extra: context } : undefined);
  } else if (__DEV__) {
    console.error('[error]', err.message, context ?? '');
  }
}

/** Report a non-error message (e.g. a degraded-but-handled condition). */
export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureMessage(message, context ? { extra: context } : undefined);
  } else if (__DEV__) {
    console.warn('[message]', message, context ?? '');
  }
}

/**
 * Structured business/system event (purchase funnel, entitlement sync gaps, scan
 * gating). Lands as a Sentry breadcrumb so it shows on the timeline of any later
 * error, and as an info-level event for funnel dashboards. Never include PII.
 */
export function trackEvent(name: string, data?: Record<string, unknown>): void {
  if (sentry) {
    sentry.addBreadcrumb({
      category: 'app',
      type: 'info',
      level: 'info',
      message: name,
      data,
    });
    sentry.captureMessage(name, { level: 'info', extra: data });
  } else if (__DEV__) {
    console.log('[event]', name, data ?? '');
  }
}
