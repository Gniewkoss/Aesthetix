import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { User, PhysiqueRank } from '../types';
import { RANKS, RANK_CONFIG, XP_REWARDS } from '../constants';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { getEmailAuthRedirectUrl } from '../auth/authRedirect';
import { mapAuthError } from '../auth/authErrors';
import {
  clearUserScopedStorage,
  loadItem,
  loadUserItem,
  removeItem,
  saveItem,
  saveUserItem,
} from './storage';
import { getValidatedSession } from '../auth/session';
import { clearLocalUserSession, hydrateUserStores } from './resetUserData';
import { captureException, setUserContext } from '../lib/errorTracking';
import { syncConsentLog } from './useConsentStore';
import {
  isPaidTier,
  maxScansPerDayForTier,
  type SubscriptionTier,
} from '../subscription/tiers';
import { setLocalFreeScanConsumed } from '../lib/freeScanQuota';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True after the first hydrate() completes (success or failure). */
  authHydrated: boolean;
  onboardingCompleted: boolean;

  hydrate: () => Promise<void>;
  syncFromSession: () => Promise<void>;
  completeOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string, fullName?: string | null) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  decrementScans: () => void;
  markFreeScanUsed: () => Promise<void>;
  upgradeToPremium: (planId?: 'weekly' | 'monthly' | 'max') => Promise<void>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getRankForXP(xp: number): PhysiqueRank {
  let rank: PhysiqueRank = 'Beginner';
  for (const r of RANKS) {
    if (xp >= RANK_CONFIG[r].minXP) rank = r;
    else break;
  }
  return rank;
}

export function getLevelForXP(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

function resetScansIfNewDay(user: User): User {
  const today = new Date().toDateString();
  const lastScan = user.lastScanDate ? new Date(user.lastScanDate).toDateString() : null;
  return lastScan !== today ? { ...user, scansToday: 0 } : user;
}

// ─── Mock fallback (no Supabase credentials) ───────────────────────────────────

const MOCK_USER: User = {
  id: 'user_001',
  email: 'user@aesthetix.app',
  name: 'Alex',
  subscriptionTier: 'free',
  isPremium: false,
  freeScanUsed: false,
  scansToday: 0,
  maxScansPerDay: 1,
  xp: 1200,
  level: getLevelForXP(1200),
  rank: 'Bronze',
  streak: 7,
  lastScanDate: undefined,
  joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

async function persistUser(user: User | null): Promise<void> {
  if (user) {
    await saveItem('user', user);
  } else {
    await removeItem('user');
  }
}

// ─── Supabase profile helpers ──────────────────────────────────────────────────

interface SupabaseProfile {
  full_name?: string | null;
  is_premium?: boolean;
  subscription_tier?: string | null;
  free_scan_used?: boolean;
  scans_today?: number;
  last_scan_reset_date?: string | null;
  last_scan_date?: string | null;
  xp?: number;
  streak?: number;
  created_at?: string;
}

async function ensureUserProfile(session: Session): Promise<SupabaseProfile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, is_premium, subscription_tier, free_scan_used, scans_today, last_scan_reset_date, last_scan_date, xp, streak, created_at')
    .eq('id', session.user.id)
    .maybeSingle<SupabaseProfile>();

  if (profile && !error) return profile;

  const fullName =
    (session.user.user_metadata?.name as string | undefined)
    ?? (session.user.user_metadata?.full_name as string | undefined)
    ?? 'Athlete';

  if (__DEV__) {
    console.warn('[auth] creating missing profile row', { userId: session.user.id, error: error?.message });
  }

  const { data: created, error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: session.user.id,
        full_name: fullName,
        free_scan_used: false,
        subscription_tier: 'free',
        is_premium: false,
      },
      { onConflict: 'id' },
    )
    .select('full_name, is_premium, subscription_tier, free_scan_used, scans_today, last_scan_reset_date, last_scan_date, xp, streak, created_at')
    .single<SupabaseProfile>();

  if (upsertError || !created) {
    throw upsertError ?? new Error('Failed to create user profile');
  }
  return created;
}

async function fetchUserFromSession(session: Session): Promise<User> {
  const today = new Date().toISOString().split('T')[0];

  const profile = await ensureUserProfile(session);

  const isNewDay = !profile?.last_scan_reset_date || profile.last_scan_reset_date !== today;
  const scansToday = isNewDay ? 0 : (profile?.scans_today ?? 0);
  const xp = profile?.xp ?? 0;

  const tier = (profile?.subscription_tier as SubscriptionTier | undefined)
    ?? (profile?.is_premium ? 'pro' : 'free');

  let freeScanUsed = profile?.free_scan_used ?? false;
  if (tier === 'free' && !freeScanUsed) {
    const { count } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .not('analysis', 'is', null);
    if ((count ?? 0) > 0) freeScanUsed = true;
  }

  if (__DEV__) {
    console.log('[auth] profile hydrated', {
      userId: session.user.id,
      tier,
      freeScanUsed,
      scansToday,
    });
  }

  return {
    id:            session.user.id,
    email:         session.user.email ?? '',
    name:          profile?.full_name ?? (session.user.user_metadata?.name as string | undefined) ?? 'Athlete',
    subscriptionTier: tier,
    isPremium:     isPaidTier(tier),
    freeScanUsed,
    scansToday,
    maxScansPerDay: maxScansPerDayForTier(tier),
    xp,
    level:         getLevelForXP(xp),
    rank:          getRankForXP(xp),
    streak:        profile?.streak ?? 0,
    lastScanDate:  profile?.last_scan_date ?? undefined,
    joinedAt:      profile?.created_at ?? session.user.created_at ?? new Date().toISOString(),
  };
}

function syncProfileAsync(userId: string, patch: Partial<SupabaseProfile>): void {
  void (async () => {
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      // A failed write means client and DB drift silently — surface it instead of swallowing.
      if (error) captureException(new Error(error.message), { op: 'syncProfile', patch });
    } catch (err) {
      captureException(err, { op: 'syncProfile', patch });
    }
  })();
}

async function applyAuthenticatedUser(
  set: (partial: Partial<AuthState>) => void,
  user: User,
): Promise<void> {
  const previousUserId = useAuthStore.getState().user?.id;
  const isSameUser = previousUserId === user.id;

  if (!isSameUser) {
    await clearLocalUserSession();
  }

  const onboardingCompleted = isSupabaseConfigured
    ? (await loadUserItem<boolean>(user.id, 'onboarding')) === true
    : (await loadItem<boolean>('onboarding')) === true;

  // Keep main tabs hidden until scan history is loaded — avoids EmptyHero flash.
  set({ user, isLoading: true, onboardingCompleted });
  setUserContext(user.id);
  syncConsentLog();
  await hydrateUserStores();
  set({ isAuthenticated: true, isLoading: false });
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authHydrated: false,
  onboardingCompleted: false,

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  hydrate: async () => {
    const updates: Partial<AuthState> = { onboardingCompleted: false };

    try {
      if (isSupabaseConfigured) {
        const session = await getValidatedSession();
        if (session) {
          updates.onboardingCompleted =
            (await loadUserItem<boolean>(session.user.id, 'onboarding')) === true;
          try {
            const user = await fetchUserFromSession(session);
            updates.user = user;
            updates.isAuthenticated = true;
          } catch (err) {
            if (__DEV__) console.warn('[auth] hydrate profile fetch failed', err);
            // Session valid but profile fetch failed — still authenticate
            updates.isAuthenticated = true;
          }
        }
      } else {
        const savedOnboarding = await loadItem<boolean>('onboarding');
        updates.onboardingCompleted = savedOnboarding === true;
        const savedUser = await loadItem<User>('user');
        if (savedUser) {
          updates.user = resetScansIfNewDay(savedUser);
          updates.isAuthenticated = true;
        }
      }

      set(updates as AuthState);

      if (get().user?.id) {
        await hydrateUserStores();
      }
    } finally {
      set({ authHydrated: true });
    }
  },

  syncFromSession: async () => {
    if (!isSupabaseConfigured) return;
    const session = await getValidatedSession();
    if (!session) return;
    const user = await fetchUserFromSession(session);
    await applyAuthenticatedUser(set, user);
  },

  completeOnboarding: () => {
    const userId = get().user?.id;
    if (userId && isSupabaseConfigured) {
      void saveUserItem(userId, 'onboarding', true);
    } else {
      void saveItem('onboarding', true);
    }
    set({ onboardingCompleted: true });
  },

  // ── Email / Password ─────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true });

    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1200));
      const user = resetScansIfNewDay({ ...MOCK_USER, email });
      await persistUser(user);
      await applyAuthenticatedUser(set, user);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw new Error(mapAuthError(error.message));
    }
    if (data.session) {
      const user = await fetchUserFromSession(data.session);
      await applyAuthenticatedUser(set, user);
    } else {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });

    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1500));
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        subscriptionTier: 'free',
        isPremium: false,
        freeScanUsed: false,
        scansToday: 0,
        maxScansPerDay: 1,
        xp: XP_REWARDS.firstScan,
        level: getLevelForXP(XP_REWARDS.firstScan),
        rank: 'Beginner',
        streak: 0,
        joinedAt: new Date().toISOString(),
      };
      await persistUser(newUser);
      await applyAuthenticatedUser(set, newUser);
      return;
    }

    const redirectTo = getEmailAuthRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      if (__DEV__) console.warn('[auth] signUp error:', error.message, error);
      set({ isLoading: false });
      throw new Error(mapAuthError(error.message));
    }

    // Supabase returns an empty identities array when the email already exists
    // (anti-enumeration) — not a new signup waiting for email.
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      set({ isLoading: false });
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    if (data.session) {
      // Email confirmation disabled — immediate session
      await supabase.from('profiles').upsert({ id: data.user!.id, full_name: name });
      const user = await fetchUserFromSession(data.session);
      await applyAuthenticatedUser(set, user);
    } else {
      // Email confirmation required
      set({ isLoading: false });
      throw new Error('CONFIRM_EMAIL');
    }
  },

  // ── Apple Sign In ─────────────────────────────────────────────────────────────

  loginWithApple: async (identityToken, fullName) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) {
      set({ isLoading: false });
      throw new Error(mapAuthError(error.message));
    }

    if (data.session) {
      if (fullName) {
        await supabase.from('profiles').upsert({ id: data.user!.id, full_name: fullName });
      } else {
        await ensureUserProfile(data.session);
      }
      const user = await fetchUserFromSession(data.session);
      await applyAuthenticatedUser(set, user);
    } else {
      set({ isLoading: false });
    }
  },

  // ── Google Sign In ────────────────────────────────────────────────────────────

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      set({ isLoading: false });
      throw new Error(mapAuthError(error.message));
    }

    if (data.session) {
      const meta = data.user?.user_metadata;
      const fullName =
        (meta?.name as string | undefined)
        ?? (meta?.full_name as string | undefined);
      if (fullName) {
        await supabase.from('profiles').upsert({ id: data.user!.id, full_name: fullName });
      } else {
        await ensureUserProfile(data.session);
      }
      const user = await fetchUserFromSession(data.session);
      await applyAuthenticatedUser(set, user);
    } else {
      set({ isLoading: false });
    }
  },

  // ── Session teardown ──────────────────────────────────────────────────────────

  logout: () => {
    void (async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      await persistUser(null);
      await clearLocalUserSession();
      setUserContext(null);
      set({ user: null, isAuthenticated: false, onboardingCompleted: false });
    })();
  },

  deleteAccount: async () => {
    const userId = get().user?.id;
    set({ isLoading: true });

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.rpc('delete_own_account');
        if (error) throw new Error(error.message);
        await supabase.auth.signOut();
      }

      if (userId) {
        await clearUserScopedStorage(userId);
      }
      await persistUser(null);
      await clearLocalUserSession();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        onboardingCompleted: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Gamification (local mock only; Supabase uses server RPCs) ─────────────────

  addXP: (amount) => {
    if (isSupabaseConfigured) return;
    const { user } = get();
    if (!user) return;
    const newXP = user.xp + amount;
    const updated: User = {
      ...user,
      xp: newXP,
      level: getLevelForXP(newXP),
      rank: getRankForXP(newXP),
    };
    void persistUser(updated);
    set({ user: updated });
  },

  incrementStreak: () => {
    if (isSupabaseConfigured) return;
    const { user } = get();
    if (!user) return;
    const today = new Date().toDateString();
    const lastScan = user.lastScanDate ? new Date(user.lastScanDate).toDateString() : null;
    if (lastScan === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = lastScan === yesterday ? user.streak + 1 : 1;
    const updated: User = { ...user, streak: newStreak, lastScanDate: new Date().toISOString() };
    void persistUser(updated);
    set({ user: updated });
  },

  decrementScans: () => {
    if (isSupabaseConfigured) return;
    const { user } = get();
    if (!user) return;
    const updated: User = {
      ...user,
      scansToday: user.scansToday + 1,
      freeScanUsed: user.subscriptionTier === 'free' ? true : user.freeScanUsed,
    };
    void persistUser(updated);
    set({ user: updated });
  },

  markFreeScanUsed: async () => {
    const { user } = get();
    if (!user || user.subscriptionTier !== 'free') return;
    const updated: User = { ...user, freeScanUsed: true };
    set({ user: updated });
    await persistUser(updated);
    await setLocalFreeScanConsumed(user.id);
  },

  upgradeToPremium: async (planId: 'weekly' | 'monthly' | 'max' = 'monthly') => {
    const { user } = get();
    if (!user) throw new Error('You must be signed in to purchase Premium.');

    const { useSubscriptionStore } = await import('./useSubscriptionStore');
    await useSubscriptionStore.getState().subscribe(planId);
  },
}));
