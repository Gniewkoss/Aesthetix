import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  user: '@physiquemax/user',
  onboarding: '@physiquemax/onboarding',
  history: '@physiquemax/history',
  progress: '@physiquemax/progress',
} as const;

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

export async function removeItem(key: keyof typeof KEYS): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS[key]);
  } catch {
    // silently ignore
  }
}
