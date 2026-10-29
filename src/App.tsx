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
import { Home, BarChart3, MessageCircle, Wrench, BookOpen, User, WifiOff } from 'lucide-react';

type Tab = 'home' | 'insights' | 'ask' | 'tools' | 'learn';

function AppContent() {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [homeVoiceStatus, setHomeVoiceStatus] = useState('');
  const [voiceUndoEntries, setVoiceUndoEntries] = useState<Array<{ type: 'sale' | 'expense' | 'udhaar'; id: string }>>([]);
  const lang = state.language || 'en';

  const showTemporaryVoiceStatus = (message: string) => {
    setHomeVoiceStatus(message);
    window.setTimeout(() => {
      setHomeVoiceStatus((current) => current === message ? '' : current);
    }, 8000);
  };

  const handleHomeVoiceTranscript = (transcript: string) => {
    // This callback only runs after the user reviews the transcript and taps the arrow.
    setVoiceUndoEntries([]);
    const parsed = parseVoiceTransactions(transcript);
    if (!parsed.transactions.length || parsed.transactions.length > 5) {
      const error = parsed.transactions.length > 5 ? 'too_many_entries' : parsed.error;
      const message = lang === 'hi'
        ? error === 'too_many_entries'
          ? 'एक बार में अधिकतम 5 एंट्री जोड़ सकता हूँ। कुछ भी नहीं जोड़ा गया। कृपया 5 या उससे कम एंट्री बोलें।'
          : error === 'missing_amount'
            ? 'रकम साफ़ सुनाई नहीं दी। कुछ नहीं जोड़ा गया। कृपया रकम और सामान/खर्च/उधार साफ़ बोलें।'
            : error === 'missing_item'
              ? 'सामान या सेवा का नाम साफ़ नहीं समझ आया। कुछ नहीं जोड़ा गया। कृपया नाम और मात्रा के साथ दोबारा बोलें।'
              : error === 'missing_customer'
                ? 'उधार के ग्राहक का नाम साफ़ नहीं समझ आया। कुछ नहीं जोड़ा गया। ग्राहक का नाम और रकम दोबारा बोलें।'
                : error === 'ambiguous_amount' || error === 'unclear_entry'
                  ? 'हम आपकी बात साफ़ नहीं सुन पाए या एंट्री अलग नहीं कर पाए। कुछ नहीं जोड़ा गया। कृपया हर एंट्री के बीच थोड़ा रुककर साफ़ बोलें।'
                  : error === 'no_type'
                    ? 'बताइए कि बिक्री, खर्च या उधार में क्या जोड़ना है।'
                    : 'हम आपकी बात साफ़ नहीं सुन पाए। कुछ नहीं जोड़ा गया। कृपया फिर से साफ़ बोलें।'
        : error === 'too_many_entries'
          ? 'I can add a maximum of 5 entries at once. Nothing was added; please say 5 or fewer.'
          : error === 'missing_amount'
            ? 'I could not hear a clear amount. Nothing was added. Please repeat the amount and whether it is a sale, expense or udhaar.'
            : error === 'missing_item'
              ? 'I could not clearly identify the item or service name. Nothing was added; please repeat the name and quantity.'
              : error === 'missing_customer'
                ? 'I could not clearly identify the udhaar customer. Nothing was added; please repeat the customer name and amount.'
                : error === 'ambiguous_amount' || error === 'unclear_entry'
                  ? 'I could not confidently separate or understand the entries. Nothing was added. Please pause briefly between each entry and speak clearly.'
                  : error === 'no_type'
                    ? 'Say whether to add sales, expenses, or udhaar.'
                    : 'We did not hear that clearly. Nothing was added; please try again.';
      showTemporaryVoiceStatus(message);
      return;
    }

    const today = getToday();
    const created: Array<{ type: 'sale' | 'expense' | 'udhaar'; id: string }> = [];
    const summaries: string[] = [];

    // Reject a batch in full if any parsed item is incomplete.
    if (parsed.transactions.some((transaction) =>
      !Number.isFinite(transaction.amount) || transaction.amount <= 0 ||
      (transaction.type === 'sale' && (!transaction.itemName?.trim() ||
        !Number.isFinite(transaction.quantity) || (transaction.quantity || 0) <= 0)) ||
      (transaction.type === 'udhaar' && !transaction.customerName?.trim())
    )) {
      showTemporaryVoiceStatus(lang === 'hi'
        ? 'एक या अधिक एंट्री साफ़ नहीं समझ आईं। कुछ नहीं जोड़ा गया। कृपया फिर से साफ़ बोलें।'
        : 'One or more entries were unclear. Nothing was added; please repeat the batch clearly.');
      return;
    }

    for (const transaction of parsed.transactions) {
      const id = generateId();
      if (transaction.type === 'sale') {
        const saleName = transaction.itemName!.trim();
        const saleQuantity = transaction.quantity ?? 1;
        const saleUnit = transaction.quantityUnit || 'unit';
        dispatch({
          type: 'ADD_SALE',
          payload: {
            id,
            date: today,
            amount: transaction.amount,
            itemName: saleName,
            quantity: saleQuantity,
            quantityUnit: saleUnit,
            paymentType: 'cash',
            createdAt: Date.now(),
          },
        });
        summaries.push(saleName + ' · ' + saleQuantity + ' ' + saleUnit + ' · ' + formatRupee(transaction.amount));
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
        summaries.push((transaction.note || (lang === 'hi' ? 'खर्च' : 'Expense')) + ' · ' + formatRupee(transaction.amount));
        created.push({ type: 'expense', id });
      } else {
        const customerName = transaction.customerName!;
        dispatch({
          type: 'ADD_UDHAAR',
          payload: {
            id,
            customerName,
            amount: transaction.amount,
            date: today,
            paid: false,
            createdAt: Date.now(),
          },
        });
        summaries.push(customerName + ' · ' + formatRupee(transaction.amount) + (lang === 'hi' ? ' उधार' : ' udhaar'));
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
    const message = (lang === 'hi' ? 'जोड़ दिया: ' : 'Added: ') +
      summaries.join(lang === 'hi' ? ' | ' : ' · ') + '.';
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
                label={lang === 'hi' ? 'आवाज़ से एंट्री जोड़ें' : 'Add entries by voice'}
                onTranscript={handleHomeVoiceTranscript}
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
