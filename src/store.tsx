import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useState, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AppState, Language, Theme, ShopProfile, SaleEntry, ExpenseEntry, UdhaarEntry, NotebookNote, ChatMessage, ChatSession, Insight } from './types';
import {
  collectSnapshotTombstones,
  createEmptySnapshotTombstones,
  createShopDataSnapshot,
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
} from './shopDataSnapshot';
import type { ShopDataSnapshot, SnapshotMergeOptions } from './shopDataSnapshot';
import type { BackupRestoreMode } from './backup/encryptedBackup';
import { loadOrCreateCloudSnapshot, persistShopDataSnapshot, replaceShopDataSnapshot, subscribeToShopDataSnapshot } from './cloudPersistence';
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
  | { type: 'RESET_LOCAL_FOR_ACCOUNT_SWITCH' }
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
    case 'SET_LOCK': {
      const pin = action.payload.pin.replace(/\D/g, '').slice(0, 4);
      const enabled = action.payload.enabled && pin.length === 4;
      return { ...state, lockEnabled: enabled, lockPin: enabled ? pin : '' };
    }
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
    case 'RESET_LOCAL_FOR_ACCOUNT_SWITCH':
      return { ...initialState };
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
  authUser: User | null;
  signOut: () => Promise<void>;
  createShopBackup: () => Promise<{ snapshot: ShopDataSnapshot; ownerId: string }>;
  restoreShopBackup: (
    snapshot: ShopDataSnapshot,
    backupOwnerId: string,
    mode: BackupRestoreMode,
    allowDifferentOwner: boolean,
  ) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [cloudReady, setCloudReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;
  const localSaveTimerRef = useRef<number | null>(null);
  const localSaveIdleRef = useRef<number | null>(null);
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
  const cloudRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const cloudReadyRef = useRef(false);
  const pushCloudSnapshotRef = useRef<() => void>(() => undefined);
  const lastRemoteUpdatedAtRef = useRef(0);

  // Keep the current Supabase identity available to account and recovery settings.
  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthUser(session?.user ?? null);
    });

    void supabase.auth.getUser()
      .then(({ data, error }) => {
        if (active && !error) setAuthUser(data.user);
      })
      .catch((error) => {
        console.error('Dukaan Dost could not read the current account identity.', error);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Build the cloud-safe snapshot once per actual state change. The old flow deep-cloned
  // every transaction and chat three times for one update, blocking weaker mobile CPUs.
  const stateSnapshot = useMemo(
    () => createShopDataSnapshot(state, tombstonesRef.current),
    [state],
  );
  currentSnapshotRef.current = stateSnapshot;

  // Persist deletions as tombstones without cloning every collection again.
  useEffect(() => {
    const nextTombstones = collectSnapshotTombstones(previousSnapshotRef.current, stateSnapshot);
    tombstonesRef.current = nextTombstones;
    const nextSnapshot = { ...stateSnapshot, tombstones: nextTombstones };
    currentSnapshotRef.current = nextSnapshot;
    previousSnapshotRef.current = nextSnapshot;
  }, [stateSnapshot]);

  // localStorage is synchronous. Write during an idle period instead of blocking the
  // interaction that changed state; always flush immediately when the app is backgrounded.
  const flushLocalState = () => {
    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
    };
    if (localSaveIdleRef.current !== null) {
      idleWindow.cancelIdleCallback?.(localSaveIdleRef.current);
      localSaveIdleRef.current = null;
    }
    if (localSaveTimerRef.current !== null) {
      window.clearTimeout(localSaveTimerRef.current);
      localSaveTimerRef.current = null;
    }
    saveState(latestStateRef.current);
  };

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      localSaveIdleRef.current = idleWindow.requestIdleCallback(() => {
        localSaveIdleRef.current = null;
        saveState(latestStateRef.current);
      }, { timeout: 500 });
    } else {
      localSaveTimerRef.current = window.setTimeout(() => {
        localSaveTimerRef.current = null;
        saveState(latestStateRef.current);
      }, 100);
    }

    return () => {
      if (localSaveIdleRef.current !== null) {
        idleWindow.cancelIdleCallback?.(localSaveIdleRef.current);
        localSaveIdleRef.current = null;
      }
      if (localSaveTimerRef.current !== null) {
        window.clearTimeout(localSaveTimerRef.current);
        localSaveTimerRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushLocalState();
    };
    window.addEventListener('pagehide', flushLocalState);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushLocalState);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flushLocalState();
    };
  }, []);

  // Establish the owner session, then keep recovering from temporary network outages.
  useEffect(() => {
    let active = true;
    let attempts = 0;
    let bootstrapping = false;

    const bootstrap = async () => {
      if (!supabase || !active || bootstrapping || cloudReadyRef.current) return;
      bootstrapping = true;

      try {
        const { data: initialSessionData, error: initialSessionError } = await supabase.auth.getSession();
        if (initialSessionError) throw initialSessionError;

        let activeSession = initialSessionData.session;
        if (!activeSession) {
          const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
          if (anonymousError) throw anonymousError;
          activeSession = anonymousData.session;
        }
        const activeUserId = activeSession?.user?.id ?? null;
        if (!activeUserId) throw new Error('There is no authenticated shop session.');

        // Local business data belongs to one Auth user. Never merge a previous shop's
        // browser cache into a different signed-in identity.
        const savedOwnerId = localStorage.getItem('dukaandost_owner_id');
        const hasSavedLocalState = Boolean(localStorage.getItem('dukaandost_state'));
        const ownerChanged = Boolean(savedOwnerId && savedOwnerId !== activeUserId);
        const unownedCacheForPermanentUser = !savedOwnerId && hasSavedLocalState && !activeSession?.user?.is_anonymous;
        const mustDiscardLocalCache = ownerChanged || unownedCacheForPermanentUser;

        let localSnapshot = currentSnapshotRef.current;
        if (mustDiscardLocalCache) {
          localStorage.removeItem('dukaandost_state');
          localStorage.removeItem('dukaandost_owner_id');
          tombstonesRef.current = createEmptySnapshotTombstones();
          localSnapshot = createShopDataSnapshot(initialState, tombstonesRef.current);
          currentSnapshotRef.current = localSnapshot;
          previousSnapshotRef.current = localSnapshot;
          dispatch({ type: 'RESET_LOCAL_FOR_ACCOUNT_SWITCH' });
        }

        const result = await loadOrCreateCloudSnapshot(localSnapshot);
        if (!active) return;

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (sessionData.session?.user?.id !== activeUserId) {
          throw new Error('The active shop account changed during cloud initialization.');
        }
        cloudUserIdRef.current = activeUserId;
        setAuthUser(sessionData.session.user);
        localStorage.setItem('dukaandost_owner_id', activeUserId);

        tombstonesRef.current = result.snapshot.tombstones;
        currentSnapshotRef.current = result.snapshot;
        previousSnapshotRef.current = result.snapshot;
        lastCloudSnapshotRef.current = JSON.stringify(result.remoteSnapshot ?? result.snapshot);
        lastRemoteUpdatedAtRef.current = result.updatedAt
          ? Date.parse(result.updatedAt)
          : 0;

        dispatch({ type: 'HYDRATE_SHOP_DATA', payload: result.snapshot });

        // Realtime delivers low-latency notices; the subscription refreshes the full
        // row after each successful join to recover any events missed while disconnected.
        cloudSubscriptionCleanupRef.current?.();
        const subscription = subscribeToShopDataSnapshot(
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

            // Resolve profile and preference conflicts independently from ledger entries.
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
            currentSnapshotRef.current = reconciled;
            previousSnapshotRef.current = reconciled;
            dispatch({ type: 'SYNC_SHOP_DATA', payload: reconciled });
          },
        );
        cloudSubscriptionCleanupRef.current = subscription.unsubscribe;
        cloudRefreshRef.current = subscription.refresh;
        cloudReadyRef.current = true;
        attempts = 0;
        setCloudReady(true);
      } catch (error) {
        console.error('Dukaan Dost cloud persistence could not initialize; local data remains available.', error);
        if (active) {
          const delay = Math.min(60000, 2000 * (2 ** Math.min(attempts, 5)));
          attempts += 1;
          if (cloudBootstrapRetryTimerRef.current !== null) {
            window.clearTimeout(cloudBootstrapRetryTimerRef.current);
          }
          cloudBootstrapRetryTimerRef.current = window.setTimeout(() => {
            cloudBootstrapRetryTimerRef.current = null;
            void bootstrap();
          }, delay);
        }
      } finally {
        bootstrapping = false;
      }
    };

    const recoverCloudConnection = () => {
      if (!active) return;

      if (!cloudReadyRef.current) {
        attempts = 0;
        if (cloudBootstrapRetryTimerRef.current !== null) {
          window.clearTimeout(cloudBootstrapRetryTimerRef.current);
          cloudBootstrapRetryTimerRef.current = null;
        }
        void bootstrap();
        return;
      }

      const refresh = cloudRefreshRef.current;
      if (!refresh) {
        pushCloudSnapshotRef.current();
        return;
      }

      // Reconcile with the server before pushing local pending changes. This prevents
      // a device waking from the background from sending a stale whole-row snapshot.
      void refresh()
        .then(() => {
          window.setTimeout(() => pushCloudSnapshotRef.current(), 0);
        })
        .catch((error) => {
          console.warn('Dukaan Dost could not reconcile cloud data after reconnecting.', error);
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pushCloudSnapshotRef.current();
      } else {
        recoverCloudConnection();
      }
    };

    window.addEventListener('online', recoverCloudConnection);
    window.addEventListener('focus', recoverCloudConnection);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    void bootstrap();

    return () => {
      active = false;
      cloudReadyRef.current = false;
      cloudRefreshRef.current = null;
      cloudSubscriptionCleanupRef.current?.();
      cloudSubscriptionCleanupRef.current = null;
      if (cloudBootstrapRetryTimerRef.current !== null) {
        window.clearTimeout(cloudBootstrapRetryTimerRef.current);
      }
      window.removeEventListener('online', recoverCloudConnection);
      window.removeEventListener('focus', recoverCloudConnection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Serialize cloud writes. Each write is conditional on the exact database version
  // that was read; conflicts are merged and retried by persistShopDataSnapshot().
  pushCloudSnapshotRef.current = () => {
    if (!cloudReady || !cloudReadyRef.current || !cloudUserIdRef.current || cloudSaveInFlightRef.current) return;

    const snapshot = currentSnapshotRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastCloudSnapshotRef.current) return;

    let mergeOptions: SnapshotMergeOptions = {};
    if (lastCloudSnapshotRef.current) {
      try {
        const lastSynced = JSON.parse(lastCloudSnapshotRef.current) as ShopDataSnapshot;
        mergeOptions = {
          preferLocalProfile:
            JSON.stringify(snapshot.shopProfile) !== JSON.stringify(lastSynced.shopProfile),
          preferLocalPreferences:
            JSON.stringify(snapshot.preferences) !== JSON.stringify(lastSynced.preferences),
        };
      } catch {
        // A missing or invalid baseline falls back to the snapshot merge defaults.
      }
    }

    if (cloudRetryTimerRef.current !== null) {
      window.clearTimeout(cloudRetryTimerRef.current);
      cloudRetryTimerRef.current = null;
    }

    cloudSaveInFlightRef.current = true;
    void persistShopDataSnapshot(snapshot, cloudUserIdRef.current, mergeOptions)
      .then((result) => {
        lastCloudSnapshotRef.current = JSON.stringify(result.snapshot);
        const remoteTime = Date.parse(result.updatedAt);
        if (Number.isFinite(remoteTime)) lastRemoteUpdatedAtRef.current = remoteTime;
        cloudRetryAttemptRef.current = 0;

        if (cloudRetryTimerRef.current !== null) {
          window.clearTimeout(cloudRetryTimerRef.current);
          cloudRetryTimerRef.current = null;
        }

        // A concurrent client may have contributed records while this write was in
        // flight. Merge that response with edits made locally after the request began.
        const latestSnapshot = currentSnapshotRef.current;
        const reconciled = mergeShopDataSnapshots(latestSnapshot, result.snapshot, {
          preferLocalProfile:
            JSON.stringify(latestSnapshot.shopProfile) !== JSON.stringify(snapshot.shopProfile),
          preferLocalPreferences:
            JSON.stringify(latestSnapshot.preferences) !== JSON.stringify(snapshot.preferences),
        });

        if (JSON.stringify(reconciled) !== JSON.stringify(latestSnapshot)) {
          tombstonesRef.current = reconciled.tombstones;
          currentSnapshotRef.current = reconciled;
          previousSnapshotRef.current = reconciled;
          dispatch({ type: 'SYNC_SHOP_DATA', payload: reconciled });
        }
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
        // If data changed while a write was in flight, enqueue the latest state.
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

  const createShopBackup = useCallback(async () => {
    if (!cloudReadyRef.current || !cloudUserIdRef.current) {
      throw new Error('Cloud sync is not ready yet. Wait for the shop to finish syncing, then create the backup.');
    }

    const ownerId = cloudUserIdRef.current;
    await cloudRefreshRef.current?.();
    if (cloudUserIdRef.current !== ownerId) {
      throw new Error('The active shop account changed while preparing the backup.');
    }

    // Persist pending local edits through the conflict-safe Phase 2 writer before
    // exporting. The encrypted file therefore represents the latest saved cloud copy.
    const result = await persistShopDataSnapshot(currentSnapshotRef.current, ownerId);
    if (cloudUserIdRef.current !== ownerId) {
      throw new Error('The active shop account changed while preparing the backup.');
    }

    lastCloudSnapshotRef.current = JSON.stringify(result.snapshot);
    const updatedAt = Date.parse(result.updatedAt);
    if (Number.isFinite(updatedAt)) lastRemoteUpdatedAtRef.current = updatedAt;
    tombstonesRef.current = result.snapshot.tombstones;
    currentSnapshotRef.current = result.snapshot;
    previousSnapshotRef.current = result.snapshot;
    dispatch({ type: 'SYNC_SHOP_DATA', payload: result.snapshot });

    return { snapshot: result.snapshot, ownerId };
  }, []);

  const restoreShopBackup = useCallback(async (
    inputSnapshot: ShopDataSnapshot,
    backupOwnerId: string,
    mode: BackupRestoreMode,
    allowDifferentOwner: boolean,
  ) => {
    if (!cloudReadyRef.current || !cloudUserIdRef.current) {
      throw new Error('Cloud sync is not ready yet. Wait for the shop to finish syncing, then restore the backup.');
    }

    const ownerId = cloudUserIdRef.current;
    if (backupOwnerId !== ownerId && !allowDifferentOwner) {
      throw new Error('This backup belongs to another shop account. Explicit confirmation is required before restoring it here.');
    }

    const backupSnapshot = normalizeShopDataSnapshot(inputSnapshot);
    if (!backupSnapshot) {
      throw new Error('The backup does not contain a valid shop-data snapshot.');
    }

    let targetSnapshot: ShopDataSnapshot;
    let result;

    if (mode === 'replace') {
      // Exact restore is intentionally guarded by a database compare-and-swap.
      // Concurrent edits cause an error instead of being silently discarded.
      targetSnapshot = backupSnapshot;
      result = await replaceShopDataSnapshot(targetSnapshot, ownerId);
    } else {
      // Merge preserves current records, chooses the backup profile/preferences,
      // and unions tombstones so a deleted record is not resurrected accidentally.
      targetSnapshot = mergeShopDataSnapshots(
        backupSnapshot,
        currentSnapshotRef.current,
        { preferLocalProfile: true, preferLocalPreferences: true },
      );
      result = await persistShopDataSnapshot(
        targetSnapshot,
        ownerId,
        { preferLocalProfile: true, preferLocalPreferences: true },
      );
    }

    if (cloudUserIdRef.current !== ownerId) {
      throw new Error('The active shop account changed during restore. No local shop state was changed.');
    }

    lastCloudSnapshotRef.current = JSON.stringify(result.snapshot);
    const updatedAt = Date.parse(result.updatedAt);
    if (Number.isFinite(updatedAt)) lastRemoteUpdatedAtRef.current = updatedAt;
    tombstonesRef.current = result.snapshot.tombstones;
    currentSnapshotRef.current = result.snapshot;
    previousSnapshotRef.current = result.snapshot;
    dispatch({ type: 'SYNC_SHOP_DATA', payload: result.snapshot });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured for this app.');
    if (!cloudReadyRef.current || !cloudUserIdRef.current) {
      throw new Error('The shop account is still syncing. Please try again when sync has finished.');
    }

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!data.user) throw new Error('There is no signed-in shop account.');
    if (data.user.is_anonymous) {
      throw new Error('Protect this shop with a verified recovery email and password before signing out. Anonymous accounts cannot be recovered after sign-out.');
    }
    if (data.user.user_metadata?.dukaandost_recovery_password_set !== true) {
      throw new Error('Save a recovery password before signing out. This protects access to your shop on another device.');
    }

    // Flush the latest shop state to the cloud before ending this device session.
    await persistShopDataSnapshot(currentSnapshotRef.current, data.user.id);
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) throw signOutError;
  }, []);

  const contextValue = useMemo(
    () => ({ state, dispatch, authUser, signOut, createShopBackup, restoreShopBackup }),
    [state, dispatch, authUser, signOut, createShopBackup, restoreShopBackup],
  );

  return (
    <StoreContext.Provider value={contextValue}>
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
