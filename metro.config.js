const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withSentryConfig } = require('@sentry/react-native/metro');

const config = withSentryConfig(getDefaultConfig(__dirname));

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
