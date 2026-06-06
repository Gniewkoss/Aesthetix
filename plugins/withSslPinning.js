// Expo config plugin: TLS public-key pinning for Supabase (*.supabase.co).
// Active only when enabled:true at prebuild (production EAS profile).
// Does NOT apply in Expo Go — requires `npx expo prebuild` + dev/production build.

const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
  AndroidConfig,
} = require('@expo/config-plugins');
const pins = require('./sslPinningPins');

function buildAndroidNetworkSecurityXml() {
  const pinElements = pins.pins.map((p) => `            <pin digest="SHA-256">${p}</pin>`).join('\n');
  const domainBlocks = pins.domains
    .map(
      (domain) => `        <domain-config cleartextTrafficPermitted="false">
            <domain includeSubdomains="true">${domain}</domain>
            <pin-set expiration="${pins.expiration}">
${pinElements}
            </pin-set>
        </domain-config>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
${domainBlocks}
</network-security-config>
`;
}

function withAndroidSslPinning(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        buildAndroidNetworkSecurityXml(),
        'utf8',
      );
      return cfg;
    },
  ]);

  return withAndroidManifest((cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return cfg;
  });
}

function withIosSslPinning(config) {
  return withInfoPlist((cfg) => {
    const pinnedDomains = {};
    for (const domain of pins.domains) {
      pinnedDomains[domain] = {
        NSIncludesSubdomains: true,
        NSPinnedLeafIdentities: pins.pins.map((pin) => ({
          'SPKI-SHA256-BASE64': pin,
        })),
      };
    }

    cfg.modResults.NSAppTransportSecurity = {
      ...(cfg.modResults.NSAppTransportSecurity ?? {}),
      NSPinnedDomains: pinnedDomains,
    };
    return cfg;
  });
}

/** Pinning mods run only during `expo prebuild` — not during `expo config` (EAS metadata step). */
function isPrebuildPhase() {
  return process.argv.some((arg) => String(arg).includes('prebuild'));
}

/**
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {{ enabled?: boolean }} props
 */
function withSslPinning(config, props = {}) {
  if (!props.enabled || !isPrebuildPhase()) return config;

  const projectRoot = config._internal?.projectRoot;
  if (!projectRoot) return config;

  config = withAndroidSslPinning(config);
  config = withIosSslPinning(config);
  return config;
}

module.exports = withSslPinning;
