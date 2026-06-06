import Constants from 'expo-constants';

/** True in the Expo Go app — native modules like expo-notifications are unavailable. */
export const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';
