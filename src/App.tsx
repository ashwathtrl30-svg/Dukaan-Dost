import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore, generateId, getToday, formatRupee } from './store';
import { VoiceMicButton } from './components/VoiceMicButton';
import { interpretVoiceTransactions } from './voice/voiceInterpreter';
import type { VoiceInterpretation } from './voice/voiceInterpreter';
import { getSaleCountCopy, getSaleItemCountFromQuantity, parseSaleQuantityInput } from './quantity';
import { t } from './i18n';
import { HomeScreen } from './screens/Home';

const LanguageScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.LanguageScreen })));
const WelcomeScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.WelcomeScreen })));
const PhoneScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.PhoneScreen })));
const InterviewScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.InterviewScreen })));
const ProfileSummaryScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.ProfileSummaryScreen })));
const TourScreen = lazy(() => import('./screens/Onboarding').then(module => ({ default: module.TourScreen })));
const InsightsScreen = lazy(() => import('./screens/Insights').then(module => ({ default: module.InsightsScreen })));
const AskScreen = lazy(() => import('./screens/Ask').then(module => ({ default: module.AskScreen })));
const ToolsScreen = lazy(() => import('./screens/Tools').then(module => ({ default: module.ToolsScreen })));
const LearnScreen = lazy(() => import('./screens/Learn').then(module => ({ default: module.LearnScreen })));
const ProfileScreen = lazy(() => import('./screens/Profile').then(module => ({ default: module.ProfileScreen })));
import { Home, BarChart3, MessageCircle, Wrench, BookOpen, User, WifiOff, Check, X, Lock, Eye, EyeOff } from 'lucide-react';

type Tab = 'home' | 'insights' | 'ask' | 'tools' | 'learn';

function AppContent() {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [homeVoiceStatus, setHomeVoiceStatus] = useState('');
  const [homeVoiceDraft, setHomeVoiceDraft] = useState('');
  const [homeVoiceListening, setHomeVoiceListening] = useState(false);
  const [homeVoiceParsing, setHomeVoiceParsing] = useState(false);
  const homeVoiceRequestVersion = useRef(0);
  const [homeVoiceAIResult, setHomeVoiceAIResult] = useState<VoiceInterpretation | null>(null);
  const [voiceUndoEntries, setVoiceUndoEntries] = useState<Array<{ type: 'sale' | 'expense' | 'udhaar'; id: string }>>([]);
  const lang = state.language || 'en';
  const hasValidAppLock = state.lockEnabled && /^\d{4}$/.test(state.lockPin);
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => !hasValidAppLock);
  const [unlockPin, setUnlockPin] = useState('');
  const [showUnlockPin, setShowUnlockPin] = useState(true);
  const [unlockError, setUnlockError] = useState('');

  // A configured PIN must be entered after a fresh app load. Disabling the lock
  // immediately restores access; PIN credentials stay local to this device.
  useEffect(() => {
    if (!state.lockEnabled || !/^\d{4}$/.test(state.lockPin)) {
      setIsAppUnlocked(true);
      setUnlockPin('');
      setUnlockError('');
    }
  }, [state.lockEnabled, state.lockPin]);

  // Re-lock whenever the app is backgrounded or the page is being left.
  useEffect(() => {
    if (!hasValidAppLock) return;

    const lockApp = () => {
      setIsAppUnlocked(false);
      setUnlockPin('');
      setUnlockError('');
      setShowUnlockPin(true);
    };
    const lockWhenHidden = () => {
      if (document.visibilityState === 'hidden') lockApp();
    };

    document.addEventListener('visibilitychange', lockWhenHidden);
    window.addEventListener('pagehide', lockApp);
    return () => {
      document.removeEventListener('visibilitychange', lockWhenHidden);
      window.removeEventListener('pagehide', lockApp);
    };
  }, [hasValidAppLock]);

  const showTemporaryVoiceStatus = (message: string) => {
    setHomeVoiceStatus(message);
    window.setTimeout(() => {
      setHomeVoiceStatus((current) => current === message ? '' : current);
    }, 8000);
  };

  const handleHomeVoiceTranscript = (transcript: string) => {
    // Any new speech invalidates an interpretation already in flight.
    homeVoiceRequestVersion.current += 1;
    setHomeVoiceDraft(transcript);
    setHomeVoiceAIResult(null);
  };

  const voiceErrorMessage = (error: string | undefined): string => {
    if (lang === 'hi') {
      if (error === 'too_many_entries') return 'एक बार में अधिकतम 5 एंट्री जोड़ सकता हूँ। कुछ भी नहीं जोड़ा गया। कृपया 5 या उससे कम एंट्री बोलें।';
      if (error === 'amount_out_of_range') return 'अधिकतम रकम ₹1 करोड़ तक हो सकती है। कुछ भी नहीं जोड़ा गया। रकम फिर से बोलें।';
      if (error === 'missing_item') return 'किस सामान या सेवा की बिक्री हुई, वह साफ़ नहीं समझ आया। कुछ भी नहीं जोड़ा गया। सामान का नाम साफ़ बोलें।';
      if (error === 'missing_quantity') return 'आप बेची गई मात्रा बताना भूल गए। कृपया वास्तविक मात्रा और इकाई बताएँ, जैसे 500 मिलीलीटर या 1 लीटर। अभी कुछ भी सेव नहीं हुआ।';
      if (error === 'missing_customer') return 'उधार के लिए ग्राहक का नाम साफ़ नहीं समझ आया। कुछ भी नहीं जोड़ा गया। ग्राहक का नाम और रकम फिर से बोलें।';
      if (error === 'missing_amount' || error === 'ambiguous_amount') return 'हम आपकी बात साफ़ नहीं समझ पाए। कुछ भी नहीं जोड़ा गया। हर सामान/खर्च/उधार का नाम और रकम साफ़-साफ़ बोलें।';
      if (error === 'no_type') return 'बताइए कि बिक्री, खर्च या उधार में क्या जोड़ना है। कुछ भी नहीं जोड़ा गया।';
      return 'हम आपकी बात साफ़ नहीं सुन पाए। कृपया धीरे और साफ़ बोलकर फिर कोशिश करें।';
    }
    if (error === 'too_many_entries') return 'I can add a maximum of 5 entries at once. Nothing was added. Please split this into batches of 5 or fewer.';
    if (error === 'amount_out_of_range') return 'The maximum supported amount is ₹1 crore. Nothing was added; please say the amount again.';
    if (error === 'missing_item') return 'I could not clearly identify a product or service for every sale. Nothing was added; please say each item name clearly.';
    if (error === 'missing_quantity') return 'You forgot to mention a quantity. Please say the actual quantity and unit, such as 500 ml or 1 litre. Nothing has been saved yet.';
    if (error === 'missing_customer') return 'I could not clearly identify the customer for an udhaar entry. Nothing was added; say each customer name and amount clearly.';
    if (error === 'missing_amount' || error === 'ambiguous_amount') return 'We did not hear you clearly. Nothing was added. Please say each item/customer, amount, and transaction type clearly.';
    if (error === 'no_type') return 'Say whether these entries are sales, expenses, or udhaar. Nothing was added.';
    return 'We did not hear you clearly. Nothing was added. Please speak clearly and try again.';
  };

  const handleHomeVoiceConfirm = async () => {
    if (homeVoiceParsing || !homeVoiceDraft.trim()) return;

    // Interpret first, then require a separate user confirmation before saving.
    if (!homeVoiceAIResult || homeVoiceAIResult.error || !homeVoiceAIResult.transactions.length) {
      const requestVersion = ++homeVoiceRequestVersion.current;
      const requestedTranscript = homeVoiceDraft;
      setHomeVoiceParsing(true);
      try {
        const result = await interpretVoiceTransactions({
          transcript: requestedTranscript,
          shopType: state.shopProfile.shopType,
          language: lang,
        });
        if (requestVersion !== homeVoiceRequestVersion.current) return;
        setHomeVoiceAIResult(result);
        if (!result.transactions.length || result.error) {
          showTemporaryVoiceStatus(result.clarification || voiceErrorMessage(result.error));
        } else {
          showTemporaryVoiceStatus(
            lang === 'hi'
              ? 'AI ने एंट्री समझ ली है। नीचे जाँचें, फिर टिक करके जोड़ें।'
              : 'AI interpretation is ready. Review the entries below, then confirm to save.'
          );
        }
      } catch {
        if (requestVersion !== homeVoiceRequestVersion.current) return;
        setHomeVoiceAIResult({
          transactions: [],
          error: 'unclear',
          clarification: lang === 'hi'
            ? 'AI सेवा अभी उपलब्ध नहीं है। कुछ भी सेव नहीं हुआ। इंटरनेट जाँचकर फिर कोशिश करें।'
            : 'AI interpretation is unavailable right now. Nothing was saved. Check your connection and retry.',
        });
        showTemporaryVoiceStatus(
          lang === 'hi'
            ? 'AI सेवा अभी उपलब्ध नहीं है। कुछ भी सेव नहीं हुआ।'
            : 'AI interpretation is unavailable. Nothing was saved.'
        );
      } finally {
        setHomeVoiceParsing(false);
      }
      return;
    }

    const parsed = homeVoiceAIResult;
    if (!parsed.transactions.length || parsed.error) {
      showTemporaryVoiceStatus(voiceErrorMessage(parsed.error));
      return;
    }
    if (parsed.transactions.some(transaction =>
      transaction.type === 'sale' && transaction.requiresQuantityConfirmation === true
    )) {
      showTemporaryVoiceStatus(
        lang === 'hi'
          ? 'कृपया मात्रा और उसकी इकाई बताएँ। अभी कुछ भी सेव नहीं हुआ।'
          : 'Please provide the quantity and unit. Nothing has been saved yet.'
      );
      return;
    }
    if (parsed.transactions.length > 5) {
      showTemporaryVoiceStatus(voiceErrorMessage('too_many_entries'));
      return;
    }

    const today = getToday();
    const created: Array<{ type: 'sale' | 'expense' | 'udhaar'; id: string }> = [];
    const summaries: string[] = [];

    for (const transaction of parsed.transactions) {
      const id = generateId();
      if (transaction.type === 'sale') {
        const quantity = Number(transaction.quantity);
        const quantityInput = transaction.quantity && transaction.quantityUnit
          ? (transaction.packageCount && transaction.packageUnit
            ? `${transaction.packageCount} ${transaction.packageUnit}, ${quantity} ${transaction.quantityUnit}`
            : `${quantity} ${transaction.quantityUnit}`)
          : '';
        const discreteQuantityCount = quantityInput
          ? getSaleItemCountFromQuantity(parseSaleQuantityInput(quantityInput))
          : null;
        // A measured amount (e.g. 500 ml) is not the number of items sold.
        const numberOfItemsSold = transaction.numberOfItemsSold ||
          transaction.packageCount ||
          discreteQuantityCount ||
          1;
        dispatch({
          type: 'ADD_SALE',
          payload: {
            id,
            date: today,
            amount: transaction.amount,
            itemName: transaction.itemName!.trim(),
            numberOfItemsSold,
            ...(transaction.quantity && transaction.quantityUnit
              ? { quantity, quantityUnit: transaction.quantityUnit }
              : {}),
            ...(transaction.packageCount && transaction.packageUnit
              ? { packageCount: transaction.packageCount, packageUnit: transaction.packageUnit }
              : {}),
            paymentType: 'cash',
            createdAt: Date.now(),
          },
        });
        const quantitySummary = transaction.quantity && transaction.quantityUnit
          ? quantity + ' ' + transaction.quantityUnit
          : '';
        const countSummary = numberOfItemsSold + ' ' + getSaleCountCopy(state.shopProfile.shopType, lang).summaryLabel;
        summaries.push(
          (transaction.itemName || 'Sale') + ' · ' + countSummary +
          (quantitySummary ? ' · ' + quantitySummary : '') + ' · ' + formatRupee(transaction.amount),
        );
        created.push({ type: 'sale', id });
      } else if (transaction.type === 'expense') {
        dispatch({
          type: 'ADD_EXPENSE',
          payload: {
            id,
            date: today,
            amount: transaction.amount,
            category: transaction.expenseCategory || 'other',
            note: transaction.note,
            createdAt: Date.now(),
          },
        });
        summaries.push((transaction.note || transaction.expenseCategory || 'Expense') + ' · ' + formatRupee(transaction.amount));
        created.push({ type: 'expense', id });
      } else {
        dispatch({
          type: 'ADD_UDHAAR',
          payload: {
            id,
            customerName: transaction.customerName!.trim(),
            amount: transaction.amount,
            date: today,
            paid: false,
            createdAt: Date.now(),
          },
        });
        summaries.push((transaction.customerName || 'Customer') + ' · ' + formatRupee(transaction.amount) + ' udhaar');
        created.push({ type: 'udhaar', id });
      }
    }

    if (state.lastEntryDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const nextStreak = state.lastEntryDate === yesterdayStr ? state.streak + 1 : 1;
      dispatch({ type: 'UPDATE_STREAK', payload: { streak: nextStreak, lastDate: today } });
    }

    setVoiceUndoEntries(created);
    setHomeVoiceDraft('');
    setHomeVoiceAIResult(null);
    const message = (lang === 'hi' ? 'जोड़ दिया: ' : 'Added: ') + summaries.join(lang === 'hi' ? ' · ' : ' | ') + '.';
    showTemporaryVoiceStatus(message);
  };

  const undoVoiceEntries = () => {
    voiceUndoEntries.forEach((entry) => {
      dispatch({ type: 'DELETE_ENTRY', payload: { type: entry.type, id: entry.id } });
    });
    setVoiceUndoEntries([]);
    showTemporaryVoiceStatus(lang === 'hi' ? 'आख़िरी वॉइस एंट्री हटा दी।' : 'Undid the last voice entry.');
  };

  // The lock gate is above onboarding and all app screens, so no tab,
  // profile page, or onboarding route can be reached without the local PIN.
  if (hasValidAppLock && !isAppUnlocked) {
    return (
      <div className="h-full min-h-screen flex flex-col items-center justify-center bg-bg px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
            <Lock size={30} />
          </div>
          <h1 className="text-section-title text-text text-center mb-2">
            {lang === 'hi' ? 'ऐप लॉक है' : 'Dukaan Dost is locked'}
          </h1>
          <p className="text-body text-text-secondary text-center mb-6">
            {lang === 'hi' ? 'आगे बढ़ने के लिए अपना 4 अंकों का PIN डालें।' : 'Enter your 4-digit PIN to continue.'}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (unlockPin === state.lockPin) {
                setIsAppUnlocked(true);
                setUnlockPin('');
                setUnlockError('');
              } else {
                setUnlockError(lang === 'hi' ? 'गलत PIN। फिर से कोशिश करें।' : 'Incorrect PIN. Please try again.');
                setUnlockPin('');
              }
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                type={showUnlockPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={4}
                autoFocus
                value={unlockPin}
                onChange={(event) => {
                  setUnlockPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                  setUnlockError('');
                }}
                className="input-field w-full text-center text-hero tracking-[1em] pr-14"
                placeholder="••••"
                aria-label={lang === 'hi' ? '4 अंकों का PIN' : '4-digit PIN'}
              />
              <button
                type="button"
                onClick={() => setShowUnlockPin((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-text-secondary"
                aria-label={showUnlockPin
                  ? (lang === 'hi' ? 'PIN छिपाएँ' : 'Hide PIN')
                  : (lang === 'hi' ? 'PIN दिखाएँ' : 'Show PIN')}
              >
                {showUnlockPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {unlockError && (
              <p className="text-sm text-problem text-center" role="alert">{unlockError}</p>
            )}
            <button type="submit" disabled={unlockPin.length !== 4} className="btn-primary">
              <Lock size={20} /> {lang === 'hi' ? 'अनलॉक करें' : 'Unlock App'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle onboarding flow
  if (!state.language) {
    return <Suspense fallback={null}><LanguageScreen /></Suspense>;
  }

  if (!state.onboardingComplete) {
    const step = state.onboardingStep;
    const OnboardingStep = step === 2
      ? PhoneScreen
      : step >= 3 && step <= 12
        ? InterviewScreen
        : step === 13
          ? ProfileSummaryScreen
          : step === 14
            ? TourScreen
            : WelcomeScreen;
    return <Suspense fallback={null}><OnboardingStep /></Suspense>;
  }

  // Show profile
  if (showProfile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={null}><ProfileScreen /></Suspense>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowProfile(false); }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar with profile icon and home voice entry */}
      <div className="flex items-start justify-end px-5 pt-3 pb-0 bg-bg">
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            aria-label={lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
          >
            <User size={24} className="text-primary" />
          </button>
          {activeTab === 'home' && (
            <>
              <VoiceMicButton
                language={lang}
                shape="circle"
                label={homeVoiceListening
                  ? (lang === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording')
                  : (lang === 'hi' ? 'आवाज़ से एंट्री जोड़ें' : 'Add entries by voice')}
                onTranscript={handleHomeVoiceTranscript}
                onRecordingChange={setHomeVoiceListening}
                onStatus={setHomeVoiceStatus}
              />
              {homeVoiceStatus && (
                <div className="max-w-[220px] text-right" role="status" aria-live="polite">
                  <p className="text-xs leading-snug text-text-secondary break-words">{homeVoiceStatus}</p>
                  {voiceUndoEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={undoVoiceEntries}
                      className="mt-1 text-xs font-semibold text-primary underline"
                    >
                      {lang === 'hi' ? 'वापस करें' : 'Undo'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {activeTab === 'home' && homeVoiceDraft.trim() && !homeVoiceListening && (
        <div className="mx-4 mt-3 p-4 rounded-2xl border border-primary/20 bg-card shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="font-semibold text-text">{lang === 'hi' ? 'एंट्री जोड़ने से पहले जाँचें' : 'Review before adding entries'}</p>
              <p className="text-xs text-text-secondary">{lang === 'hi' ? 'नीचे सुना गया टेक्स्ट ठीक करें। टिक दबाने पर ही एंट्री जोड़ी जाएगी।' : 'Correct the transcript if needed. Entries are added only after you press the checkmark.'}</p>
            </div>
            <button type="button" aria-label={lang === 'hi' ? 'रद्द करें' : 'Cancel voice entry'} onClick={() => { homeVoiceRequestVersion.current += 1; setHomeVoiceDraft(''); setHomeVoiceAIResult(null); }} className="w-9 h-9 rounded-full flex items-center justify-center bg-bg text-text-secondary"><X size={18}/></button>
          </div>
          <textarea
            value={homeVoiceDraft}
            onChange={(event) => { homeVoiceRequestVersion.current += 1; setHomeVoiceDraft(event.target.value); setHomeVoiceAIResult(null); }}
            rows={2}
            className="input-field w-full text-sm"
            aria-label={lang === 'hi' ? 'आवाज़ से पहचाना गया टेक्स्ट' : 'Recognized voice transcript'}
          />
          {(() => {
            const parsed = homeVoiceAIResult;
            const canAdd = !!parsed &&
              !parsed.error &&
              parsed.transactions.length > 0 &&
              parsed.transactions.length <= 5 &&
              !parsed.transactions.some(transaction =>
                transaction.type === 'sale' && transaction.requiresQuantityConfirmation === true
              );
            const hasPreview = !!parsed && parsed.transactions.length > 0 && parsed.transactions.length <= 5;
            const hasMissingQuantity = parsed?.error === 'missing_quantity' ||
              !!parsed?.transactions.some(transaction =>
                transaction.type === 'sale' && transaction.requiresQuantityConfirmation === true
              );
            return (
              <>
                {homeVoiceParsing && (
                  <p className="text-sm text-primary" role="status" aria-live="polite">
                    {lang === 'hi' ? 'आपकी बात समझ रहा हूँ…' : 'Understanding your entry…'}
                  </p>
                )}
                {parsed?.selectedTranscript && (
                  <p className="text-xs text-text-secondary break-words">
                    {lang === 'hi' ? 'AI ने यह टेक्स्ट चुना:' : 'AI interpreted this transcript:'} {parsed.selectedTranscript}
                  </p>
                )}
                {hasPreview ? (
                  <div className="rounded-xl bg-bg p-3 space-y-2">
                    <p className="text-sm font-semibold text-text">
                      {hasMissingQuantity
                        ? (lang === 'hi' ? 'अधूरी एंट्री — मात्रा जोड़ें' : 'Incomplete interpretation — quantity needed')
                        : (lang === 'hi'
                          ? parsed.transactions.length + ' एंट्री तैयार हैं'
                          : parsed.transactions.length + (parsed.transactions.length === 1 ? ' entry ready' : ' entries ready'))}
                    </p>
                    {parsed.transactions.map((transaction, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="text-text font-medium break-words">
                            {transaction.type === 'sale'
                              ? transaction.itemName
                              : transaction.type === 'expense'
                                ? (transaction.note || transaction.expenseCategory || 'Expense')
                                : transaction.customerName}
                          </p>
                          {transaction.type === 'sale' && (
                            <p className="text-xs text-text-secondary">
                              {transaction.numberOfItemsSold
                                ? `${transaction.numberOfItemsSold} ${getSaleCountCopy(state.shopProfile.shopType, lang).summaryLabel}`
                                : ''}
                              {transaction.packageCount && transaction.packageUnit
                                ? ` · ${transaction.packageCount} ${transaction.packageUnit}`
                                : ''}
                              {transaction.quantity && transaction.quantityUnit
                                ? ` · ${transaction.quantity} ${transaction.quantityUnit}`
                                : ''}
                            </p>
                          )}
                          {transaction.type === 'udhaar' && (
                            <p className="text-xs text-text-secondary">
                              {lang === 'hi' ? 'उधार' : 'Udhaar'}
                            </p>
                          )}
                        </div>
                        <p className="text-text font-semibold whitespace-nowrap">{formatRupee(transaction.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : parsed?.error ? (
                  <p className="text-sm text-problem" role="alert">
                    {parsed.clarification || voiceErrorMessage(parsed.error)}
                  </p>
                ) : (
                  <p className="text-sm text-text-secondary">
                    {lang === 'hi'
                      ? 'AI आपकी हिंदी, अंग्रेज़ी या Hinglish एंट्री समझेगा। सेव करने से पहले आप हर एंट्री जाँच पाएँगे।'
                      : 'AI interprets Hindi, English and Hinglish. Nothing is saved until you review and confirm each entry.'}
                  </p>
                )}
                {hasMissingQuantity && (
                  <div className="space-y-1" role="alert" aria-live="assertive">
                    <p className="text-sm font-semibold text-problem">
                      {lang === 'hi' ? 'आप बेची गई मात्रा बताना भूल गए।' : 'You forgot to mention a quantity.'}
                    </p>
                    <p className="text-xs leading-relaxed text-problem">
                      {lang === 'hi'
                        ? 'परेशानी के लिए माफ़ कीजिए। यह जानकारी देने से आपको बेहतर insights मिलेंगे।'
                        : 'Sorry if this bothers you, by providing this info, you will get better insights.'}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleHomeVoiceConfirm}
                  disabled={homeVoiceParsing || !homeVoiceDraft.trim() || (parsed !== null && !parsed.error && !canAdd)}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {homeVoiceParsing
                    ? (lang === 'hi' ? 'समझ रहा हूँ…' : 'Interpreting…')
                    : canAdd
                      ? (lang === 'hi' ? 'टिक करें और एंट्री जोड़ें' : '✓ Confirm and add entries')
                      : parsed?.error
                        ? (lang === 'hi' ? 'फिर से समझें' : 'Retry interpretation')
                        : (lang === 'hi' ? 'AI से समझें' : 'Interpret with AI')}
                </button>
              </> 
            );
          })()}
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-warning text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff size={16} />
          {t('noInternet', lang)}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={null}>
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'insights' && <InsightsScreen />}
          {activeTab === 'ask' && <AskScreen />}
          {activeTab === 'tools' && <ToolsScreen />}
          {activeTab === 'learn' && <LearnScreen />}
        </Suspense>
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// ============ BOTTOM NAVIGATION ============
function BottomNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  const { state } = useStore();
  const lang = state.language!;

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'home', icon: Home, label: t('navHome', lang) },
    { id: 'insights', icon: BarChart3, label: t('navInsights', lang) },
    { id: 'ask', icon: MessageCircle, label: t('navAsk', lang) },
    { id: 'tools', icon: Wrench, label: t('navTools', lang) },
    { id: 'learn', icon: BookOpen, label: t('navLearn', lang) },
  ];

  return (
    <nav className="bg-card border-t border-border bottom-nav">
      <div className="flex items-center justify-around h-full">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`text-small font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============ ROOT APP ============
export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
