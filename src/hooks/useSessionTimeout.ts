/**
 * Inactivity auto-logout was removed — fitness apps should keep users signed in.
 * Session ends only on explicit logout, account deletion, or an invalid refresh token.
 */
export function useSessionTimeout(): void {
  // Intentionally no-op.
}
