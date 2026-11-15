import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../../api/extract-camera.ts';

async function invoke(method = 'POST', headers: Record<string, string> = {}, body: unknown = {}) {
  const snapshot: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const req = { method, headers, body };
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


function withCameraTestEnvironment(run: () => Promise<void>) {
  return async () => {
    const keys = [
      'CAMERA_V1_ENABLED',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'GEMINI_API_KEY',
    ] as const;
    const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    const originalFetch = globalThis.fetch;

    try {
      process.env.CAMERA_V1_ENABLED = 'true';
      process.env.SUPABASE_URL = 'https://staging.example.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-public-key';
      process.env.GEMINI_API_KEY = 'test-provider-key';
      await run();
    } finally {
      for (const key of keys) {
        const value = previous[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      globalThis.fetch = originalFetch;
    }
  };
}

function validSyntheticJpegBase64(): string {
  // Minimal synthetic bytes with a JPEG signature; no real photograph is used.
  return btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46));
}

function validModelExtraction() {
  return {
    schemaVersion: 1,
    items: [{
      productName: 'Synthetic Rice',
      quantity: 2,
      quantityUnit: 'kg',
      finalAmount: 120.5,
      amountSource: 'printed_line_total',
      amountCalculation: null,
      confidence: 'high',
      needsReview: false,
      reviewReasons: [],
    }],
  };
}

test('valid session and synthetic image complete the extraction path using a mocked provider', withCameraTestEnvironment(async () => {
  const requestedUrls: string[] = [];
  let providerRequest: Record<string, any> | null = null;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requestedUrls.push(url);

    if (url.endsWith('/auth/v1/user')) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer valid-test-session');
      assert.equal(new Headers(init?.headers).get('apikey'), 'test-public-key');
      return new Response(JSON.stringify({ id: 'synthetic-shop-user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-provider-key');
    providerRequest = JSON.parse(String(init?.body)) as Record<string, any>;
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(validModelExtraction()) }],
        },
      }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await invoke('POST', { authorization: 'Bearer valid-test-session' }, {
    imageBase64: validSyntheticJpegBase64(),
    mimeType: 'image/jpeg',
  });

  assert.equal(result.status, 200);
  assert.deepEqual(requestedUrls, [
    'https://staging.example.supabase.co/auth/v1/user',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
  ]);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.deepEqual(result.body, {
    extraction: validModelExtraction(),
    reviewCount: 0,
    itemCount: 1,
  });
  assert.equal(providerRequest?.generationConfig?.responseMimeType, 'application/json');
  assert.equal(providerRequest?.contents?.[0]?.parts?.[1]?.inlineData?.mimeType, 'image/jpeg');
  assert.equal(providerRequest?.contents?.[0]?.parts?.[1]?.inlineData?.data, validSyntheticJpegBase64());
}));

test('rejects a malformed image after authentication and before calling the provider', withCameraTestEnvironment(async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requestedUrls.push(url);
    return new Response(JSON.stringify({ id: 'synthetic-shop-user' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await invoke('POST', { authorization: 'Bearer valid-test-session' }, {
    imageBase64: 'not-base64',
    mimeType: 'image/jpeg',
  });

  assert.equal(result.status, 400);
  assert.deepEqual(requestedUrls, ['https://staging.example.supabase.co/auth/v1/user']);
}));

test('sanitizes provider failures and does not expose provider response bodies', withCameraTestEnvironment(async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: 'synthetic-shop-user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: { message: 'sensitive provider diagnostic' } }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await invoke('POST', { authorization: 'Bearer valid-test-session' }, {
    imageBase64: validSyntheticJpegBase64(),
    mimeType: 'image/jpeg',
  });

  assert.equal(result.status, 502);
  assert.deepEqual(result.body, {
    error: 'The photo could not be read right now. Please try again.',
  });
  assert.equal(JSON.stringify(result.body).includes('sensitive provider diagnostic'), false);
}));

test('rejects malformed model output instead of returning unvalidated rows', withCameraTestEnvironment(async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: 'synthetic-shop-user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"schemaVersion":1,"items":null}' }] } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await invoke('POST', { authorization: 'Bearer valid-test-session' }, {
    imageBase64: validSyntheticJpegBase64(),
    mimeType: 'image/jpeg',
  });

  assert.equal(result.status, 422);
  assert.deepEqual(result.body, {
    error: 'The photo could not be read reliably. Try a clearer photo or enter the sales manually.',
  });
}));
