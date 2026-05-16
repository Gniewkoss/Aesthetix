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

const ANALYSIS_STEPS = [
  'Scanning physique...',
  'Analyzing muscle groups...',
  'Calculating symmetry...',
  'Evaluating proportions...',
  'Detecting weak points...',
  'Generating recommendations...',
  'Computing AI predictions...',
  'Finalizing report...',
];

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  history: [],
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: '',
  error: null,

  runAnalysis: async (imageUris: string[]) => {
    set({ isAnalyzing: true, analysisProgress: 0, error: null, analysisStep: ANALYSIS_STEPS[0] });

    // Simulate step-by-step progress updates
    const totalDuration = 7000;
    const stepInterval = totalDuration / ANALYSIS_STEPS.length;
    let stepIndex = 0;

    const progressTimer = setInterval(() => {
      stepIndex++;
      if (stepIndex < ANALYSIS_STEPS.length) {
        set({
          analysisStep: ANALYSIS_STEPS[stepIndex],
          analysisProgress: (stepIndex / ANALYSIS_STEPS.length) * 95,
        });
      }
    }, stepInterval);

    try {
      const analysis = await analyzePhysique(imageUris);
      clearInterval(progressTimer);

      set({
        currentAnalysis: analysis,
        history: [analysis, ...get().history],
        isAnalyzing: false,
        analysisProgress: 100,
        analysisStep: 'Complete!',
      });

      return analysis;
    } catch (err) {
      clearInterval(progressTimer);
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      set({ isAnalyzing: false, error: message, analysisProgress: 0 });
      return null;
    }
  },

  loadHistory: () => {
    set({ history: MOCK_HISTORY });
  },

  clearError: () => set({ error: null }),

  setCurrentAnalysis: (analysis: PhysiqueAnalysis) => set({ currentAnalysis: analysis }),
}));
