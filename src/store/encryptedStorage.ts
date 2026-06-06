// Encrypted-at-rest storage for health-adjacent local caches (scan history, chat).
// Uses the same Keychain/Keystore chunking strategy as the auth session adapter.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const isWeb = Platform.OS === 'web';

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

async function getEncrypted(key: string): Promise<string | null> {
  const base = safeKey(key);
  if (isWeb) return AsyncStorage.getItem(base);

  const n = await getChunkCount(base);
  if (n === 0) return SecureStore.getItemAsync(base);

  const parts = await Promise.all(
    Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${base}__${i}`)),
  );
  if (parts.some((p) => p === null)) return null;
  return parts.join('');
}

async function setEncrypted(key: string, value: string): Promise<void> {
  const base = safeKey(key);
  if (isWeb) {
    await AsyncStorage.setItem(base, value);
    return;
  }

  await clearChunks(base);
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${base}__${i}`, c)));
  await SecureStore.setItemAsync(`${base}__n`, String(chunks.length));
}

async function deleteEncrypted(key: string): Promise<void> {
  const base = safeKey(key);
  if (isWeb) {
    await AsyncStorage.removeItem(base);
    return;
  }
  await clearChunks(base);
  await SecureStore.deleteItemAsync(base).catch(() => {});
}

export async function loadEncryptedJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await getEncrypted(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveEncryptedJson<T>(key: string, value: T): Promise<void> {
  try {
    await setEncrypted(key, JSON.stringify(value));
  } catch {
    // silently ignore write failures
  }
}

export async function removeEncryptedKey(key: string): Promise<void> {
  try {
    await deleteEncrypted(key);
  } catch {
    // silently ignore
  }
}
