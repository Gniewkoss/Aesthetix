const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const TIKTOK_SKADNETWORK_IDS = ['22mmun2rn5.skadnetwork'];
const QUERY_SCHEMES = ['tiktok', 'snssdk1233', 'snssdk1180'];

/**
 * @param {import('@expo/config').ExpoConfig} config
 * @param {{ ios?: { tiktokAppId?: string }, android?: { tiktokAppId?: string } }} props
 */
function withTikTokBusiness(config, props = {}) {
  const ios = props.ios ?? {};
  const android = props.android ?? {};

  config = withInfoPlist(config, (iosConfig) => {
    if (ios.tiktokAppId) {
      iosConfig.modResults.TikTokAppID = ios.tiktokAppId;
    }

    const existing = iosConfig.modResults.SKAdNetworkItems ?? [];
    const existingIds = new Set(existing.map((item) => item.SKAdNetworkIdentifier));
    const newItems = TIKTOK_SKADNETWORK_IDS
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ SKAdNetworkIdentifier: id }));
    if (newItems.length > 0) {
      iosConfig.modResults.SKAdNetworkItems = [...existing, ...newItems];
    }

    iosConfig.modResults.LSApplicationQueriesSchemes =
      iosConfig.modResults.LSApplicationQueriesSchemes ?? [];
    for (const scheme of QUERY_SCHEMES) {
      if (!iosConfig.modResults.LSApplicationQueriesSchemes.includes(scheme)) {
        iosConfig.modResults.LSApplicationQueriesSchemes.push(scheme);
      }
    }

    return iosConfig;
  });

  config = withAndroidManifest(config, (androidConfig) => {
    if (!android.tiktokAppId) return androidConfig;

    const application = androidConfig.modResults.manifest.application?.[0];
    if (!application) return androidConfig;

    const metaData = application['meta-data'] ?? [];
    application['meta-data'] = metaData.filter(
      (meta) => meta.$?.['android:name'] !== 'com.tiktok.sdk.AppId',
    );
    application['meta-data'].push({
      $: {
        'android:name': 'com.tiktok.sdk.AppId',
        'android:value': android.tiktokAppId,
      },
    });

    return androidConfig;
  });

  return config;
}

module.exports = withTikTokBusiness;
