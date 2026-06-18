import type { Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

const SESSION_VALIDATION_MS = 15_000;
const VALIDATION_RETRIES = 3;

let validationInFlight: Promise<Session | null> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  if (__DEV__) console.warn('[auth] clearing stale session (invalid refresh token)');
  await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Returns a session only if it is still valid on the server.
 * Deduplicates concurrent calls and retries transient network failures.
 * Falls back to the cached session when offline so users are not logged out on restart.
 */
export async function getValidatedSession(): Promise<Session | null> {
  if (validationInFlight) return validationInFlight;

  validationInFlight = validateSessionWithRetry().finally(() => {
    validationInFlight = null;
  });
  return validationInFlight;
}

async function validateSessionWithRetry(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  for (let attempt = 0; attempt < VALIDATION_RETRIES; attempt++) {
    try {
      const { data: { user }, error } = await withTimeout(
        supabase.auth.getUser(),
        SESSION_VALIDATION_MS,
      );

      if (!error && user) return session;

      if (isInvalidRefreshTokenError(error)) {
        await clearStaleAuthSession();
        return null;
      }

      if (__DEV__) {
        console.warn('[auth] getUser failed', { attempt, message: error?.message });
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[auth] session validation attempt failed', { attempt, err });
      }
    }

    if (attempt < VALIDATION_RETRIES - 1) {
      await delay(800 * (attempt + 1));
    }
  }

  // Offline / slow network — keep the user signed in with the cached session.
  if (__DEV__) {
    console.warn('[auth] using cached session after validation retries exhausted');
  }
  return session;
}

/** Lightweight check used after purchase — does not clear session on failure. */
export async function getSessionIfPresent(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
