import { supabase } from './supabaseClient';
import type { EncryptedVaultEnvelope } from './secureVault';

export interface EncryptedShopVaultRow extends EncryptedVaultEnvelope {
  user_id: string;
  updated_at: string;
}

export interface LegacyShopSnapshotRow {
  state: unknown;
  schema_version: number;
  updated_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Secure cloud storage is not configured. Please contact Dukaan Dost support.');
  }
  return supabase;
}

/** Use the current signed-in identity, creating the prototype's anonymous identity only once. */
export async function ensureShopVaultSession(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  let session = data.session;
  if (!session) {
    const created = await client.auth.signInAnonymously();
    if (created.error) throw created.error;
    session = created.data.session;
  }
  const userId = session?.user?.id;
  if (!userId) throw new Error('A secure shop account could not be established.');
  return userId;
}

async function assertActiveShopUser(expectedUserId: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session?.user?.id !== expectedUserId) {
    throw new Error('The active shop account changed. The vault operation was stopped.');
  }
}

export async function readEncryptedShopVault(
  userId: string,
): Promise<EncryptedShopVaultRow | null> {
  const client = requireSupabase();
  await assertActiveShopUser(userId);
  const { data, error } = await client
    .from('shop_vaults')
    .select('user_id, ciphertext, iv, kdf_salt, crypto_version, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as EncryptedShopVaultRow | null;
}

/** Read the old plaintext snapshot only for the one-time, verified vault migration. */
export async function readLegacyShopSnapshot(
  userId: string,
): Promise<LegacyShopSnapshotRow | null> {
  const client = requireSupabase();
  await assertActiveShopUser(userId);
  const { data, error } = await client
    .from('shop_state_snapshots')
    .select('state, schema_version, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as LegacyShopSnapshotRow | null;
}

/** Save only the encrypted envelope. No shop records or passphrase are sent as plaintext. */
export async function writeEncryptedShopVault(
  userId: string,
  envelope: EncryptedVaultEnvelope,
): Promise<void> {
  const client = requireSupabase();
  await assertActiveShopUser(userId);
  const { error } = await client
    .from('shop_vaults')
    .upsert(
      {
        user_id: userId,
        ciphertext: envelope.ciphertext,
        iv: envelope.iv,
        kdf_salt: envelope.kdf_salt,
        crypto_version: envelope.crypto_version,
      },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

/** Delete the legacy plaintext copy only after the encrypted copy has been read back and verified. */
export async function deleteLegacyShopSnapshot(
  userId: string,
  expectedUpdatedAt: string,
): Promise<void> {
  const client = requireSupabase();
  await assertActiveShopUser(userId);
  // Compare-and-delete avoids removing a newer plaintext write from an older
  // app tab while a vault migration is in progress.
  const { error } = await client
    .from('shop_state_snapshots')
    .delete()
    .eq('user_id', userId)
    .eq('updated_at', expectedUpdatedAt);
  if (error) throw error;
}

async function readLatestEncryptedVault(userId: string): Promise<EncryptedShopVaultRow | null> {
  return readEncryptedShopVault(userId);
}

export type EncryptedVaultListener = (row: EncryptedShopVaultRow) => void;

/**
 * Subscribe to only the current owner's encrypted vault. RLS enforces ownership.
 * A fresh read when the channel reconnects recovers changes made while offline.
 */
export function subscribeToEncryptedShopVault(
  userId: string,
  onVault: EncryptedVaultListener,
): () => void {
  const client = requireSupabase();
  let cancelled = false;
  let newestDeliveredAt = Number.NEGATIVE_INFINITY;

  const deliver = (row: EncryptedShopVaultRow | null) => {
    if (cancelled || !row || row.user_id !== userId) return;
    const updatedAtMs = Date.parse(row.updated_at);
    if (Number.isFinite(updatedAtMs) && updatedAtMs < newestDeliveredAt) return;
    if (Number.isFinite(updatedAtMs)) newestDeliveredAt = updatedAtMs;
    onVault(row);
  };

  const channel = client
    .channel('encrypted-shop-vault:' + userId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shop_vaults',
        filter: 'user_id=eq.' + userId,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        deliver(payload.new as EncryptedShopVaultRow);
      },
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        void readLatestEncryptedVault(userId)
          .then(deliver)
          .catch((readError) => {
            if (!cancelled) {
              console.error('Dukaan Dost could not refresh the encrypted vault after reconnecting.', readError);
            }
          });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Dukaan Dost encrypted vault sync was interrupted; Supabase will retry.', error);
      }
    });

  return () => {
    cancelled = true;
    void client.removeChannel(channel);
  };
}
