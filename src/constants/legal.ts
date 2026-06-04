// Single source of truth for legal documents + acceptance versioning.
//
// Bump POLICY_VERSION whenever the Privacy Policy or Terms change materially. The
// consent store compares the accepted version against this, so a bump re-prompts
// every user for fresh consent (GDPR: consent must cover the current terms).
//
// Public pages: docs/ in this repo, deployed to aesthetix.online (see docs/README.md).

export const LEGAL_BASE_URL = 'https://aesthetix.online';

export const PRIVACY_URL = `${LEGAL_BASE_URL}/privacy.html`;
export const TERMS_URL = `${LEGAL_BASE_URL}/terms.html`;

/** Must match the "Version" line in docs/privacy.html and docs/terms.html */
export const POLICY_VERSION = '2026-06-04';

export const SUPPORT_EMAIL = 'support@aesthetix.online';
export const PRIVACY_EMAIL = 'privacy@aesthetix.online';

// Shown prominently before signup and on analysis results. Keeps the product framed
// as fitness/wellness — NOT medical advice — to avoid FDA/medical-device exposure.
export const MEDICAL_DISCLAIMER =
  'Aesthetix provides physique and fitness insights for informational purposes ' +
  'only. It is not medical advice and does not diagnose, treat, or prevent any ' +
  'condition. Consult a qualified professional before making changes to your diet, ' +
  'training, or health routine.';
