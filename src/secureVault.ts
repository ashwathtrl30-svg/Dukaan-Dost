export interface EncryptedVaultEnvelope {
  ciphertext: string;
  iv: string;
  kdf_salt: string;
  crypto_version: 1;
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
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(salt);
}

async function deriveVaultKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
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

export async function encryptVaultState(
  state: unknown,
  passphrase: string,
  salt: string,
): Promise<EncryptedVaultEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    kdf_salt: salt,
    crypto_version: 1,
  };
}

export async function decryptVaultState<T = unknown>(
  envelope: EncryptedVaultEnvelope,
  passphrase: string,
): Promise<T> {
  if (envelope.crypto_version !== 1) {
    throw new Error('This encrypted vault uses an unsupported encryption version.');
  }

  const key = await deriveVaultKey(passphrase, envelope.kdf_salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
    key,
    fromBase64(envelope.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
