import { Platform } from 'react-native';
import { isSupabaseConfigured } from '../api/supabase';
import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_PACKAGE_IDS,
} from './storeCatalog';

export { REVENUECAT_ENTITLEMENT_ID, REVENUECAT_PACKAGE_IDS };

/**
 * Real App Store / Play billing via RevenueCat.
 * Leave false until store products exist and react-native-purchases is installed.
 */
export const IAP_ENABLED = process.env.EXPO_PUBLIC_IAP_ENABLED === 'true';

/** @deprecated Use REVENUECAT_PACKAGE_IDS from storeCatalog */
export const PLAN_TO_RC_PACKAGE_ID = REVENUECAT_PACKAGE_IDS;

/**
 * Local-only subscription simulation (no store). Used when IAP is off, or when running
 * without Supabase / with EXPO_PUBLIC_USE_MOCK_API=true.
 */
export function usesLocalSubscriptionMock(): boolean {
  if (IAP_ENABLED) return false;
  if (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') return true;
  return !isSupabaseConfigured;
}

export function getRevenueCatApiKey(): string | null {
  if (!IAP_ENABLED) return null;
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  return key?.trim() || null;
}
