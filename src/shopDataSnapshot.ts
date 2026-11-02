import type {
  AppState,
  ChatSession,
  ExpenseEntry,
  Insight,
  Language,
  NotebookNote,
  SaleEntry,
  ShopProfile,
  Theme,
  UdhaarEntry,
} from './types';

export interface SnapshotPreferences {
  language: Language | null;
  theme: Theme;
  onboardingComplete: boolean;
  userName: string;
  reminderTime: string;
  streak: number;
  lastEntryDate: string;
  textSize: 'normal' | 'large';
  notificationsEnabled: boolean;
  alertTypes: Record<string, boolean>;
}

export interface SnapshotTombstones {
  sales: string[];
  expenses: string[];
  udhaar: string[];
  notebookNotes: string[];
  chatSessions: string[];
  insights: string[];
}

export interface ShopDataSnapshot {
  shopProfile: ShopProfile;
  sales: SaleEntry[];
  expenses: ExpenseEntry[];
  udhaar: UdhaarEntry[];
  notebookNotes: NotebookNote[];
  chatSessions: ChatSession[];
  insights: Insight[];
  preferences: SnapshotPreferences;
  tombstones: SnapshotTombstones;
}

export interface SnapshotMergeOptions {
  /** Whether this device has a pending local shop-profile edit. */
  preferLocalProfile?: boolean;
  /** Whether this device has pending local preference edits. */
  preferLocalPreferences?: boolean;
}

type SnapshotSource = Pick<
  AppState,
  | 'shopProfile'
  | 'sales'
  | 'expenses'
  | 'udhaar'
  | 'notebookNotes'
  | 'chatSessions'
  | 'insights'
  | 'language'
  | 'theme'
  | 'onboardingComplete'
  | 'userName'
  | 'reminderTime'
  | 'streak'
  | 'lastEntryDate'
  | 'textSize'
  | 'notificationsEnabled'
  | 'alertTypes'
>;

const MAX_TOMBSTONES_PER_COLLECTION = 10000;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createEmptySnapshotTombstones(): SnapshotTombstones {
  return {
    sales: [],
    expenses: [],
    udhaar: [],
    notebookNotes: [],
    chatSessions: [],
    insights: [],
  };
}

export function mergeSnapshotTombstones(
  ...sources: Array<Partial<SnapshotTombstones> | null | undefined>
): SnapshotTombstones {
  const result = createEmptySnapshotTombstones();
  for (const key of Object.keys(result) as Array<keyof SnapshotTombstones>) {
    const ids = sources.flatMap((source) =>
      Array.isArray(source?.[key]) ? source[key] as string[] : []
    );
    result[key] = [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))]
      .slice(-MAX_TOMBSTONES_PER_COLLECTION);
  }
  return result;
}

/** Build the cloud-safe part of AppState. Device PINs and phone identifiers are never synced. */
export function createShopDataSnapshot(
  source: SnapshotSource,
  tombstones: SnapshotTombstones = createEmptySnapshotTombstones(),
): ShopDataSnapshot {
  return {
    shopProfile: clone(source.shopProfile),
    sales: clone(Array.isArray(source.sales) ? source.sales : []),
    expenses: clone(Array.isArray(source.expenses) ? source.expenses : []),
    udhaar: clone(Array.isArray(source.udhaar) ? source.udhaar : []),
    notebookNotes: clone(Array.isArray(source.notebookNotes) ? source.notebookNotes : []),
    chatSessions: clone(Array.isArray(source.chatSessions) ? source.chatSessions : []),
    insights: clone(Array.isArray(source.insights) ? source.insights : []),
    preferences: {
      language: source.language,
      theme: source.theme,
      onboardingComplete: source.onboardingComplete,
      userName: source.userName,
      reminderTime: source.reminderTime,
      streak: source.streak,
      lastEntryDate: source.lastEntryDate,
      textSize: source.textSize,
      notificationsEnabled: source.notificationsEnabled,
      alertTypes: clone(source.alertTypes || {}),
    },
    tombstones: mergeSnapshotTombstones(tombstones),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTombstones(value: unknown): SnapshotTombstones {
  if (!isRecord(value)) return createEmptySnapshotTombstones();
  return mergeSnapshotTombstones(value as Partial<SnapshotTombstones>);
}

function normalizePreferences(value: unknown): SnapshotPreferences {
  const raw = isRecord(value) ? value : {};
  const rawAlertTypes = isRecord(raw.alertTypes) ? raw.alertTypes : {};
  const alertTypes: Record<string, boolean> = {};
  for (const [key, setting] of Object.entries(rawAlertTypes)) {
    if (typeof setting === 'boolean') alertTypes[key] = setting;
  }

  return {
    language: raw.language === 'en' || raw.language === 'hi' ? raw.language : null,
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    onboardingComplete: raw.onboardingComplete === true,
    userName: typeof raw.userName === 'string' ? raw.userName : '',
    reminderTime: typeof raw.reminderTime === 'string' ? raw.reminderTime : '20:00',
    streak: typeof raw.streak === 'number' && Number.isFinite(raw.streak)
      ? Math.max(0, Math.floor(raw.streak))
      : 0,
    lastEntryDate: typeof raw.lastEntryDate === 'string' ? raw.lastEntryDate : '',
    textSize: raw.textSize === 'large' ? 'large' : 'normal',
    notificationsEnabled: typeof raw.notificationsEnabled === 'boolean'
      ? raw.notificationsEnabled
      : true,
    alertTypes: {
      daily: true,
      udhaar: true,
      festival: true,
      insights: true,
      ...alertTypes,
    },
  };
}

/**
 * Supports schema v1 rows as well as v2 rows. Missing v2 fields from an older cloud
 * snapshot are defaulted safely so deploying this change does not invalidate existing data.
 */
export function normalizeShopDataSnapshot(value: unknown): ShopDataSnapshot | null {
  if (!isRecord(value) || !isRecord(value.shopProfile)) return null;
  if (
    !Array.isArray(value.sales) ||
    !Array.isArray(value.expenses) ||
    !Array.isArray(value.udhaar) ||
    !Array.isArray(value.notebookNotes)
  ) return null;

  const profile = value.shopProfile as unknown as ShopProfile;
  if (!Array.isArray(profile.worries)) return null;

  return {
    shopProfile: clone(profile),
    sales: clone(value.sales as SaleEntry[]),
    expenses: clone(value.expenses as ExpenseEntry[]),
    udhaar: clone(value.udhaar as UdhaarEntry[]),
    notebookNotes: clone(value.notebookNotes as NotebookNote[]),
    chatSessions: Array.isArray(value.chatSessions)
      ? clone(value.chatSessions as ChatSession[])
      : [],
    insights: Array.isArray(value.insights)
      ? clone(value.insights as Insight[])
      : [],
    preferences: normalizePreferences(value.preferences),
    tombstones: normalizeTombstones(value.tombstones),
  };
}

function versionOf(item: { createdAt?: number; updatedAt?: number }): number {
  return item.updatedAt ?? item.createdAt ?? 0;
}

function mergeById<T extends { id: string; createdAt?: number; updatedAt?: number }>(
  remote: T[],
  local: T[],
  deletedIds: string[],
): T[] {
  const entries = new Map<string, T>();
  for (const item of remote) {
    if (item && typeof item.id === 'string') entries.set(item.id, item);
  }
  for (const item of local) {
    if (!item || typeof item.id !== 'string') continue;
    const existing = entries.get(item.id);
    // Prefer the most recently edited copy. Local wins ties so an edit made during
    // startup reconciliation is not discarded.
    if (!existing || versionOf(item) >= versionOf(existing)) entries.set(item.id, item);
  }
  const removed = new Set(deletedIds);
  return [...entries.values()]
    .filter((item) => !removed.has(item.id))
    .sort((a, b) => versionOf(b) - versionOf(a));
}

function hasConfiguredShopProfile(profile: ShopProfile): boolean {
  return Boolean(
    profile.shopType ||
    profile.shopName?.trim() ||
    profile.city?.trim() ||
    profile.duration ||
    profile.ownership ||
    profile.monthlySales ||
    profile.udhaarLevel ||
    profile.accounting ||
    profile.worries?.length
  );
}

/** Capture IDs removed locally so stale browser caches cannot resurrect deleted records. */
export function collectSnapshotTombstones(
  previous: ShopDataSnapshot,
  current: ShopDataSnapshot,
): SnapshotTombstones {
  const merged = mergeSnapshotTombstones(previous.tombstones, current.tombstones);
  const collections: Array<keyof SnapshotTombstones> = [
    'sales',
    'expenses',
    'udhaar',
    'notebookNotes',
    'chatSessions',
    'insights',
  ];
  for (const key of collections) {
    const before = previous[key] as Array<{ id: string }>;
    const after = current[key] as Array<{ id: string }>;
    const afterIds = new Set(after.map((item) => item.id));
    const removedIds = before
      .filter((item) => !afterIds.has(item.id))
      .map((item) => item.id);
    merged[key] = [...new Set([...merged[key], ...removedIds])]
      .slice(-MAX_TOMBSTONES_PER_COLLECTION);
  }
  return merged;
}

/**
 * Reconcile local and cloud data. Records are merged by ID, deletions are respected,
 * and a blank new device adopts the cloud profile and preferences.
 */
export function mergeShopDataSnapshots(
  local: ShopDataSnapshot,
  remote: ShopDataSnapshot,
  options: SnapshotMergeOptions = {},
): ShopDataSnapshot {
  const tombstones = mergeSnapshotTombstones(local.tombstones, remote.tombstones);
  const useLocalProfileAndPreferences = hasConfiguredShopProfile(local.shopProfile);
  const useLocalProfile = options.preferLocalProfile ?? useLocalProfileAndPreferences;
  const useLocalPreferences = options.preferLocalPreferences ?? useLocalProfileAndPreferences;

  return {
    shopProfile: clone(
      useLocalProfile ? local.shopProfile : remote.shopProfile
    ),
    sales: mergeById(remote.sales, local.sales, tombstones.sales),
    expenses: mergeById(remote.expenses, local.expenses, tombstones.expenses),
    udhaar: mergeById(remote.udhaar, local.udhaar, tombstones.udhaar),
    notebookNotes: mergeById(remote.notebookNotes, local.notebookNotes, tombstones.notebookNotes),
    chatSessions: mergeById(remote.chatSessions, local.chatSessions, tombstones.chatSessions),
    insights: mergeById(remote.insights, local.insights, tombstones.insights),
    preferences: clone(
      useLocalPreferences ? local.preferences : remote.preferences
    ),
    tombstones,
  };
}
