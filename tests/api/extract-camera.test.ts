import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../../api/extract-camera.ts';

async function invoke(method = 'POST', headers: Record<string, string> = {}) {
  const snapshot: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const req = { method, headers, body: {} };
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
      error: 'Photo extraction is not enabled yet. Your photo has not been forwarded to Gemini.',
    });
  } finally {
    if (previous === undefined) delete process.env.CAMERA_V1_ENABLED;
    else process.env.CAMERA_V1_ENABLED = previous;
  }
});

test('rejects an invalid shop session before parsing or forwarding an image', async () => {
  const keys = ['CAMERA_V1_ENABLED', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';

  try {
    process.env.CAMERA_V1_ENABLED = 'true';
    process.env.SUPABASE_URL = 'https://staging.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-public-key';
    process.env.GEMINI_API_KEY = 'test-provider-key';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ message: 'Invalid JWT' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await invoke('POST', { authorization: 'Bearer invalid-token' });
    assert.equal(result.status, 401);
    assert.equal(requestedUrl, 'https://staging.example.supabase.co/auth/v1/user');
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.fetch = originalFetch;
  }
});
