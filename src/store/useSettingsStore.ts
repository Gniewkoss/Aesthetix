import { create } from 'zustand';
import { loadUserItem, saveUserItem } from './storage';
import { useAuthStore } from './useAuthStore';

export type AppearanceMode = 'system' | 'light' | 'dark';

export interface NotificationSettings {
  scanReminders: boolean;
  streakReminders: boolean;
  progressUpdates: boolean;
}

export interface UserSettings {
  appearance: AppearanceMode;
  notifications: NotificationSettings;
  lastShareBonusDate?: string;
  hasSharedProgress?: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  appearance: 'system',
  notifications: {
    scanReminders: true,
    streakReminders: true,
    progressUpdates: true,
  },
};

interface SettingsState {
  settings: UserSettings;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  setNotification: (key: keyof NotificationSettings, value: boolean) => void;
  setAppearance: (mode: AppearanceMode) => void;
  markShareBonusClaimed: () => void;
  markSharedProgress: () => void;
  reset: () => void;
}

function persistSettings(settings: UserSettings): void {
  const userId = useAuthStore.getState().user?.id;
  if (userId) void saveUserItem(userId, 'settings', settings);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async (userId) => {
    const stored = await loadUserItem<UserSettings>(userId, 'settings');
    set({
      settings: stored
        ? {
            ...DEFAULT_SETTINGS,
            ...stored,
            appearance: stored.appearance ?? DEFAULT_SETTINGS.appearance,
            notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
          }
        : DEFAULT_SETTINGS,
      hydrated: true,
    });
  },

  setNotification: (key, value) => {
    const updated: UserSettings = {
      ...get().settings,
      notifications: { ...get().settings.notifications, [key]: value },
    };
    set({ settings: updated });
    persistSettings(updated);
  },

  setAppearance: (mode) => {
    const updated: UserSettings = { ...get().settings, appearance: mode };
    set({ settings: updated });
    persistSettings(updated);
  },

  markShareBonusClaimed: () => {
    const today = new Date().toISOString().split('T')[0];
    const updated: UserSettings = { ...get().settings, lastShareBonusDate: today };
    set({ settings: updated });
    persistSettings(updated);
  },

  markSharedProgress: () => {
    const updated: UserSettings = { ...get().settings, hasSharedProgress: true };
    set({ settings: updated });
    persistSettings(updated);
  },

  reset: () => set({ settings: DEFAULT_SETTINGS, hydrated: false }),
}));
