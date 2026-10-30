import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './parse-voice.ts';

type ResponseSnapshot = { status?: number; body?: unknown; headers: Record<string, string> };

async function invoke(body: unknown, ip: string): Promise<{ response: ResponseSnapshot; request?: { url: string; headers: Record<string, string>; body: unknown } }> {
  const response: ResponseSnapshot = { headers: {} };
  const req = {
    method: 'POST',
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
  return { response };
}

const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string> } };
const oldUrl = runtime.process?.env?.SUPABASE_URL;
const oldKey = runtime.process?.env?.SUPABASE_ANON_KEY;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (runtime.process?.env) {
    if (oldUrl === undefined) delete runtime.process.env.SUPABASE_URL;
    else runtime.process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete runtime.process.env.SUPABASE_ANON_KEY;
    else runtime.process.env.SUPABASE_ANON_KEY = oldKey;
  }
  globalThis.fetch = originalFetch;
});

test('proxies the transcript, al¶»§q«^