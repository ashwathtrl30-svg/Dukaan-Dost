import React, { useState } from 'react';
import { StoreProvider, useStore, generateId, getToday, formatRupee } from './store';
import { VoiceMicButton } from './components/VoiceMicButton';
import { parseVoiceTransactions } from './voice/voiceCommands';
import { t } from './i18n';
import { LanguageScreen, WelcomeScreen, PhoneScreen, InterviewScreen, ProfileSummaryScreen, TourScreen } from './screens/Onboarding';
import { HomeScreen } from './screens/Home';
import { InsightsScreen } from './screens/Insights';
import { AskScreen } from './screens/Ask';
import { ToolsScreen } from './screens/Tools';
import { LearnScreen } from './screens/Learn';
import { ProfileScreen } from './screens/Profile';
import { Home, BarChart3, MessageCircle, Wrench, BookOpen, User, WifiOff, Check, X } from 'lucide-react';

type Tab = 'home' | 'insights' | 'ask' | 'tools' | 'learn';

function AppContent() {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [homeVoiceStatus, setHomeVoiceStatus] = useState('');
  const [homeVoiceDraft, setHomeVoiceDraft] = useState('');
  const [homeVoiceListening, setHomeVoiceListening] = useState(false);
  const [voiceUndoEntries, setVoiceUndoEntries] = useState<Array<{ type: 'sale' | 'expense' | 'udhaar'; id: string }>>([]);
  const lang = state.language || 'en';

  const showTemporaryVoiceStatus = (message: string) => {
    setHomeVoiceStatus(message);
    window.setTimeout(() => {
      setHomeVoiceStatus((current) => current === message ? '' : current);
    }, 8000);
  };

  const handleHomeVoiceTranscript = (transcript: string) => {
    setHomeVoiceDraft(transcript);
  };

  const voiceErrorMessage = (error: string | undefined): string => {
    if (lang === 'hi') {
      if (error === 'too_many_entries') return 'एक बार में अधिकतम 5 एंट्री जोड़ सकता हूँ। कुछ भी नहीं जोड़ा गया। कृपया 5 या उससे कम एंट्री बोलें।';
      if (error === 'amount_out_of_range') return 'अधिकतम रकम ₹1 करोड़ तक हो सकती है। कुछ भी नहीं जोड़ा गया। रकम फिर से बोलें।';
      if (error === 'missing_item') return 'किस सामान या सेवा की बिक्री हुई, वह साफ़ नहीं समझ आया। कुछ भी नहीं जोड़ा गया। सामान का नाम साफ़ बोलें।';
      if (error === 'missing_customer') return 'उधार के लिए ग्राहक का नाम साफ़ नहीं समझ आया। कुछ भी नहीं जोड़ा गया। ग्राहक का नाम और रकम फिर से बोलें।';
      if (error === 'missing_amount' || error === 'ambiguous_amount') return 'हम आपकी बात साफ़ नहीं समझ पाए। कुछ भी नहीं जोड़ा गया। हर सामान/खर्च/उधार का नाम और रकम साफ़-साफ़ बोलें।';
      if (error === 'no_type') return 'बताइए कि बिक्री, खर्च या उधार में क्या जोड़ना है। कुछ भी नहीं जोड़ा गया।';
      return 'हम आपकी बात साफ़ नहीं सुन पाए। कृपया धीरे और साफ़ बोलकर फिर कोशिश करें।';
    }
    if (error === 'too_many_entries') return 'I can add a maximum of 5 entries at once. Nothing was added. Please split this into batches of 5 or fewer.';
    if (error === 'amount_out_of_range') return 'The maximum supported amount is ₹1 crore. Nothing was added; please say the amount again.';
    if (error === 'missing_item') return 'I could not clearly identify a product or service for every sale. Nothing was added; please say each item name clearly.';
    if (error === 'missing_customer') return 'I could not clearly identify the customer for an udhaar entry. Nothing was added; say each customer name and amount clearly.';
    if (error === 'missing_amount' || error === 'ambiguous_amount') return 'We did not hear you clearly. Nothing was added. Please say each item/customer, amount, and transaction type clearly.';
    if (error === 'no_type') return 'Say whether these entries are sales, expenses, or udhaar. Nothing was added.';
    return 'We did not hear you clearly. Nothing was added. Please speak clearly and try again.';
  };

  const handleHomeVoiceConfirm = () => {
    const parsed = parseVoiceTransactions(homeVoiceDraft);
    if (!parsed.transactions.length || parsed.error) {
      showTemporaryVoiceStatus(voiceErrorMessage(parsed.error));
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
        const quantity = Number(transaction.quantity ?? 1);
        dispatch({
          type: 'ADD_SALE',
          payload: {
            id,
            date: today,
            amount: transaction.amount,
            itemName: transaction.itemName!.trim(),
            quantity,
            quantityUnit: transaction.quantityUnit || 'unit',
            paymentType: 'cash',
            createdAt: Date.now(),
          },
        });
        summaries.push(
          (transaction.itemName || 'Sale') + ' · ' + quantity + ' ' + (transaction.quantityUnit || 'unit') + ' · ' + formatRupee(transaction.amount),
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

  // Handle onboarding flow
  if (!state.language) {
    return <LanguageScreen />;
  }

  if (!state.onboardingComplete) {
    const step = state.onboardingStep;
    if (step === 0 || step === 1) return <WelcomeScreen />;
    if (step === 2) return <PhoneScreen />;
    if (step >= 3 && step <= 12) return <InterviewScreen />;
    if (step === 13) return <ProfileSummaryScreen />;
    if (step === 14) return <TourScreen />;
    return <WelcomeScreen />;
  }

  // Show profile
  if (showProfile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ProfileScreen />
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
            <button type="button" aria-label={lang === 'hi' ? 'रद्द करें' : 'Cancel voice entry'} onClick={() => setHomeVoiceDraft('')} className="w-9 h-9 rounded-full flex items-center justify-center bg-bg text-text-secondary"><X size={18}/></button>
          </div>
          <textarea
            value={homeVoiceDraft}
            onChange={(event) => setHomeVoiceDraft(event.target.value)}
            rows={2}
            className="input-field w-full text-sm"
            aria-label={lang === 'hi' ? 'आवाज़ से पहचाना गया टेक्स्ट' : 'Recognized voice transcript'}
          />
          {(() => {
            const parsed = parseVoiceTransactions(homeVoiceDraft);
            const canAdd = !parsed.error && parsed.transactions.length > 0 && parsed.transactions.length <= 5;
            return (
              <>
                {canAdd ? (
                  <div className="rounded-xl bg-bg p-3 space-y-2">
                    <p className="text-sm font-semibold text-text">
                      {lang === 'hi' ? parsed.transactions.length + ' एंट्री तैयार हैं' : parsed.transactions.length + (parsed.transactions.length === 1 ? ' entry ready' : ' entries ready')}
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
                              {Number(transaction.quantity ?? 1)} {transaction.quantityUnit || 'unit'}
                            </p>
                          )}
                        </div>
                        <p className="text-text font-semibold whitespace-nowrap">{formatRupee(transaction.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-problem" role="alert">{voiceErrorMessage(parsed.error || 'unclear')}</p>
                )}
                <button
                  type="button"
                  onClick={handleHomeVoiceConfirm}
                  disabled={!canAdd}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={18}/> {lang === 'hi' ? 'टिक करें और एंट्री जोड़ें' : '✓ Confirm and add entries'}
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
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'ask' && <AskScreen />}
        {activeTab === 'tools' && <ToolsScreen />}
        {activeTab === 'learn' && <LearnScreen />}
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
