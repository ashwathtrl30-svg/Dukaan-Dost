export interface EncryptedVaultEnvelope {
  ciphertext: string;
  iv: string;
  kdf_salt: string;
  crypto_version: 1;
}

export interface VaultCipher {
  encrypt(value: unknown): Promise<EncryptedVaultEnvelope>;
  decrypt<T = unknown>(envelope: EncryptedVaultEnvelope): Promise<T>;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function createVaultSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

async function deriveVaultKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('This browser does not support secure vault encryption. Please use an updated browser.');
  }
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltBase64),
      iterations: 600000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Derive once per vault unlock, then reuse the non-extractable AES key for
 * local-cache and cloud writes. The passphrase and key never leave this tab.
 */
export async function createVaultCipher(
  passphrase: string,
  salt: string,
): Promise<VaultCipher> {
  if (passphrase.length < 12) {
    throw new Error('Use at least 12 characters for your private vault passphrase.');
  }
  const key = await deriveVaultKey(passphrase, salt);

  return {
    async encrypt(value: unknown): Promise<EncryptedVaultEnvelope> {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = new TextEncoder().encode(JSON.stringify(value));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext,
      );
      return {
        ciphertext: toBase64(new Uint8Array(encrypted)),
        iv: toBase64(iv),
        kdf_salt: salt,
        crypto_version: 1,
      };
    },

    async decrypt<T = unknown>(envelope: EncryptedVaultEnvelope): Promise<T> {
      if (envelope.crypto_version !== 1) {
        throw new Error('This encrypted vault uses an unsupported encryption version.');
      }
      if (envelope.kdf_salt !== salt) {
        throw new Error('The encrypted vault key metadata does not match this vault.');
      }
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
        key,
        fromBase64(envelope.ciphertext),
      );
      return JSON.parse(new TextDecoder().decode(plaintext)) as T;
    },
  };
}

/** Convenience helpers retained for compatibility with existing callers. */
export async function encryptVaultState(
  state: unknown,
  passphrase: string,
  salt: string,
): Promise<EncryptedVaultEnvelope> {
  const cipher = await createVaultCipher(passphrase, salt);
  return cipher.encrypt(state);
}

export async function decryptVaultState<T = unknown>(
  envelope: EncryptedVaultEnvelope,
  passphrase: string,
): Promise<T> {
  const cipher = await createVaultCipher(passphrase, envelope.kdf_salt);
  return cipher.decrypt<T>(envelope);
}
