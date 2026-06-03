// Removes Sign in with Apple entitlement when disabled (required for Personal Team / free Apple ID).
// Set EXPO_PUBLIC_DISABLE_APPLE_SIGNIN=true before `expo prebuild` or use for local ios/ edits.

const { withEntitlementsPlist } = require('@expo/config-plugins');

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withOptionalAppleSignIn(config, { enabled = true } = {}) {
  return withEntitlementsPlist(config, (cfg) => {
    if (!enabled) {
      delete cfg.modResults['com.apple.developer.applesignin'];
    }
    return cfg;
  });
}

module.exports = withOptionalAppleSignIn;
