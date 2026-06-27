import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'aesthetix_installation_id';

const KEYCHAIN_OPTS = {
  // Survives app reinstall on the same device (iOS Keychain); not tied to auth account.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** Stable per-device id (not tied to auth). Sent to Edge Functions for free-tier abuse checks. */
export async function getInstallationDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY, KEYCHAIN_OPTS);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id, KEYCHAIN_OPTS);
  return id;
}
