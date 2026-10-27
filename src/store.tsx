import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Language, Theme, ShopProfile, SaleEntry, ExpenseEntry, UdhaarEntry, ChatMessage, Insight } from './types';
import { supabase } from './supabaseClient';
import { createVaultSalt, decryptVaultState, encryptVaultState, EncryptedVaultEnvelope } from './secureVault';

const initialState: AppState = {
  language: null,
  theme: 'light',
  onboardingStep: 0,
  onboardingComplete: false,
  shopProfile: {
    shopType: null,
    shopName: '',
    city: '',
    duration: null,
    ownership: null,
    workers: 1,
    monthlySales: null,
    udhaarLevel: null,
    accounting: null,
    worries: [],
  },
  sales: [],
  expenses: [],
  udhaar: [],
  chatHistory: [],
  insights: [],
  phoneNumber: '',
  userName: '',
  reminderTime: '20:00',
  streak: 0,
  lastEntryDate: '',
  textSize: 'normal',
  lockEnabled: false,
  lockPin: '',
  notificationsEnabled: true,
  alertTypes: {
    daily: true,
    udhaar: true,
    festival: true,
    insights: true,
  },
};

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_ONBOARDING_STEP'; payload: number }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'UPDATE_SHOP_PROFILE'; payload: Partial<ShopProfile> }
  | { type: 'ADD_SALE'; payload: SaleEntry }
  | { type: 'ADD_EXPENSE'; payload: ExpenseEntry }
  | { type: 'ADD_UDHAAR'; payload: UdhaarEntry }
  | { type: 'TOGGLE_UDHAAR_PAID'; payload: string }
  | { type: 'DELETE_ENTRY'; payload: { type: 'sale' | 'expense' | 'udhaar'; id: string } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'ADD_INSIGHT'; payload: Insight }
  | { type: 'MARK_INSIGHT_USEFUL'; payload: { id: string; useful: boolean } }
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_REMINDER_TIME'; payload: string }
  | { type: 'UPDATE_STREAK'; payload: { streak: number; lastDate: string } }
  | { type: 'SET_TEXT_SIZE'; payload: 'normal' | 'large' }
  | { type: 'SET_LOCK'; payload: { enabled: boolean; pin: string } }
  | { type: 'TOGGLE_ALERT_TYPE'; payload: string }
  | { type: 'EXPORT_DATA' }
  | { type: 'DELETE_ALL_DATA' }
  | { type: 'RESET_ONBOARDING' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'UPDATE_SHOP_PROFILE':
      return { ...state, shopProfile: { ...state.shopProfile, ...action.payload } };
    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'ADD_UDHAAR':
      return { ...state, udhaar: [action.payload, ...state.udhaar] };
    case 'TOGGLE_UDHAAR_PAID':
      return {
        ...state,
        udhaar: state.udhaar.map(u => u.id === action.payload ? { ...u, paid: !u.paid } : u),
      };
    case 'DELETE_ENTRY': {
      if (action.payload.type === 'sale') {
        return { ...state, sales: state.sales.filter(s => s.id !== action.payload.id) };
      } else if (action.payload.type === 'expense') {
        return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload.id) };
      } else {
        return { ...state, udhaar: state.udhaar.filter(u => u.id !== action.payload.id) };
      }
    }
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] };
    case 'ADD_INSIGHT':
      return { ...state, insights: [action.payload, ...state.insights] };
    case 'MARK_INSIGHT_USEFUL':
      return {
        ...state,
        insights: state.insights.map(i => i.id === action.payload.id ? { ...i, useful: action.payload.useful } : i),
      };
    case 'SET_PHONE':
      return { ...state, phoneNumber: action.payload };
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'SET_REMINDER_TIME':
      return { ...state, reminderTime: action.payload };
    case 'UPDATE_STREAK':
      return { ...state, streak: action.payload.streak, lastEntryDate: action.payload.lastDate };
    case 'SET_TEXT_SIZE':
      return { ...state, textSize: action.payload };
    case 'SET_LOCK':
      return { ...state, lockEnabled: action.payload.enabled, lockPin: action.payload.pin };
    case 'TOGGLE_ALERT_TYPE':
      return {
        ...state,
        alertTypes: { ...state.alertTypes, [action.payload]: !state.alertTypes[action.payload] },
      };
    case 'DELETE_ALL_DATA':
      return { ...initialState, language: state.language, theme: state.theme };
    case 'RESET_ONBOARDING':
      return { ...state, onboardingComplete: false, onboardingStep: 0 };
    default:
      return state;
  }
}

// Before authentication, persist only non-sensitive setup preferences.
// Never reuse the legacy, unencrypted global state for a different account.
function loadState(): AppState {
  try {
    const saved = localStorage.getItem('dukaandost_pre_auth_state');
    // The prototype's old global state is deliberately not imported because it
    // has no verified owner. Keep it untouched until a safe, explicit migration
    // or deletion is chosen by the device owner.
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialState,
        language: parsed.language === 'en' || parsed.language === 'hi' ? parsed.language : null,
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        onboardingStep: Math.max(0, Math.min(2, Number(parsed.onboardingStep) || 0)),
        onboardingComplete: false,
      };
    }
  } catch (e) {
    console.error('Failed to load safe setup preferences:', e);
  }
  return initialState;
}

function savePreAuthState(state: AppState) {
  try {
    const safeState: AppState = {
      ...initialState,
      language: state.language,
      theme: state.theme,
      onboardingStep: Math.max(0, Math.min(2, state.onboardingStep)),
      onboardingComplete: false,
    };
    localStorage.setItem('dukaandost_pre_auth_state', JSON.stringify(safeState));
  } catch (e) {
    console.error('Failed to save safe setup preferences:', e);
  }
}

type VaultStatus = 'signed_out' | 'checking' | 'new' | 'existing' | 'error';

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  authReady: boolean;
  authUserId: string | null;
  vaultUnlocked: boolean;
  vaultStatus: VaultStatus;
  unlockVault: (passphrase: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [authReady, setAuthReady] = React.useState(false);
  const [authUserId, setAuthUserId] = React.useState<string | null>(null);
  const [vaultUnlocked, setVaultUnlocked] = React.useState(false);
  const [vaultStatus, setVaultStatus] = React.useState<VaultStatus>('checking');
  const passphraseRef = React.useRef<string | null>(null);
  const saltRef = React.useRef<string | null>(null);
  const currentUserRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthUserId(null);
      setVaultStatus('signed_out');
      setAuthReady(true);
      return;
    }

    let active = true;
    const acceptSession = (userId: string | null) => {
      if (userId !== currentUserRef.current) {
        currentUserRef.current = userId;
        passphraseRef.current = null;
        saltRef.current = null;
        setVaultUnlocked(false);
        setVaultStatus(userId ? 'checking' : 'signed_out');
      }
      setAuthUserId(userId);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Could not restore the Supabase session:', error.message);
      acceptSession(data.session?.user.id ?? null);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      acceptSession(session?.user.id ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !authUserId || !supabase) {
      if (authReady && !authUserId) setVaultStatus('signed_out');
      return;
    }

    let active = true;
    setVaultStatus('checking');
    supabase
      .from('shop_vaults')
      .select('user_id')
      .eq('user_id', authUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Could not check the private vault:', error.message);
          setVaultStatus('error');
        } else {
          setVaultStatus(data ? 'existing' : 'new');
        }
      });

    return () => {
      active = false;
    };
  }, [authReady, authUserId]);

  const unlockVault = async (passphrase: string) => {
    if (!supabase || !authUserId) {
      throw new Error('Sign in with your phone number before opening your private vault.');
    }
    if (passphrase.length < 12) {
      throw new Error('Use a private vault passphrase with at least 12 characters.');
    }

    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user || userResult.user.id !== authUserId) {
      throw new Error('Your sign-in session could not be verified. Sign in again.');
    }

    const { data: row, error } = await supabase
      .from('shop_vaults')
      .select('ciphertext,iv,kdf_salt,crypto_version')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (error) throw new Error('Could not load the encrypted vault: ' + error.message);

    let salt: string;
    let nextState: AppState;

    if (row) {
      salt = row.kdf_salt;
      try {
        nextState = await decryptVaultState<AppState>(row as EncryptedVaultEnvelope, passphrase);
      } catch {
        throw new Error('That vault passphrase did not unlock this data. We cannot reset or recover it for you.');
      }
      if (!nextState || !Array.isArray(nextState.sales) || !Array.isArray(nextState.expenses) || !Array.isArray(nextState.udhaar)) {
        throw new Error('The encrypted vault does not contain a valid Dukaan Dost data record.');
      }
    } else {
      // Start with a clean, account-specific state. Never copy another browser
      // user's old sales, expenses, or customer-credit entries into this vault.
      salt = createVaultSalt();
      nextState = {
        ...initialState,
        language: state.language,
        theme: state.theme,
        onboardingStep: 3,
        onboardingComplete: false,
        phoneNumber: state.phoneNumber,
      };
    }

    const envelope = await encryptVaultState(nextState, passphrase, salt);
    const { error: saveError } = await supabase
      .from('shop_vaults')
      .upsert({
        user_id: authUserId,
        ...envelope,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (saveError) throw new Error('Could not save the encrypted vault: ' + saveError.message);

    // The local backup, like the server copy, contains ciphertext only.
    localStorage.setItem(`dukaandost_encrypted_vault_${authUserId}`, JSON.stringify(envelope));
    passphraseRef.current = passphrase;
    saltRef.current = salt;
    dispatch({ type: 'LOAD_STATE', payload: nextState });
    setVaultStatus('existing');
    setVaultUnlocked(true);
  };

  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    passphraseRef.current = null;
    saltRef.current = null;
    setVaultUnlocked(false);
    dispatch({
      type: 'LOAD_STATE',
      payload: {
        ...initialState,
        language: state.language,
        theme: state.theme,
        onboardingStep: 2,
      },
    });
  };

  useEffect(() => {
    if (!authReady || !authUserId || !vaultUnlocked || !supabase || !passphraseRef.current || !saltRef.current) {
      savePreAuthState(state);
      return;
    }

    const userId = authUserId;
    const passphrase = passphraseRef.current;
    const salt = saltRef.current;
    const snapshot = state;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const envelope = await encryptVaultState(snapshot, passphrase, salt);
          localStorage.setItem(`dukaandost_encrypted_vault_${userId}`, JSON.stringify(envelope));
          const { error } = await supabase
            .from('shop_vaults')
            .upsert({
              user_id: userId,
              ...envelope,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          if (error) console.error('Could not sync the encrypted shop vault:', error.message);
        } catch (error) {
          console.error('Could not encrypt/sync the shop vault:', error);
        }
      })();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [state, authReady, authUserId, vaultUnlocked]);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  return (
    <StoreContext.Provider value={{
      state,
      dispatch,
      authReady,
      authUserId,
      vaultUnlocked,
      vaultStatus,
      unlockVault,
      signOut,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

// Utility functions
export function formatRupee(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Indian number grouping
  const formatted = absAmount.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getTodaySales(sales: SaleEntry[]): number {
  const today = getToday();
  return sales.filter(s => s.date === today).reduce((sum, s) => sum + s.amount, 0);
}

export function getTodayExpenses(expenses: ExpenseEntry[]): number {
  const today = getToday();
  return expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
}

export function getWeekSales(sales: SaleEntry[], daysAgo: number = 0): number {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6 - (daysAgo * 7));
  const end = new Date(today);
  end.setDate(end.getDate() - (daysAgo * 7));
  
  return sales
    .filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    })
    .reduce((sum, s) => sum + s.amount, 0);
}

export function getLast7DaysData(sales: SaleEntry[]): { day: string; amount: number }[] {
  const result: { day: string; amount: number }[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en', { weekday: 'short' });
    const amount = sales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.amount, 0);
    result.push({ day: dayName, amount });
  }
  
  return result;
}

export function getTotalUdhaar(udhaar: UdhaarEntry[]): number {
  return udhaar.filter(u => !u.paid).reduce((sum, u) => sum + u.amount, 0);
}

// Insights helper functions
export function getWeekExpenses(expenses: ExpenseEntry[], daysAgo: number = 0): number {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6 - (daysAgo * 7));
  const end = new Date(today);
  end.setDate(end.getDate() - (daysAgo * 7));
  
  return expenses
    .filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getMonthSales(sales: SaleEntry[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return sales
    .filter(s => {
      const d = new Date(s.date);
      return d >= monthStart;
    })
    .reduce((sum, s) => sum + s.amount, 0);
}

export function getMonthExpenses(expenses: ExpenseEntry[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return expenses
    .filter(e => {
      const d = new Date(e.date);
      return d >= monthStart;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getProfitPercent(sales: number, expenses: number): number {
  if (sales === 0) return 0;
  return Math.round(((sales - expenses) / sales) * 100);
}

export function getTopExpenseCategories(expenses: ExpenseEntry[], limit: number = 3): { category: string; amount: number }[] {
  const categoryMap: Record<string, number> = {};
  
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  
  return Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function getBestDay(sales: SaleEntry[]): { day: string; amount: number } | null {
  if (sales.length === 0) return null;
  
  const dayMap: Record<string, number> = {};
  
  sales.forEach(s => {
    const date = new Date(s.date);
    const dayName = date.toLocaleDateString('en', { weekday: 'long' });
    dayMap[dayName] = (dayMap[dayName] || 0) + s.amount;
  });
  
  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  return bestDay ? { day: bestDay[0], amount: bestDay[1] } : null;
}
