import { create } from 'zustand';
import { ProgressEntry } from '../types';
import { isSupabaseConfigured, supabase } from '../api/supabase';
import { loadItem, loadUserItem, removeItem, removeUserItem, saveItem, saveUserItem } from './storage';

interface ProgressState {
  entries: ProgressEntry[];
  hydrate: () => Promise<void>;
  addEntry: (entry: ProgressEntry) => void;
  loadMockProgress: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],

  hydrate: async () => {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const saved = await loadUserItem<ProgressEntry[]>(session.user.id, 'progress');
        await removeItem('progress');
        set({ entries: saved ?? [] });
        return;
      }
    }

    const saved = await loadItem<ProgressEntry[]>('progress');
    set({ entries: saved ?? [] });
  },

  addEntry: (entry: ProgressEntry) => {
    const entries = [...get().entries, entry];
    if (isSupabaseConfigured) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) void saveUserItem(session.user.id, 'progress', entries);
        else void saveItem('progress', entries);
      });
    } else {
      void saveItem('progress', entries);
    }
    set({ entries });
  },

  // No-op: kept for call-site compatibility during Phase 1 transition.
  loadMockProgress: () => {},
}));
