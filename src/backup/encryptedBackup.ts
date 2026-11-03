import {
  normalizeShopDataSnapshot,
  type ShopDataSnapshot,
} from '../shopDataSnapshot';

const BACKUP_FORMAT = 'dukaan-dost-encrypted-backup';
const BACKUP_FORMAT_VERSION = 1;
const BACKUP_SCHEMA_VERSION = 2;
const APP_ID = 'dukaan-dost';
const KDF_ITERATIONS = 600_000;
const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const MAX_RECORDS_PER_COLLECTION = 100_000;
const AAD = new TextEncoder().encode('dukaan-dost-encrypted-backup:v1');

interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  cipher: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

interface BackupPayload {
  appId: typeof APP_ID;
  schemaVersion: number;
  createdAt: string;
  ownerId: string;
  snapshot: ShopDataSnapshot;
}

export interface DecryptedShopBackup {
  createdAt: string;
  ownerId: string;
  shopName: string;
  snapshot: ShopDataSnapshot;
  counts: {
    sales: number;
    expenses: number;
    udhaar: number;
    notebookNotes: number;
    chatSessions: number;
    insights: number;
  };
}

export type BackupRestoreMode = 'merge' | 'replace';

export function validateBackupPassphrase(passphrase: string): string | null {
  if (passphrase.length < 12) return 'Use a backup passphrase with at least 12 characters.';
  if (passphrase.length > 128) return 'Use a backup passphrase with no more than 128 characters.';
  if (!/\S/.test(passphrase)) return 'The backup passphrase cannot contain only spaces.';
  return null;
}

function requireCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('This browser does not support secure encrypted backups. Update the browser and try again.');
  }
  return globalThis.crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: unknown, field: string): Uint8Array {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_BACKUP_BYTES * 2 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    throw new Error('The backup file has an invalid ' + field + ' field.');
  }

  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    throw new Error('The backup file has an invalid ' + field + ' field.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

function isMoney(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) &&
    value >= 0 && value <= 1_000_000_000;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
}

function validateUniqueIds(items: unknown[], collection: string): void {
  if (items.length > MAX_RECORDS_PER_COLLECTION) {
    throw new Error('The backup contains too many ' + collection + ' records.');
  }

  const ids = new Set<string>();
  for (const item of items) {
    if (!isRecord(item) || !isId(item.id)) {
      throw new Error('The backup contains an invalid ' + collection + ' record.');
    }
    if (ids.has(item.id)) {
      throw new Error('The backup contains duplicate IDs in ' + collection + '.');
    }
    ids.add(item.id);
  }
}

function validateSnapshot(value: unknown): ShopDataSnapshot {
  const snapshot = normalizeShopDataSnapshot(value);
  if (!snapshot) {
    throw new Error('The backup does not contain a valid Dukaan Dost shop snapshot.');
  }

  const profile = snapshot.shopProfile;
  if (
    typeof profile.shopName !== 'string' ||
    profile.shopName.length > 256 ||
    typeof profile.city !== 'string' ||
    profile.city.length > 256 ||
    !Array.isArray(profile.worries) ||
    !profile.worries.every((worry) => isOneOf(worry, [
      'low_profit', 'too_much_stock', 'customers_not_paying', 'rising_costs',
      'competition', 'no_time', 'dont_know',
    ] as const)) ||
    !Number.isInteger(profile.workers) ||
    profile.workers < 1 ||
    profile.workers > 50 ||
    (profile.shopType !== null && !isOneOf(profile.shopType, [
      'kirana', 'medical', 'bakery', 'sweet', 'tailor', 'salon',
      'hardware', 'mobile', 'vegetable', 'tea', 'restaurant', 'other',
    ] as const)) ||
    (profile.duration !== null && !isOneOf(profile.duration, ['under1', '1to5', '5to10', 'over10'] as const)) ||
    (profile.ownership !== null && !isOneOf(profile.ownership, ['own', 'rent'] as const)) ||
    (profile.monthlySales !== null && !isOneOf(profile.monthlySales, ['under50k', '50kto1L', '1Lto3L', '3Lto5L', '5Lto10L', 'over10L'] as const)) ||
    (profile.udhaarLevel !== null && !isOneOf(profile.udhaarLevel, ['never', 'sometimes', 'often'] as const)) ||
    (profile.accounting !== null && !isOneOf(profile.accounting, ['memory', 'notebook', 'app', 'nothing'] as const))
  ) {
    throw new Error('The backup contains an invalid shop profile.');
  }

  validateUniqueIds(snapshot.sales, 'sales');
  for (const sale of snapshot.sales) {
    if (
      !isDate(sale.date) ||
      !isMoney(sale.amount) ||
      !['cash', 'upi', 'udhaar'].includes(sale.paymentType) ||
      !Number.isFinite(sale.createdAt) ||
      (sale.numberOfItemsSold !== undefined && (!Number.isInteger(sale.numberOfItemsSold) || sale.numberOfItemsSold < 1 || sale.numberOfItemsSold > 1_000_000)) ||
      (sale.itemName !== undefined && (typeof sale.itemName !== 'string' || sale.itemName.length > 256)) ||
      (sale.quantity !== undefined && (!Number.isFinite(sale.quantity) || sale.quantity <= 0 || sale.quantity > 1_000_000)) ||
      (sale.quantityUnit !== undefined && (typeof sale.quantityUnit !== 'string' || sale.quantityUnit.length > 32))
    ) {
      throw new Error('The backup contains an invalid sales record.');
    }
  }

  validateUniqueIds(snapshot.expenses, 'expenses');
  for (const expense of snapshot.expenses) {
    if (
      !isDate(expense.date) ||
      !isMoney(expense.amount) ||
      typeof expense.category !== 'string' ||
      expense.category.length > 100 ||
      !Number.isFinite(expense.createdAt)
    ) {
      throw new Error('The backup contains an invalid expense record.');
    }
  }

  validateUniqueIds(snapshot.udhaar, 'udhaar');
  for (const entry of snapshot.udhaar) {
    if (
      !isDate(entry.date) ||
      !isMoney(entry.amount) ||
      typeof entry.customerName !== 'string' ||
      entry.customerName.trim().length === 0 ||
      entry.customerName.length > 256 ||
      typeof entry.paid !== 'boolean' ||
      !Number.isFinite(entry.createdAt) ||
      (entry.dueDate !== undefined && !isDate(entry.dueDate)) ||
      (entry.updatedAt !== undefined && !Number.isFinite(entry.updatedAt))
    ) {
      throw new Error('The backup contains an invalid udhaar record.');
    }
  }

  validateUniqueIds(snapshot.notebookNotes, 'notebook notes');
  for (const note of snapshot.notebookNotes) {
    if (
      typeof note.title !== 'string' ||
      note.title.length > 500 ||
      typeof note.content !== 'string' ||
      note.content.length > 200_000 ||
      !Number.isFinite(note.createdAt) ||
      !Number.isFinite(note.updatedAt)
    ) {
      throw new Error('The backup contains an invalid notebook note.');
    }
  }

  validateUniqueIds(snapshot.chatSessions, 'chat sessions');
  for (const session of snapshot.chatSessions) {
    if (
      typeof session.title !== 'string' ||
      session.title.length > 500 ||
      !Number.isFinite(session.createdAt) ||
      !Array.isArray(session.messages) ||
      session.messages.length > 10_000
    ) {
      throw new Error('The backup contains an invalid chat session.');
    }
    for (const message of session.messages) {
      if (
        !isRecord(message) ||
        !isId(message.id) ||
        !['user', 'assistant'].includes(String(message.role)) ||
        typeof message.content !== 'string' ||
        message.content.length > 100_000 ||
        typeof message.timestamp !== 'number' ||
        !Number.isFinite(message.timestamp) ||
        (message.language !== undefined && !isOneOf(message.language, ['en', 'hi'] as const))
      ) {
        throw new Error('The backup contains an invalid chat message.');
      }
    }
  }

  validateUniqueIds(snapshot.insights, 'insights');
  for (const insight of snapshot.insights) {
    if (
      typeof insight.headline !== 'string' ||
      typeof insight.explanation !== 'string' ||
      typeof insight.action !== 'string' ||
      !Number.isFinite(insight.createdAt) ||
      !isOneOf(insight.type, ['profit', 'cost', 'udhaar', 'stock', 'season', 'pricing', 'cash', 'win'] as const)
    ) {
      throw new Error('The backup contains an invalid insight.');
    }
  }

  return snapshot;
}

async function deriveEncryptionKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoApi = requireCrypto();
  const material = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a cloud-synchronised shop snapshot as a portable, password-protected file. */
export async function encryptShopBackup(
  inputSnapshot: ShopDataSnapshot,
  ownerId: string,
  passphrase: string,
  createdAt = new Date().toISOString(),
): Promise<string> {
  const passwordError = validateBackupPassphrase(passphrase);
  if (passwordError) throw new Error(passwordError);
  if (!isId(ownerId)) throw new Error('A valid shop account is required to create a backup.');
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('The backup creation date is invalid.');

  const snapshot = validateSnapshot(inputSnapshot);
  const cryptoApi = requireCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(passphrase, salt);

  const payload: BackupPayload = {
    appId: APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt,
    ownerId,
    snapshot,
  };
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await cryptoApi.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: AAD, tagLength: 128 },
    key,
    plaintext,
  );

  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA-256',
    iterations: KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };

  return JSON.stringify(envelope);
}

/** Decrypt and fully validate a backup before allowing any shop data to be restored. */
export async function decryptShopBackup(
  serializedBackup: string,
  passphrase: string,
): Promise<DecryptedShopBackup> {
  const passwordError = validateBackupPassphrase(passphrase);
  if (passwordError) throw new Error(passwordError);
  if (typeof serializedBackup !== 'string' || serializedBackup.length === 0) {
    throw new Error('Choose a Dukaan Dost backup file first.');
  }
  if (new TextEncoder().encode(serializedBackup).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('This backup file is too large to open safely.');
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(serializedBackup);
  } catch {
    throw new Error('This file is not a valid Dukaan Dost backup.');
  }

  if (
    !isRecord(envelope) ||
    envelope.format !== BACKUP_FORMAT ||
    envelope.formatVersion !== BACKUP_FORMAT_VERSION ||
    envelope.cipher !== 'AES-GCM-256' ||
    envelope.kdf !== 'PBKDF2-SHA-256' ||
    envelope.iterations !== KDF_ITERATIONS
  ) {
    throw new Error('This backup format or encryption version is not supported.');
  }

  const salt = base64ToBytes(envelope.salt, 'salt');
  const iv = base64ToBytes(envelope.iv, 'initialisation vector');
  const ciphertext = base64ToBytes(envelope.ciphertext, 'encrypted data');
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17) {
    throw new Error('The backup file is incomplete or damaged.');
  }

  const cryptoApi = requireCrypto();
  const key = await deriveEncryptionKey(passphrase, salt);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await cryptoApi.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: AAD, tagLength: 128 },
      key,
      ciphertext,
    );
  } catch {
    throw new Error('The passphrase is incorrect, or this backup file has been changed or damaged.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new Error('The decrypted backup content is not valid.');
  }

  if (
    !isRecord(payload) ||
    payload.appId !== APP_ID ||
    payload.schemaVersion !== BACKUP_SCHEMA_VERSION ||
    typeof payload.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(payload.createdAt)) ||
    !isId(payload.ownerId)
  ) {
    throw new Error('The backup does not contain a supported Dukaan Dost shop account.');
  }

  const snapshot = validateSnapshot(payload.snapshot);
  return {
    createdAt: payload.createdAt,
    ownerId: payload.ownerId,
    shopName: snapshot.shopProfile.shopName || 'My Shop',
    snapshot,
    counts: {
      sales: snapshot.sales.length,
      expenses: snapshot.expenses.length,
      udhaar: snapshot.udhaar.length,
      notebookNotes: snapshot.notebookNotes.length,
      chatSessions: snapshot.chatSessions.length,
      insights: snapshot.insights.length,
    },
  };
}

export function getBackupFilename(createdAt: string): string {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return 'dukaandost-backup.ddbackup';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return 'dukaandost-backup-' + y + m + d + '.ddbackup';
}
