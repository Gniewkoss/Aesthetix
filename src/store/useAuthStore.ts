import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { User, PhysiqueRank } from '../types';
import { RANKS, RANK_CONFIG, XP_REWARDS } from '../constants';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { getEmailAuthRedirectUrl } from '../auth/authRedirect';
import { mapAuthError } from '../auth/authErrors';
import { loadItem, saveItem, removeItem } from './storage';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;

  hydrate: () => Promise<void>;
  completeOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string, fullName?: string | null) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  decrementScans: () => void;
  upgradeToPremium: () => void;
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
  email: 'user@physiquemax.ai',
  name: 'Alex',
  isPremium: false,
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
  scans_today?: number;
  last_scan_reset_date?: string | null;
  last_scan_date?: string | null;
  xp?: number;
  streak?: number;
  created_at?: string;
}

async function fetchUserFromSession(session: Session): Promise<User> {
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_premium, scans_today, last_scan_reset_date, last_scan_date, xp, streak, created_at')
    .eq('id', session.user.id)
    .single<SupabaseProfile>();

  const isNewDay = !profile?.last_scan_reset_date || profile.last_scan_reset_date !== today;
  const scansToday = isNewDay ? 0 : (profile?.scans_today ?? 0);
  const xp = profile?.xp ?? 0;

  return {
    id:            session.user.id,
    email:         session.user.email ?? '',
    name:          profile?.full_name ?? (session.user.user_metadata?.name as string | undefined) ?? 'Athlete',
    isPremium:     profile?.is_premium ?? false,
    scansToday,
    maxScansPerDay: 1,
    xp,
    level:         getLevelForXP(xp),
    rank:          getRankForXP(xp),
    streak:        profile?.streak ?? 0,
    lastScanDate:  profile?.last_scan_date ?? undefined,
    joinedAt:      profile?.created_at ?? session.user.created_at ?? new Date().toISOString(),
  };
}

function syncProfileAsync(userId: string, patch: Partial<SupabaseProfile>): void {
  void supabase.from('profiles').update(patch).eq('id', userId);
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  onboardingCompleted: false,

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  hydrate: async () => {
    const savedOnboarding = await loadItem<boolean>('onboarding');
    const updates: Partial<AuthState> = { onboardingCompleted: savedOnboarding === true };

    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const user = await fetchUserFromSession(session);
          updates.user = user;
          updates.isAuthenticated = true;
        } catch {
          // session valid but profile fetch failed — still authenticate
          updates.isAuthenticated = true;
        }
      }
    } else {
      const savedUser = await loadItem<User>('user');
      if (savedUser) {
        updates.user = resetScansIfNewDay(savedUser);
        updates.isAuthenticated = true;
      }
    }

    set(updates as AuthState);
  },

  completeOnboarding: () => {
    void saveItem('onboarding', true);
    set({ onboardingCompleted: true });
  },

  // ── Email / Password ─────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true });

    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1200));
      const user = resetScansIfNewDay({ ...MOCK_USER, email });
      await persistUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw new Error(mapAuthError(error.message));
    }
    if (data.session) {
      const user = await fetchUserFromSession(data.session);
      set({ user, isAuthenticated: true, isLoading: false });
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
        isPremium: false,
        scansToday: 0,
        maxScansPerDay: 1,
        xp: XP_REWARDS.firstScan,
        level: getLevelForXP(XP_REWARDS.firstScan),
        rank: 'Beginner',
        streak: 0,
        joinedAt: new Date().toISOString(),
      };
      await persistUser(newUser);
      set({ user: newUser, isAuthenticated: true, isLoading: false });
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
      set({ user, isAuthenticated: true, isLoading: false });
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
      }
      const user = await fetchUserFromSession(data.session);
      set({ user, isAuthenticated: true, isLoading: false });
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
      const user = await fetchUserFromSession(data.session);
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  // ── Session teardown ──────────────────────────────────────────────────────────

  logout: () => {
    if (isSupabaseConfigured) {
      void supabase.auth.signOut();
    }
    void persistUser(null);
    set({ user: null, isAuthenticated: false });
  },

  // ── Gamification mutations (client-authoritative; synced to DB async) ─────────

  addXP: (amount) => {
    const { user } = get();
    if (!user) return;
    const newXP = user.xp + amount;
    const updated: User = {
      ...user,
      xp: newXP,
      level: getLevelForXP(newXP),
      rank: getRankForXP(newXP),
    };
    if (!isSupabaseConfigured) void persistUser(updated);
    else syncProfileAsync(user.id, { xp: newXP });
    set({ user: updated });
  },

  incrementStreak: () => {
    const { user } = get();
    if (!user) return;
    const today = new Date().toDateString();
    const lastScan = user.lastScanDate ? new Date(user.lastScanDate).toDateString() : null;
    if (lastScan === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = lastScan === yesterday ? user.streak + 1 : 1;
    const updated: User = { ...user, streak: newStreak, lastScanDate: new Date().toISOString() };
    if (!isSupabaseConfigured) void persistUser(updated);
    else syncProfileAsync(user.id, { streak: newStreak, last_scan_date: updated.lastScanDate });
    set({ user: updated });
  },

  // scansToday is also incremented server-side by the Edge Function.
  // This client increment keeps the UI in sync immediately.
  decrementScans: () => {
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, scansToday: user.scansToday + 1 };
    if (!isSupabaseConfigured) void persistUser(updated);
    set({ user: updated });
  },

  upgradeToPremium: () => {
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, isPremium: true };
    if (!isSupabaseConfigured) void persistUser(updated);
    else syncProfileAsync(user.id, { is_premium: true });
    set({ user: updated });
  },
}));
