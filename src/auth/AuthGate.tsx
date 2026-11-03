import React, { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import {
  describeAuthError,
  isValidRecoveryEmail,
  normalizeRecoveryEmail,
  validateRecoveryPassword,
} from './authValidation';

type AccessMode = 'welcome' | 'sign-in' | 'forgot-password';

function savedLanguage(): 'en' | 'hi' {
  try {
    const saved = localStorage.getItem('dukaandost_state');
    const parsed = saved ? JSON.parse(saved) as { language?: string } : {};
    return parsed.language === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

function clearLocalDataForAnotherIdentity(userId: string) {
  const previousOwnerId = localStorage.getItem('dukaandost_owner_id');
  const hasCachedState = Boolean(localStorage.getItem('dukaandost_state'));

  if (previousOwnerId !== userId && hasCachedState) {
    localStorage.removeItem('dukaandost_state');
  }
  if (previousOwnerId && previousOwnerId !== userId) {
    localStorage.removeItem('dukaandost_owner_id');
  }
}

export function AccountAccessGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AccessMode>('welcome');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [language] = useState(savedLanguage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hi = language === 'hi';

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsPasswordRecovery(false);
        setMode('welcome');
      } else if (event === 'PASSWORD_RECOVERY') {
        setSession(nextSession);
        setIsPasswordRecovery(true);
      }
    });

    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setError(describeAuthError(sessionError));
        } else {
          setSession(data.session);
        }
      })
      .catch((sessionError: unknown) => {
        if (active) setError(describeAuthError(sessionError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    const normalizedEmail = normalizeRecoveryEmail(email);
    if (!isValidRecoveryEmail(normalizedEmail) || !password) {
      setError(hi ? 'कृपया सही ईमेल और पासवर्ड डालें।' : 'Enter a valid email address and password.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session) {
        throw new Error('Supabase did not return an active session. Verify your email and try again.');
      }

      // Never merge a previous anonymous shop cache into a different account.
      clearLocalDataForAnotherIdentity(data.session.user.id);
      setSession(data.session);
      setPassword('');
    } catch (signInError) {
      setError(describeAuthError(signInError));
    } finally {
      setBusy(false);
    }
  };

  const handleStartNewShop = async () => {
    if (!supabase || busy) return;

    const hasCachedState = Boolean(localStorage.getItem('dukaandost_state'));
    if (hasCachedState) {
      const confirmed = window.confirm(
        hi
          ? 'इस ब्राउज़र में पहले की दुकान का डेटा मौजूद है। नया खाता शुरू करने से यह स्थानीय डेटा हट जाएगा। क्या आप आगे बढ़ना चाहते हैं?'
          : 'This browser contains data from a previous shop. Starting a new shop will clear that local copy. Continue?',
      );
      if (!confirmed) return;
      localStorage.removeItem('dukaandost_state');
      localStorage.removeItem('dukaandost_owner_id');
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data, error: anonymousError } = await supabase.auth.signInAnonymously();
      if (anonymousError) throw anonymousError;
      if (!data.session) throw new Error('Supabase did not create a shop session.');
      setSession(data.session);
    } catch (anonymousError) {
      setError(describeAuthError(anonymousError));
    } finally {
      setBusy(false);
    }
  };

  const handleSendPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    const normalizedEmail = normalizeRecoveryEmail(email);
    if (!isValidRecoveryEmail(normalizedEmail)) {
      setError(hi ? 'कृपया सही ईमेल पता डालें।' : 'Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: window.location.origin },
      );
      if (resetError) throw resetError;
      setMessage(
        hi
          ? 'यदि इस ईमेल से खाता जुड़ा है, तो पासवर्ड रीसेट लिंक भेज दिया गया है। अपना इनबॉक्स देखें।'
          : 'If an account uses this email, a password reset link has been sent. Check your inbox.',
      );
    } catch (resetError) {
      setError(describeAuthError(resetError));
    } finally {
      setBusy(false);
    }
  };

  const handleSetRecoveredPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    const validationError = validateRecoveryPassword(newPassword);
    if (validationError) {
      setError(hi ? 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' : validationError);
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setPasswordRecovery(false);
      setNewPassword('');
      setMessage(hi ? 'पासवर्ड अपडेट हो गया।' : 'Your password has been updated.');
    } catch (updateError) {
      setError(describeAuthError(updateError));
    } finally {
      setBusy(false);
    }
  };

  if (!supabase) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="text-sm text-text-secondary">{hi ? 'खाता जाँचा जा रहा है…' : 'Checking your shop account…'}</div>
      </div>
    );
  }

  if (session && isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-5">
        <form onSubmit={handleSetRecoveredPassword} className="card w-full max-w-sm p-5 space-y-4">
          <div className="text-4xl text-center">🔐</div>
          <h1 className="text-section-title text-text text-center">
            {hi ? 'नया पासवर्ड बनाएँ' : 'Choose a new password'}
          </h1>
          <p className="text-sm text-text-secondary text-center">
            {hi ? 'अपने दुकान खाते के लिए नया पासवर्ड डालें।' : 'Set a new password for your shop account.'}
          </p>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="input-field w-full"
            placeholder={hi ? 'नया पासवर्ड (कम से कम 8 अक्षर)' : 'New password (at least 8 characters)'}
          />
          {error && <p className="text-sm text-problem" role="alert">{error}</p>}
          {message && <p className="text-sm text-positive" role="status">{message}</p>}
          <button type="submit" disabled={busy || !newPassword} className="btn-primary w-full">
            {busy ? (hi ? 'अपडेट हो रहा है…' : 'Updating…') : (hi ? 'पासवर्ड अपडेट करें' : 'Update password')}
          </button>
        </form>
      </div>
    );
  }

  if (session) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="card w-full max-w-sm p-5 space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-3xl">🏪</div>
          <h1 className="text-section-title text-text">Dukaan Dost</h1>
          <p className="text-sm text-text-secondary mt-2">
            {mode === 'forgot-password'
              ? (hi ? 'अपने दुकान खाते का पासवर्ड रीसेट करें।' : 'Reset the password for your shop account.')
              : mode === 'sign-in'
                ? (hi ? 'अपने मौजूदा दुकान खाते में साइन इन करें।' : 'Sign in to your existing shop account.')
                : (hi ? 'अपनी दुकान का डेटा सुरक्षित रखें और किसी भी डिवाइस से खोलें।' : 'Secure your shop data and access it from another device.')}
          </p>
        </div>

        {mode === 'welcome' && (
          <>
            <button
              type="button"
              onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }}
              className="btn-primary w-full"
              disabled={busy}
            >
              {hi ? 'मेरी मौजूदा दुकान खोलें' : 'Sign in to my shop'}
            </button>
            <button
              type="button"
              onClick={handleStartNewShop}
              className="btn-secondary w-full"
              disabled={busy}
            >
              {busy ? (hi ? 'शुरू हो रहा है…' : 'Starting…') : (hi ? 'नई दुकान शुरू करें' : 'Start a new shop')}
            </button>
          </>
        )}

        {mode === 'sign-in' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder={hi ? 'ईमेल पता' : 'Recovery email'}
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field w-full"
              placeholder={hi ? 'पासवर्ड' : 'Password'}
            />
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? (hi ? 'साइन इन हो रहा है…' : 'Signing in…') : (hi ? 'साइन इन करें' : 'Sign in')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('forgot-password'); setError(''); setMessage(''); }}
              className="btn-text w-full"
            >
              {hi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('welcome'); setError(''); setMessage(''); }}
              className="btn-text w-full"
            >
              {hi ? 'वापस' : 'Back'}
            </button>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form onSubmit={handleSendPasswordReset} className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder={hi ? 'ईमेल पता' : 'Recovery email'}
            />
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? (hi ? 'भेज रहा है…' : 'Sending…') : (hi ? 'रीसेट लिंक भेजें' : 'Send reset link')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }}
              className="btn-text w-full"
            >
              {hi ? 'वापस साइन इन पर जाएँ' : 'Back to sign in'}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-problem" role="alert">{error}</p>}
        {message && <p className="text-sm text-positive" role="status">{message}</p>}

        <p className="text-xs text-text-secondary text-center">
          {hi
            ? 'नई दुकान पहले इस डिवाइस पर शुरू होगी। बाद में प्रोफ़ाइल में रिकवरी ईमेल जोड़ें।'
            : 'A new shop starts on this device first. Add a recovery email in Profile before changing devices.'}
        </p>
      </div>
    </div>
  );
}
