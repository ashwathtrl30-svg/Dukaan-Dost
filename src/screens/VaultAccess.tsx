import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';

export function VaultAccessScreen() {
  const { vaultStatus, unlockVault, signOut } = useStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isNewVault = vaultStatus === 'new';

  const handleUnlock = async () => {
    setError('');
    if (passphrase.length < 12) {
      setError('Use at least 12 characters for your private vault passphrase.');
      return;
    }
    if (isNewVault && passphrase !== confirmation) {
      setError('The two passphrases do not match.');
      return;
    }

    setBusy(true);
    try {
      await unlockVault(passphrase);
      setPassphrase('');
      setConfirmation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open your private vault. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (vaultStatus === 'checking') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-bg">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <LockKeyhole size={30} />
        </div>
        <h1 className="text-section-title text-text mb-2">Checking your private vault</h1>
        <p className="text-body text-text-secondary text-center">Your shop records remain encrypted while we check for your saved vault.</p>
      </div>
    );
  }

  if (vaultStatus === 'error' || vaultStatus === 'signed_out') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-bg">
        <div className="card w-full max-w-sm">
          <h1 className="text-section-title text-text mb-2">Private vault unavailable</h1>
          <p className="text-body text-text-secondary mb-4">We could not check your vault. Your shop data has not been opened.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mb-3">Try again</button>
          <button onClick={() => { void signOut().catch(() => undefined); }} className="btn-secondary">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-bg animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {isNewVault ? <ShieldCheck size={30} /> : <LockKeyhole size={30} />}
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-screen-title text-text text-center mb-2">
          {isNewVault ? 'Create your private vault' : 'Unlock your private vault'}
        </h1>
        <p className="text-body text-text-secondary text-center mb-6">
          {isNewVault
            ? 'Your shop records will be encrypted on this device before they are saved online. Choose a passphrase only you know.'
            : 'Enter the passphrase you created for this vault. Neither the database nor the app stores it.'}
        </p>

        <label className="text-small font-medium text-text block mb-2" htmlFor="vault-passphrase">
          Private vault passphrase
        </label>
        <input
          id="vault-passphrase"
          type="password"
          autoComplete={isNewVault ? 'new-password' : 'current-password'}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="input-field mb-3"
          minLength={12}
          placeholder="At least 12 characters"
        />

        {isNewVault && (
          <>
            <label className="text-small font-medium text-text block mb-2" htmlFor="vault-confirmation">
              Confirm passphrase
            </label>
            <input
              id="vault-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="input-field mb-3"
              minLength={12}
              placeholder="Enter it again"
            />
          </>
        )}

        {error && <p role="alert" className="text-small text-problem mb-3">{error}</p>}

        <button
          onClick={() => { void handleUnlock(); }}
          disabled={busy || passphrase.length < 12 || (isNewVault && !confirmation)}
          className="btn-primary mb-3"
        >
          <LockKeyhole size={18} />
          {busy ? 'Securing your data…' : isNewVault ? 'Create encrypted vault' : 'Unlock my data'}
        </button>

        <div className="card mt-4">
          <p className="text-small text-text-secondary">
            <strong>Important:</strong> This passphrase is not recoverable by Dukaan Dost. If you forget it, the encrypted cloud backup cannot be decrypted. Keep it somewhere safe and private.
          </p>
        </div>

        <button
          onClick={() => { void signOut().catch((err) => setError(err instanceof Error ? err.message : 'Could not sign out.')); }}
          className="btn-text mx-auto mt-4"
        >
          Use a different phone number
        </button>
      </div>
    </div>
  );
}
