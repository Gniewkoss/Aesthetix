import { useAnalysisStore } from './useAnalysisStore';
import { useProgressStore } from './useProgressStore';
import { useSettingsStore } from './useSettingsStore';
import { useSubscriptionStore } from './useSubscriptionStore';
import { clearPurchasesUser } from '../subscription/purchases';
import { clearUserLocalData } from './storage';
import { useAuthStore } from './useAuthStore';
import { cancelAllAesthetixNotifications } from '../lib/pushNotifications';

/** Wipe in-memory stores and legacy local cache (used on logout / account switch). */
export async function clearLocalUserSession(): Promise<void> {
  await cancelAllAesthetixNotifications();
  await clearPurchasesUser();
  await clearUserLocalData();
  useAnalysisStore.setState({
    currentAnalysis: null,
    history: [],
    historyHydrated: false,
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
  if (userId) {
    const { syncPurchasesUser } = await import('../subscription/purchases');
    await syncPurchasesUser(userId);
  }
  await Promise.all([
    useAnalysisStore.getState().hydrate(),
    useProgressStore.getState().hydrate(),
    userId ? useSettingsStore.getState().hydrate(userId) : Promise.resolve(),
    userId ? useSubscriptionStore.getState().hydrate(userId) : Promise.resolve(),
  ]);
}
