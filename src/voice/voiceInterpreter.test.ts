import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretVoiceTransactions } from './voiceInterpreter.ts';

const originalFetch = globalThis.fetch;

function installResponse(payload: unknown, status = 200) {
  let requestedUrl = '';
  let requestedBody: Record<string, unknown> | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return {
    get url() { return requestedUrl; },
    get body() { return requestedBody; },
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('sends mixed Hindi and Hinglish text to the server interpreter and validates the result', async () => {
  const mock = installResponse({
    transactions: [{
      type: 'sale',
      amount: 70,
      itemName: 'sugar',
      numberOfItemsSold: 2,
      quantity: 2,
      quantityUnit: 'kg',
    }],
    selectedTranscript: 'do kilo sugar bik gaya sattar rupaye mein',
    clarification: '',
  });

  const result = await interpretVoiceTransactions({
    transcript: 'do kilo sugar bik gaya sattar rupaye mein',
    candidates: ['2 kg sugar sold for 70 rupees'],
    shopType: 'kirana',
    language: 'hi',
  });

  assert.equal(mock.url, '/api/parse-voice');
  assert.deepEqual(mock.body?.candidates, ['2 kg sugar sold for 70 rupees']);
  assert.equal(mock.body?.language, 'hi');
  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].amount, 70);
  assert.equal(result.transactions[0].quantity, 2);
  assert.equal(result.transactions[0].quantityUnit, 'kg');
  assert.equal(result.selectedTranscript, 'do kilo sugar bik gaya sattar rupaye mein');
});

test('returns clarification without creating transactions when an amount or quantity is unclear', async () => {
  installResponse({
    transactions: [],
    error: 'missing_quantity',
    selectedTranscript: 'sugar sattar rupaye',
    clarification: 'How much sugar was sold?',
  });

  const result = await interpretVoiceTransactions({
    transcript: 'sugar sattar rupaye',
    shopType: 'kirana',
    language: 'en',
  });

  assert.equal(result.transactions.length, 0);
  assert.equal(result.error, 'missing_quantity');
  assert.equal(result.clarification, 'How much sugar was sold?');
});

test('rejects a malformed AI transaction instead of returning it for saving', async () => {
  installResponse({
    transactions: [{ type: 'sale', amount: 70, itemName: '', numberOfItemsSold: 2 }],
    selectedTranscript: 'some unclear speech',
  });

  const result = await interpretVoiceTransactions({
    transcript: 'some unclear speech',
    shopType: 'other',
    language: 'en',
  });

  assert.equal(result.transactions.length, 0);
  assert.equal(result.error, 'unclear');
});
