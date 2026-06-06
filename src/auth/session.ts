import type { Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

const SESSION_VALIDATION_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('session validation timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return (
    message.includes('Refresh Token') ||
    message.includes('refresh_token') ||
    message.includes('Invalid Refresh Token')
  );
}

/** Drop cached credentials when the server no longer recognizes the refresh token. */
export async function clearStaleAuthSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Returns a session only if it is still valid on the server.
 * Clears local storage when the refresh token was revoked or expired server-side.
 */
export async function getValidatedSession(): Promise<Session | null> {
  try {
    return await withTimeout(validateSession(), SESSION_VALIDATION_MS);
  } catch {
    return null;
  }
}

async function validateSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    if (isInvalidRefreshTokenError(error)) {
      await clearStaleAuthSession();
    }
    return null;
  }

  return session;
}
