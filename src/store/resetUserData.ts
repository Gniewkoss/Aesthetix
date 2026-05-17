import { useAnalysisStore } from './useAnalysisStore';
import { useProgressStore } from './useProgressStore';
import { clearUserLocalData } from './storage';

/** Wipe in-memory stores and legacy local cache (used on logout / account switch). */
export async function clearLocalUserSession(): Promise<void> {
  await clearUserLocalData();
  useAnalysisStore.setState({
    currentAnalysis: null,
    history: [],
    isAnalyzing: false,
    analysisProgress: 0,
    analysisStep: '',
    error: null,
  });
  useProgressStore.setState({ entries: [] });
}

export async function hydrateUserStores(): Promise<void> {
  await Promise.all([
    useAnalysisStore.getState().hydrate(),
    useProgressStore.getState().hydrate(),
  ]);
}
