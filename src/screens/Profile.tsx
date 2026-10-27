import React, { useState } from 'react';
import { useStore, formatRupee, getTotalUdhaar } from '../store';
import { t, tArray } from '../i18n';
import { ArrowLeft, Globe, Moon, Sun, Lock, Shield, Download, Trash2, Share2, HelpCircle, Bell, Type, Clock, Info } from 'lucide-react';

// ============ PROFILE SCREEN ============
export function ProfileScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  
  const profile = state.shopProfile;
  const totalUdhaar = getTotalUdhaar(state.udhaar);
  
  if (showPrivacy) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => setShowPrivacy(false)} className="w-12 h-12 rounded-full flex items-center justify-center">
            <span className="text-body">←</span>
          </button>
          <h2 className="text-body-lg font-bold text-text flex-1">{t('privacyTitle', lang)}</h2>
        </div>
        <div className="flex-1 scroll-area px-5 py-3">
          <div className="text-5xl text-center mb-3">🔒</div>
          <p className="text-body text-text-secondary mb-4 text-center">{t('privacyDesc', lang)}</p>
          <div className="space-y-3">
            {tArray('privacyPoints', lang).map((point, i) => (
              <div key={i} className="card flex items-center gap-3 h-14 px-4">
                <span className="text-positive text-2xl flex-shrink-0">✓</span>
                <p className="text-body text-text">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (showPin) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => setShowPin(false)} className="w-12 h-12 rounded-full flex items-center justify-center">
            <span className="text-body">←</span>
          </button>
          <h2 className="text-body-lg font-bold text-text flex-1">{t('appLock', lang)}</h2>
        </div>
        <div className="flex-1 scroll-area px-5 py-3">
          <p className="text-body text-text-secondary mb-4">
            {lang === 'hi' ? '4 अंक का PIN लगाएँ। यह तब काम आएगा जब फ़ोन किसी और के हाथ में हो।' : 'Set a 4-digit PIN. Useful when phone is with family or staff.'}
          </p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="input-field text-center text-hero tracking-[1em] mb-4"
            placeholder="••••"
          />
          <button
            onClick={() => {
              dispatch({ type: 'SET_LOCK', payload: { enabled: pin.length === 4, pin } });
              setShowPin(false);
            }}
            disabled={pin.length !== 4}
            className="btn-primary"
          >
            <Lock size={20} /> {t('save', lang)}
          </button>
          {state.lockEnabled && (
            <button
              onClick={() => {
                dispatch({ type: 'SET_LOCK', payload: { enabled: false, pin: '' } });
                setShowPin(false);
              }}
              className="btn-secondary mt-3 text-problem border-problem"
            >
              {lang === 'hi' ? 'लॉक हटाएँ' : 'Remove Lock'}
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{t('profileTitle', lang)}</h1>
      </div>
      
      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Shop card */}
        <div className="card mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-lg font-bold text-text truncate">
                {profile.shopName || (profile.shopType ? t(`st_${profile.shopType}` as any, lang) : (lang === 'hi' ? 'मेरी दुकान' : 'My Shop'))}
              </p>
              <p className="text-small text-text-secondary">{profile.city || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg rounded-xl p-3">
              <p className="text-small text-text-secondary">{lang === 'hi' ? 'बिक्री (इस महीने)' : 'Sales (this month)'}</p>
              <p className="text-body font-bold text-text">{formatRupee(state.sales.reduce((s, e) => s + e.amount, 0))}</p>
            </div>
            <div className="bg-bg rounded-xl p-3">
              <p className="text-small text-text-secondary">{lang === 'hi' ? 'उधार बाकी' : 'Udhaar pending'}</p>
              <p className="text-body font-bold text-warning">{formatRupee(totalUdhaar)}</p>
            </div>
          </div>
        </div>
        
        {/* Settings */}
        <div className="space-y-3">
          {/* Language */}
          <button
            onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: lang === 'en' ? 'hi' : 'en' })}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            <Globe size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('language', lang)}</p>
              <p className="text-small text-text-secondary">{lang === 'en' ? 'English' : 'हिंदी'}</p>
            </div>
            <span className="text-primary text-small flex-shrink-0">{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
          
          {/* Dark Mode */}
          <button
            onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' })}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            {state.theme === 'light' ? <Moon size={24} className="text-primary flex-shrink-0" /> : <Sun size={24} className="text-accent flex-shrink-0" />}
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('darkMode', lang)}</p>
              <p className="text-small text-text-secondary">{state.theme === 'light' ? (lang === 'hi' ? 'बंद' : 'Off') : (lang === 'hi' ? 'चालू' : 'On')}</p>
            </div>
          </button>
          
          {/* Text Size */}
          <button
            onClick={() => dispatch({ type: 'SET_TEXT_SIZE', payload: state.textSize === 'normal' ? 'large' : 'normal' })}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            <Type size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('textSizeLabel', lang)}</p>
              <p className="text-small text-text-secondary">{state.textSize === 'normal' ? t('normal', lang) : t('large', lang)}</p>
            </div>
          </button>
          
          {/* Reminder Time */}
          <button
            onClick={() => {
              const times = ['19:00', '20:00', '21:00', '22:00'];
              const currentIdx = times.indexOf(state.reminderTime);
              const next = times[(currentIdx + 1) % times.length];
              dispatch({ type: 'SET_REMINDER_TIME', payload: next });
            }}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            <Clock size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('reminderTime', lang)}</p>
              <p className="text-small text-text-secondary">{state.reminderTime}</p>
            </div>
          </button>
          
          {/* App Lock */}
          <button onClick={() => setShowPin(true)} className="card w-full flex items-center gap-3 h-16 px-4">
            <Lock size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('appLock', lang)}</p>
              <p className="text-small text-text-secondary">{state.lockEnabled ? (lang === 'hi' ? 'चालू' : 'On') : (lang === 'hi' ? 'बंद' : 'Off')}</p>
            </div>
          </button>
          
          {/* Privacy */}
          <button onClick={() => setShowPrivacy(true)} className="card w-full flex items-center gap-3 h-16 px-4">
            <Shield size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('privacy', lang)}</p>
            </div>
          </button>
          
          {/* Export Data */}
          <button
            onClick={() => {
              const data = JSON.stringify(state, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dukaandost-data.json';
              a.click();
            }}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            <Download size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('exportData', lang)}</p>
            </div>
          </button>
          
          {/* Share App */}
          <button
            onClick={() => {
              const msg = lang === 'hi'
                ? 'दुकानदोस्त ऐप आज़माओ — दुकान का हिसाब और सलाह, मुफ़्त! https://dukaandost.app'
                : 'Try DukaanDost app — smart business advisor for shops, free! https://dukaandost.app';
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="card w-full flex items-center gap-3 h-16 px-4"
          >
            <Share2 size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('shareApp', lang)}</p>
            </div>
          </button>
          
          {/* Help */}
          <button className="card w-full flex items-center gap-3 h-16 px-4">
            <HelpCircle size={24} className="text-primary flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-text">{t('help', lang)}</p>
              <p className="text-small text-text-secondary">{lang === 'hi' ? 'कॉल या WhatsApp करें' : 'Call or WhatsApp us'}</p>
            </div>
          </button>
          
          {/* Delete Data */}
          <button
            onClick={() => {
              if (confirm(lang === 'hi' ? 'क्या आप सच में सब डेटा मिटाना चाहते हैं? यह वापस नहीं आएगा।' : 'Delete all data? This cannot be undone.')) {
                dispatch({ type: 'DELETE_ALL_DATA' });
              }
            }}
            className="card w-full flex items-center gap-3 h-16 px-4 border-red-200"
          >
            <Trash2 size={24} className="text-problem flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-medium text-problem">{t('deleteData', lang)}</p>
            </div>
          </button>
        </div>
        
        {/* About */}
        <div className="mt-6 text-center">
          <p className="text-small text-text-secondary">DukaanDost v1.0</p>
          <p className="text-small text-text-secondary mt-1">
            {lang === 'hi' ? 'भारतीय दुकानदारों के लिए बनाया गया ❤️' : 'Made with ❤️ for Indian shopkeepers'}
          </p>
        </div>
      </div>
    </div>
  );
}
