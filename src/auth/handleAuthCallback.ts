import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase, isSupabaseConfigured } from '../api/supabase';

/** Exchange tokens or auth code from a Supabase email / OAuth redirect URL. */
export async function createSessionFromUrl(url: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });
    if (error) throw error;
    return true;
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  return false;
}

export function subscribeToAuthLinks(onUrl: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => onUrl(url));
  return () => subscription.remove();
}

export function getInitialAuthUrl(): Promise<string | null> {
  return Linking.getInitialURL();
}
