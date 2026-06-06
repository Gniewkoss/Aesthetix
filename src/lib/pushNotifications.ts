import { AppState, Platform } from 'react-native';
import { isExpoGo } from './runtime';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const NOTIF_IDS = {
  SCAN_DAILY: 'aesthetix-scan-daily',
  STREAK_TODAY: 'aesthetix-streak-today',
  PROGRESS_WEEKLY: 'aesthetix-progress-weekly',
} as const;

const ANDROID_CHANNEL_ID = 'aesthetix-alerts';

const SCAN_HOUR = 9;
const SCAN_MINUTE = 0;
const STREAK_HOUR = 20;
const STREAK_MINUTE = 0;
const PROGRESS_WEEKDAY = 1; // Sunday
const PROGRESS_HOUR = 10;
const PROGRESS_MINUTE = 0;

let handlerConfigured = false;

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | null | undefined;

function notificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isExpoGo;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsSupported()) return null;
  if (notificationsModule === undefined) {
    try {
      notificationsModule = await import('expo-notifications');
    } catch {
      notificationsModule = null;
    }
  }
  return notificationsModule;
}

export async function configurePushNotificationHandler(): Promise<void> {
  if (handlerConfigured || !notificationsSupported()) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;

  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Aesthetix Alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120, 80, 120],
    lightColor: '#C7F940',
  });
}

export async function getNotificationPermissionStatus(): Promise<string> {
  const Notifications = await getNotifications();
  if (!Notifications) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Request OS permission. Returns true when alerts may be shown. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === Notifications.PermissionStatus.GRANTED) return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return status === Notifications.PermissionStatus.GRANTED;
}

export async function cancelAllAesthetixNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Promise.all(
    Object.values(NOTIF_IDS).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

function scannedToday(): boolean {
  const latest = useAnalysisStore.getState().history[0];
  if (!latest) return false;
  return new Date(latest.createdAt).toDateString() === new Date().toDateString();
}

function nextTimeToday(hour: number, minute: number): Date | null {
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= Date.now()) return null;
  return trigger;
}

async function scheduleDailyScanReminder(Notifications: NotificationsModule): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.SCAN_DAILY,
    content: {
      title: 'Time for your physique scan',
      body: 'Upload front and back photos — your AI report takes under 60 seconds.',
      data: { screen: 'Upload' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: SCAN_HOUR,
      minute: SCAN_MINUTE,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

async function scheduleStreakAlert(Notifications: NotificationsModule, streak: number): Promise<void> {
  const triggerDate = nextTimeToday(STREAK_HOUR, STREAK_MINUTE);
  if (!triggerDate) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.STREAK_TODAY,
    content: {
      title: `Keep your ${streak}-day streak`,
      body: 'Scan before midnight to maintain your streak.',
      data: { screen: 'Upload' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

async function scheduleWeeklyProgress(Notifications: NotificationsModule): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.PROGRESS_WEEKLY,
    content: {
      title: 'Your weekly progress',
      body: 'See how your physique score changed this week.',
      data: { screen: 'Progress' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: PROGRESS_WEEKDAY,
      hour: PROGRESS_HOUR,
      minute: PROGRESS_MINUTE,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

/** (Re)schedule local push alerts from current settings and scan state. */
export async function syncPushNotificationSchedule(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      await cancelAllAesthetixNotifications();
      return;
    }

    const { settings, hydrated } = useSettingsStore.getState();
    if (!hydrated) return;

    const { notifications } = settings;
    const anyEnabled =
      notifications.scanReminders ||
      notifications.streakReminders ||
      notifications.progressUpdates;

    if (!anyEnabled) {
      await cancelAllAesthetixNotifications();
      return;
    }

    const granted = await getNotificationPermissionStatus();
    if (granted !== Notifications.PermissionStatus.GRANTED) return;

    await ensureAndroidChannel(Notifications);
    await cancelAllAesthetixNotifications();

    if (notifications.scanReminders) {
      await scheduleDailyScanReminder(Notifications);
    }

    const streak = user.streak ?? 0;
    if (notifications.streakReminders && streak > 0 && !scannedToday()) {
      await scheduleStreakAlert(Notifications, streak);
    }

    if (notifications.progressUpdates) {
      await scheduleWeeklyProgress(Notifications);
    }
  } catch (err) {
    if (__DEV__) console.warn('[notifications] sync failed', err);
  }
}

/** Re-sync when app returns to foreground (streak alert date may have changed). */
export function subscribeNotificationResync(): () => void {
  if (!notificationsSupported()) return () => {};

  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncPushNotificationSchedule();
  });
  return () => sub.remove();
}

export async function addNotificationResponseListener(
  handler: (screen: string) => void,
): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (typeof screen === 'string') handler(screen);
  });
  return () => sub.remove();
}
