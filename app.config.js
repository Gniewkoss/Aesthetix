// Expo config — use `npx expo prebuild` for native projects (Sentry + SSL pinning).
// Env at prebuild time: EXPO_PUBLIC_SSL_PINNING_ENABLED, SENTRY_ORG, SENTRY_PROJECT.

const sslPinningEnabled = process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'true';
/** Personal Team cannot use Sign in with Apple — disable for local device builds. */
const appleSignInEnabled = process.env.EXPO_PUBLIC_DISABLE_APPLE_SIGNIN !== 'true';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Aesthetix',
  slug: 'aesthetix-ai',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'physiquemax',
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
    bundleIdentifier: 'com.physiquemax.ai',
    backgroundColor: '#0A0B0D',
    usesAppleSignIn: appleSignInEnabled,
    infoPlist: {
      NSCameraUsageDescription:
        'Aesthetix needs camera access to analyze your physique.',
      NSPhotoLibraryUsageDescription:
        'Aesthetix needs photo library access to analyze your physique.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'com.physiquemax.ai',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
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
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
    ['./plugins/withSslPinning', { enabled: sslPinningEnabled }],
    ['./plugins/withOptionalAppleSignIn', { enabled: appleSignInEnabled }],
  ],
  extra: {
    sslPinningEnabled,
  },
};
