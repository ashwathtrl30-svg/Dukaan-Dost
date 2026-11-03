import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import {
  describeAuthError,
  isValidRecoveryEmail,
  normalizeRecoveryEmail,
  validateRecoveryPassword,
} from './authValidation';

export function AccountRecoveryPanel() {
  const { authUser } = useStore();
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAnonymous = authUser?.is_anonymous ?? true;
  const isEmailVerified = Boolean(authUser?.email && authUser.email_confirmed_at);

  useEffect(() => {
    if (authUser?.email) setEmail(authUser.email);
    if (authUser?.email && authUser.email_confirmed_at) {
      setPendingEmail('');
    }
  }, [authUser?.email, authUser?.email_confirmed_at]);

  const handleSendVerification = async () => {
    if (!supabase) return;

    const normalizedEmail = normalizeRecoveryEmail(email);
    if (!isValidRecoveryEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: linkError } = await supabase.auth.updateUser(
        { email: normalizedEmail },
        { emailRedirectTo: window.location.origin },
      );
      if (linkError) throw linkError;

      setPendingEmail(normalizedEmail);
      setMessage('Verification email requested. Open the email on this device, follow its link, then return here to check verification.');
    } catch (linkError) {
      setError(describeAuthError(linkError));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!supabase) return;

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!data.user?.email || !data.user.email_confirmed_at || data.user.is_anonymous) {
        setError('The email is not verified on this shop account yet. Open the latest verification email and try again.');
        return;
      }

      setEmail(data.user.email);
      setPendingEmail('');
      setShowPasswordSetup(true);
      setMessage('Email verified. Set a password so you can sign in to this shop on another device.');
    } catch (verificationError) {
      setError(describeAuthError(verificationError));
    } finally {
      setBusy(false);
    }
  };

  const handleSetPassword = async () => {
    if (!supabase) return;

    const validationError = validateRecoveryPassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      setPassword('');
      setShowPasswordSetup(false);
      setMessage('Password saved. You can now sign in with this email and password on another device.');
    } catch (passwordError) {
      setError(describeAuthError(passwordError));
    } finally {
      setBusy(false);
    }
  };

  if (!supabase) return null;

  return (
    <section className="card mb-4 p-4 space-y-3" aria-labelledby="account-recovery-heading">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">🔐</div>
        <div className="min-w-0 flex-1">
          <h2 id="account-recovery-heading" className="text-body-lg font-bold text-text">
            {isEmailVerified ? 'Account recovery is set up' : 'Protect and recover your shop'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isAnonymous
              ? 'This shop currently uses a device-bound anonymous sign-in. Add a verified email and password before switching phones or signing out.'
              : isEmailVerified
                ? 'Your verified email is linked to this shop. Use it with your password to sign in on another device.'
                : 'Finish verifying the email linked to this shop so it can be recovered.'}
          </p>
        </div>
      </div>

      {!isEmailVerified && (
        <>
          <label className="block text-sm font-medium text-text" htmlFor="shop-recovery-email">
            Recovery email
          </label>
          <input
            id="shop-recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field w-full"
            placeholder="you@example.com"
            disabled={busy || Boolean(pendingEmail)}
          />
          {pendingEmail ? (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">
                Verification requested for <strong>{pendingEmail}</strong>.
              </p>
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={busy}
                className="btn-primary w-full"
              >
                {busy ? 'Checking…' : "I've verified my email"}
              </button>
              <button
                type="button"
                onClick={() => { setPendingEmail(''); setError(''); setMessage(''); }}
                className="btn-text w-full"
              >
                Change email address
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy ? 'Sending…' : 'Send verification email'}
            </button>
          )}
        </>
      )}

      {isEmailVerified && (
        <div className="rounded-xl bg-bg p-3 space-y-2">
          <p className="text-sm font-semibold text-text break-all">{authUser?.email}</p>
          <p className="text-xs text-positive">✓ Verified recovery email</p>
          {!showPasswordSetup ? (
            <button
              type="button"
              onClick={() => { setShowPasswordSetup(true); setMessage(''); setError(''); }}
              className="btn-secondary w-full"
            >
              Set or change password
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field w-full"
                placeholder="New password (at least 8 characters)"
              />
              <button
                type="button"
                onClick={handleSetPassword}
                disabled={busy || !password}
                className="btn-primary w-full"
              >
                {busy ? 'Saving…' : 'Save password'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordSetup(false); setPassword(''); }}
                className="btn-text w-full"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-problem" role="alert">{error}</p>}
      {message && <p className="text-sm text-positive" role="status">{message}</p>}
      <p className="text-xs text-text-secondary">
        Email confirmation requires Supabase manual identity linking and a production email sender. The app will not mark an unverified address as protected.
      </p>
    </section>
  );
}
