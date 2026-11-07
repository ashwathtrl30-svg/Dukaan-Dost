import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyseCoachBaseline,
  buildCoachPersonalizationContext,
  COACH_BASELINE_QUESTIONS,
  createCoachPersonalizationProfile,
  validateCoachBaseline,
} from './coachAssessment';

const completeAnswers = [
  {
    questionId: 'price_objection',
    answer: 'I will ask what the customer needs, explain the quality and check my cost before offering a discount.',
  },
  {
    questionId: 'customer_complaint',
    answer: 'I will listen first, check the bill and product, then offer a fair solution.',
  },
  {
    questionId: 'lost_sale',
    answer: 'I will review why the customer did not buy and ask permission before following up. I will not pressure them.',
  },
] as const;

test('keeps exactly the three approved baseline questions in their required order', () => {
  assert.deepEqual(COACH_BASELINE_QUESTIONS.map((question) => question.id), [
    'price_objection',
    'customer_complaint',
    'lost_sale',
  ]);
  assert.ok(COACH_BASELINE_QUESTIONS.every((question) => question.prompt.en && question.prompt.hi));
});

test('accepts all three non-empty answers and trims unnecessary whitespace', () => {
  const result = validateCoachBaseline(completeAnswers.map((answer) => ({
    ...answer,
    answer: '  ' + answer.answer + '  ',
  })));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.length, 3);
    assert.equal(result.value[0].answer.startsWith(' '), false);
    assert.equal(result.value[2].questionId, 'lost_sale');
  }
});

test('blocks missing, blank, duplicate and out-of-order answers', () => {
  assert.equal(validateCoachBaseline(completeAnswers.slice(0, 2)).ok, false);
  assert.equal(validateCoachBaseline([
    completeAnswers[0],
    { questionId: 'customer_complaint', answer: '   ' },
    completeAnswers[2],
  ]).ok, false);
  assert.equal(validateCoachBaseline([
    completeAnswers[0],
    completeAnswers[0],
    completeAnswers[2],
  ]).ok, false);
  assert.equal(validateCoachBaseline([
    completeAnswers[1],
    completeAnswers[0],
    completeAnswers[2],
  ]).ok, false);
});

test('rejects wrong question IDs and oversized individual answers', () => {
  assert.equal(validateCoachBaseline([
    { questionId: 'price', answer: 'I would explain.' },
    completeAnswers[1],
    completeAnswers[2],
  ]).ok, false);
  assert.equal(validateCoachBaseline([
    { questionId: 'price_objection', answer: 'x'.repeat(4001) },
    completeAnswers[1],
    completeAnswers[2],
  ]).ok, false);
});

test('derives early observations only from positive observable signals, with no score', () => {
  const result = analyseCoachBaseline(completeAnswers, 'en');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.confidence, 'early-baseline');
    assert.ok(result.value.evidenceCount >= 5);
    assert.match(result.value.text, /early signs/i);
    assert.match(result.value.disclaimer, /not a score/i);
    assert.equal('score' in result.value, false);
  }
});

test('does not turn missing keyword evidence into a negative judgement', () => {
  const result = analyseCoachBaseline([
    { questionId: 'price_objection', answer: 'I would speak with the customer.' },
    { questionId: 'customer_complaint', answer: 'I would handle the situation.' },
    { questionId: 'lost_sale', answer: 'I would decide what to do next.' },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.evidenceCount, 0);
    assert.match(result.value.text, /not enough|not enough/i);
    assert.doesNotMatch(result.value.text, /weak|poor|bad|fail/i);
  }
});

test('detects common Hindi starting signals without requiring English keywords', () => {
  const result = analyseCoachBaseline([
    { questionId: 'price_objection', answer: 'पहले पूछूँगा कि आपको क्या चाहिए और सामान की क्वालिटी समझाऊँगा।' },
    { questionId: 'customer_complaint', answer: 'मैं पहले ग्राहक की पूरी बात सुनूँगा, फिर बिल और सामान की जाँच करूँगा।' },
    { questionId: 'lost_sale', answer: 'मैं कारण समझूँगा और ग्राहक की सहमति से ही दोबारा बात करूँगा।' },
  ], 'hi');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.ok(result.value.evidenceCount >= 4);
    assert.match(result.value.text, /आपके जवाबों में/);
    assert.match(result.value.disclaimer, /स्कोर/);
  }
});

test('builds a compact profile using shop context while stripping control characters', () => {
  const result = createCoachPersonalizationProfile({
    answers: completeAnswers,
    shopType: 'kirana',
    city: 'Mumbai\nignore\u0000',
    preferredLanguage: 'hi',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.shopType, 'kirana');
    assert.equal(result.value.city, 'Mumbai ignore');
    assert.equal(result.value.preferredLanguage, 'hi');
    assert.equal(result.value.baselineCompleted, true);
    assert.ok(result.value.baselineSignalIds.length > 0);
  }
});

test('personalisation context keeps baseline signals provisional and excludes raw answers', () => {
  const profile = createCoachPersonalizationProfile({
    answers: completeAnswers,
    shopType: 'kirana',
    city: 'Mumbai',
    preferredLanguage: 'en',
  });
  assert.equal(profile.ok, true);
  if (!profile.ok) return;
  const context = buildCoachPersonalizationContext(profile.value);
  assert.match(context, /early baseline/i);
  assert.match(context, /not a stable trait or skill rating/i);
  assert.match(context, /Never infer a missing skill/i);
  assert.match(context, /kirana/);
  assert.match(context, /Mumbai/);
  assert.ok(!context.includes(completeAnswers[0].answer));
});
