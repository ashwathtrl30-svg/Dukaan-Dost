import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeCoachRateLimit } from './coachRateLimit.ts';

test('uses the authenticated database RPC with the requested bucket and limits', async () => {
  let called = false;
  const allowed = await consumeCoachRateLimit({
    async rpc(name, args) {
      called = true;
      assert.equal(name, 'coach_consume_rate_limit');
      assert.deepEqual(args, { p_bucket: 'customer', p_limit: 18, p_window_seconds: 60 });
      return { data: true, error: null };
    },
  }, 'customer', 18);
  assert.equal(called, true);
  assert.equal(allowed, true);
});

test('returns denied when the shared database counter is over limit', async () => {
  const allowed = await consumeCoachRateLimit({
    async rpc() { return { data: false, error: null }; },
  }, 'feedback', 8);
  assert.equal(allowed, false);
});

test('fails closed when the shared database limiter is unavailable', async () => {
  await assert.rejects(
    () => consumeCoachRateLimit({
      async rpc() { return { data: null, error: new Error('missing RPC') }; },
    }, 'milestone', 6),
    /rate-limit service is unavailable/,
  );
});

test('rejects malformed RPC responses and invalid limits', async () => {
  await assert.rejects(
    () => consumeCoachRateLimit({ async rpc() { return { data: 1, error: null }; } }, 'customer', 18),
    /invalid response/,
  );
  await assert.rejects(
    () => consumeCoachRateLimit({ async rpc() { return { data: true, error: null }; } }, 'customer', 0),
    /Invalid Coach rate-limit configuration/,
  );
});
