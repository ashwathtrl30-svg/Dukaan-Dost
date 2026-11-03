import { supabase } from './supabaseClient';
import {
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
  type ShopDataSnapshot,
  type SnapshotMergeOptions,
} from './shopDataSnapshot';
import {
  persistSnapshotWithConflictResolution,
  type CloudSnapshotRow,
  type SnapshotWriteAdapter,
  type SnapshotWriteResult,
} from './snapshotSync';

export interface CloudBootstrapResult {
  snapshot: ShopDataSnapshot;
  remoteSnapshot: ShopDataSnapshot | null;
  schemaVersion: number;
  updatedAt: string | null;
}

export type CloudSnapshotListener = (
  snapshot: ShopDataSnapshot,
  updatedAt: string,
) => void;

export interface CloudSnapshotSubscription {
  /** Fetch the latest owner-scoped row and reconcile it with the local client. */
  refresh: () => Promise<void>;
  /** Stop listening and release the Realtime channel. */
  unsubscribe: () => void;
}

/**
 * Establish an Auth identity, then load the owner's cloud snapshot.
 * Anonymous Auth remains a temporary identity until phone sign-in is integrated.
 */
export async function loadOrCreateCloudSnapshot(
  localSnapshot: ShopDataSnapshot,
): Promise<CloudBootstrapResult> {
  if (!supabase) {
    throw new Error('Supabase client configuration is missing.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let session = sessionData.session;
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }

  if (!session?.user?.id) {
    throw new Error('Supabase did not create an authenticated shop session.');
  }

  const { data, error } = await supabase
    .from('shop_state_snapshots')
    .select('state, schema_version, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) throw error;

  const row = data as CloudSnapshotRow | null;
  if (!row) {
    // Insert is intentionally not an upsert. If another client creates the row first,
    // the conflict-safe writer re-reads and merges that row before retrying.
    const created = await persistShopDataSnapshot(localSnapshot, session.user.id);
    return {
      snapshot: created.snapshot,
      remoteSnapshot: created.snapshot,
      schemaVersion: created.schemaVersion,
      updatedAt: created.updatedAt,
    };
  }

  if (row.schema_version !== 1 && row.schema_version !== 2) {
    throw new Error('The cloud shop data uses an unsupported schema version.');
  }

  const remoteSnapshot = normalizeShopDataSnapshot(row.state);
  if (!remoteSnapshot) {
    throw new Error('The cloud shop data could not be safely read; local data was left untouched.');
  }

  return {
    snapshot: mergeShopDataSnapshots(localSnapshot, remoteSnapshot),
    remoteSnapshot,
    schemaVersion: row.schema_version,
    updatedAt: row.updated_at,
  };
}

/** Read the latest owner-scoped row and verify the active identity before every refresh. */
async function readLatestShopSnapshot(userId: string): Promise<CloudSnapshotRow | null> {
  if (!supabase) throw new Error('Supabase client configuration is missing.');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user?.id !== userId) {
    throw new Error('The active shop session changed; refusing to read another account.');
  }

  const { data, error } = await supabase
    .from('shop_state_snapshots')
    .select('state, schema_version, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as CloudSnapshotRow | null;
}

/**
 * Listen only to the signed-in owner's snapshot. Realtime is the fast notification
 * path; refresh() is the recovery path for missed events after reconnect/backgrounding.
 */
export function subscribeToShopDataSnapshot(
  userId: string,
  onSnapshot: CloudSnapshotListener,
): CloudSnapshotSubscription {
  if (!supabase) throw new Error('Supabase client configuration is missing.');

  let cancelled = false;
  let newestDeliveredAt = Number.NEGATIVE_INFINITY;

  const deliver = (row: CloudSnapshotRow | null) => {
    if (cancelled || !row) return;
    if (row.schema_version !== 1 && row.schema_version !== 2) {
      console.error('Dukaan Dost received an unsupported cloud snapshot version.');
      return;
    }

    const snapshot = normalizeShopDataSnapshot(row.state);
    if (!snapshot) {
      console.error('Dukaan Dost ignored an invalid cloud snapshot; local data was left untouched.');
      return;
    }

    const updatedAtMs = Date.parse(row.updated_at);
    if (Number.isFinite(updatedAtMs) && updatedAtMs < newestDeliveredAt) return;
    if (Number.isFinite(updatedAtMs)) newestDeliveredAt = updatedAtMs;

    onSnapshot(snapshot, row.updated_at);
  };

  const refresh = async () => {
    const latestRow = await readLatestShopSnapshot(userId);
    deliver(latestRow);
  };

  const channel = supabase
    .channel('shop-state-sync:' + userId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shop_state_snapshots',
        filter: 'user_id=eq.' + userId,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        deliver(payload.new as CloudSnapshotRow);
      },
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        void refresh().catch((readError) => {
          if (!cancelled) {
            console.error('Dukaan Dost could not refresh cloud data after reconnecting.', readError);
          }
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Dukaan Dost live sync connection interrupted; Supabase will retry.', error);
      }
    });

  return {
    refresh,
    unsubscribe: () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    },
  };
}

/**
 * Save the current snapshot with optimistic concurrency control. The timestamp
 * predicate prevents this client from overwriting a row changed by another client
 * after it was read. Conflicts are merged and retried by snapshotSync.ts.
 */
export async function persistShopDataSnapshot(
  snapshot: ShopDataSnapshot,
  expectedUserId?: string,
  mergeOptions: SnapshotMergeOptions = {},
): Promise<SnapshotWriteResult> {
  if (!supabase) throw new Error('Supabase client configuration is missing.');

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const userId = data.session?.user?.id;
  if (!userId) throw new Error('There is no authenticated shop session.');
  if (expectedUserId && expectedUserId !== userId) {
    throw new Error('The active shop session changed; refusing to write to a different account.');
  }

  const adapter: SnapshotWriteAdapter = {
    read: (ownerId) => readLatestShopSnapshot(ownerId),

    insert: async (ownerId, nextSnapshot) => {
      const { data: inserted, error } = await supabase
        .from('shop_state_snapshots')
        .insert({
          user_id: ownerId,
          state: nextSnapshot,
          schema_version: 2,
        })
        .select('state, schema_version, updated_at')
        .single();

      if (error) throw error;
      return inserted as CloudSnapshotRow;
    },

    compareAndSwap: async (ownerId, expectedUpdatedAt, nextSnapshot) => {
      const { data: updated, error } = await supabase
        .from('shop_state_snapshots')
        .update({
          state: nextSnapshot,
          schema_version: 2,
        })
        .eq('user_id', ownerId)
        .eq('updated_at', expectedUpdatedAt)
        .select('state, schema_version, updated_at')
        .maybeSingle();

      if (error) throw error;
      return updated as CloudSnapshotRow | null;
    },
  };

  return persistSnapshotWithConflictResolution(
    userId,
    snapshot,
    adapter,
    mergeOptions,
  );
}
