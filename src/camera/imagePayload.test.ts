import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeCameraImagePayload, MAX_CAMERA_IMAGE_BYTES } from './imagePayload';

function base64(bytes: number[]): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

test('accepts a JPEG payload with a matching signature', () => {
  const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
  const result = decodeCameraImagePayload(base64(bytes), 'image/jpeg');
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.bytes.length, bytes.length);
});

test('rejects MIME and file-signature mismatches', () => {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
  assert.equal(decodeCameraImagePayload(base64(png), 'image/jpeg').ok, false);
  assert.equal(decodeCameraImagePayload(base64(png), 'image/png').ok, true);
});

test('rejects malformed base64 and unsupported image types', () => {
  assert.equal(decodeCameraImagePayload('not base64', 'image/jpeg').ok, false);
  assert.equal(decodeCameraImagePayload('AAAA', 'image/heic').ok, false);
});

test('rejects images above the configured byte limit', () => {
  const tooLarge = btoa('x'.repeat(MAX_CAMERA_IMAGE_BYTES + 1));
  assert.equal(decodeCameraImagePayload(tooLarge, 'image/jpeg').ok, false);
});
