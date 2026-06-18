import { Platform } from 'react-native';
import { isExpoGo } from './runtime';
import {
  getNativeAppId,
  getTikTokAccessToken,
  getTikTokAppId,
  isTikTokConfigured,
} from './tiktokConfig';

let initialized = false;

async function requestAttIfNeeded(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    await requestTrackingPermissionsAsync();
  } catch (err) {
    if (__DEV__) console.warn('[tiktok] ATT request skipped:', err);
  }
}

/** TikTok Ads SDK — attribution only (install + app open). No custom events. */
export async function initTikTok(): Promise<void> {
  if (isExpoGo || initialized || !isTikTokConfigured()) return;

  try {
    const TiktokSDK = (await import('@layers/expo-tiktok-business')).default;
    await TiktokSDK.initialize(getNativeAppId(), getTikTokAppId(), {
      accessToken: getTikTokAccessToken(),
      debugMode: __DEV__,
      autoTrackAppLifecycle: true,
      autoTrackRouteChanges: false,
    });
    initialized = true;
    await requestAttIfNeeded();
  } catch (err) {
    if (__DEV__) console.warn('[tiktok] init skipped:', err);
  }
}
