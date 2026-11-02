import React, { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState, Language, Theme, ShopProfile, SaleEntry, ExpenseEntry, UdhaarEntry, NotebookNote, ChatMessage, ChatSession, Insight } from './types';
import {
  collectSnapshotTombstones,
  createEmptySnapshotTombstones,
  createShopDataSnapshot,
  mergeShopDataSnapshots,
} from './shopDataSnapshot';
import type { ShopDataSnapshot } from './shopDataSnapshot';
import { loadOrCreateCloudSnapshot, persistShopDataSnapshot, subscribeToShopDataSnapshot } from './cloudPersistence';
import { supabase } from './supabaseClient';

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
  notebookNotes: [],
  chatSessions: [],
  activeSessionId: null,
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
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_ONBOARDING_STEP'; payload: number }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'UPDATE_SHOP_PROFILE'; payload: Partial<ShopProfile> }
  | { type: 'ADD_SALE'; payload: SaleEntry }
  | { type: 'ADD_EXPENSE'; payload: ExpenseEntry }
  | { type: 'ADD_UDHAAR'; payload: UdhaarEntry }
  | { type: 'ADD_NOTE'; payload: NotebookNote }
  | { type: 'UPDATE_NOTE'; payload: NotebookNote }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'TOGGLE_UDHAAR_PAID'; payload: string }
  | { type: 'DELETE_ENTRY'; payload: { type: 'sale' | 'expense' | 'udhaar'; id: string } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CREATE_NEW_CHAT' }
  | { type: 'SET_ACTIVE_CHAT'; payload: string }
  | { type: 'DELETE_CHAT'; payload: string }
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
  | { type: 'RESET_ONBOARDING' }
  | { type: 'HYDRATE_SHOP_DATA'; payload: ShopDataSnapshot }
  | { type: 'SYNC_SHOP_DATA'; payload: ShopDataSnapshot };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
    case 'ADD_NOTE':
      return { ...state, notebookNotes: [action.payload, ...(state.notebookNotes || [])] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notebookNotes: (state.notebookNotes || []).map(note =>
          note.id === action.payload.id ? action.payload : note
        ),
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notebookNotes: (state.notebookNotes || []).filter(note => note.id !== action.payload),
      };
    case 'TOGGLE_UDHAAR_PAID':
      return {
        ...state,
        udhaar: state.udhaar.map(u => u.id === action.payload
          ? { ...u, paid: !u.paid, updatedAt: Date.now() }
          : u),
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
    case 'ADD_CHAT_MESSAGE': {
      if (!state.activeSessionId) {
        // Create new session if none active
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: action.payload.content.slice(0, 30) + (action.payload.content.length > 30 ? '...' : ''),
          createdAt: Date.now(),
          updatedAt: action.payload.timestamp,
          messages: [action.payload],
        };
        return {
          ...state,
          chatSessions: [newSession, ...state.chatSessions],
          activeSessionId: newSession.id,
        };
      }
      // Add to active session
      return {
        ...state,
        chatSessions: state.chatSessions.map(session =>
          session.id === state.activeSessionId
            ? { ...session, messages: [...session.messages, action.payload], updatedAt: action.payload.timestamp }
            : session
        ),
      };
    }
    case 'CREATE_NEW_CHAT': {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      return {
        ...state,
        chatSessions: [newSession, ...state.chatSessions.filter(session => session.messages.length > 0)],
        activeSessionId: newSession.id,
      };
    }
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeSessionId: action.payload };
    case 'DELETE_CHAT':
      return {
        ...state,
        chatSessions: state.chatSessions.filter(s => s.id !== action.payload),
        activeSessionId: state.activeSessionId === action.payload ? null : state.activeSessionId,
      };
    case 'CLEAR_CHAT':
      return { ...state, chatSessions: [], activeSessionId: null };
    case 'ADD_INSIGHT':
      return { ...state, insights: [action.payload, ...state.insights] };
    case 'MARK_INSIGHT_USEFUL':
      return {
        ...state,
        insights: state.insights.map(i => i.id === action.payload.id
          ? { ...i, useful: action.payload.useful, updatedAt: Date.now() }
          : i),
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
    case 'HYDRATE_SHOP_DATA': {
      // Merge stable records while restoring the complete cloud-safe app state.
      // Phone identity and device lock credentials intentionally remain local.
      const merged = mergeShopDataSnapshots(createShopDataSnapshot(state), action.payload);
      return {
        ...state,
        shopProfile: merged.shopProfile,
        sales: merged.sales,
        expenses: merged.expenses,
        udhaar: merged.udhaar,
        notebookNotes: merged.notebookNotes,
        chatSessions: merged.chatSessions,
        insights: merged.insights,
        language: merged.preferences.language,
        theme: merged.preferences.theme,
        onboardingComplete: merged.preferences.onboardingComplete,
        userName: merged.preferences.userName,
        reminderTime: merged.preferences.reminderTime,
        streak: merged.preferences.streak,
        lastEntryDate: merged.preferences.lastEntryDate,
        textSize: merged.preferences.textSize,
        notificationsEnabled: merged.preferences.notificationsEnabled,
        alertTypes: merged.preferences.alertTypes,
        activeSessionId: state.activeSessionId && merged.chatSessions.some(
          (session) => session.id === state.activeSessionId
        )
          ? state.activeSessionId
          : merged.chatSessions.find((session) => session.messages.length === 0)?.id
            ?? merged.chatSessions[0]?.id
            ?? null,
      };
    }
    case 'SYNC_SHOP_DATA': {
      // The payload is already reconciled with this device's pending changes.
      // Replace only cloud-owned fields; device PIN and phone details remain local.
      const merged = action.payload;
      return {
        ...state,
        shopProfile: merged.shopProfile,
        sales: merged.sales,
        expenses: merged.expenses,
        udhaar: merged.udhaar,
        notebookNotes: merged.notebookNotes,
        chatSessions: merged.chatSessions,
        insights: merged.insights,
        language: merged.preferences.language,
        theme: merged.preferences.theme,
        onboardingComplete: merged.preferences.onboardingComplete,
        userName: merged.preferences.userName,
        reminderTime: merged.preferences.reminderTime,
        streak: merged.preferences.streak,
        lastEntryDate: merged.preferences.lastEntryDate,
        textSize: merged.preferences.textSize,
        notificationsEnabled: merged.preferences.notificationsEnabled,
        alertTypes: merged.preferences.alertTypes,
        activeSessionId: state.activeSessionId && merged.chatSessions.some(
          (session) => session.id === state.activeSessionId
        )
          ? state.activeSessionId
          : merged.chatSessions.find((session) => session.messages.length === 0)?.id
            ?? merged.chatSessions[0]?.id
            ?? null,
      };
    }
    case 'DELETE_ALL_DATA':
      return { ...initialState, language: state.language, theme: state.theme };
    case 'RESET_ONBOARDING':
      return { ...state, onboardingComplete: false, onboardingStep: 0 };
    default:
      return state;
  }
}

// Load from localStorage
function loadState(): AppState {
  try {
    const saved = localStorage.getItem('dukaandost_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migration: Convert old chatHistory to new chatSessions structure
      if (parsed.chatHistory && !parsed.chatSessions) {
        const oldMessages: ChatMessage[] = parsed.chatHistory;
        if (oldMessages.length > 0) {
          const migratedSession: ChatSession = {
            id: 'migrated-' + Date.now(),
            title: oldMessages[0].content.slice(0, 30) + (oldMessages[0].content.length > 30 ? '...' : ''),
            createdAt: oldMessages[0].timestamp,
            messages: oldMessages,
          };
          parsed.chatSessions = [migratedSession];
          parsed.activeSessionId = migratedSession.id;
        } else {
          parsed.chatSessions = [];
          parsed.activeSessionId = null;
        }
        delete parsed.chatHistory; // Remove old property
      }
      
      // Ensure new properties exist
      if (!parsed.chatSessions) parsed.chatSessions = [];
      if (parsed.activeSessionId === undefined) parsed.activeSessionId = null;
      
      const hydratedState: AppState = { ...initialState, ...parsed };
      if (!Array.isArray(hydratedState.notebookNotes)) hydratedState.notebookNotes = [];

      // Start each full website visit with a fresh Ask conversation while
      // keeping completed conversations available in Chat History.
      if (hydratedState.onboardingComplete) {
        const savedSessions = Array.isArray(hydratedState.chatSessions)
          ? hydratedState.chatSessions.filter(
              (session) => Array.isArray(session.messages) && session.messages.length > 0
            )
          : [];
        const freshSession: ChatSession = {
          id: generateId(),
          title: 'New Chat',
          createdAt: Date.now(),
          messages: [],
        };

        return {
          ...hydratedState,
          chatSessions: [freshSession, ...savedSessions],
          activeSessionId: freshSession.id,
        };
      }

      return hydratedState;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return initialState;
}

// Save to localStorage
function saveState(state: AppState) {
  try {
    localStorage.setItem('dukaandost_state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [cloudReady, setCloudReady] = useState(false);
  const tombstonesRef = useRef(createEmptySnapshotTombstones());
  const currentSnapshotRef = useRef<ShopDataSnapshot>(
    createShopDataSnapshot(state, tombstonesRef.current)
  );
  const previousSnapshotRef = useRef<ShopDataSnapshot>(currentSnapshotRef.current);
  const lastCloudSnapshotRef = useRef('');
  const cloudSaveInFlightRef = useRef(false);
  const cloudRetryAttemptRef = useRef(0);
  const cloudRetryTimerRef = useRef<number | null>(null);
  const cloudBootstrapRetryTimerRef = useRef<number | null>(null);
  const cloudUserIdRef = useRef<string | null>(null);
  const cloudSubscriptionCleanupRef = useRef<(() => void) | null>(null);
  const lastRemoteUpdatedAtRef = useRef(0);

  currentSnapshotRef.current = createShopDataSnapshot(state, tombstonesRef.current);

  // Persist deletions as tombstones. This prevents an older offline copy from
  // re-introducing a sale, expense, udhaar, note, chat, or insight after sync.
  useEffect(() => {
    const latest = createShopDataSnapshot(state, tombstonesRef.current);
    tombstonesRef.current = collectSnapshotTombstones(previousSnapshotRef.current, latest);
    currentSnapshotRef.current = createShopDataSnapshot(state, tombstonesRef.current);
    previousSnapshotRef.current = currentSnapshotRef.current;
  }, [state]);

  // Keep the existing local cache for offline use and as a non-destructive migration source.
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Establish the authenticated owner and reconcile local data with that owner's cloud copy.
  // Initialization is retried after transient network failures; local use remains available.
  useEffect(() => {
    let active = true;
    let attempts = 0;

    const bootstrap = async () => {
      if (!supabase) return;
      try {
        const localSnapshot = currentSnapshotRef.current;
        const result = await loadOrCreateCloudSnapshot(localSnapshot);
        if (!active) return;

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const activeUserId = sessionData.session?.user?.id ?? null;
        if (!activeUserId) throw new Error('There is no authenticated shop session.');
        cloudUserIdRef.current = activeUserId;

        tombstonesRef.current = result.snapshot.tombstones;
        currentSnapshotRef.current = result.snapshot;
        previousSnapshotRef.current = result.snapshot;
        lastCloudSnapshotRef.current = result.schemaVersion >= 2
          ? JSON.stringify(result.remoteSnapshot ?? result.snapshot)
          : '';
        lastRemoteUpdatedAtRef.current = result.updatedAt
          ? Date.parse(result.updatedAt)
          : 0;

        dispatch({ type: 'HYDRATE_SHOP_DATA', payload: result.snapshot });

        // Subscribe only to this owner's row. Reconnection performs a fresh cloud read,
        // so changes made while this device was offline are recovered automatically.
        cloudSubscriptionCleanupRef.current?.();
        cloudSubscriptionCleanupRef.current = subscribeToShopDataSnapshot(
          activeUserId,
          (remoteSnapshot, updatedAt) => {
            if (!active) return;

            const remoteTime = Date.parse(updatedAt);
            if (Number.isFinite(remoteTime) && remoteTime < lastRemoteUpdatedAtRef.current) {
              return;
            }
            if (Number.isFinite(remoteTime)) {
              lastRemoteUpdatedAtRef.current = remoteTime;
            }

            const remoteSerialized = JSON.stringify(remoteSnapshot);
            if (remoteSerialized === lastCloudSnapshotRef.current) return;

            const currentSnapshot = currentSnapshotRef.current;
            let preferLocalProfile = true;
            let preferLocalPreferences = true;

            // Compare these fields independently. A pending sale must not prevent a
            // remote shop-profile or preference edit from reaching this device.
            if (lastCloudSnapshotRef.current) {
              try {
                const lastSynced = JSON.parse(lastCloudSnapshotRef.current) as ShopDataSnapshot;
                preferLocalProfile =
                  JSON.stringify(currentSnapshot.shopProfile) !== JSON.stringify(lastSynced.shopProfile);
                preferLocalPreferences =
                  JSON.stringify(currentSnapshot.preferences) !== JSON.stringify(lastSynced.preferences);
              } catch {
                // Until a valid cloud baseline exists, preserve local setup choices.
              }
            }

            const reconciled = mergeShopDataSnapshots(
              currentSnapshot,
              remoteSnapshot,
              { preferLocalProfile, preferLocalPreferences },
            );

            lastCloudSnapshotRef.current = remoteSerialized;
            tombstonesRef.current = reconciled.tombstones;

            // Dispatch even when the merged data matches local state: this schedules
            // a cloud write if the local device had unsaved edits while the event arrived.

            currentSnapshotRef.current = reconciled;
            previousSnapshotRef.current = reconciled;
            dispatch({ type: 'SYNC_SHOP_DATA', payload: reconciled });
          },
        );

        setCloudReady(true);
      } catch (error) {
        console.error('Dukaan Dost cloud persistence could not initialize; local data remains available.', error);
        if (active && attempts < 5) {
          const delay = Math.min(30000, 2000 * (2 ** attempts));
          attempts += 1;
          cloudBootstrapRetryTimerRef.current = window.setTimeout(() => {
            cloudBootstrapRetryTimerRef.current = null;
            void bootstrap();
          }, delay);
        }
      }
    };

    void bootstrap();
    return () => {
      active = false;
      cloudSubscriptionCleanupRef.current?.();
      cloudSubscriptionCleanupRef.current = null;
      if (cloudBootstrapRetryTimerRef.current !== null) {
        window.clearTimeout(cloudBootstrapRetryTimerRef.current);
      }
    };
  }, []);

  // Serialize cloud writes, skip unchanged state, and retry transient failures without changing the UI.
  const pushCloudSnapshotRef = useRef<() => void>(() => undefined);
  pushCloudSnapshotRef.current = () => {
    if (!cloudReady || !cloudUserIdRef.current || cloudSaveInFlightRef.current) return;

    const snapshot = currentSnapshotRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastCloudSnapshotRef.current) return;

    cloudSaveInFlightRef.current = true;
    void persistShopDataSnapshot(snapshot, cloudUserIdRef.current)
      .then(() => {
        lastCloudSnapshotRef.current = serialized;
        cloudRetryAttemptRef.current = 0;
      })
      .catch((error) => {
        console.error('Dukaan Dost cloud save failed; it will retry automatically.', error);
        cloudRetryAttemptRef.current += 1;
        if (cloudRetryTimerRef.current !== null) {
          window.clearTimeout(cloudRetryTimerRef.current);
        }
        const delay = Math.min(60000, 2000 * (2 ** Math.min(cloudRetryAttemptRef.current - 1, 5)));
        cloudRetryTimerRef.current = window.setTimeout(() => {
          cloudRetryTimerRef.current = null;
          pushCloudSnapshotRef.current();
        }, delay);
      })
      .finally(() => {
        cloudSaveInFlightRef.current = false;
        // If data changed while a write was in flight, immediately enqueue the latest version.
        if (JSON.stringify(currentSnapshotRef.current) !== lastCloudSnapshotRef.current) {
          if (cloudRetryTimerRef.current === null) {
            window.setTimeout(() => pushCloudSnapshotRef.current(), 0);
          }
        }
      });
  };

  useEffect(() => {
    if (!cloudReady) return;
    const timer = window.setTimeout(() => pushCloudSnapshotRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [state, cloudReady]);

  useEffect(() => {
    const retryWhenOnline = () => pushCloudSnapshotRef.current();
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') pushCloudSnapshotRef.current();
    };
    window.addEventListener('online', retryWhenOnline);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('online', retryWhenOnline);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, []);

  useEffect(() => () => {
    if (cloudRetryTimerRef.current !== null) {
      window.clearTimeout(cloudRetryTimerRef.current);
    }
    if (cloudBootstrapRetryTimerRef.current !== null) {
      window.clearTimeout(cloudBootstrapRetryTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
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
  // Entry dates are shop-local calendar dates, not UTC dates. Using UTC here
  // can assign an entry to yesterday during the first hours after midnight in India.
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
