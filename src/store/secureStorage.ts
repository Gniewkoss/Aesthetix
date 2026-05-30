// Encrypted-at-rest storage adapter for the Supabase auth session.
//
// WHY: the persisted session contains the access + refresh tokens — the crown
// jewels. AsyncStorage writes them as plaintext to app-private storage, which is
// readable on a rooted/jailbroken device (GDPR Art. 32 / App Store expectations).
// expo-secure-store puts them in the iOS Keychain / Android Keystore (hardware
// backed where available) instead.
//
// CHUNKING: SecureStore values are capped (~2KB, enforced on Android). A full
// Supabase session can exceed that, so values are split into chunks. A small
// manifest key records the chunk count so reads can reassemble and writes can
// clean up stale chunks.
//
// WEB: SecureStore is native-only; on web (expo start --web) we transparently
// fall back to AsyncStorage.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // chars; JWTs are ASCII so chars ≈ bytes, leaves headroom under 2KB
const isWeb = Platform.OS === 'web';

// SecureStore keys may only contain [A-Za-z0-9._-]. Supabase keys like
// `sb-<ref>-auth-token` qualify, but sanitize defensively for any future key.
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function getChunkCount(base: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(`${base}__n`);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function clearChunks(base: string): Promise<void> {
  const n = await getChunkCount(base);
  const deletions: Promise<void>[] = [SecureStore.deleteItemAsync(`${base}__n`)];
  for (let i = 0; i < n; i++) deletions.push(SecureStore.deleteItemAsync(`${base}__${i}`));
  await Promise.all(deletions);
}

export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const base = safeKey(key);
    if (isWeb) return AsyncStorage.getItem(base);

    const n = await getChunkCount(base);
    if (n === 0) {
      // Either not stored, or stored before chunking was introduced — try the raw key.
      return SecureStore.getItemAsync(base);
    }
    const parts = await Promise.all(
      Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${base}__${i}`)),
    );
    if (parts.some((p) => p === null)) return null; // corrupt/partial write
    return parts.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const base = safeKey(key);
    if (isWeb) {
      await AsyncStorage.setItem(base, value);
      return;
    }

    await clearChunks(base); // drop any previous (possibly longer) value first

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${base}__${i}`, c)));
    await SecureStore.setItemAsync(`${base}__n`, String(chunks.length));
  },

  removeItem: async (key: string): Promise<void> => {
    const base = safeKey(key);
    if (isWeb) {
      await AsyncStorage.removeItem(base);
      return;
    }
    await clearChunks(base);
    // also clear a possible pre-chunking raw value
    await SecureStore.deleteItemAsync(base).catch(() => {});
  },
};
