import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendFinalSpeechRecognitionSession,
  buildSpeechTranscriptCandidates,
  buildSpeechTranscriptParts,
  updateSpeechRecognitionSegments,
  type SpeechRecognitionEventLike,
} from './speechRecognition';

function event(
  resultIndex: number,
  values: Array<{ transcript: string; isFinal: boolean }>,
): SpeechRecognitionEventLike {
  return {
    resultIndex,
    results: values.map(value => ({
      isFinal: value.isFinal,
      length: 1,
      0: { transcript: value.transcript },
    })),
  };
}

test('updates only changed result indexes and preserves earlier final segments', () => {
  const first = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'do kilo', isFinal: true },
    { transcript: 'rice', isFinal: false },
  ]));
  const second = updateSpeechRecognitionSegments(first, event(1, [
    { transcript: 'do kilo', isFinal: true },
    { transcript: 'rice 200 rupaye', isFinal: true },
  ]));

  assert.deepEqual(second, [
    { transcript: 'do kilo', isFinal: true, alternatives: ['do kilo'] },
    { transcript: 'rice 200 rupaye', isFinal: true, alternatives: ['rice 200 rupaye'] },
  ]);
});

test('replaces an interim segment when it becomes final instead of duplicating it', () => {
  const interim = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'two hundred', isFinal: false },
  ]));
  const final = updateSpeechRecognitionSegments(interim, event(0, [
    { transcript: '200 rupees', isFinal: true },
  ]));
  const parts = buildSpeechTranscriptParts('', final);

  assert.equal(parts.finalTranscript, '200 rupees');
  assert.equal(parts.interimTranscript, '');
  assert.equal(parts.transcript, '200 rupees');
});

test('keeps interim and final text separate while producing a review snapshot', () => {
  const segments = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'do kilo rice', isFinal: true },
    { transcript: '200 rupaye', isFinal: false },
  ]));
  const parts = buildSpeechTranscriptParts('previous entry', segments);

  assert.equal(parts.finalTranscript, 'do kilo rice');
  assert.equal(parts.interimTranscript, '200 rupaye');
  assert.equal(parts.transcript, 'previous entry do kilo rice 200 rupaye');
});

test('truncates stale result slots when the browser result list shrinks', () => {
  const first = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'one', isFinal: true },
    { transcript: 'two', isFinal: true },
    { transcript: 'stale', isFinal: true },
  ]));
  const second = updateSpeechRecognitionSegments(first, event(1, [
    { transcript: 'one', isFinal: true },
    { transcript: 'updated two', isFinal: true },
  ]));

  assert.deepEqual(second, [
    { transcript: 'one', isFinal: true, alternatives: ['one'] },
    { transcript: 'updated two', isFinal: true, alternatives: ['updated two'] },
  ]);
});

test('normalizes repeated whitespace in assembled transcripts', () => {
  const parts = buildSpeechTranscriptParts('  previous\n entry  ', [
    { transcript: '  do   kilo   rice ', isFinal: true },
    { transcript: '  200   rupaye ', isFinal: false },
  ]);

  assert.equal(parts.finalTranscript, 'do kilo rice');
  assert.equal(parts.interimTranscript, '200 rupaye');
  assert.equal(parts.transcript, 'previous entry do kilo rice 200 rupaye');
});


test('serializes recordings across microphone components and hands off after stop', async () => {
  const {
    requestVoiceRecording,
    releaseVoiceRecording,
  } = await import('./speechRecognition');
  const firstOwner = Symbol('home');
  const secondOwner = Symbol('notebook');
  const events: string[] = [];

  requestVoiceRecording({
    owner: firstOwner,
    stop: () => events.push('stop-home'),
    start: () => events.push('start-home'),
  });
  requestVoiceRecording({
    owner: secondOwner,
    stop: () => events.push('stop-notebook'),
    start: () => events.push('start-notebook'),
  });

  assert.deepEqual(events, ['start-home', 'stop-home']);
  releaseVoiceRecording(firstOwner);
  assert.deepEqual(events, ['start-home', 'stop-home', 'start-notebook']);
  releaseVoiceRecording(secondOwner);
});

test('cancels a queued microphone when its component unmounts', async () => {
  const {
    requestVoiceRecording,
    releaseVoiceRecording,
    cancelVoiceRecordingRequest,
  } = await import('./speechRecognition');
  const firstOwner = Symbol('ask');
  const queuedOwner = Symbol('notebook');
  const events: string[] = [];

  requestVoiceRecording({
    owner: firstOwner,
    stop: () => events.push('stop-ask'),
    start: () => events.push('start-ask'),
  });
  requestVoiceRecording({
    owner: queuedOwner,
    stop: () => events.push('stop-notebook'),
    start: () => events.push('start-notebook'),
  });
  cancelVoiceRecordingRequest(queuedOwner);
  releaseVoiceRecording(firstOwner);

  assert.deepEqual(events, ['start-ask', 'stop-ask']);
});


test('retains browser alternatives and builds ranked full-transcript candidates', () => {
  const segments = updateSpeechRecognitionSegments([], {
    resultIndex: 0,
    results: [
      {
        isFinal: true,
        length: 2,
        0: { transcript: 'do kilo rice', confidence: 0.9 },
        1: { transcript: 'two kilos rice', confidence: 0.7 },
      },
      {
        isFinal: true,
        length: 2,
        0: { transcript: 'two hundred rupees', confidence: 0.8 },
        1: { transcript: '200 rupees', confidence: 0.6 },
      },
    ],
  });

  assert.deepEqual(segments[0].alternatives, ['do kilo rice', 'two kilos rice']);
  assert.deepEqual(buildSpeechTranscriptCandidates(segments), [
    'do kilo rice two hundred rupees',
    'do kilo rice 200 rupees',
    'two kilos rice two hundred rupees',
    'two kilos rice 200 rupees',
  ]);
  assert.deepEqual(buildSpeechTranscriptCandidates(segments, 2), [
    'do kilo rice two hundred rupees',
    'do kilo rice 200 rupees',
  ]);
});

test('uses one final-only recognition session on Android phones', async () => {
  const { getSpeechRecognitionMode } = await import('./speechRecognition');

  assert.deepEqual(
    getSpeechRecognitionMode(
      'Mozilla/5.0 (Linux; Android 16; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
      'Linux armv8l',
      5,
    ),
    { continuous: false, interimResults: false, restartOnEnd: true },
  );
});

test('uses one final-only recognition session on iPhones and iPads', async () => {
  const { getSpeechRecognitionMode } = await import('./speechRecognition');

  assert.deepEqual(
    getSpeechRecognitionMode(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile',
      'iPhone',
      5,
    ),
    { continuous: false, interimResults: false, restartOnEnd: true },
  );

  assert.deepEqual(
    getSpeechRecognitionMode('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15', 'MacIntel', 5),
    { continuous: false, interimResults: false, restartOnEnd: true },
  );
});

test('preserves continuous interim recognition on laptops and desktops', async () => {
  const { getSpeechRecognitionMode } = await import('./speechRecognition');

  assert.deepEqual(
    getSpeechRecognitionMode(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
      'MacIntel',
      0,
    ),
    { continuous: true, interimResults: true, restartOnEnd: true },
  );
});


test('keeps one mobile recording active across separate final recognition sessions', () => {
  const firstSession = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'two packets lace chips', isFinal: true },
  ]));
  const afterFirstSession = appendFinalSpeechRecognitionSession('', firstSession);

  const secondSession = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'twenty rupees', isFinal: true },
  ]));
  const afterSecondSession = appendFinalSpeechRecognitionSession(afterFirstSession, secondSession);

  const thirdSession = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'quantity two', isFinal: true },
  ]));
  const completeRecording = appendFinalSpeechRecognitionSession(afterSecondSession, thirdSession);

  assert.equal(
    completeRecording,
    'two packets lace chips twenty rupees quantity two',
  );
});

test('does not append interim-only text when a mobile recognition session ends', () => {
  const session = updateSpeechRecognitionSegments([], event(0, [
    { transcript: 'unconfirmed partial phrase', isFinal: false },
  ]));

  assert.equal(appendFinalSpeechRecognitionSession('confirmed words', session), 'confirmed words');
});
