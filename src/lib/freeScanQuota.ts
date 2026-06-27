import * as SecureStore from 'expo-secure-store';

const DEVICE_FREE_SCAN_KEY = 'aesthetix_device_free_scan_consumed';

const KEYCHAIN_OPTS = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** Device-scoped backup when profile.free_scan_used is stale or server is unreachable. */
export async function isDeviceFreeScanConsumed(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(DEVICE_FREE_SCAN_KEY, KEYCHAIN_OPTS);
  return v === '1';
}

export async function setDeviceFreeScanConsumed(): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_FREE_SCAN_KEY, '1', KEYCHAIN_OPTS);
}
