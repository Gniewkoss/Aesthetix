import { create } from 'zustand';
import { ProgressEntry } from '../types';

interface ProgressState {
  entries: ProgressEntry[];
  addEntry: (entry: ProgressEntry) => void;
  loadMockProgress: () => void;
}

const MOCK_PROGRESS: ProgressEntry[] = [
  { date: '2026-02-15', overallScore: 61, bodyFat: 20, symmetryScore: 65, vTaperScore: 68 },
  { date: '2026-03-01', overallScore: 64, bodyFat: 19, symmetryScore: 67, vTaperScore: 70 },
  { date: '2026-03-15', overallScore: 66, bodyFat: 18, symmetryScore: 69, vTaperScore: 72 },
  { date: '2026-04-01', overallScore: 68, bodyFat: 17, symmetryScore: 71, vTaperScore: 74 },
  { date: '2026-04-15', overallScore: 70, bodyFat: 16, symmetryScore: 72, vTaperScore: 76 },
  { date: '2026-05-01', overallScore: 73, bodyFat: 15, symmetryScore: 74, vTaperScore: 79 },
];

export const useProgressStore = create<ProgressState>((set) => ({
  entries: [],

  addEntry: (entry: ProgressEntry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  loadMockProgress: () => set({ entries: MOCK_PROGRESS }),
}));
