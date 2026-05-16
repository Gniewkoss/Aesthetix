import { create } from 'zustand';
import { User, PhysiqueRank } from '../types';
import { RANKS, RANK_CONFIG, XP_REWARDS } from '../constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

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

function getLevelForXP(xp: number): number {
  return Math.floor(xp / 250) + 1;
}

const MOCK_USER: User = {
  id: 'user_001',
  email: 'user@physiquemax.ai',
  name: 'Alex',
  isPremium: false,
  scansToday: 0,
  maxScansPerDay: 1,
  xp: 1200,
  level: 5,
  rank: 'Bronze',
  streak: 7,
  lastScanDate: undefined,
  joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1200));
    set({
      user: { ...MOCK_USER, email },
      isAuthenticated: true,
      isLoading: false,
    });
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
      level: 1,
      rank: 'Beginner',
      streak: 0,
      joinedAt: new Date().toISOString(),
    };
    set({ user: newUser, isAuthenticated: true, isLoading: false });
  },

  logout: () => set({ user: null, isAuthenticated: false }),

  addXP: (amount: number) => {
    const { user } = get();
    if (!user) return;
    const newXP = user.xp + amount;
    set({
      user: {
        ...user,
        xp: newXP,
        level: getLevelForXP(newXP),
        rank: getRankForXP(newXP),
      },
    });
  },

  incrementStreak: () => {
    const { user } = get();
    if (!user) return;
    const today = new Date().toDateString();
    const lastScan = user.lastScanDate ? new Date(user.lastScanDate).toDateString() : null;
    if (lastScan === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = lastScan === yesterday ? user.streak + 1 : 1;
    set({ user: { ...user, streak: newStreak, lastScanDate: new Date().toISOString() } });
  },

  decrementScans: () => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, scansToday: user.scansToday + 1 } });
  },

  upgradeToPremium: () => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, isPremium: true, maxScansPerDay: 999 } });
  },
}));
