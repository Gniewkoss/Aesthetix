// Expo config — use `npx expo prebuild` for native projects (Sentry + SSL pinning).
// Env at prebuild time: EXPO_PUBLIC_SSL_PINNING_ENABLED, SENTRY_ORG, SENTRY_PROJECT.

const sslPinningEnabled = process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'true';
/** Personal Team cannot use Sign in with Apple — disable for local device builds. */
const appleSignInEnabled = process.env.EXPO_PUBLIC_DISABLE_APPLE_SIGNIN !== 'true';

/** Google OAuth redirect on iOS — reversed client ID from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. */
function getGoogleIosUrlScheme() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) return null;
  const id = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${id}`;
}

const googleIosUrlScheme = getGoogleIosUrlScheme();
const iosUrlSchemes = ['aesthetix', 'ai.aesthetix.app'];
if (googleIosUrlScheme) iosUrlSchemes.push(googleIosUrlScheme);

const tiktokAppIds = {
  ios: process.env.EXPO_PUBLIC_TIKTOK_APP_ID_IOS?.trim() || process.env.EXPO_PUBLIC_TIKTOK_APP_ID?.trim(),
  android:
    process.env.EXPO_PUBLIC_TIKTOK_APP_ID_ANDROID?.trim() || process.env.EXPO_PUBLIC_TIKTOK_APP_ID?.trim(),
};

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Aesthetix',
  slug: 'aesthetix-ai',
  version: '1.0.1',
  orientation: 'portrait',
  scheme: 'aesthetix',
  backgroundColor: '#0A0B0D',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ai.aesthetix.app',
    backgroundColor: '#0A0B0D',
    usesAppleSignIn: appleSignInEnabled,
    infoPlist: {
      NSCameraUsageDescription:
        'Aesthetix needs camera access to analyze your physique.',
      NSPhotoLibraryUsageDescription:
        'Aesthetix needs photo library access to analyze your physique.',
      NSUserNotificationsUsageDescription:
        'Aesthetix sends scan reminders, streak alerts, and weekly progress updates.',
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: iosUrlSchemes,
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'ai.aesthetix.app',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-camera',
    'expo-image-picker',
    ...(appleSignInEnabled ? ['expo-apple-authentication'] : []),
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    ],
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#C7F940',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
    ['./plugins/withSslPinning', { enabled: sslPinningEnabled }],
    ['./plugins/withOptionalAppleSignIn', { enabled: appleSignInEnabled }],
    [
      './plugins/withTikTokBusiness',
      {
        ios: { tiktokAppId: tiktokAppIds.ios },
        android: { tiktokAppId: tiktokAppIds.android },
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'Allow Aesthetix to measure ad performance and show more relevant campaigns.',
      },
    ],
  ],
  extra: {
    sslPinningEnabled,
    eas: {
      projectId: '03286584-32ad-40d6-93ec-61c84169e797',
    },
  },
};
