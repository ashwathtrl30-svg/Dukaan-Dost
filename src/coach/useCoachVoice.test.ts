import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendCoachTranscript,
  getCoachSpeechLocale,
  mapCoachSpeechRecognitionError,
} from './useCoachVoice.js';

test('Coach speech locale follows the saved app language', () => {
  assert.equal(getCoachSpeechLocale('en'), 'en-IN');
  assert.equal(getCoachSpeechLocale('hi'), 'hi-IN');
});

test('recognised speech appends to typed text with readable spacing', () => {
  assert.equal(appendCoachTranscript('I would first ask', 'what the customer needs'), 'I would first ask what the customer needs');
});

test('identical recognition segments are not appended twice', () => {
  assert.equal(appendCoachTranscript('Namaste, aapko kya chahiye?', 'aapko kya chahiye?'), 'Namaste, aapko kya chahiye?');
});

test('a recognition result containing the full draft replaces rather than duplicates it', () => {
  assert.equal(appendCoachTranscript('Namaste', 'Namaste, aapko kya chahiye?'), 'Namaste, aapko kya chahiye?');
});

test('transcripts remove control characters and respect the message limit', () => {
  assert.equal(appendCoachTranscript('Hello\u0000', 'there', 8), 'Hello th');
  assert.equal(appendCoachTranscript('', 'This sentence is too long', 8), 'This sen');
});

test('speech recognition errors are converted to safe UI states', () => {
  assert.equal(mapCoachSpeechRecognitionError('not-allowed'), 'permission-denied');
  assert.equal(mapCoachSpeechRecognitionError('service-not-allowed'), 'permission-denied');
  assert.equal(mapCoachSpeechRecognitionError('no-speech'), 'no-speech');
  assert.equal(mapCoachSpeechRecognitionError('audio-capture'), 'no-microphone');
  assert.equal(mapCoachSpeechRecognitionError('network'), 'network');
  assert.equal(mapCoachSpeechRecognitionError('language-not-supported'), 'language');
  assert.equal(mapCoachSpeechRecognitionError('unexpected'), 'unknown');
});
