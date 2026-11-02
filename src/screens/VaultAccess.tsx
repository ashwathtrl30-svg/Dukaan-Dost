import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { Language } from '../types';
import { useStore } from '../store';

export function VaultAccessScreen() {
  const { state, vaultStatus, vaultError, unlockVault } = useStore();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('dukaandost_vault_language');
    if (saved === 'hi' || saved === 'en') return saved;
    return state.language === 'hi' ? 'hi' : 'en';
  });
  const [step, setStep] = useState<'language' | 'vault'>('language');
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isNewVault = vaultStatus === 'new';
  const isHindi = language === 'hi';

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem('dukaandost_vault_language', nextLanguage);
  };

  const handleUnlock = async () => {
    setError('');
    if (passphrase.length < 12) {
      setError(isHindi
        ? 'कम से कम 12 अक्षरों का पासफ़्रेज़ रखें।'
        : 'Use at least 12 characters for your private vault passphrase.');
      return;
    }
    if (isNewVault && passphrase !== confirmation) {
      setError(isHindi
        ? 'दोनों पासफ़्रेज़ एक जैसे नहीं हैं।'
        : 'The two passphrases do not match.');
      return;
    }

    setBusy(true);
    try {
      await unlockVault(passphrase, language);
      setPassphrase('');
      setConfirmation('');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'OperationError') {
        setError(isHindi
          ? 'पासफ़्रेज़ सही नहीं है। कृपया फिर से कोशिश करें।'
          : 'That passphrase did not unlock your vault. Please try again.');
      } else {
        setError(isHindi
          ? 'वॉल्ट नहीं खुल पाया। इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।'
          : err instanceof Error
            ? err.message
            : 'Could not open your private vault. Please try again.');
      }
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
        <h1 className="text-section-title text-text mb-2 text-center">
          {isHindi ? 'आपकी निजी वॉल्ट जाँची जा रही है' : 'Checking your private vault'}
        </h1>
        <p className="text-body text-text-secondary text-center">
          {isHindi
            ? 'आपकी दुकान का डेटा सुरक्षित रहते हुए वॉल्ट की जाँच हो रही है।'
            : 'Your shop records remain protected while we check your vault.'}
        </p>
      </div>
    );
  }

  if (vaultStatus === 'error') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-bg">
        <div className="card w-full max-w-sm">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => chooseLanguage('en')}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${!isHindi ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}
              aria-pressed={!isHindi}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => chooseLanguage('hi')}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${isHindi ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}
              aria-pressed={isHindi}
            >
              हिंदी
            </button>
          </div>
          <h1 className="text-section-title text-text mb-2">
            {isHindi ? 'निजी वॉल्ट उपलब्ध नहीं है' : 'Private vault unavailable'}
          </h1>
          <p className="text-body text-text-secondary mb-4">
            {isHindi
              ? 'हम आपकी वॉल्ट नहीं खोल पाए। आपका दुकान डेटा नहीं बदला गया।'
              : vaultError || 'We could not check your vault. Your shop data has not been opened.'}
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary mb-3">
            {isHindi ? 'फिर से कोशिश करें' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'language') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-8 bg-bg animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
          <ShieldCheck size={30} />
        </div>
        <div className="w-full max-w-sm">
          <h1 className="text-screen-title text-text text-center mb-2">
            Choose your language
          </h1>
          <p className="text-body text-text-secondary text-center mb-6">
            अपनी भाषा चुनें
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => chooseLanguage('en')}
              className={`rounded-2xl border-2 p-5 text-center transition-colors ${!isHindi ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              aria-pressed={!isHindi}
            >
              <span className="block text-lg font-semibold text-text">English</span>
              <span className="block text-xs text-text-secondary mt-1">Continue in English</span>
            </button>
            <button
              type="button"
              onClick={() => chooseLanguage('hi')}
              className={`rounded-2xl border-2 p-5 text-center transition-colors ${isHindi ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              aria-pressed={isHindi}
            >
              <span className="block text-lg font-semibold text-text">हिंदी</span>
              <span className="block text-xs text-text-secondary mt-1">हिंदी में आगे बढ़ें</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('vault')}
            className="btn-primary w-full"
          >
            {isHindi ? 'आगे बढ़ें' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 bg-bg animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {isNewVault ? <ShieldCheck size={30} /> : <LockKeyhole size={30} />}
      </div>
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setStep('language')}
            className="text-sm font-semibold text-primary"
          >
            {isHindi ? 'भाषा बदलें' : 'Change language'}
          </button>
        </div>

        <h1 className="text-screen-title text-text text-center mb-2">
          {isNewVault
            ? (isHindi ? 'अपनी निजी वॉल्ट बनाएँ' : 'Create your private vault')
            : (isHindi ? 'अपनी निजी वॉल्ट खोलें' : 'Unlock your private vault')}
        </h1>
        <p className="text-body text-text-secondary text-center mb-6">
          {isNewVault
            ? (isHindi
              ? 'आपकी दुकान का डेटा ऑनलाइन सेव होने से पहले इसी डिवाइस पर एन्क्रिप्ट होगा। ऐसा पासफ़्रेज़ चुनें जिसे केवल आप जानते हों।'
              : 'Your shop records will be encrypted on this device before they are saved online. Choose a passphrase only you know.')
            : (isHindi
              ? 'अपनी वॉल्ट खोलने के लिए वही पासफ़्रेज़ डालें जो आपने बनाते समय चुना था।'
              : 'Enter the passphrase you created for this vault.')}
        </p>
        {vaultError && (
          <p className="text-small text-warning text-center mb-3" role="status">
            {isHindi
              ? 'क्लाउड उपलब्ध नहीं है। सेव की गई एन्क्रिप्टेड कॉपी खुलने पर सिंक फिर शुरू होगा।'
              : vaultError}
          </p>
        )}

        <label className="text-small font-medium text-text block mb-2" htmlFor="vault-passphrase">
          {isHindi ? 'निजी वॉल्ट पासफ़्रेज़' : 'Private vault passphrase'}
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
            placeholder={isHindi ? 'कम से कम 12 अक्षर' : 'At least 12 characters'}
          />
          <button
            type="button"
            onClick={() => setShowPassphrase((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={showPassphrase ? (isHindi ? 'पासफ़्रेज़ छिपाएँ' : 'Hide passphrase') : (isHindi ? 'पासफ़्रेज़ दिखाएँ' : 'Show passphrase')}
            aria-pressed={showPassphrase}
            title={showPassphrase ? (isHindi ? 'पासफ़्रेज़ छिपाएँ' : 'Hide passphrase') : (isHindi ? 'पासफ़्रेज़ दिखाएँ' : 'Show passphrase')}
          >
            {showPassphrase ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {isNewVault && (
          <>
            <label className="text-small font-medium text-text block mb-2" htmlFor="vault-confirmation">
              {isHindi ? 'पासफ़्रेज़ की पुष्टि करें' : 'Confirm passphrase'}
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
                placeholder={isHindi ? 'दोबारा डालें' : 'Enter it again'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                aria-label={showConfirmation ? (isHindi ? 'पुष्टि वाला पासफ़्रेज़ छिपाएँ' : 'Hide confirmation passphrase') : (isHindi ? 'पुष्टि वाला पासफ़्रेज़ दिखाएँ' : 'Show confirmation passphrase')}
                aria-pressed={showConfirmation}
                title={showConfirmation ? (isHindi ? 'पासफ़्रेज़ छिपाएँ' : 'Hide passphrase') : (isHindi ? 'पासफ़्रेज़ दिखाएँ' : 'Show passphrase')}
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
          {busy
            ? (isHindi ? 'डेटा सुरक्षित किया जा रहा है…' : 'Securing your data…')
            : isNewVault
              ? (isHindi ? 'एन्क्रिप्टेड वॉल्ट बनाएँ' : 'Create encrypted vault')
              : (isHindi ? 'मेरा डेटा खोलें' : 'Unlock my data')}
        </button>

        <div className="card mt-4">
          <p className="text-small text-text-secondary">
            <strong>{isHindi ? 'ज़रूरी बात:' : 'Important:'}</strong>{' '}
            {isHindi
              ? 'यह पासफ़्रेज़ वापस नहीं पाया जा सकता। भूलने पर एन्क्रिप्टेड क्लाउड बैकअप नहीं खुलेगा। इसे सुरक्षित जगह पर लिखकर रखें।'
              : 'This passphrase is not recoverable by Dukaan Dost. If you forget it, the encrypted cloud backup cannot be decrypted. Keep it somewhere safe and private.'}
          </p>
        </div>

        <p className="text-small text-text-secondary text-center mt-4">
          {isHindi
            ? 'अकाउंट बदलने और पासफ़्रेज़ रिकवर करने की सुविधा असली फ़ोन वेरिफ़िकेशन के बाद उपलब्ध होगी।'
            : 'Account switching and passphrase recovery will be available after verified phone sign-in is integrated.'}
        </p>
      </div>
    </div>
  );
}
