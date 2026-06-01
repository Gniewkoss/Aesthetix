import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { isSessionExpired, resetSessionActivity, touchSessionActivity } from '../lib/sessionTimeout';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Signs the user out after 30 minutes of inactivity (foreground time only).
 */
export function useSessionTimeout(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    resetSessionActivity();

    const onStateChange = (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (isSessionExpired()) logout();
        else touchSessionActivity();
      }
      if (next === 'active') touchSessionActivity();
      appState.current = next;
    };

    const interval = setInterval(() => {
      if (appState.current === 'active' && isSessionExpired()) logout();
    }, CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener('change', onStateChange);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);
}
