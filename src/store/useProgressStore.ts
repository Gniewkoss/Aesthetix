import { create } from 'zustand';
import { ProgressEntry } from '../types';
import { loadItem, saveItem } from './storage';

interface ProgressState {
  entries: ProgressEntry[];
  hydrate: () => Promise<void>;
  addEntry: (entry: ProgressEntry) => void;
  loadMockProgress: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],

  hydrate: async () => {
    const saved = await loadItem<ProgressEntry[]>('progress');
    if (saved && saved.length > 0) {
      set({ entries: saved });
    }
  },

  addEntry: (entry: ProgressEntry) => {
    const entries = [...get().entries, entry];
    void saveItem('progress', entries);
    set({ entries });
  },

  // No-op: kept for call-site compatibility during Phase 1 transition.
  loadMockProgress: () => {},
}));
