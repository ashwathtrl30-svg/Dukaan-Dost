import type { AppState, ExpenseEntry, NotebookNote, SaleEntry, ShopProfile, UdhaarEntry } from './types';

export interface ShopDataSnapshot {
  shopProfile: ShopProfile;
  sales: SaleEntry[];
  expenses: ExpenseEntry[];
  udhaar: UdhaarEntry[];
  notebookNotes: NotebookNote[];
}

type SnapshotSource = Pick<AppState, 'shopProfile' | 'sales' | 'expenses' | 'udhaar' | 'notebookNotes'>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Deliberately excludes identity, PIN, preferences, chats and AI history.
 * Only the shop profile and records required to run the business are synced.
 */
export function createShopDataSnapshot(source: SnapshotSource): ShopDataSnapshot {
  return {
    shopProfile: clone(source.shopProfile),
    sales: clone(Array.isArray(source.sales) ? source.sales : []),
    expenses: clone(Array.isArray(source.expenses) ? source.expenses : []),
    udhaar: clone(Array.isArray(source.udhaar) ? source.udhaar : []),
    notebookNotes: clone(Array.isArray(source.notebookNotes) ? source.notebookNotes : []),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Return a clean supported snapshot; unexpected fields are intentionally discarded. */
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
  };
}

function mergeById<T extends { id: string; createdAt?: number; updatedAt?: number }>(
  remote: T[],
  local: T[],
): T[] {
  const entries = new Map<string, T>();
  for (const item of remote) {
    if (item && typeof item.id === 'string') entries.set(item.id, item);
  }
  // Local copy wins only for matching IDs; all unique records from both sides survive.
  for (const item of local) {
    if (item && typeof item.id === 'string') entries.set(item.id, item);
  }
  return [...entries.values()].sort((a, b) =>
    (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0)
  );
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

/**
 * First-sync reconciliation is additive: no unique local or cloud record is discarded.
 * A configured local profile takes precedence; a blank new device adopts the cloud profile.
 */
export function mergeShopDataSnapshots(
  local: ShopDataSnapshot,
  remote: ShopDataSnapshot,
): ShopDataSnapshot {
  return {
    shopProfile: clone(
      hasConfiguredShopProfile(local.shopProfile)
        ? local.shopProfile
        : remote.shopProfile
    ),
    sales: mergeById(remote.sales, local.sales),
    expenses: mergeById(remote.expenses, local.expenses),
    udhaar: mergeById(remote.udhaar, local.udhaar),
    notebookNotes: mergeById(remote.notebookNotes, local.notebookNotes),
  };
}
