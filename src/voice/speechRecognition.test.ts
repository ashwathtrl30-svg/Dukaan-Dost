import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
    { transcript: 'do kilo', isFinal: true },
    { transcript: 'rice 200 rupaye', isFinal: true },
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
    { transcript: 'one', isFinal: true },
    { transcript: 'updated two', isFinal: true },
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
