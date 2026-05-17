import { create } from 'zustand';
import { PhysiqueAnalysis } from '../types';
import { analyzePhysique } from '../api/openai';
import { supabase, isSupabaseConfigured } from '../api/supabase';
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
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: rows } = await supabase
          .from('scans')
          .select('analysis')
          .eq('user_id', session.user.id)
          .not('analysis', 'is', null)
          .order('created_at', { ascending: false })
          .limit(MAX_HISTORY);

        if (rows && rows.length > 0) {
          const history = rows.map((r) => r.analysis as PhysiqueAnalysis);
          // Update local cache so the app works offline
          void saveItem('history', history);
          set({ history, currentAnalysis: history[0] });
          return;
        }
      }
    }

    // Fall back to local AsyncStorage cache (Phase 1 behavior)
    const saved = await loadItem<PhysiqueAnalysis[]>('history');
    if (saved && saved.length > 0) {
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
      // history is newest-first; cap at MAX_HISTORY
      const newHistory = [analysis, ...get().history].slice(0, MAX_HISTORY);

      // Always persist locally for offline access
      void saveItem('history', newHistory);

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
  loadHistory: () => {},

  clearError: () => set({ error: null }),

  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => set({ currentAnalysis: analysis }),
}));
