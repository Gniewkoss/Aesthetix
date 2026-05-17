import { create } from 'zustand';
import { PhysiqueAnalysis } from '../types';
import { analyzePhysique } from '../api/openai';
import { loadItem, saveItem } from './storage';

const MAX_HISTORY = 50;

interface AnalysisState {
  currentAnalysis: PhysiqueAnalysis | null;
  history: PhysiqueAnalysis[];
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStep: string;
  error: string | null;

  hydrate: () => Promise<void>;
  runAnalysis: (imageUris: string[]) => Promise<PhysiqueAnalysis | null>;
  loadHistory: () => void;
  clearError: () => void;
  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  history: [],
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: '',
  error: null,

  hydrate: async () => {
    const saved = await loadItem<PhysiqueAnalysis[]>('history');
    if (saved && saved.length > 0) {
      // history is stored newest-first; index 0 is the most recent scan
      set({ history: saved, currentAnalysis: saved[0] });
    }
  },

  runAnalysis: async (imageUris: string[]) => {
    set({ isAnalyzing: true, analysisProgress: 0, error: null, analysisStep: 'Initializing...' });

    const onProgress = (step: string, progress: number) => {
      set({ analysisStep: step, analysisProgress: progress });
    };

    try {
      const analysis = await analyzePhysique(imageUris, onProgress);
      // newest first; cap at MAX_HISTORY
      const newHistory = [analysis, ...get().history].slice(0, MAX_HISTORY);

      await saveItem('history', newHistory);
      set({
        currentAnalysis: analysis,
        history: newHistory,
        isAnalyzing: false,
        analysisProgress: 100,
        analysisStep: 'Complete!',
      });

      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      set({ isAnalyzing: false, error: message, analysisProgress: 0, analysisStep: '' });
      return null;
    }
  },

  // No-op: history is populated during hydration and after each runAnalysis.
  // Kept for call-site compatibility.
  loadHistory: () => {},

  clearError: () => set({ error: null }),

  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => set({ currentAnalysis: analysis }),
}));
