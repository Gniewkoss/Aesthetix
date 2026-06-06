import { useEffect } from 'react';
import {
  addNotificationResponseListener,
  configurePushNotificationHandler,
  ensureNotificationPermission,
  subscribeNotificationResync,
  syncPushNotificationSchedule,
} from '../lib/pushNotifications';
import { navigateFromNotification } from '../navigation/navigationRef';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function usePushNotifications(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    void configurePushNotificationHandler();

    let removeResponseListener = () => {};
    void addNotificationResponseListener(navigateFromNotification).then((remove) => {
      removeResponseListener = remove;
    });

    const resyncSub = subscribeNotificationResync();

    return () => {
      removeResponseListener();
      resyncSub();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !settingsHydrated) return;

    void (async () => {
      const { notifications } = useSettingsStore.getState().settings;
      const anyEnabled =
        notifications.scanReminders ||
        notifications.streakReminders ||
        notifications.progressUpdates;
      if (anyEnabled) await ensureNotificationPermission();
      await syncPushNotificationSchedule();
    })();
  }, [isAuthenticated, settingsHydrated]);
}
