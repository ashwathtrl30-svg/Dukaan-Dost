import test from 'node:test';
import assert from 'node:assert/strict';
import {
  transcribeVoiceAudio,
  MAX_VOICE_AUDIO_BYTES,
} from './audioTranscription';

const originalFetch = globalThis.fetch;
const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window;
let fakeDuration = 0.01;
let requestBody: Record<string, unknown> | undefined;
let requestUrl = '';

class FakeAudioContext {
  async decodeAudioData(_buffer: ArrayBuffer): Promise<AudioBuffer> {
    const sampleRate = 48_000;
    const length = Math.ceil(fakeDuration * sampleRate);
    const samples = new Float32Array(length).fill(0.08);
    return {
      duration: fakeDuration,
      numberOfChannels: 1,
      sampleRate,
      length,
      getChannelData: () => samples,
    } as unknown as AudioBuffer;
  }
  async close(): Promise<void> {}
}

function installFakeWindow() {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { AudioContext: FakeAudioContext },
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) {
    delete (globalThis as typeof globalThis & { window?: unknown }).window;
  } else {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
  fakeDuration = 0.01;
  requestBody = undefined;
  requestUrl = '';
});

test('converts recorded WebM audio to WAV and sends bakery vocabulary to the server', async () => {
  installFakeWindow();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body || '{}'));
    return new Response(JSON.stringify({
      transcript: 'ek chocolate bomboloni pachas rupaye sale add karo',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const transcript = await transcribeVoiceAudio(
    new Blob(['fake webm audio'], { type: 'audio/webm' }),
    {
      language: 'hi',
      customVocabulary: ['Chocolate Bomboloni', 'San Sebastian Cheesecake'],
    },
  );

  assert.equal(transcript, 'ek chocolate bomboloni pachas rupaye sale add karo');
  assert.equal(requestUrl, '/api/parse-voice');
  assert.equal(requestBody?.mode, 'transcribe');
  assert.equal(requestBody?.mimeType, 'audio/wav');
  assert.equal(requestBody?.language, 'hi');
  assert.deepEqual(requestBody?.customVocabulary, [
    'Chocolate Bomboloni',
    'San Sebastian Cheesecake',
  ]);
  assert.equal(typeof requestBody?.audioBase64, 'string');
  const decodedWav = atob(String(requestBody?.audioBase64));
  assert.equal(decodedWav.slice(0, 4), 'RIFF');
  assert.equal(decodedWav.slice(8, 12), 'WAVE');
});

test('rejects recordings longer than sixty seconds before sending an API request', async () => {
  installFakeWindow();
  fakeDuration = 61;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  await assert.rejects(
    transcribeVoiceAudio(new Blob(['fake'], { type: 'audio/webm' }), { language: 'en' }),
    /60 seconds or less/,
  );
  assert.equal(called, false);
});

test('enforces the converted audio byte limit', () => {
  assert.equal(MAX_VOICE_AUDIO_BYTES, 2_100_000);
});
