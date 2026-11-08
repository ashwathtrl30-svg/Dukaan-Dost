import assert from 'node:assert/strict';
import test from 'node:test';
import guides from '../../docs/sell-better/phase-4/feedback-guides.v1.json' with { type: 'json' };
import { buildLessonFeedback } from './feedbackEngine.js';

test('all 24 lesson feedback guides are present and structurally complete', () => {
  assert.equal(guides.lessons.length, 24);
  assert.equal(new Set(guides.lessons.map((item) => item.lessonId)).size, 24);
  for (const guide of guides.lessons) {
    assert.ok(guide.principle.length > 10, guide.lessonId);
    assert.ok(guide.signals.length >= 2, guide.lessonId);
    for (const signal of guide.signals) {
      assert.ok(signal.label.length > 0, guide.lessonId);
      assert.ok(signal.phrases.length > 0, guide.lessonId);
      assert.ok(signal.why.length > 10, guide.lessonId);
      assert.ok(signal.question.endsWith('?'), guide.lessonId);
    }
  }
});

test('recognises a lesson-specific idea with punctuation and different capitalisation', () => {
  const result = buildLessonFeedback('UC-01', 'I would first ask about their BUDGET, then check the usual brand.', guides);
  assert.equal(result.status, 'matched');
  assert.match(result.recognition, /budget/);
  assert.ok(result.consideration);
  assert.equal(result.consideration.heading, 'ANOTHER ANGLE TO CONSIDER');
});

test('a phrase not recognised by the guide is never labelled wrong', () => {
  const result = buildLessonFeedback('UC-01', 'I would listen carefully and explain the options in a calm way.', guides);
  assert.equal(result.status, 'unmatched');
  assert.match(result.recognition, /does not mean your approach is wrong/i);
  assert.ok(result.consideration);
});

test('short answers ask for more detail instead of pretending to assess', () => {
  const result = buildLessonFeedback('UC-01', 'Ask budget', guides);
  assert.equal(result.status, 'needs_detail');
  assert.match(result.message, /more detail/i);
});

test('real customer phone numbers, emails and UPI IDs are rejected', () => {
  assert.equal(buildLessonFeedback('UC-01', 'Call customer 9876543210 and ask about their needs.', guides).status, 'privacy');
  assert.equal(buildLessonFeedback('UC-01', 'Email customer person@example.com to ask what they need.', guides).status, 'privacy');
  assert.equal(buildLessonFeedback('UC-01', 'Use customer name@oksbi and then explain options.', guides).status, 'privacy');
});

test('unknown lessons fail safely without throwing', () => {
  const result = buildLessonFeedback('DOES-NOT-EXIST', 'I would ask about their budget and intended use.', guides);
  assert.equal(result.status, 'unavailable');
  assert.ok(result.message);
});

test('feedback does not expose a score or echo the complete response', () => {
  const answer = 'I would ask about their budget and cooking use before suggesting a product.';
  const result = buildLessonFeedback('UC-01', answer, guides);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /score|rating|grade|out of 10/i);
  assert.ok(!serialized.includes(answer));
});
