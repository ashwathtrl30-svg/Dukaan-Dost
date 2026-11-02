import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';

export function VaultAccessScreen() {
  const { vaultStatus, vaultError, unlockVault } = useStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  if (vaultStatus === 'error') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-bg">
        <div className="card w-full max-w-sm">
          <h1 className="text-section-title text-text mb-2">Private vault unavailable</h1>
          <p className="text-body text-text-secondary mb-4">{vaultError || 'We could not check your vault. Your shop data has not been opened.'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mb-3">Try again</button>
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
        {vaultError && <p className="text-small text-warning text-center mb-3" role="status">{vaultError}</p>}

        <label className="text-small font-medium text-text block mb-2" htmlFor="vault-passphrase">
          Private vault passphrase
        </label>
        <div className="relative mb-3">
          <input
            id="vault-passphrase"
            type={showPassphrase ? 'text' : 'password'}
            autoComplete={isNewVault ? 'new-password' : 'current-password'}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="input-field pr-12"
            minLength={12}
            placeholder="At least 12 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassphrase((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
            aria-pressed={showPassphrase}
            title={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
          >
            {showPassphrase ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {isNewVault && (
          <>
            <label className="text-small font-medium text-text block mb-2" htmlFor="vault-confirmation">
              Confirm passphrase
            </label>
            <div className="relative mb-3">
              <input
                id="vault-confirmation"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="input-field pr-12"
                minLength={12}
                placeholder="Enter it again"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                aria-label={showConfirmation ? 'Hide confirmation passphrase' : 'Show confirmation passphrase'}
                aria-pressed={showConfirmation}
                title={showConfirmation ? 'Hide confirmation passphrase' : 'Show confirmation passphrase'}
              >
                {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
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

        <p className="text-small text-text-secondary text-center mt-4">
          Account switching and passphrase recovery will be available after verified phone sign-in is integrated.
        </p>
      </div>
    </div>
  );
}
