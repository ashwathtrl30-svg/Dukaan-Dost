import React, { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState, Language, Theme, ShopProfile, SaleEntry, ExpenseEntry, UdhaarEntry, NotebookNote, ChatMessage, ChatSession, Insight } from './types';
import {
  collectSnapshotTombstones,
  createEmptySnapshotTombstones,
  createShopDataSnapshot,
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
} from './shopDataSnapshot';
import type { ShopDataSnapshot } from './shopDataSnapshot';
import { ensureShopVaultSession, readEncryptedShopVault, readLegacyShopSnapshot, writeEncryptedShopVault, deleteLegacyShopSnapshot, subscribeToEncryptedShopVault, type EncryptedShopVaultRow } from './cloudVault';
import { createVaultSalt, createVaultCipher, type EncryptedVaultEnvelope, type VaultCipher } from './secureVault';

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
  | { type: 'RESTORE_LOCAL_STATE'; payload: AppState }
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
    case 'RESTORE_LOCAL_STATE':
      return action.payload;
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

type VaultStatus = 'checking' | 'new' | 'locked' | 'unlocked' | 'error';

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  vaultStatus: VaultStatus;
  vaultError: string;
  unlockVault: (passphrase: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_VAULT_CACHE_PREFIX = 'dukaandost_encrypted_state:';
const LOCAL_VAULT_SALT_PREFIX = 'dukaandost_local_vault_salt:';

function localVaultCacheKey(userId: string): string {
  return LOCAL_VAULT_CACHE_PREFIX + userId;
}

function localVaultSaltKey(userId: string): string {
  return LOCAL_VAULT_SALT_PREFIX + userId;
}

function readLocalEncryptedCache(userId: string): { envelope: EncryptedVaultEnvelope; salt: string } | null {
  try {
    const raw = localStorage.getItem(localVaultCacheKey(userId));
    const salt = localStorage.getItem(localVaultSaltKey(userId));
    if (!raw || !salt) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const envelope = value as EncryptedVaultEnvelope;
    if (
      typeof envelope.ciphertext !== 'string' ||
      typeof envelope.iv !== 'string' ||
      typeof envelope.kdf_salt !== 'string' ||
      envelope.crypto_version !== 1
    ) return null;
    return { envelope, salt };
  } catch {
    return null;
  }
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppState>;
  return !!candidate.shopProfile &&
    typeof candidate.shopProfile === 'object' &&
    Array.isArray(candidate.sales) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.udhaar) &&
    Array.isArray(candidate.notebookNotes);
}

function hasLocalProfileData(profile: ShopProfile): boolean {
  return Boolean(
    profile.shopType || profile.shopName?.trim() || profile.city?.trim() ||
    profile.duration || profile.ownership || profile.monthlySales ||
    profile.udhaarLevel || profile.accounting || profile.worries?.length
  );
}

async function reconcileAndRemoveLegacySnapshot(
  userId: string,
  cipher: VaultCipher,
  encryptedSnapshot: ShopDataSnapshot,
  encryptedUpdatedAt: string,
): Promise<{ snapshot: ShopDataSnapshot; updatedAt: string }> {
  const legacyRow = await readLegacyShopSnapshot(userId);
  if (!legacyRow) return { snapshot: encryptedSnapshot, updatedAt: encryptedUpdatedAt };

  if (legacyRow.schema_version !== 1 && legacyRow.schema_version !== 2) {
    throw new Error('The old cloud shop data uses an unsupported version. It was left untouched.');
  }
  const legacySnapshot = normalizeShopDataSnapshot(legacyRow.state);
  if (!legacySnapshot) {
    throw new Error('The old cloud shop data could not be validated. It was left untouched.');
  }

  // If a stale client wrote after the vault was created, retain the newer snapshot.
  // Record-level updates are still reconciled by their timestamps and tombstones.
  const encryptedTime = Date.parse(encryptedUpdatedAt);
  const legacyTime = Date.parse(legacyRow.updated_at);
  const legacyIsNewer =
    Number.isFinite(legacyTime) &&
    (!Number.isFinite(encryptedTime) || legacyTime > encryptedTime);
  const merged = mergeShopDataSnapshots(
    encryptedSnapshot,
    legacySnapshot,
    {
      preferLocalProfile: !legacyIsNewer && hasLocalProfileData(encryptedSnapshot.shopProfile),
      preferLocalPreferences: !legacyIsNewer && Boolean(
        encryptedSnapshot.preferences.language || encryptedSnapshot.preferences.onboardingComplete
      ),
    },
  );

  let verifiedUpdatedAt = encryptedUpdatedAt;
  if (JSON.stringify(merged) !== JSON.stringify(encryptedSnapshot)) {
    const replacement = await cipher.encrypt(merged);
    await writeEncryptedShopVault(userId, replacement);
    const verifiedRow = await readEncryptedShopVault(userId);
    if (!verifiedRow ||
        verifiedRow.ciphertext !== replacement.ciphertext ||
        verifiedRow.iv !== replacement.iv ||
        verifiedRow.kdf_salt !== replacement.kdf_salt) {
      throw new Error('The updated encrypted vault could not be verified. The old cloud copy was retained.');
    }
    const verified = normalizeShopDataSnapshot(await cipher.decrypt<unknown>(verifiedRow));
    if (!verified || JSON.stringify(verified) !== JSON.stringify(merged)) {
      throw new Error('The updated encrypted vault did not pass its verification check. The old cloud copy was retained.');
    }
    verifiedUpdatedAt = verifiedRow.updated_at;
  }

  // Remove the readable legacy row only after the encrypted version has been
  // decrypted and validated, including any newer data found in that legacy row.
  await deleteLegacyShopSnapshot(userId, legacyRow.updated_at);
  return { snapshot: merged, updatedAt: verifiedUpdatedAt };
}

function applySnapshotToState(base: AppState, snapshot: ShopDataSnapshot): AppState {
  return {
    ...base,
    shopProfile: snapshot.shopProfile,
    sales: snapshot.sales,
    expenses: snapshot.expenses,
    udhaar: snapshot.udhaar,
    notebookNotes: snapshot.notebookNotes,
    chatSessions: snapshot.chatSessions,
    activeSessionId: base.activeSessionId && snapshot.chatSessions.some(
      (session) => session.id === base.activeSessionId
    )
      ? base.activeSessionId
      : snapshot.chatSessions.find((session) => session.messages.length === 0)?.id
        ?? snapshot.chatSessions[0]?.id
        ?? null,
    insights: snapshot.insights,
    language: snapshot.preferences.language,
    theme: snapshot.preferences.theme,
    onboardingComplete: snapshot.preferences.onboardingComplete,
    userName: snapshot.preferences.userName,
    reminderTime: snapshot.preferences.reminderTime,
    streak: snapshot.preferences.streak,
    lastEntryDate: snapshot.preferences.lastEntryDate,
    textSize: snapshot.preferences.textSize,
    notificationsEnabled: snapshot.preferences.notificationsEnabled,
    alertTypes: snapshot.preferences.alertTypes,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Plaintext local storage is read only as a one-time migration source.
  // Once a vault is unlocked, the app writes only encrypted local state.
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [vaultStatus, setVaultStatus] = useState<VaultStatus>('checking');
  const [vaultError, setVaultError] = useState('');
  const [cloudReady, setCloudReady] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const passphraseRef = useRef<string | null>(null);
  const remoteCipherRef = useRef<VaultCipher | null>(null);
  const localCipherRef = useRef<VaultCipher | null>(null);
  const remoteUpdatedAtRef = useRef(0);
  const lastCloudSnapshotRef = useRef('');
  const cloudSubscriptionCleanupRef = useRef<(() => void) | null>(null);
  const cloudSaveInFlightRef = useRef(false);
  const cloudRetryTimerRef = useRef<number | null>(null);
  const cloudRetryAttemptRef = useRef(0);
  const localSaveTimerRef = useRef<number | null>(null);
  const localSaveSequenceRef = useRef(0);

  const tombstonesRef = useRef(createEmptySnapshotTombstones());
  const currentSnapshotRef = useRef<ShopDataSnapshot>(
    createShopDataSnapshot(state, tombstonesRef.current),
  );
  const previousSnapshotRef = useRef<ShopDataSnapshot>(currentSnapshotRef.current);
  const pushCloudRef = useRef<() => void>(() => undefined);
  const connectCloudRef = useRef<() => Promise<void>>(async () => undefined);
  const subscribeRef = useRef<() => void>(() => undefined);

  currentSnapshotRef.current = createShopDataSnapshot(state, tombstonesRef.current);

  // Identify the current owner and check whether the encrypted vault exists.
  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const userId = await ensureShopVaultSession();
        if (!active) return;
        userIdRef.current = userId;
        localStorage.setItem('dukaandost_active_vault_user', userId);

        try {
          const row = await readEncryptedShopVault(userId);
          if (!active) return;
          setVaultError('');
          setVaultStatus(row ? 'locked' : 'new');
        } catch (error) {
          if (!active) return;
          if (readLocalEncryptedCache(userId)) {
            setVaultError('Cloud storage is temporarily unavailable. You can unlock the encrypted copy on this device; cloud sync will resume when the connection returns.');
            setVaultStatus('locked');
          } else {
            setVaultError(error instanceof Error
              ? error.message
              : 'Could not connect to secure cloud storage. Check your internet connection and retry.');
            setVaultStatus('error');
          }
        }
      } catch (error) {
        if (!active) return;
        setVaultError(error instanceof Error
          ? error.message
          : 'Could not establish a secure shop account. Please retry.');
        setVaultStatus('error');
      }
    };
    void bootstrap();

    return () => {
      active = false;
      cloudSubscriptionCleanupRef.current?.();
      cloudSubscriptionCleanupRef.current = null;
    };
  }, []);

  // Track deleted records only after the vault has been unlocked. This avoids treating
  // the initial locked state as a real deletion of records from the encrypted vault.
  useEffect(() => {
    if (vaultStatus !== 'unlocked') return;
    const latest = createShopDataSnapshot(state, tombstonesRef.current);
    tombstonesRef.current = collectSnapshotTombstones(previousSnapshotRef.current, latest);
    currentSnapshotRef.current = createShopDataSnapshot(state, tombstonesRef.current);
    previousSnapshotRef.current = currentSnapshotRef.current;
  }, [state, vaultStatus]);

  // Persist all on-device app state as an encrypted envelope. The encryption key
  // remains non-extractable and in memory; the passphrase is never stored.
  useEffect(() => {
    if (vaultStatus !== 'unlocked') return;
    const userId = userIdRef.current;
    const cipher = localCipherRef.current;
    if (!userId || !cipher) return;

    const sequence = ++localSaveSequenceRef.current;
    if (localSaveTimerRef.current !== null) {
      window.clearTimeout(localSaveTimerRef.current);
    }
    localSaveTimerRef.current = window.setTimeout(() => {
      localSaveTimerRef.current = null;
      void cipher.encrypt(state).then((envelope) => {
        if (sequence !== localSaveSequenceRef.current) return;
        localStorage.setItem(localVaultCacheKey(userId), JSON.stringify(envelope));
        localStorage.setItem(localVaultSaltKey(userId), envelope.kdf_salt);
        localStorage.removeItem('dukaandost_state');
      }).catch((error) => {
        console.error('Dukaan Dost could not update its encrypted local cache.', error);
      });
    }, 180);

    return () => {
      if (localSaveTimerRef.current !== null) {
        window.clearTimeout(localSaveTimerRef.current);
        localSaveTimerRef.current = null;
      }
    };
  }, [state, vaultStatus]);

  // Realtime delivers encrypted rows only. Decryption and reconciliation happen locally.
  subscribeRef.current = () => {
    const userId = userIdRef.current;
    if (!userId || !remoteCipherRef.current) return;

    cloudSubscriptionCleanupRef.current?.();
    cloudSubscriptionCleanupRef.current = subscribeToEncryptedShopVault(userId, (row) => {
      void (async () => {
        const cipher = remoteCipherRef.current;
        if (!cipher || row.user_id !== userId) return;

        const remoteTime = Date.parse(row.updated_at);
        if (Number.isFinite(remoteTime) && remoteTime < remoteUpdatedAtRef.current) return;

        const decoded = await cipher.decrypt<unknown>(row);
        const remoteSnapshot = normalizeShopDataSnapshot(decoded);
        if (!remoteSnapshot) {
          console.error('Dukaan Dost ignored an invalid encrypted vault update.');
          return;
        }

        const remoteSerialized = JSON.stringify(remoteSnapshot);
        if (remoteSerialized === lastCloudSnapshotRef.current) return;

        const localSnapshot = currentSnapshotRef.current;
        let preferLocalProfile = true;
        let preferLocalPreferences = true;
        if (lastCloudSnapshotRef.current) {
          try {
            const lastSynced = JSON.parse(lastCloudSnapshotRef.current) as ShopDataSnapshot;
            preferLocalProfile = JSON.stringify(localSnapshot.shopProfile) !== JSON.stringify(lastSynced.shopProfile);
            preferLocalPreferences = JSON.stringify(localSnapshot.preferences) !== JSON.stringify(lastSynced.preferences);
          } catch {
            // Preserve local pending edits if a prior sync baseline cannot be parsed.
          }
        }

        const reconciled = mergeShopDataSnapshots(
          localSnapshot,
          remoteSnapshot,
          { preferLocalProfile, preferLocalPreferences },
        );
        lastCloudSnapshotRef.current = remoteSerialized;
        if (Number.isFinite(remoteTime)) remoteUpdatedAtRef.current = remoteTime;
        tombstonesRef.current = reconciled.tombstones;
        currentSnapshotRef.current = reconciled;
        previousSnapshotRef.current = reconciled;
        dispatch({
          type: 'RESTORE_LOCAL_STATE',
          payload: applySnapshotToState(stateRef.current, reconciled),
        });
      })().catch((error) => {
        console.error('Dukaan Dost could not decrypt a vault update. Local data remains unchanged.', error);
      });
    });
  };

  // Persist the latest cloud-safe snapshot as ciphertext, with a single-write queue.
  pushCloudRef.current = () => {
    const userId = userIdRef.current;
    const cipher = remoteCipherRef.current;
    if (vaultStatus !== 'unlocked' || !cloudReady || !userId || !cipher || cloudSaveInFlightRef.current) {
      return;
    }

    const snapshot = currentSnapshotRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastCloudSnapshotRef.current) return;

    cloudSaveInFlightRef.current = true;
    void cipher.encrypt(snapshot)
      .then((envelope) => writeEncryptedShopVault(userId, envelope))
      .then(() => {
        lastCloudSnapshotRef.current = serialized;
        cloudRetryAttemptRef.current = 0;
      })
      .catch((error) => {
        console.error('Dukaan Dost encrypted cloud save failed; it will retry automatically.', error);
        cloudRetryAttemptRef.current += 1;
        if (cloudRetryTimerRef.current !== null) {
          window.clearTimeout(cloudRetryTimerRef.current);
        }
        const delay = Math.min(60000, 2000 * (2 ** Math.min(cloudRetryAttemptRef.current - 1, 5)));
        cloudRetryTimerRef.current = window.setTimeout(() => {
          cloudRetryTimerRef.current = null;
          pushCloudRef.current();
        }, delay);
      })
      .finally(() => {
        cloudSaveInFlightRef.current = false;
        if (
          JSON.stringify(currentSnapshotRef.current) !== lastCloudSnapshotRef.current &&
          cloudRetryTimerRef.current === null
        ) {
          window.setTimeout(() => pushCloudRef.current(), 0);
        }
      });
  };

  // Reconnect after an offline unlock. If there is no encrypted row yet, migrate the
  // legacy plaintext snapshot only after the new ciphertext is read back and decrypted.
  connectCloudRef.current = async () => {
    const userId = userIdRef.current;
    const passphrase = passphraseRef.current;
    if (!userId || !passphrase || remoteCipherRef.current) return;

    const row = await readEncryptedShopVault(userId);
    let remoteCipher: VaultCipher;
    let remoteSnapshot: ShopDataSnapshot;

    if (row) {
      remoteCipher = await createVaultCipher(passphrase, row.kdf_salt);
      const decoded = normalizeShopDataSnapshot(await remoteCipher.decrypt<unknown>(row));
      if (!decoded) throw new Error('The encrypted cloud vault could not be validated.');
      const legacyReconciled = await reconcileAndRemoveLegacySnapshot(
        userId,
        remoteCipher,
        decoded,
        row.updated_at,
      );
      remoteSnapshot = legacyReconciled.snapshot;
      lastCloudSnapshotRef.current = JSON.stringify(remoteSnapshot);
      const remoteTime = Date.parse(legacyReconciled.updatedAt);
      remoteUpdatedAtRef.current = Number.isFinite(remoteTime) ? remoteTime : 0;

      const merged = mergeShopDataSnapshots(currentSnapshotRef.current, remoteSnapshot);
      tombstonesRef.current = merged.tombstones;
      currentSnapshotRef.current = merged;
      previousSnapshotRef.current = merged;
      dispatch({
        type: 'RESTORE_LOCAL_STATE',
        payload: applySnapshotToState(stateRef.current, merged),
      });
    } else {
      const legacyRow = await readLegacyShopSnapshot(userId);
      let legacySnapshot: ShopDataSnapshot | null = null;
      if (legacyRow) {
        if (legacyRow.schema_version !== 1 && legacyRow.schema_version !== 2) {
          throw new Error('The old cloud shop data uses an unsupported version. It was left untouched.');
        }
        legacySnapshot = normalizeShopDataSnapshot(legacyRow.state);
        if (!legacySnapshot) {
          throw new Error('The old cloud shop data could not be validated. It was left untouched.');
        }
      }

      const localSnapshot = currentSnapshotRef.current;
      remoteSnapshot = legacySnapshot
        ? mergeShopDataSnapshots(localSnapshot, legacySnapshot, {
            preferLocalPreferences: Boolean(
              stateRef.current.language || stateRef.current.onboardingComplete
            ),
          })
        : localSnapshot;
      const salt = createVaultSalt();
      remoteCipher = await createVaultCipher(passphrase, salt);
      const envelope = await remoteCipher.encrypt(remoteSnapshot);
      await writeEncryptedShopVault(userId, envelope);

      const verifiedRow = await readEncryptedShopVault(userId);
      if (!verifiedRow || verifiedRow.ciphertext !== envelope.ciphertext ||
          verifiedRow.iv !== envelope.iv || verifiedRow.kdf_salt !== envelope.kdf_salt) {
        throw new Error('The encrypted cloud vault could not be verified. The old cloud copy was retained.');
      }
      const verified = normalizeShopDataSnapshot(await remoteCipher.decrypt<unknown>(verifiedRow));
      if (!verified || JSON.stringify(verified) !== JSON.stringify(remoteSnapshot)) {
        throw new Error('The encrypted cloud vault did not pass its verification check.');
      }
      if (legacyRow) await deleteLegacyShopSnapshot(userId, legacyRow.updated_at);
      lastCloudSnapshotRef.current = JSON.stringify(remoteSnapshot);
      const remoteTime = Date.parse(verifiedRow.updated_at);
      remoteUpdatedAtRef.current = Number.isFinite(remoteTime) ? remoteTime : 0;
    }

    remoteCipherRef.current = remoteCipher;
    setCloudReady(true);
    setVaultError('');
    subscribeRef.current();
    if (JSON.stringify(currentSnapshotRef.current) !== lastCloudSnapshotRef.current) {
      window.setTimeout(() => pushCloudRef.current(), 0);
    }
  };

  const unlockVault = async (passphrase: string): Promise<void> => {
    if (passphrase.length < 12) {
      throw new Error('Use at least 12 characters for your private vault passphrase.');
    }

    setVaultError('');
    const userId = userIdRef.current ?? await ensureShopVaultSession();
    userIdRef.current = userId;

    const localCache = readLocalEncryptedCache(userId);
    let cachedState: AppState | null = null;
    if (localCache) {
      try {
        const localCipher = await createVaultCipher(passphrase, localCache.salt);
        const decrypted = await localCipher.decrypt<unknown>(localCache.envelope);
        if (isAppState(decrypted)) cachedState = decrypted;
      } catch {
        // The cloud vault, if present, remains the authoritative passphrase check.
      }
    }

    let row: EncryptedShopVaultRow | null = null;
    let cloudAvailable = true;
    try {
      row = await readEncryptedShopVault(userId);
    } catch {
      cloudAvailable = false;
    }

    if (localCache && !cachedState && !row) {
      throw new Error('This passphrase did not unlock the encrypted data saved on this device.');
    }

    const localBase = cachedState ?? stateRef.current;
    const localSnapshot = createShopDataSnapshot(localBase, tombstonesRef.current);
    let mergedSnapshot: ShopDataSnapshot;
    let remoteCipher: VaultCipher | null = null;
    let remoteUpdatedAt = 0;

    if (row) {
      remoteCipher = await createVaultCipher(passphrase, row.kdf_salt);
      const decoded = await remoteCipher.decrypt<unknown>(row);
      const remoteSnapshot = normalizeShopDataSnapshot(decoded);
      if (!remoteSnapshot) {
        throw new Error('The encrypted cloud vault could not be validated. Your data was not changed.');
      }

      const legacyReconciled = await reconcileAndRemoveLegacySnapshot(
        userId,
        remoteCipher,
        remoteSnapshot,
        row.updated_at,
      );
      const authoritativeRemoteSnapshot = legacyReconciled.snapshot;
      const preferLocalPreferences = Boolean(
        localBase.language || localBase.onboardingComplete || hasLocalProfileData(localBase.shopProfile)
      );
      mergedSnapshot = mergeShopDataSnapshots(
        localSnapshot,
        authoritativeRemoteSnapshot,
        { preferLocalPreferences },
      );
      lastCloudSnapshotRef.current = JSON.stringify(authoritativeRemoteSnapshot);
      const remoteTime = Date.parse(legacyReconciled.updatedAt);
      remoteUpdatedAt = Number.isFinite(remoteTime) ? remoteTime : 0;
    } else if (cloudAvailable) {
      const legacyRow = await readLegacyShopSnapshot(userId);
      let legacySnapshot: ShopDataSnapshot | null = null;
      if (legacyRow) {
        if (legacyRow.schema_version !== 1 && legacyRow.schema_version !== 2) {
          throw new Error('The old cloud shop data uses an unsupported version. It was left untouched.');
        }
        legacySnapshot = normalizeShopDataSnapshot(legacyRow.state);
        if (!legacySnapshot) {
          throw new Error('The old cloud shop data could not be validated. It was left untouched.');
        }
      }

      mergedSnapshot = legacySnapshot
        ? mergeShopDataSnapshots(localSnapshot, legacySnapshot, {
            preferLocalPreferences: Boolean(
              localBase.language || localBase.onboardingComplete
            ),
          })
        : localSnapshot;

      const salt = createVaultSalt();
      remoteCipher = await createVaultCipher(passphrase, salt);
      const envelope = await remoteCipher.encrypt(mergedSnapshot);
      await writeEncryptedShopVault(userId, envelope);

      const verifiedRow = await readEncryptedShopVault(userId);
      if (!verifiedRow || verifiedRow.ciphertext !== envelope.ciphertext ||
          verifiedRow.iv !== envelope.iv || verifiedRow.kdf_salt !== envelope.kdf_salt) {
        throw new Error('The encrypted cloud vault could not be verified. Your previous cloud copy was retained.');
      }
      const verified = normalizeShopDataSnapshot(await remoteCipher.decrypt<unknown>(verifiedRow));
      if (!verified || JSON.stringify(verified) !== JSON.stringify(mergedSnapshot)) {
        throw new Error('The encrypted cloud vault did not pass its verification check.');
      }

      // Delete the old plaintext row only after ciphertext read-back and decryption pass.
      if (legacyRow) await deleteLegacyShopSnapshot(userId, legacyRow.updated_at);
      lastCloudSnapshotRef.current = JSON.stringify(mergedSnapshot);
      const remoteTime = Date.parse(verifiedRow.updated_at);
      remoteUpdatedAt = Number.isFinite(remoteTime) ? remoteTime : 0;
    } else {
      if (!cachedState || !localCache) {
        throw new Error('Connect to the internet once to create your encrypted vault. No data has been changed.');
      }
      mergedSnapshot = createShopDataSnapshot(cachedState);
      lastCloudSnapshotRef.current = '';
    }

    const restoredState = applySnapshotToState(localBase, mergedSnapshot);
    const localSalt = cachedState && localCache ? localCache.salt : createVaultSalt();
    const localCipher = await createVaultCipher(passphrase, localSalt);

    // Commit an encrypted local copy before removing the old plaintext cache.
    const localEnvelope = await localCipher.encrypt(restoredState);
    localStorage.setItem(localVaultCacheKey(userId), JSON.stringify(localEnvelope));
    localStorage.setItem(localVaultSaltKey(userId), localSalt);
    localStorage.setItem('dukaandost_active_vault_user', userId);
    localStorage.removeItem('dukaandost_state');

    passphraseRef.current = passphrase;
    remoteCipherRef.current = remoteCipher;
    localCipherRef.current = localCipher;
    remoteUpdatedAtRef.current = remoteUpdatedAt;
    tombstonesRef.current = mergedSnapshot.tombstones;
    currentSnapshotRef.current = mergedSnapshot;
    previousSnapshotRef.current = mergedSnapshot;

    dispatch({ type: 'RESTORE_LOCAL_STATE', payload: restoredState });
    setCloudReady(Boolean(remoteCipher && cloudAvailable));
    setVaultStatus('unlocked');

    if (remoteCipher && cloudAvailable) {
      subscribeRef.current();
    } else {
      setVaultError('Your encrypted device copy is open. Cloud sync will reconnect when internet access returns.');
    }
  };

  // Save the latest state to the encrypted cloud vault after small bursts of edits.
  useEffect(() => {
    if (vaultStatus !== 'unlocked' || !cloudReady) return;
    const timer = window.setTimeout(() => pushCloudRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [state, vaultStatus, cloudReady]);

  useEffect(() => {
    const retryCloud = () => {
      if (vaultStatus === 'unlocked' && !cloudReady) {
        void connectCloudRef.current().catch((error) => {
          setVaultError(error instanceof Error
            ? error.message
            : 'Cloud vault sync could not reconnect. Your local encrypted copy remains available.');
        });
      } else if (vaultStatus === 'unlocked') {
        pushCloudRef.current();
      }
    };
    window.addEventListener('online', retryCloud);
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') pushCloudRef.current();
    };
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('online', retryCloud);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [vaultStatus, cloudReady]);

  // The prototype uses anonymous Supabase accounts. Signing out would orphan cloud
  // data until real, recoverable phone authentication is available.
  const signOut = async (): Promise<void> => {
    throw new Error('Account switching will be available after real phone verification is integrated. Your vault and shop data have been kept safe.');
  };

  useEffect(() => () => {
    cloudSubscriptionCleanupRef.current?.();
    if (cloudRetryTimerRef.current !== null) window.clearTimeout(cloudRetryTimerRef.current);
    if (localSaveTimerRef.current !== null) window.clearTimeout(localSaveTimerRef.current);
  }, []);

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
      vaultStatus,
      vaultError,
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
