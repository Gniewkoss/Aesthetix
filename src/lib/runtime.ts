import { isRunningInExpoGo } from 'expo';

/** True in the Expo Go app — native modules like expo-notifications are unavailable. */
export const isExpoGo = isRunningInExpoGo();
