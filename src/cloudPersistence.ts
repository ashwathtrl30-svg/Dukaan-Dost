import { supabase } from './supabaseClient';
import {
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
  type ShopDataSnapshot,
} from './shopDataSnapshot';

interface SnapshotRow {
  state: unknown;
  schema_version: number;
}

export interface CloudBootstrapResult {
  snapshot: ShopDataSnapshot;
  remoteSnapshot: ShopDataSnapshot | null;
  schemaVersion: number;
}

/**
 * Establish an Auth identity, then load the owner's cloud snapshot.
 * Anonymous Auth is a temporary bridge until the real phone sign-in flow is implemented.
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
    .select('state, schema_version')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) throw error;

  const row = data as SnapshotRow | null;
  if (!row) {
    // First cloud save is additive and uses the current browser's complete local ledger.
    await persistShopDataSnapshot(localSnapshot, session.user.id);
    return { snapshot: localSnapshot, remoteSnapshot: null, schemaVersion: 2 };
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}
