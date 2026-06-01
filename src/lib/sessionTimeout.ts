/** Inactivity window before forcing sign-out (30 minutes). */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let lastActivityAt = Date.now();

export function touchSessionActivity(): void {
  lastActivityAt = Date.now();
}

export function isSessionExpired(): boolean {
  return Date.now() - lastActivityAt >= SESSION_TIMEOUT_MS;
}

export function resetSessionActivity(): void {
  lastActivityAt = Date.now();
}
