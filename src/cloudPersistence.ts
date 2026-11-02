import { supabase } from './supabaseClient';
import {
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
  type ShopDataSnapshot,
} from './shopDataSnapshot';

interface SnapshotRow {
  state: unknown;
  schema_version: number;
  updated_at: string;
}

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

  const row = data as SnapshotRow | null;
  if (!row) {
    // First cloud save is additive and uses the current browser's complete local ledger.
    await persistShopDataSnapshot(localSnapshot, session.user.id);
    return {
      snapshot: localSnapshot,
      remoteSnapshot: null,
      schemaVersion: 2,
      updatedAt: null,
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

/** Read the latest owner-scoped row after a Realtime channel connects or reconnects. */
async function readLatestShopSnapshot(userId: string): Promise<SnapshotRow | null> {
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
  return data as SnapshotRow | null;
}

/**
 * Listen only to the signed-in owner's snapshot.
 * The table's RLS policy independently controls which rows can be delivered.
 * A fresh read on SUBSCRIBED also recovers updates missed while the device was offline.
 */
export function subscribeToShopDataSnapshot(
  userId: string,
  onSnapshot: CloudSnapshotListener,
): () => void {
  if (!supabase) throw new Error('Supabase client configuration is missing.');

  let cancelled = false;
  let newestDeliveredAt = Number.NEGATIVE_INFINITY;

  const deliver = (row: SnapshotRow | null) => {
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
        deliver(payload.new as SnapshotRow);
      },
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        void readLatestShopSnapshot(userId)
          .then(deliver)
          .catch((readError) => {
            if (!cancelled) {
              console.error('Dukaan Dost could not refresh cloud data after reconnecting.', readError);
            }
          });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Dukaan Dost live sync connection interrupted; Supabase will retry.', error);
      }
    });

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

/** Upsert the current user's snapshot; the database RLS policy independently enforces ownership. */
export async function persistShopDataSnapshot(
  snapshot: ShopDataSnapshot,
  expectedUserId?: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase client configuration is missing.');

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const userId = data.session?.user?.id;
  if (!userId) throw new Error('There is no authenticated shop session.');
  if (expectedUserId && expectedUserId !== userId) {
    throw new Error('The active shop session changed; refusing to write to a different account.');
  }

  const { error } = await supabase
    .from('shop_state_snapshots')
    .upsert(
      {
        user_id: userId,
        state: snapshot,
        schema_version: 2,
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}
