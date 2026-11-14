import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAKERY_VOICE_VOCABULARY,
  buildVoiceVocabulary,
} from './voiceVocabulary';

test('includes a broad bakery starter vocabulary and the difficult names in the report', () => {
  assert.ok(BAKERY_VOICE_VOCABULARY.length >= 100);
  assert.ok(BAKERY_VOICE_VOCABULARY.includes('Chocolate Bomboloni'));
  assert.ok(BAKERY_VOICE_VOCABULARY.includes('San Sebastian Cheesecake'));
  assert.ok(BAKERY_VOICE_VOCABULARY.includes('San Sebastián Cheesecake'));
  assert.ok(BAKERY_VOICE_VOCABULARY.includes('Kouign-Amann'));
});

test('prioritises frequently sold saved product names before bakery defaults', () => {
  const result = buildVoiceVocabulary('bakery', [
    'Chocolate Bomboloni',
    'San Sebastian Cheesecake',
    'Chocolate Bomboloni',
    'Pistachio Croissant',
  ]);

  assert.equal(result[0], 'Chocolate Bomboloni');
  assert.ok(result.indexOf('San Sebastian Cheesecake') < result.indexOf('Kouign-Amann'));
  assert.ok(result.includes('Pistachio Croissant'));
  assert.ok(result.length <= 150);
});

test('deduplicates product names and respects the configured vocabulary limit', () => {
  const result = buildVoiceVocabulary('bakery', [
    'San Sebastian Cheesecake',
    '  San   Sebastian   Cheesecake ',
    'Chocolate Bomboloni',
  ], 2);

  assert.equal(result.length, 2);
  assert.equal(result[0], 'San Sebastian Cheesecake');
  assert.equal(result[1], 'Chocolate Bomboloni');
});

test('does not inject bakery vocabulary into unrelated shop types', () => {
  assert.deepEqual(
    buildVoiceVocabulary('kirana', ['Fortune Oil', 'Tata Salt']),
    ['Fortune Oil', 'Tata Salt'],
  );
});
