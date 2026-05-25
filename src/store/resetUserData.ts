import { useAnalysisStore } from './useAnalysisStore';
import { useProgressStore } from './useProgressStore';
import { useSettingsStore } from './useSettingsStore';
import { useSubscriptionStore } from './useSubscriptionStore';
import { clearUserLocalData } from './storage';
import { useAuthStore } from './useAuthStore';

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
  useSettingsStore.getState().reset();
  useSubscriptionStore.getState().reset();
}

export async function hydrateUserStores(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  await Promise.all([
    useAnalysisStore.getState().hydrate(),
    useProgressStore.getState().hydrate(),
    userId ? useSettingsStore.getState().hydrate(userId) : Promise.resolve(),
    userId ? useSubscriptionStore.getState().hydrate(userId) : Promise.resolve(),
  ]);
}
