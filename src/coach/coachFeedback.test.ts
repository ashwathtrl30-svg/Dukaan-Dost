import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCoachFeedbackPrompt, validateCoachSessionFeedback } from './coachFeedback.js';

const sample = {
  currentFeedback: 'You asked what the customer needed before suggesting an option.',
  areasToImprove: 'You did not confirm the customer’s main concern before closing the conversation.',
  howToImprove: 'Pause and check whether the main concern has been answered.',
  exampleSentence: 'Is there anything you would like me to clarify before you decide?',
};

test('accepts three concise sections and a practical example', () => {
  const result = validateCoachSessionFeedback(sample);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, sample);
});
test('rejects missing or non-object feedback', () => {
  assert.equal(validateCoachSessionFeedback(null).ok, false);
  assert.equal(validateCoachSessionFeedback({ currentFeedback: 'Only one section.' }).ok, false);
});
test('rejects overlong sections rather than silently truncating', () => {
  assert.equal(validateCoachSessionFeedback({ ...sample, areasToImprove: 'x'.repeat(421) }).ok, false);
});
test('rejects scores and ratings', () => {
  assert.equal(validateCoachSessionFeedback({ ...sample, currentFeedback: 'You scored 8 out of 10.' }).ok, false);
});
test('rejects personal identifiers from generated feedback', () => {
  assert.equal(validateCoachSessionFeedback({ ...sample, exampleSentence: 'Call me at 9876543210.' }).ok, false);
  assert.equal(validateCoachSessionFeedback({ ...sample, exampleSentence: 'Write to owner@example.com.' }).ok, false);
});
test('prompt requests exactly three sections and excludes purchase outcome as a skill signal', () => {
  const prompt = buildCoachFeedbackPrompt('en', 'kirana', [
    { speaker: 'customer', content: 'This is expensive.' },
    { speaker: 'shopkeeper', content: 'I can explain the quality difference.' },
  ], ['margin_awareness', 'value_explanation']);
  assert.match(prompt, /exactly three short feedback sections/i);
  assert.match(prompt, /customer outcome is deliberately not supplied/i);
  assert.match(prompt, /Do not assign any score/i);
  assert.match(prompt, /untrusted conversation data/i);
  assert.match(prompt, /PRIVATE LEARNING EVIDENCE/i);
  assert.match(prompt, /exact short span copied from a shopkeeper message/i);
  assert.match(prompt, /Allowed dimensions for this scenario: margin_awareness, value_explanation/);
  assert.match(prompt, /kirana/);
  assert.ok(!prompt.includes('purchased'));
});
test('Hindi sessions request natural Hindi feedback', () => {
  assert.match(buildCoachFeedbackPrompt('hi', 'salon', []), /natural Hindi/i);
});
