import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeAssessmentData,
  normalizeBaselineAnswers,
  normalizeCoachText,
} from './coachData';

const validBaseline = [
  { questionId: 'price_objection', answer: 'I would explain the product value and ask what matters to them.' },
  { questionId: 'customer_complaint', answer: 'I would listen, check the purchase and offer a fair solution.' },
  { questionId: 'lost_sale', answer: 'I would review what happened and learn from it.' },
] as const;

test('accepts exactly the three baseline answers in the approved order', () => {
  const result = normalizeBaselineAnswers(validBaseline);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.length, 3);
    assert.equal(result.value[0].questionId, 'price_objection');
  }
});

test('rejects missing, duplicated, reordered and blank baseline answers', () => {
  assert.equal(normalizeBaselineAnswers(validBaseline.slice(0, 2)).ok, false);
  assert.equal(normalizeBaselineAnswers([
    validBaseline[0],
    validBaseline[0],
    validBaseline[2],
  ]).ok, false);
  assert.equal(normalizeBaselineAnswers([
    validBaseline[1],
    validBaseline[0],
    validBaseline[2],
  ]).ok, false);
  assert.equal(normalizeBaselineAnswers([
    validBaseline[0],
    { questionId: 'customer_complaint', answer: '   ' },
    validBaseline[2],
  ]).ok, false);
});

test('trims transcript text and enforces the maximum message length', () => {
  assert.deepEqual(normalizeCoachText('  Namaste, I will help.  '), {
    ok: true,
    value: 'Namaste, I will help.',
  });
  assert.equal(normalizeCoachText('   ').ok, false);
  assert.equal(normalizeCoachText('x'.repeat(4001)).ok, false);
  assert.equal(normalizeCoachText(42).ok, false);
});

test('accepts bounded JSON assessment objects and rejects unsafe shapes or oversized payloads', () => {
  assert.equal(normalizeAssessmentData({ feedback: 'Listen first', strengths: [] }).ok, true);
  assert.equal(normalizeAssessmentData(null).ok, false);
  assert.equal(normalizeAssessmentData(['not', 'an', 'object']).ok, false);
  assert.equal(normalizeAssessmentData({ feedback: 'x'.repeat(33_000) }).ok, false);
});
