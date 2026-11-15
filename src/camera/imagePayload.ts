export const MAX_CAMERA_IMAGE_BYTES = 3_000_000;

export type CameraImagePayloadResult =
  | { ok: true; bytes: Uint8Array; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }
  | { ok: false; error: string };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function hasSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (mimeType === 'image/webp') {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

/** Validate image bytes and declared MIME before forwarding them to an AI provider. */
export function decodeCameraImagePayload(
  base64: unknown,
  mimeType: unknown,
  maxBytes = MAX_CAMERA_IMAGE_BYTES,
): CameraImagePayloadResult {
  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: 'Use a JPEG, PNG or WebP photo.' };
  }
  if (typeof base64 !== 'string' || !base64 || base64.length > Math.ceil(maxBytes * 4 / 3) + 8) {
    return { ok: false, error: 'The photo is too large. Choose a smaller image.' };
  }
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { ok: false, error: 'The photo could not be read. Choose it again.' };
  }

  let bytes: Uint8Array;
  try {
    const binary = atob(base64);
    if (binary.length <= 0 || binary.length > maxBytes) {
      return { ok: false, error: 'The photo is too large. Choose a smaller image.' };
    }
    bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    return { ok: false, error: 'The photo could not be read. Choose it again.' };
  }

  if (!hasSignature(bytes, mimeType)) {
    return { ok: false, error: 'The selected file does not match its image format.' };
  }

  return {
    ok: true,
    bytes,
    mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
  };
}
