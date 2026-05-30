// Client-side input validation for auth fields.
//
// Note: this is UX-layer defense (clear feedback, fewer bad requests). It is NOT a
// security boundary on its own — Supabase Auth + Postgres parameterized queries +
// RLS are what actually prevent SQL injection. We still validate to reject
// obviously malformed input early and enforce a minimum password policy.

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters (incl. accented), spaces, hyphen, apostrophe, period. 2–60 chars.
const NAME_PATTERN = /^[\p{L}][\p{L}\s\-'.]{1,59}$/u;

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long' };
  if (!EMAIL_PATTERN.test(trimmed)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password.length > 72) {
    // bcrypt (Supabase Auth) truncates beyond 72 bytes — reject to avoid silent surprises.
    return { valid: false, error: 'Password must be 72 characters or fewer' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'Use at least one letter and one number' };
  }
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Name is required' };
  if (!NAME_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Enter a valid name (letters only)' };
  }
  return { valid: true };
}
