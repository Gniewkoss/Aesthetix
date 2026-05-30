// Consent-gated analytics façade.
//
// GDPR/CCPA require explicit opt-in before any analytics collection. Every event
// goes through trackEvent(), which is a hard no-op unless the user has opted in
// (useConsentStore.analyticsConsent === true). This means analytics calls can be
// sprinkled through the app safely — nothing leaves the device without consent.
//
// No analytics SDK is wired yet (by design — none is bundled, so there is nothing
// to leak). To enable a provider later, implement `dispatch()` below (e.g. PostHog
// or Amplitude in EU/GDPR mode with IP anonymization) and disclose it in the
// Privacy Policy. Until then events are logged to the console in dev only.

import { useConsentStore } from '../store/useConsentStore';

export type AnalyticsEvent =
  | 'scan_started'
  | 'scan_completed'
  | 'signup_completed'
  | 'premium_viewed'
  | 'premium_purchased';

function hasConsent(): boolean {
  return useConsentStore.getState().analyticsConsent === true;
}

function dispatch(_event: AnalyticsEvent, _props?: Record<string, unknown>): void {
  // TODO: forward to a GDPR-mode analytics provider here once selected.
}

export function trackEvent(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!hasConsent()) return;
  if (__DEV__) console.log('[analytics]', event, props ?? '');
  dispatch(event, props);
}
