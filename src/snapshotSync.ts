import {
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
  type ShopDataSnapshot,
  type SnapshotMergeOptions,
} from './shopDataSnapshot';

export interface CloudSnapshotRow {
  state: unknown;
  schema_version: number;
  updated_at: string;
}

export interface SnapshotWriteAdapter {
  read(userId: string): Promise<CloudSnapshotRow | null>;
  insert(userId: string, snapshot: ShopDataSnapshot): Promise<CloudSnapshotRow>;
  compareAndSwap(
    userId: string,
    expectedUpdatedAt: string,
    snapshot: ShopDataSnapshot,
  ): Promise<CloudSnapshotRow | null>;
}

export interface SnapshotWriteResult {
  snapshot: ShopDataSnapshot;
  updatedAt: string;
  schemaVersion: number;
}

export interface SnapshotWriteOptions extends SnapshotMergeOptions {
  maxAttempts?: number;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function normalizeRow(row: CloudSnapshotRow): ShopDataSnapshot {
  if (row.schema_version !== 1 && row.schema_version !== 2) {
    throw new Error('The cloud shop data uses an unsupported schema version.');
  }

  const snapshot = normalizeShopDataSnapshot(row.state);
  if (!snapshot) {
    throw new Error('The cloud shop data could not be safely read; local data was left untouched.');
  }
  return snapshot;
}

function pauseBeforeRetry(attempt: number): Promise<void> {
  const delay = Math.min(160, 20 * (2 ** attempt));
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Persist one complete shop snapshot without allowing a stale client to replace a newer
 * row. The database timestamp is used as a compare-and-swap token. If another client
 * changes the row first, read the new row, merge record IDs and tombstones, then retry.
 */
export async function persistSnapshotWithConflictResolution(
  userId: string,
  localSnapshot: ShopDataSnapshot,
  adapter: SnapshotWriteAdapter,
  options: SnapshotWriteOptions = {},
): Promise<SnapshotWriteResult> {
  if (!userId) throw new Error('There is no authenticated shop session.');

  const maxAttempts = Math.max(1, Math.min(12, Math.floor(options.maxAttempts ?? 8)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const remoteRow = await adapter.read(userId);

    if (!remoteRow) {
      try {
        const createdRow = await adapter.insert(userId, localSnapshot);
        return {
          snapshot: normalizeRow(createdRow),
          updatedAt: createdRow.updated_at,
          schemaVersion: createdRow.schema_version,
        };
      } catch (error) {
        // Two devices can both observe an empty table. The primary key chooses one
        // creator; the other must read and merge that winner rather than upsert over it.
        if (!isUniqueViolation(error)) throw error;
        await pauseBeforeRetry(attempt);
        continue;
      }
    }

    const remoteSnapshot = normalizeRow(remoteRow);
    const mergedSnapshot = mergeShopDataSnapshots(
      localSnapshot,
      remoteSnapshot,
      {
        preferLocalProfile: options.preferLocalProfile,
        preferLocalPreferences: options.preferLocalPreferences,
      },
    );

    // Avoid unnecessary writes when the current row already contains the merged data.
    // Version-1 rows still pass through one CAS update so they are upgraded to version 2.
    if (
      remoteRow.schema_version === 2 &&
      JSON.stringify(mergedSnapshot) === JSON.stringify(remoteSnapshot)
    ) {
      return {
        snapshot: remoteSnapshot,
        updatedAt: remoteRow.updated_at,
        schemaVersion: remoteRow.schema_version,
      };
    }

    const updatedRow = await adapter.compareAndSwap(
      userId,
      remoteRow.updated_at,
      mergedSnapshot,
    );

    if (updatedRow) {
      return {
        snapshot: normalizeRow(updatedRow),
        updatedAt: updatedRow.updated_at,
        schemaVersion: updatedRow.schema_version,
      };
    }

    // A concurrent writer changed updated_at between our read and update. Re-read
    // and merge again; never fall back to an unconditional overwrite.
    await pauseBeforeRetry(attempt);
  }

  throw new Error(
    'The cloud shop data is changing on another device. Your changes are still saved locally and will retry.',
  );
}

/**
 * Replace a snapshot only if the database row has not changed since it was read.
 * Unlike normal sync, restore/replace is intentionally exact: it never silently
 * merges a newer remote snapshot over the selected backup. A racing write aborts.
 */
export async function replaceSnapshotWithConflictGuard(
  userId: string,
  snapshot: ShopDataSnapshot,
  adapter: SnapshotWriteAdapter,
): Promise<SnapshotWriteResult> {
  if (!userId) throw new Error('There is no authenticated shop session.');

  const currentRow = await adapter.read(userId);
  if (!currentRow) {
    const inserted = await adapter.insert(userId, snapshot);
    return {
      snapshot: normalizeRow(inserted),
      updatedAt: inserted.updated_at,
      schemaVersion: inserted.schema_version,
    };
  }

  const updated = await adapter.compareAndSwap(userId, currentRow.updated_at, snapshot);
  if (!updated) {
    throw new Error('Cloud shop data changed while the restore was in progress. Refresh and review the restore again.');
  }

  return {
    snapshot: normalizeRow(updated),
    updatedAt: updated.updated_at,
    schemaVersion: updated.schema_version,
  };
}
