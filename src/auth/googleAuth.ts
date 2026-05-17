import { Platform } from 'react-native';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? webClientId;
const androidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? webClientId;

export function isGoogleAuthEnabled(): boolean {
  if (!webClientId) return false;
  if (Platform.OS === 'ios') return Boolean(iosClientId);
  if (Platform.OS === 'android') return Boolean(androidClientId);
  return true;
}

export function getGoogleAuthConfig() {
  if (!isGoogleAuthEnabled()) {
    throw new Error('Google auth is not configured');
  }
  return {
    webClientId: webClientId!,
    iosClientId: iosClientId!,
    androidClientId: androidClientId!,
  };
}
