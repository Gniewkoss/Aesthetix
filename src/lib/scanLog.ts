import { trackEvent } from './errorTracking';

/** Structured scan-pipeline logging (Sentry breadcrumbs in prod, console in dev). */
export function logScan(step: string, data?: Record<string, unknown>): void {
  trackEvent(`scan_${step}`, data);
  if (__DEV__) {
    console.log(`[scan] ${step}`, data ?? '');
  }
}
