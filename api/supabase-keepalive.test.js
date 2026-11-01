import test from "node:test";
import assert from "node:assert/strict";
import handler from "./supabase-keepalive.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("rejects non-GET requests", async () => {
  const res = createResponse();
  await handler({ method: "POST", headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("rejects requests without the cron secret", async () => {
  const oldSecret = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const res = createResponse();
  try {
    await handler({ method: "GET", headers: {} }, res);
    assert.equal(res.statusCode, 401);
  } finally {
    if (oldSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = oldSecret;
  }
});

test("checks Supabase without returning business data", async () => {
  const old = {
    secret: process.env.CRON_SECRET,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    fetch: globalThis.fetch,
  };
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.SUPABASE_URL = "https://example.supabase.co///";
  process.env.SUPABASE_ANON_KEY = "test-publishable-key";
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url, init };
    return Response.json(true, { status: 200 });
  };

  const res = createResponse();
  try {
    await handler(
      { method: "GET", headers: { authorization: "Bearer test-cron-secret" } },
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(request.url, "https://example.supabase.co/rest/v1/rpc/dukaan_dost_health_check");
    assert.equal(request.init.method, "POST");
    assert.equal(request.init.headers.apikey, "test-publishable-key");
    assert.equal(request.init.body, "{}");
  } finally {
    if (old.secret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = old.secret;
    if (old.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = old.url;
    if (old.key === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = old.key;
    globalThis.fetch = old.fetch;
  }
});

test("reports an upstream Supabase failure", async () => {
  const old = {
    secret: process.env.CRON_SECRET,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    fetch: globalThis.fetch,
  };
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-publishable-key";
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });

  const res = createResponse();
  try {
    await handler(
      { method: "GET", headers: { authorization: "Bearer test-cron-secret" } },
      res,
    );
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
  } finally {
    if (old.secret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = old.secret;
    if (old.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = old.url;
    if (old.key === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = old.key;
    globalThis.fetch = old.fetch;
  }
});
