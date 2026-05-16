import { create } from 'zustand';
import { PhysiqueAnalysis } from '../types';
import { MOCK_HISTORY } from '../api/mock';
import { analyzePhysique } from '../api/openai';

interface AnalysisState {
  currentAnalysis: PhysiqueAnalysis | null;
  history: PhysiqueAnalysis[];
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStep: string;
  error: string | null;

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

  runAnalysis: async (imageUris: string[]) => {
    set({ isAnalyzing: true, analysisProgress: 0, error: null, analysisStep: 'Initializing...' });

    // Progress callback driven by real pipeline stages (no fake timer)
    const onProgress = (step: string, progress: number) => {
      set({ analysisStep: step, analysisProgress: progress });
    };

    try {
      const analysis = await analyzePhysique(imageUris, onProgress);

      set({
        currentAnalysis: analysis,
        history: [analysis, ...get().history],
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

  loadHistory: () => {
    set({ history: MOCK_HISTORY });
  },

  clearError: () => set({ error: null }),

  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => set({ currentAnalysis: analysis }),
}));
