import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? webClientId;
const androidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? webClientId;

/** True when running inside Expo Go (bundle id is host.exp.Exponent, not com.physiquemax.ai). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isGoogleAuthEnabled(): boolean {
  if (!webClientId) return false;
  if (isExpoGo()) return true;
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

/**
 * Client IDs for expo-auth-session.
 * Expo Go on iOS needs a dedicated iOS OAuth client (bundle ID host.exp.Exponent), not the Web client.
 */
export function getGoogleRequestClientIds() {
  return getGoogleAuthConfig();
}

/** Reversed client ID URL scheme shown in Google Cloud → iOS client details. */
export function getIosGoogleRedirectScheme(iosClientId: string): string {
  const id = iosClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${id}`;
}

/**
 * Redirect URI must match the iOS OAuth client in Google Cloud.
 * Default expo-auth-session uses host.exp.Exponent:/oauthredirect → invalid_request.
 */
export function getGoogleOAuthRedirectUri(): string {
  const config = getGoogleAuthConfig();

  if (Platform.OS === 'ios') {
    return `${getIosGoogleRedirectScheme(config.iosClientId)}:/oauth2redirect`;
  }

  if (Platform.OS === 'android') {
    return makeRedirectUri({
      scheme: 'physiquemax',
      path: 'oauth/google',
      preferLocalhost: false,
    });
  }

  return makeRedirectUri({
    scheme: 'physiquemax',
    path: 'oauth/google',
    preferLocalhost: false,
  });
}
