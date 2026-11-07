import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/coach-customer.ts';

type ResponseSnapshot = {
  status?: number;
  body?: Record<string, unknown>;
  headers: Record<string, string>;
};

async function invoke(body: unknown, method = 'POST', authorization?: string) {
  const snapshot: ResponseSnapshot = { headers: {} };
  const req = {
    method,
    body,
    headers: authorization ? { authorization } : {},
  };
  const res = {
    setHeader(name: string, value: string) {
      snapshot.headers[name] = value;
    },
    status(code: number) {
      snapshot.status = code;
      return {
        json(data: Record<string, unknown>) {
          snapshot.body = data;
          return snapshot;
        },
      };
    },
  };
  await handler(req, res);
  return snapshot;
}

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};
const env = runtime.process && runtime.process.env;
const original = env ? {
  url: env.SUPABASE_URL,
  anon: env.SUPABASE_ANON_KEY,
  gemini: env.GEMINI_API_KEY,
} : null;

test.afterEach(() => {
  if (!env || !original) return;
  if (original.url === undefined) delete env.SUPABASE_URL;
  else env.SUPABASE_URL = original.url;
  if (original.anon === undefined) delete env.SUPABASE_ANON_KEY;
  else env.SUPABASE_ANON_KEY = original.anon;
  if (original.gemini === undefined) delete env.GEMINI_API_KEY;
  else env.GEMINI_API_KEY = original.gemini;
});

test('rejects methods other than POST', async () => {
  const result = await invoke({}, 'GET');
  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, 'POST');
});

test('rejects malformed and unsupported actions before making upstream requests', async () => {
  const malformed = await invoke(null);
  assert.equal(malformed.status, 400);

  const unsupported = await invoke({ action: 'reveal-archetype' });
  assert.equal(unsupported.status, 400);
});

test('fails closed with an explicit preview-disabled response when backend secrets are absent', async () => {
  if (!env) throw new Error('Node environment variables are unavailable to this test.');
  delete env.SUPABASE_URL;
  delete env.SUPABASE_ANON_KEY;
  delete env.GEMINI_API_KEY;

  const result = await invoke({ action: 'start' });
  assert.equal(result.status, 503);
  assert.equal(result.body?.code, 'COACH_SIMULATION_NOT_CONFIGURED');
});

test('requires a signed-in account before any Coach session lookup', async () => {
  if (!env) throw new Error('Node environment variables are unavailable to this test.');
  env.SUPABASE_URL = 'https://example.supabase.co';
  env.SUPABASE_ANON_KEY = 'test-anon-key';
  env.GEMINI_API_KEY = 'test-gemini-key';

  const result = await invoke({ action: 'start' });
  assert.equal(result.status, 401);
});
