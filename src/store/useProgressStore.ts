import { create } from 'zustand';
import { PhysiqueAnalysis, ProgressEntry } from '../types';
import { isSupabaseConfigured, supabase } from '../api/supabase';
import { loadItem, loadUserItem, removeItem, removeUserItem, saveItem, saveUserItem } from './storage';
import { progressEntryFromAnalysis, progressEntriesFromHistory } from '../lib/progressFromAnalysis';

const MAX_ENTRIES = 50;

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
        const userId = session.user.id;
        const { data: rows } = await supabase
          .from('scans')
          .select('analysis, created_at')
          .eq('user_id', userId)
          .not('analysis', 'is', null)
          .order('created_at', { ascending: true })
          .limit(MAX_ENTRIES);

        if (rows && rows.length > 0) {
          const entries = rows.map((r) =>
            progressEntryFromAnalysis(r.analysis as PhysiqueAnalysis, r.created_at as string),
          );
          void saveUserItem(userId, 'progress', entries);
          await removeItem('progress');
          set({ entries });
          return;
        }

        const saved = await loadUserItem<ProgressEntry[]>(userId, 'progress');
        await removeItem('progress');
        set({ entries: saved ?? [] });
        return;
      }
    }

    const saved = await loadItem<ProgressEntry[]>('progress');
    if (saved && saved.length > 0) {
      set({ entries: saved });
      return;
    }

    const history = await loadItem<PhysiqueAnalysis[]>('history');
    if (history && history.length > 0) {
      set({ entries: progressEntriesFromHistory(history) });
      return;
    }

    set({ entries: [] });
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
