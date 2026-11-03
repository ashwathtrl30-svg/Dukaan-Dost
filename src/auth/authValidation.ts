export function normalizeRecoveryEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidRecoveryEmail(value: string): boolean {
  const email = normalizeRecoveryEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRecoveryPassword(value: string): string | null {
  if (value.length < 8) return 'Use at least 8 characters for your password.';
  if (value.length > 72) return 'Use a password with no more than 72 characters.';
  if (!/\S/.test(value)) return 'Your password cannot contain only spaces.';
  return null;
}

export function describeAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (
    normalized.includes('email address not authorized') ||
    normalized.includes('email_address_not_authorized')
  ) {
    return 'Supabase email delivery is still in test mode. Configure custom SMTP before sending verification or recovery emails to shopkeepers.';
  }
  if (
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('email rate limit exceeded')
  ) {
    return 'The project email limit has been reached. Configure custom SMTP for production email delivery.';
  }
  if (
    normalized.includes('manual linking') ||
    normalized.includes('identity linking') ||
    normalized.includes('linking identities is disabled')
  ) {
    return 'Account linking is disabled in Supabase. Enable manual identity linking in Authentication settings, then try again.';
  }
  if (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('identity already exists')
  ) {
    return 'That email is already linked to another account. Sign in to that shop instead of linking it here.';
  }
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_credentials')
  ) {
    return 'The email or password is incorrect.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Verify your email address before signing in.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts. Please wait a little before trying again.';
  }

  return message || 'The account request could not be completed. Please try again.';
}
