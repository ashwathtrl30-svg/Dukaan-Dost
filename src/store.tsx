import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Language, Theme, ShopProfile, SaleEntry, ExpenseEntry, UdhaarEntry, ChatMessage, ChatSession, Insight } from './types';

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
  | { type: 'RESET_ONBOARDING' };

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
    case 'ADD_CHAT_MESSAGE': {
      if (!state.activeSessionId) {
        // Create new session if none active
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: action.payload.content.slice(0, 30) + (action.payload.content.length > 30 ? '...' : ''),
          createdAt: Date.now(),
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
            ? { ...session, messages: [...session.messages, action.payload] }
            : session
        ),
      };
    }
    case 'CREATE_NEW_CHAT': {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        createdAt: Date.now(),
        messages: [],
      };
      return {
        ...state,
        chatSessions: [newSession, ...state.chatSessions],
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
      
      return { ...initialState, ...parsed };
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

  useEffect(() => {
    saveState(state);
  }, [state]);

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
