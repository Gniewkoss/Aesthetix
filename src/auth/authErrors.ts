/** Map Supabase auth API errors to stable app error codes / messages. */
export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('email rate limit') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'EMAIL_RATE_LIMIT';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'AUTH_RATE_LIMIT';
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  ) {
    return 'EMAIL_ALREADY_REGISTERED';
  }
  if (lower.includes('redirect') && lower.includes('not allowed')) {
    return 'REDIRECT_URL_NOT_ALLOWED';
  }
  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'SIGNUP_DISABLED';
  }
  if (lower.includes('appleid.apple.com') && lower.includes('not enabled')) {
    return 'APPLE_PROVIDER_DISABLED';
  }
  if (lower.includes('google') && lower.includes('not enabled')) {
    return 'GOOGLE_PROVIDER_DISABLED';
  }
  return message;
}
