import { makeRedirectUri } from 'expo-auth-session';

/** Redirect URL for Supabase email confirmation / magic links (must match Dashboard allow-list). */
export function getEmailAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: 'physiquemax',
    path: 'auth/callback',
  });
}
