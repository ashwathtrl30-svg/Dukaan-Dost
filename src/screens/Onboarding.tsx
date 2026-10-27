import React, { useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { t } from '../i18n';
import { ShopType, Duration, Ownership, MonthlySales, UdhaarLevel, AccountingMethod, Worry } from '../types';
import { ArrowLeft, Check, MapPin, SkipForward } from 'lucide-react';

// Shop type emojis for visual cards
const shopTypeEmojis: Record<ShopType, string> = {
  kirana: '🏪', medical: '💊', bakery: '🍰', sweet: '🍬', tailor: '🧵',
  salon: '💇', hardware: '🔧', mobile: '📱', vegetable: '🥬', tea: '🍵',
  restaurant: '🍽️', other: '🏢',
};

// ============ LANGUAGE SCREEN ============
export function LanguageScreen() {
  const { dispatch } = useStore();
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 animate-fade-in" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #E8F5E9 100%)' }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(11, 122, 75, 0.3)' }}>
          <span className="text-4xl">🏪</span>
        </div>
        <h1 className="text-screen-title text-text mb-1">DukaanDost</h1>
        <p className="text-body-lg text-primary font-semibold mb-1">दुकानदोस्त</p>
        <p className="text-secondary text-text-secondary">Your Shop's Smart Advisor</p>
      </div>
      
      <p className="text-body-lg text-text text-center mb-6 font-medium">
        {t('chooseLanguage', 'en')}
      </p>
      
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'en' })}
          className="btn-primary text-body-lg"
        >
          🇬🇧 English
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'hi' })}
          className="btn-primary text-body-lg"
          style={{ backgroundColor: '#F59E0B', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
        >
          🇮🇳 हिंदी
        </button>
      </div>
      
      <p className="text-small text-text-secondary mt-8 text-center">
        Made with ❤️ for Indian shopkeepers
      </p>
    </div>
  );
}

// ============ WELCOME SCREEN ============
export function WelcomeScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 animate-fade-in" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #FFF8E1 100%)' }}>
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
          <span className="text-5xl">🤝</span>
        </div>
        <h1 className="text-screen-title text-text mb-3">
          {t('welcome', lang)}
        </h1>
        <p className="text-body text-text-secondary leading-relaxed">
          {t('welcomePromise', lang)}
        </p>
      </div>
      
      {/* Feature highlights */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-2xl">💰</span>
          <span className="text-body">{lang === 'hi' ? 'बिक्री और खर्च का हिसाब' : 'Track sales & expenses'}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-2xl">💡</span>
          <span className="text-body">{lang === 'hi' ? 'समझदार सलाह' : 'Smart advice for your shop'}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-2xl">🗣️</span>
          <span className="text-body">{lang === 'hi' ? 'हिंदी या अंग्रेज़ी में पूछें' : 'Ask in Hindi or English'}</span>
        </div>
      </div>
      
      <div className="w-full max-w-sm mt-auto">
        <button
          onClick={() => dispatch({ type: 'SET_ONBOARDING_STEP', payload: 2 })}
          className="btn-primary text-body-lg"
        >
          {t('getStarted', lang)} →
        </button>
        <p className="text-small text-text-secondary text-center mt-3">
          {lang === 'hi' ? '2 मिनट में शुरू • कोई पासवर्ड नहीं' : 'Starts in 2 minutes • No password needed'}
        </p>
      </div>
    </div>
  );
}

// ============ PHONE LOGIN ============
export function PhoneScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fullPhone = `+91${phone}`;

  const handleSendOtp = async () => {
    setError('');
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!supabase) {
      setError('Secure sign-in is not configured. Please try again after the app settings are updated.');
      return;
    }

    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (authError) throw authError;
      dispatch({ type: 'SET_PHONE', payload: fullPhone });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the verification code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (otp.length !== 6 || !supabase) return;
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      if (authError) throw authError;
      if (!data.session || !data.user) {
        throw new Error('The code was not accepted. Please request a new one and try again.');
      }
      dispatch({ type: 'SET_PHONE', payload: fullPhone });
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col px-5 pt-4 bg-bg animate-fade-in">
      <button
        onClick={() => { setError(''); setStep('phone'); dispatch({ type: 'SET_ONBOARDING_STEP', payload: 1 }); }}
        className="flex items-center gap-2 text-primary mb-6 h-12"
      >
        <ArrowLeft size={24} /> <span className="text-body">{t('back', lang)}</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-5xl mb-4 text-center">📱</div>

        {step === 'phone' ? (
          <>
            <h2 className="text-section-title text-text mb-2">{t('phoneTitle', lang)}</h2>
            <p className="text-body text-text-secondary mb-4">{t('phoneDesc', lang)}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="card font-semibold">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="XXXXX XXXXX"
                className="input-field text-body text-center tracking-wider"
                autoComplete="tel-national"
                autoFocus
              />
            </div>
            {error && <p role="alert" className="text-small text-problem mb-3">{error}</p>}
            <button onClick={() => { void handleSendOtp(); }} disabled={busy || phone.length !== 10} className="btn-primary">
              {busy ? 'Sending code…' : t('sendOtp', lang)}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-section-title text-text mb-2">{t('enterOtp', lang)}</h2>
            <p className="text-body text-text-secondary mb-4">{t('otpSent', lang)} +91 {phone}</p>
            <input
              type="tel"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="______"
              className="input-field text-body text-center tracking-[0.5em] mb-4"
              autoComplete="one-time-code"
              autoFocus
            />
            {error && <p role="alert" className="text-small text-problem mb-3">{error}</p>}
            <button onClick={() => { void handleVerify(); }} disabled={busy || otp.length !== 6} className="btn-primary mb-3">
              {busy ? 'Verifying…' : t('verify', lang)}
            </button>
            <button onClick={() => { void handleSendOtp(); }} disabled={busy} className="btn-text mx-auto">
              {t('resend', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============ SHOP INTERVIEW ============
export function InterviewScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const totalQuestions = 10;
  const currentQ = state.onboardingStep - 3;
  
  const goNext = () => {
    if (currentQ < totalQuestions - 1) {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
    } else {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: 13 });
    }
  };
  
  const goBack = () => {
    if (currentQ > 0) {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep - 1 });
    }
  };
  
  const skip = () => goNext();
  
  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Progress bar */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-small font-medium text-text-secondary">
            {currentQ + 1} {t('interviewProgress', lang)} {totalQuestions}
          </span>
          {currentQ >= 2 && (
            <button onClick={skip} className="btn-text text-small">
              <SkipForward size={14} /> {t('skip', lang)}
            </button>
          )}
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }} />
        </div>
      </div>
      
      {/* Question content */}
      <div className="flex-1 scroll-area px-5 py-3">
        {currentQ === 0 && <ShopTypeQuestion />}
        {currentQ === 1 && <ShopNameQuestion />}
        {currentQ === 2 && <CityQuestion />}
        {currentQ === 3 && <DurationQuestion />}
        {currentQ === 4 && <OwnershipQuestion />}
        {currentQ === 5 && <WorkersQuestion />}
        {currentQ === 6 && <MonthlySalesQuestion />}
        {currentQ === 7 && <UdhaarQuestion />}
        {currentQ === 8 && <AccountingQuestion />}
        {currentQ === 9 && <WorriesQuestion />}
      </div>
      
      {/* Back button */}
      {currentQ > 0 && (
        <div className="px-5 pb-4 safe-bottom">
          <button onClick={goBack} className="btn-secondary">
            <ArrowLeft size={20} /> {t('back', lang)}
          </button>
        </div>
      )}
    </div>
  );
}

// Individual question components
function ShopTypeQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const types: ShopType[] = ['kirana', 'medical', 'bakery', 'sweet', 'tailor', 'salon', 'hardware', 'mobile', 'vegetable', 'tea', 'restaurant', 'other'];
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_shopType', lang)}</h2>
      <div className="grid grid-cols-2 gap-3">
        {types.map(type => (
          <button
            key={type}
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { shopType: type } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className={`card flex flex-col items-center justify-center h-20 transition-all ${
              state.shopProfile.shopType === type ? 'ring-2 ring-primary bg-green-50' : ''
            }`}
          >
            <span className="text-3xl mb-1">{shopTypeEmojis[type]}</span>
            <span className="text-small font-medium text-center leading-tight">{t(`st_${type}` as any, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ShopNameQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [name, setName] = useState(state.shopProfile.shopName);
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-2">{t('q_shopName', lang)}</h2>
      <p className="text-secondary text-text-secondary mb-4">{t('q_shopNameOptional', lang)}</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { shopName: name } })}
        placeholder={lang === 'hi' ? 'जैसे: शर्मा जनरल स्टोर' : 'e.g. Sharma General Store'}
        className="input-field text-body mb-4"
        autoFocus
      />
      <button
        onClick={() => {
          dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { shopName: name } });
          dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
        }}
        className="btn-primary"
      >
        {t('next', lang)} →
      </button>
    </div>
  );
}

function CityQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [city, setCity] = useState(state.shopProfile.city);
  const [showSuggestion, setShowSuggestion] = useState(true);
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_city', lang)}</h2>
      
      {showSuggestion && (
        <div className="card mb-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-secondary text-text-secondary">{t('q_citySuggest', lang)}</p>
              <p className="text-body font-bold">Delhi</p>
            </div>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { city: 'Delhi' } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className="btn-primary text-body"
          >
            <Check size={18} /> {t('q_cityConfirm', lang)}
          </button>
          <button
            onClick={() => setShowSuggestion(false)}
            className="btn-text w-full mt-2"
          >
            {t('q_cityChange', lang)}
          </button>
        </div>
      )}
      
      {!showSuggestion && (
        <>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={lang === 'hi' ? 'शहर का नाम' : 'City name'}
            className="input-field text-body mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { city } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className="btn-primary"
          >
            {t('next', lang)} →
          </button>
        </>
      )}
    </div>
  );
}

function DurationQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const options: Duration[] = ['under1', '1to5', '5to10', 'over10'];
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_duration', lang)}</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { duration: opt } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className={`card w-full text-left text-body font-medium h-14 flex items-center px-4 ${
              state.shopProfile.duration === opt ? 'ring-2 ring-primary' : ''
            }`}
          >
            {t(`d_${opt}` as any, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

function OwnershipQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_ownership', lang)}</h2>
      <div className="space-y-3">
        <button
          onClick={() => {
            dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { ownership: 'own' } });
            dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
          }}
          className="card w-full text-left text-body font-medium h-18 flex items-center gap-4 px-4"
        >
          <span className="text-3xl">🏠</span> {t('o_own', lang)}
        </button>
        <button
          onClick={() => {
            dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { ownership: 'rent' } });
            dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
          }}
          className="card w-full text-left text-body font-medium h-18 flex items-center gap-4 px-4"
        >
          <span className="text-3xl">🔑</span> {t('o_rent', lang)}
        </button>
      </div>
    </div>
  );
}

function WorkersQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [count, setCount] = useState(state.shopProfile.workers);
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-6">{t('q_workers', lang)}</h2>
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => setCount(Math.max(1, count - 1))}
          className="w-14 h-14 rounded-full bg-border flex items-center justify-center text-2xl font-bold"
        >
          −
        </button>
        <span className="text-hero text-text">{count}</span>
        <button
          onClick={() => setCount(Math.min(50, count + 1))}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold"
        >
          +
        </button>
      </div>
      <button
        onClick={() => {
          dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { workers: count } });
          dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
        }}
        className="btn-primary"
      >
        {t('next', lang)} →
      </button>
    </div>
  );
}

function MonthlySalesQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const options: MonthlySales[] = ['under50k', '50kto1L', '1Lto3L', '3Lto5L', '5Lto10L', 'over10L'];
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_monthlySales', lang)}</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { monthlySales: opt } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className={`card w-full text-left text-body font-medium h-14 flex items-center px-4 ${
              state.shopProfile.monthlySales === opt ? 'ring-2 ring-primary' : ''
            }`}
          >
            {t(`ms_${opt}` as any, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

function UdhaarQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const options: UdhaarLevel[] = ['never', 'sometimes', 'often'];
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_udhaar', lang)}</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { udhaarLevel: opt } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className={`card w-full text-left text-body font-medium h-14 flex items-center px-4 ${
              state.shopProfile.udhaarLevel === opt ? 'ring-2 ring-primary' : ''
            }`}
          >
            {t(`u_${opt}` as any, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountingQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const options: AccountingMethod[] = ['memory', 'notebook', 'app', 'nothing'];
  const emojis = { memory: '🧠', notebook: '📓', app: '📱', nothing: '❌' };
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-4">{t('q_accounting', lang)}</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { accounting: opt } });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 });
            }}
            className={`card w-full text-left text-body font-medium h-14 flex items-center gap-3 px-4 ${
              state.shopProfile.accounting === opt ? 'ring-2 ring-primary' : ''
            }`}
          >
            <span className="text-2xl">{emojis[opt]}</span> {t(`a_${opt}` as any, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorriesQuestion() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const options: Worry[] = ['low_profit', 'too_much_stock', 'customers_not_paying', 'rising_costs', 'competition', 'no_time', 'dont_know'];
  const selected = state.shopProfile.worries;
  
  const toggle = (w: Worry) => {
    const newWorries = selected.includes(w)
      ? selected.filter(x => x !== w)
      : [...selected, w];
    dispatch({ type: 'UPDATE_SHOP_PROFILE', payload: { worries: newWorries } });
  };
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-section-title text-text mb-2">{t('q_worries', lang)}</h2>
      <p className="text-secondary text-text-secondary mb-4">{t('q_worriesHint', lang)}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`chip ${selected.includes(opt) ? 'chip-active' : ''}`}
          >
            {t(`w_${opt}` as any, lang)}
          </button>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_ONBOARDING_STEP', payload: state.onboardingStep + 1 })}
        className="btn-primary"
      >
        {t('next', lang)} →
      </button>
    </div>
  );
}

// ============ PROFILE SUMMARY ============
export function ProfileSummaryScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const profile = state.shopProfile;
  
  const fields = [
    { label: t('q_shopType', lang), value: profile.shopType ? t(`st_${profile.shopType}` as any, lang) : '—', step: 3 },
    { label: t('q_shopName', lang), value: profile.shopName || '—', step: 4 },
    { label: t('q_city', lang), value: profile.city || '—', step: 5 },
    { label: t('q_duration', lang), value: profile.duration ? t(`d_${profile.duration}` as any, lang) : '—', step: 6 },
    { label: t('q_ownership', lang), value: profile.ownership ? t(`o_${profile.ownership}` as any, lang) : '—', step: 7 },
    { label: t('q_workers', lang), value: String(profile.workers), step: 8 },
    { label: t('q_monthlySales', lang), value: profile.monthlySales ? t(`ms_${profile.monthlySales}` as any, lang) : '—', step: 9 },
    { label: t('q_udhaar', lang), value: profile.udhaarLevel ? t(`u_${profile.udhaarLevel}` as any, lang) : '—', step: 10 },
    { label: t('q_accounting', lang), value: profile.accounting ? t(`a_${profile.accounting}` as any, lang) : '—', step: 11 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex-1 scroll-area px-5 pt-4">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">✅</div>
          <h2 className="text-section-title text-text">{t('profileSummary', lang)}</h2>
        </div>
        
        <div className="space-y-3 mb-6">
          {fields.map((field, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: 'SET_ONBOARDING_STEP', payload: field.step })}
              className="card w-full text-left flex justify-between items-center h-16 px-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-small text-text-secondary">{field.label}</p>
                <p className="text-body font-semibold text-text truncate">{field.value}</p>
              </div>
              <span className="text-primary text-small flex-shrink-0 ml-2">{t('editAnswer', lang)}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-5 pb-4 safe-bottom">
        <button
          onClick={() => {
            dispatch({ type: 'SET_ONBOARDING_STEP', payload: 14 });
          }}
          className="btn-primary text-body-lg"
        >
          {t('confirmProfile', lang)} ✓
        </button>
      </div>
    </div>
  );
}

// ============ WELCOME TOUR ============
export function TourScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [tourStep, setTourStep] = useState(0);
  
  const tours = [
    { emoji: '💰', title: t('tour1Title', lang), desc: t('tour1Desc', lang), bg: 'linear-gradient(180deg, #E8F5E9 0%, #FAF7F2 100%)' },
    { emoji: '💡', title: t('tour2Title', lang), desc: t('tour2Desc', lang), bg: 'linear-gradient(180deg, #FFF8E1 0%, #FAF7F2 100%)' },
    { emoji: '🗣️', title: t('tour3Title', lang), desc: t('tour3Desc', lang), bg: 'linear-gradient(180deg, #E3F2FD 0%, #FAF7F2 100%)' },
  ];
  
  const current = tours[tourStep];
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 animate-fade-in" style={{ background: current.bg }}>
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center mb-6 shadow-lg">
          <span className="text-5xl">{current.emoji}</span>
        </div>
        <h2 className="text-section-title text-text mb-3">{current.title}</h2>
        <p className="text-body text-text-secondary leading-relaxed max-w-xs">{current.desc}</p>
      </div>
      
      {/* Dots */}
      <div className="flex gap-2 mb-6">
        {tours.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === tourStep ? 'bg-primary w-6' : 'bg-border w-2'}`} />
        ))}
      </div>
      
      <div className="w-full max-w-sm space-y-3">
        {tourStep < 2 ? (
          <button onClick={() => setTourStep(tourStep + 1)} className="btn-primary text-body-lg">
            {t('tourNext', lang)} →
          </button>
        ) : (
          <button
            onClick={() => {
              dispatch({ type: 'COMPLETE_ONBOARDING' });
              dispatch({ type: 'SET_ONBOARDING_STEP', payload: 0 });
            }}
            className="btn-primary text-body-lg"
          >
            {t('tourDone', lang)} 🎉
          </button>
        )}
        <button
          onClick={() => {
            dispatch({ type: 'COMPLETE_ONBOARDING' });
            dispatch({ type: 'SET_ONBOARDING_STEP', payload: 0 });
          }}
          className="btn-text w-full"
        >
          {t('tourSkip', lang)}
        </button>
      </div>
    </div>
  );
}
