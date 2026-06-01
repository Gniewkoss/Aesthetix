import { isExpoGo } from './runtime';

/**
 * Measures async work; logs slow paths to console (dev) and Sentry breadcrumbs.
 */
export async function withPerfSpan<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    const ms = Date.now() - t0;
    if (__DEV__) console.log(`[perf] ${op}:${name} ${ms}ms`);
    if (ms >= 2500 && process.env.EXPO_PUBLIC_SENTRY_DSN && !isExpoGo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
        Sentry.addBreadcrumb({ category: 'performance', message: `${op}:${name}`, data: { ms } });
      } catch {
        // Sentry unavailable
      }
    }
  }
}
