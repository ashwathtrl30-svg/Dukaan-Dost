import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './parse-voice.ts';

type ResponseSnapshot = { status?: number; body?: unknown; headers: Record<string, string> };

async function invoke(body: unknown, ip: string, method = 'POST') {
  const response: ResponseSnapshot = { headers: {} };
  const req = {
    method,
    body,
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  };
  const res = {
    setHeader(name: string, value: string) { response.headers[name] = value; },
    status(code: number) {
      response.status = code;
      return {
        json(data: unknown) { response.body = data; return response; },
      };
    },
  };
  await handler(req, res);
  return response;
}

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};
const env = runtime.process?.env;
const oldUrl = env?.SUPABASE_URL;
const oldKey = env?.SUPABASE_ANON_KEY;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (env) {
    if (oldUrl === undefined) delete env.SUPABASE_URL;
    else env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete env.SUPABASE_ANON_KEY;
    else env.SUPABASE_ANON_KEY = oldKey;
  }
  globalThis.fetch = originalFetch;
});

test('rejects methods other than POST', async () => {
  const result = await invoke({}, '198.51.100.11', 'GET');
  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, 'POST');
});

test('rejects empty transcripts before calling the upstream service', async () => {
  const result = await invoke({ transcript: '   ' }, '198.51.100.12');
  assert.equal(result.status, 400);
});

test('forwards a bounded transcript to the active Supabase voice function', async () => {
  if (!env) throw new Error('Node environment variables are unavailable to this test.');
  env.SUPABASE_URL = 'https://example.supabase.co';
  env.SUPABASE_ANON_KEY = 'test-anon-key';

  let requestedUrl = '';
  let requestedHeaders: Record<string, string> = {};
  let requestedBody: Record<string, unknown> = {};
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedHeaders = Object.fromEntries(new Headers(init?.headers).entries());
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return new Response(JSON.stringify({ transactions: [], error: 'missing_quantity' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await invoke({
    transcript: 'do kilo sugar sattar rupaye',
    candidates: ['2 kg sugar for 70'],
    shopType: 'kirana',
    language: 'hi',
  }, '198.51.100.13');

  assert.equal(requestedUrl, 'https://example.supabase.co/functions/v1/parse-voice-entry');
  assert.equal(requestedHeaders.apikey, 'test-anon-key');
  assert.equal(requestedHeaders.authorization, 'Bearer test-anon-key');
  assert.equal(requestedBody.transcript, 'do kilo sugar sattar rupaye');
  assert.equal(requestedBody.language, 'hi');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { transactions: [], error: 'missing_quantity' });
});
