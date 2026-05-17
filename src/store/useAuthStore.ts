import { create } from 'zustand';
import { User, PhysiqueRank } from '../types';
import { RANKS, RANK_CONFIG, XP_REWARDS } from '../constants';
import { loadItem, saveItem, removeItem } from './storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;

  hydrate: () => Promise<void>;
  completeOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  decrementScans: () => void;
  upgradeToPremium: () => void;
}

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

function resetScansIfNewDay(user: User): User {
  const today = new Date().toDateString();
  const lastScan = user.lastScanDate ? new Date(user.lastScanDate).toDateString() : null;
  if (lastScan !== today) {
    return { ...user, scansToday: 0 };
  }
  return user;
}

async function persistUser(user: User | null): Promise<void> {
  if (user) {
    await saveItem('user', user);
  } else {
    await removeItem('user');
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  onboardingCompleted: false,

  hydrate: async () => {
    const [savedUser, savedOnboarding] = await Promise.all([
      loadItem<User>('user'),
      loadItem<boolean>('onboarding'),
    ]);
    const updates: Partial<AuthState> = {
      onboardingCompleted: savedOnboarding === true,
    };
    if (savedUser) {
      updates.user = resetScansIfNewDay(savedUser);
      updates.isAuthenticated = true;
    }
    set(updates as AuthState);
  },

  completeOnboarding: () => {
    void saveItem('onboarding', true);
    set({ onboardingCompleted: true });
  },

  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1200));
    const user = resetScansIfNewDay({ ...MOCK_USER, email });
    await persistUser(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (name: string, email: string, _password: string) => {
    set({ isLoading: true });
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
  },

  logout: () => {
    void persistUser(null);
    set({ user: null, isAuthenticated: false });
  },

  addXP: (amount: number) => {
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
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, scansToday: user.scansToday + 1 };
    void persistUser(updated);
    set({ user: updated });
  },

  upgradeToPremium: () => {
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, isPremium: true };
    void persistUser(updated);
    set({ user: updated });
  },
}));
