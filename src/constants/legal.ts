// Single source of truth for legal documents + acceptance versioning.
//
// Bump POLICY_VERSION whenever the Privacy Policy or Terms change materially. The
// consent store compares the accepted version against this, so a bump re-prompts
// every user for fresh consent (GDPR: consent must cover the current terms).

export const PRIVACY_URL = 'https://physiquemax.ai/privacy';
export const TERMS_URL = 'https://physiquemax.ai/terms';

export const POLICY_VERSION = '2026-05-30';

// Shown prominently before signup and on analysis results. Keeps the product framed
// as fitness/wellness — NOT medical advice — to avoid FDA/medical-device exposure.
export const MEDICAL_DISCLAIMER =
  'Aesthetix AI provides physique and fitness insights for informational purposes ' +
  'only. It is not medical advice and does not diagnose, treat, or prevent any ' +
  'condition. Consult a qualified professional before making changes to your diet, ' +
  'training, or health routine.';
