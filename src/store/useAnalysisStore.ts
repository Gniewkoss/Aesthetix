import { create } from 'zustand';
import { PhysiqueAnalysis } from '../types';
import { analyzePhysique } from '../api/openai';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { loadItem, loadUserItem, removeItem, removeUserItem, saveItem, saveUserItem } from './storage';

const MAX_HISTORY = 50;

interface AnalysisState {
  currentAnalysis: PhysiqueAnalysis | null;
  history: PhysiqueAnalysis[];
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStep: string;
  error: string | null;
  errorCode: string | null;

  hydrate: () => Promise<void>;
  runAnalysis: (imageUris: string[]) => Promise<PhysiqueAnalysis | null>;
  loadHistory: () => void;
  clearError: () => void;
  isRateLimited: () => boolean;
  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  history: [],
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: '',
  error: null,
  errorCode: null,

  hydrate: async () => {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const userId = session.user.id;
        const { data: rows } = await supabase
          .from('scans')
          .select('analysis')
          .eq('user_id', userId)
          .not('analysis', 'is', null)
          .order('created_at', { ascending: false })
          .limit(MAX_HISTORY);

        if (rows && rows.length > 0) {
          const history = rows.map((r) => r.analysis as PhysiqueAnalysis);
          void saveUserItem(userId, 'history', history);
          void removeItem('history');
          set({ history, currentAnalysis: history[0] });
          return;
        }

        // Logged-in user with no scans — do not reuse another account's local cache
        await removeUserItem(userId, 'history');
        await removeItem('history');
        set({ history: [], currentAnalysis: null });
        return;
      }
    }

    // Mock / offline mode only
    const saved = await loadItem<PhysiqueAnalysis[]>('history');
    if (saved && saved.length > 0) {
      set({ history: saved, currentAnalysis: saved[0] });
    } else {
      set({ history: [], currentAnalysis: null });
    }
  },

  runAnalysis: async (imageUris: string[]) => {
    set({ isAnalyzing: true, analysisProgress: 0, error: null, errorCode: null, analysisStep: 'Initializing...' });

    const onProgress = (step: string, progress: number) => {
      set({ analysisStep: step, analysisProgress: progress });
    };

    try {
      const analysis = await analyzePhysique(imageUris, onProgress);
      // history is newest-first; cap at MAX_HISTORY
      const newHistory = [analysis, ...get().history].slice(0, MAX_HISTORY);

      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          void saveUserItem(session.user.id, 'history', newHistory);
        } else {
          void saveItem('history', newHistory);
        }
      } else {
        void saveItem('history', newHistory);
      }

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
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as Error & { code?: string }).code)
          : null;
      set({ isAnalyzing: false, error: message, errorCode: code, analysisProgress: 0, analysisStep: '' });
      return null;
    }
  },

  // No-op: history is populated during hydration and after each runAnalysis.
  loadHistory: () => {},

  clearError: () => set({ error: null, errorCode: null }),

  isRateLimited: () => {
    const { errorCode, error } = get();
    return errorCode === 'RATE_LIMITED' || (error?.toLowerCase().includes('premium') ?? false);
  },

  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => set({ currentAnalysis: analysis }),
}));
