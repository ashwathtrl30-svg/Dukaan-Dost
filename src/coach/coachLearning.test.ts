import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateCoachLearningState,
  buildCoachLearningEvidenceInstructions,
  buildCoachMilestonePrompt,
  normalizeCoachTeachingAdjustment,
  validateCoachLearningEvidence,
  validateCoachMilestoneReview,
} from './coachLearning.js';

const tested = ['negotiation', 'margin_awareness'];
const transcript = [
  { speaker: 'customer' as const, content: 'Can you lower the price?' },
  { speaker: 'shopkeeper' as const, content: 'I can explain the value, but I cannot go below my cost.' },
];

test('accepts only evidence quotes copied from a tested shopkeeper reply', () => {
  const result = validateCoachLearningEvidence([
    { dimension: 'margin_awareness', observation: 'strength', evidenceQuote: 'I cannot go below my cost.' },
    { dimension: 'negotiation', observation: 'practice_opportunity', evidenceQuote: 'Can you lower the price?' },
    { dimension: 'accuracy', observation: 'strength', evidenceQuote: 'I cannot go below my cost.' },
  ], transcript, tested);
  assert.deepEqual(result, [{
    dimension: 'margin_awareness',
    observation: 'strength',
    evidenceQuote: 'I cannot go below my cost.',
  }]);
});

test('rejects invented quotes, customer quotes, private identifiers and duplicate dimensions', () => {
  const result = validateCoachLearningEvidence([
    { dimension: 'negotiation', observation: 'practice_opportunity', evidenceQuote: 'I will give you 50 percent off.' },
    { dimension: 'margin_awareness', observation: 'strength', evidenceQuote: 'Can you lower the price?' },
    { dimension: 'margin_awareness', observation: 'strength', evidenceQuote: 'I cannot go below my cost.' },
    { dimension: 'negotiation', observation: 'strength', evidenceQuote: 'Call me at 9876543210.' },
  ], transcript, tested);
  assert.deepEqual(result, [{
    dimension: 'margin_awareness',
    observation: 'strength',
    evidenceQuote: 'I cannot go below my cost.',
  }]);
});

test('private evidence instructions restrict the model to scenario-tested dimensions', () => {
  const prompt = buildCoachLearningEvidenceInstructions(['negotiation', 'untrusted_dimension']);
  assert.match(prompt, /Allowed dimensions for this scenario: negotiation/);
  assert.match(prompt, /exact short span copied from a shopkeeper message/i);
  assert.match(prompt, /Missing keywords.*never evidence/i);
});

test('does not invent learning weaknesses when there is no direct evidence', () => {
  const state = aggregateCoachLearningState({
    sessions: [{
      scenarioCode: 'ddsc1_11_kirana_bargainer',
      testedDimensions: ['negotiation'],
      evidence: [],
    }],
    completedSessions: 11,
  });
  assert.deepEqual(state.dimensionSignals, {});
  assert.deepEqual(state.focusAreas, []);
  assert.deepEqual(state.strengths, []);
  assert.equal(state.teachingAdjustment, null);
});

test('creates focus areas only from repeated evidence and changes approach after five repeated opportunities', () => {
  const sessions = Array.from({ length: 5 }, (_, index) => ({
    scenarioCode: 'ddsc1_' + String(index + 11).padStart(2, '0') + '_kirana_bargainer',
    completedAt: '2026-11-' + String(index + 1).padStart(2, '0') + 'T10:00:00.000Z',
    testedDimensions: ['negotiation', 'margin_awareness'],
    evidence: [{
      dimension: 'negotiation',
      observation: 'practice_opportunity' as const,
      evidenceQuote: 'I will just lower the price.',
    }],
  }));
  const state = aggregateCoachLearningState({ sessions, completedSessions: 15 });
  assert.equal(state.dimensionSignals.negotiation, 0);
  assert.deepEqual(state.focusAreas, ['negotiation']);
  assert.deepEqual(state.teachingAdjustment, {
    mode: 'focused_micro_practice',
    dimension: 'negotiation',
    opportunityStreak: 5,
  });
  assert.equal(normalizeCoachTeachingAdjustment(state.teachingAdjustment)?.dimension, 'negotiation');
});

test('a clear positive observation resets the repeated-opportunity teaching adjustment', () => {
  const sessions = Array.from({ length: 6 }, (_, index) => ({
    scenarioCode: 'ddsc1_' + String(index + 11).padStart(2, '0') + '_kirana_bargainer',
    completedAt: '2026-11-' + String(index + 1).padStart(2, '0') + 'T10:00:00.000Z',
    testedDimensions: ['negotiation'],
    evidence: [{
      dimension: 'negotiation',
      observation: index === 5 ? 'strength' as const : 'practice_opportunity' as const,
      evidenceQuote: index === 5 ? 'I can explain the value without changing the price.' : 'I will just lower the price.',
    }],
  }));
  const state = aggregateCoachLearningState({ sessions, completedSessions: 16 });
  assert.equal(state.opportunityStreaks.negotiation, 0);
  assert.equal(state.teachingAdjustment, null);
});

test('milestone reviews require evidence-based sections and verify every quotation', () => {
  const sessions = [{
    practiceNumber: 1,
    shopType: 'kirana',
    language: 'en' as const,
    messages: transcript,
  }];
  const prompt = buildCoachMilestonePrompt(sessions);
  assert.match(prompt, /compare the earliest practices with practice ten/i);
  assert.match(prompt, /No outcomes are supplied/i);
  assert.ok(!prompt.includes('purchased'));

  const valid = validateCoachMilestoneReview({
    overallReview: 'You checked the customer concern and explained the product value in several conversations.',
    progressSinceStart: 'Your later replies included clearer explanations than the first practice. The evidence is still limited.',
    nextPracticeFocus: 'Continue checking the customer’s main concern before recommending an option.',
    evidenceQuotes: ['I can explain the value, but I cannot go below my cost.'],
  }, sessions);
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.value.evidenceQuotes.length, 1);

  assert.equal(validateCoachMilestoneReview({
    overallReview: 'You scored 8 out of 10.',
    progressSinceStart: 'Some progress is visible.',
    nextPracticeFocus: 'Listen first.',
    evidenceQuotes: [],
  }, sessions).ok, false);
});

test('milestone review can honestly report insufficient improvement evidence', () => {
  const result = validateCoachMilestoneReview({
    overallReview: 'The conversations show different customer concerns, but there is not enough repeated evidence to make a broad conclusion.',
    progressSinceStart: 'The first and tenth practices do not show a clear change in the available replies.',
    nextPracticeFocus: 'Keep asking one clear question before recommending an item.',
    evidenceQuotes: [],
  }, []);
  assert.equal(result.ok, true);
});
