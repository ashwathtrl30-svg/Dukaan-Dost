import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../../api/extract-camera.ts';

async function invoke(method = 'POST') {
  const snapshot: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const req = { method, headers: {}, body: {} };
  const res = {
    setHeader(name: string, value: string) { snapshot.headers[name] = value; },
    status(code: number) {
      snapshot.status = code;
      return { json(data: unknown) { snapshot.body = data; return snapshot; } };
    },
  };
  await handler(req, res);
  return snapshot;
}

test('camera extraction endpoint rejects non-POST methods', async () => {
  const result = await invoke('GET');
  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, 'POST');
});

test('camera extraction remains disabled unless explicitly enabled', async () => {
  const previous = process.env.CAMERA_V1_ENABLED;
  delete process.env.CAMERA_V1_ENABLED;
  try {
    const result = await invoke();
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, {
      error: 'Photo extraction is not enabled yet. Your image has not been sent.',
    });
  } finally {
    if (previous === undefined) delete process.env.CAMERA_V1_ENABLED;
    else process.env.CAMERA_V1_ENABLED = previous;
  }
});
