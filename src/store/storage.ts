import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  user: '@physiquemax/user',
  onboarding: '@physiquemax/onboarding',
  history: '@physiquemax/history',
  progress: '@physiquemax/progress',
  settings: '@physiquemax/settings',
} as const;

export type StorageKey = keyof typeof KEYS;
export type UserStorageKey = 'onboarding' | 'history' | 'progress' | 'settings';

function userScopedKey(userId: string, key: UserStorageKey): string {
  return `${KEYS[key]}:${userId}`;
}

export async function loadItem<T>(key: keyof typeof KEYS): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveItem<T>(key: keyof typeof KEYS, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch {
    // silently ignore write failures
  }
}

export async function removeItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS[key]);
  } catch {
    // silently ignore
  }
}

export async function loadUserItem<T>(userId: string, key: UserStorageKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(userScopedKey(userId, key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveUserItem<T>(userId: string, key: UserStorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(userScopedKey(userId, key), JSON.stringify(value));
  } catch {
    // silently ignore
  }
}

export async function removeUserItem(userId: string, key: UserStorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(userScopedKey(userId, key));
  } catch {
    // silently ignore
  }
}

/** Clears global (legacy) keys — each account should use per-user keys when logged in. */
export async function clearUserLocalData(): Promise<void> {
  await Promise.all(
    (Object.keys(KEYS) as StorageKey[]).map((key) => removeItem(key)),
  );
}

export async function clearUserScopedStorage(userId: string): Promise<void> {
  const keys: UserStorageKey[] = ['onboarding', 'history', 'progress'];
  await Promise.all(keys.map((key) => removeUserItem(userId, key)));
}
