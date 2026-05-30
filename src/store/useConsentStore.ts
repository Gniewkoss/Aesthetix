import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { POLICY_VERSION } from '../constants/legal';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { captureException } from '../lib/errorTracking';

// Consent is recorded BEFORE a user account exists (gate on the signup screen), so it
// lives in a global AsyncStorage key, not per-user. Once authenticated we also write an
// immutable audit row to `consent_logs` (GDPR requires provable, timestamped consent).

const CONSENT_KEY = '@physiquemax/consent';

interface PersistedConsent {
  acceptedPolicyVersion: string | null; // version of Terms+Privacy the user accepted
  analyticsConsent: boolean; // explicit opt-in for analytics (default off)
  acceptedAt: string | null;
}

interface ConsentState extends PersistedConsent {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** True when the user has accepted the CURRENT policy version. */
  hasCurrentConsent: () => boolean;
  /** Record acceptance of the current Terms + Privacy, with an analytics choice. */
  recordAcceptance: (analyticsConsent: boolean) => Promise<void>;
  /** Update the analytics opt-in independently (e.g. from a settings toggle). */
  setAnalyticsConsent: (value: boolean) => Promise<void>;
}

const DEFAULTS: PersistedConsent = {
  acceptedPolicyVersion: null,
  analyticsConsent: false,
  acceptedAt: null,
};

async function persist(state: PersistedConsent): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch (err) {
    captureException(err, { op: 'persistConsent' });
  }
}

// Fire-and-forget audit row. The consent_logs table is insert-only for the user (RLS).
function logConsentToSupabase(state: PersistedConsent): void {
  if (!isSupabaseConfigured) return;
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // pre-auth acceptance is re-logged after login via syncConsentLog()
      await supabase.from('consent_logs').insert({
        user_id: user.id,
        policy_version: state.acceptedPolicyVersion,
        analytics_consent: state.analyticsConsent,
        accepted_at: state.acceptedAt,
      });
    } catch (err) {
      captureException(err, { op: 'logConsentToSupabase' });
    }
  })();
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CONSENT_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<PersistedConsent>) : {};
      set({ ...DEFAULTS, ...parsed, hydrated: true });
    } catch {
      set({ ...DEFAULTS, hydrated: true });
    }
  },

  hasCurrentConsent: () => get().acceptedPolicyVersion === POLICY_VERSION,

  recordAcceptance: async (analyticsConsent) => {
    const next: PersistedConsent = {
      acceptedPolicyVersion: POLICY_VERSION,
      analyticsConsent,
      acceptedAt: new Date().toISOString(),
    };
    set(next);
    await persist(next);
    logConsentToSupabase(next);
  },

  setAnalyticsConsent: async (value) => {
    const next: PersistedConsent = { ...get(), analyticsConsent: value };
    set({ analyticsConsent: value });
    await persist(next);
    logConsentToSupabase(next);
  },
}));

/**
 * Re-write the consent audit row after authentication, since acceptance may have
 * happened pre-auth (no user_id yet). Safe to call on every login.
 */
export function syncConsentLog(): void {
  const { acceptedPolicyVersion, analyticsConsent, acceptedAt } = useConsentStore.getState();
  if (!acceptedPolicyVersion) return;
  logConsentToSupabase({ acceptedPolicyVersion, analyticsConsent, acceptedAt });
}
