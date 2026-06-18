import { Platform } from 'react-native';
import type { TiktokPlatformValue } from '@layers/expo-tiktok-business';

const APP_ID = 'ai.aesthetix.app';

function envTrim(key: string): string | null {
  const value = process.env[key]?.trim();
  return value || null;
}

function platformAppId(): string | null {
  if (Platform.OS === 'ios') {
    return envTrim('EXPO_PUBLIC_TIKTOK_APP_ID_IOS') ?? envTrim('EXPO_PUBLIC_TIKTOK_APP_ID');
  }
  if (Platform.OS === 'android') {
    return envTrim('EXPO_PUBLIC_TIKTOK_APP_ID_ANDROID') ?? envTrim('EXPO_PUBLIC_TIKTOK_APP_ID');
  }
  return envTrim('EXPO_PUBLIC_TIKTOK_APP_ID');
}

function platformAccessToken(): string | null {
  if (Platform.OS === 'ios') {
    return envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN_IOS') ?? envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN');
  }
  if (Platform.OS === 'android') {
    return envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN_ANDROID') ?? envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN');
  }
  return envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN');
}

/** True when TikTok credentials exist for the current platform. */
export function isTikTokConfigured(): boolean {
  return !!(platformAppId() && platformAccessToken());
}

export function getNativeAppId(): string | TiktokPlatformValue {
  return { ios: APP_ID, android: APP_ID };
}

export function getTikTokAppId(): string | TiktokPlatformValue {
  const ios = envTrim('EXPO_PUBLIC_TIKTOK_APP_ID_IOS') ?? envTrim('EXPO_PUBLIC_TIKTOK_APP_ID');
  const android = envTrim('EXPO_PUBLIC_TIKTOK_APP_ID_ANDROID') ?? envTrim('EXPO_PUBLIC_TIKTOK_APP_ID');
  if (ios && android && ios === android) return ios;
  return { ios: ios ?? undefined, android: android ?? undefined };
}

export function getTikTokAccessToken(): string | TiktokPlatformValue {
  const ios = envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN_IOS') ?? envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN');
  const android = envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN_ANDROID') ?? envTrim('EXPO_PUBLIC_TIKTOK_ACCESS_TOKEN');
  if (ios && android && ios === android) return ios;
  return { ios: ios ?? undefined, android: android ?? undefined };
}
