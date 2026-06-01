const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// getSentryExpoConfig uses Expo's debug-id plugin (compatible with NativeWind).
// Do NOT use withSentryConfig here — it wraps customSerializer and breaks NativeWind.
const config = getSentryExpoConfig(__dirname, {
  enableSourceContextInDevelopment: false,
});

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
