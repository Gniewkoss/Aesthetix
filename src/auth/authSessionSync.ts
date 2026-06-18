import { supabase, isSupabaseConfigured } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';

let subscribed = false;

/** Keep Zustand auth state aligned with Supabase token lifecycle. */
export function subscribeToAuthSessionChanges(): () => void {
  if (!isSupabaseConfigured || subscribed) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (__DEV__) console.log('[auth] onAuthStateChange', event);

    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        onboardingCompleted: false,
        authHydrated: true,
      });
      return;
    }

    if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
      void useAuthStore.getState().syncFromSession();
    }
  });

  subscribed = true;
  return () => {
    data.subscription.unsubscribe();
    subscribed = false;
  };
}
