import * as SecureStore from 'expo-secure-store';

const keyForUser = (userId: string) => `aesthetix_free_scan_used_${userId}`;

/** Client backup when profile.free_scan_used is stale or migrations are pending. */
export async function isLocalFreeScanConsumed(userId: string): Promise<boolean> {
  const v = await SecureStore.getItemAsync(keyForUser(userId));
  return v === '1';
}

export async function setLocalFreeScanConsumed(userId: string): Promise<void> {
  await SecureStore.setItemAsync(keyForUser(userId), '1');
}
