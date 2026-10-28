import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { StoreProvider, useStore } from './store';
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
  const { state } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  const lang = state.language!;

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
      {/* Top bar with profile icon */}
      <div className="flex items-center justify-end px-5 pt-3 pb-0 bg-bg">
        <button
          onClick={() => setShowProfile(true)}
          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <User size={24} className="text-primary" />
        </button>
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
      <Analytics />
    </StoreProvider>
  );
}
