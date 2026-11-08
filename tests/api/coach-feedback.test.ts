import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/coach-feedback.ts';

type Snapshot = { status?: number; body?: Record<string, unknown>; headers: Record<string, string> };
async function invoke(body: unknown, method = 'POST', authorization?: string) {
  const snapshot: Snapshot = { headers: {} };
  const req = { method, body, headers: authorization ? { authorization } : {} };
  const res = {
    setHeader(name: string, value: string) { snapshot.headers[name] = value; },
    status(code: number) {
      snapshot.status = code;
      return { json(data: Record<string, unknown>) { snapshot.body = data; return snapshot; } };
    },
  };
  await handler(req, res);
  return snapshot;
}
const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
const env = runtime.process?.env;
const original = env ? { url: env.SUPABASE_URL, anon: env.SUPABASE_ANON_KEY, gemini: env.GEMINI_API_KEY } : null;
test.afterEach(() => {
  if (!env || !original) return;
  if (original.url === undefined) delete env.SUPABASE_URL; else env.SUPABASE_URL = original.url;
  if (original.anon === undefined) delete env.SUPABASE_ANON_KEY; else env.SUPABASE_ANON_KEY = original.anon;
  if (original.gemini === undefined) delete env.GEMINI_API_KEY; else env.GEMINI_API_KEY = original.gemini;
});
test('rejects non-POST requests', async () => {
  const result = await invoke({}, 'GET');
  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, 'POST');
});
test('rejects malformed requests and invalid session UUIDs', async () => {
  assert.equal((await invoke(null)).status, 400);
  assert.equal((await invoke({ sessionId: 'not-a-uuid' })).status, 400);
  assert.equal((await invoke({ sessionId: '12345678-1234-1234-1234-123456789012' })).status, 400);
});
test('fails closed when isolated Coach backend credentials are absent', async () => {
  if (!env) throw new Error('Node environment variables are unavailable.');
  delete env.SUPABASE_URL; delete env.SUPABASE_ANON_KEY; delete env.GEMINI_API_KEY;
  const result = await invoke({ sessionId: 'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0' });
  assert.equal(result.status, 503);
  assert.equal(result.body?.code, 'COACH_FEEDBACK_NOT_CONFIGURED');
});
test('requires account authentication when backend credentials are configured', async () => {
  if (!env) throw new Error('Node environment variables are unavailable.');
  env.SUPABASE_URL = 'https://example.supabase.co'; env.SUPABASE_ANON_KEY = 'test-anon-key'; env.GEMINI_API_KEY = 'test-gemini-key';
  const result = await invoke({ sessionId: 'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0' });
  assert.equal(result.status, 401);
});
