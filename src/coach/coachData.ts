import { COACH_BASELINE_QUESTION_IDS } from './types';
import type { CoachBaselineAnswer } from './types';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ASSESSMENT_BYTES = 32_768;

export function normalizeCoachText(value: unknown): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { ok: false, error: 'Message text must be a string.' };
  }

  const normalized = value.trim();
  if (!normalized) return { ok: false, error: 'Message text cannot be empty.' };
  if (normalized.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: 'Message text is longer than the supported limit.' };
  }

  return { ok: true, value: normalized };
}

/**
 * The first assessment is deliberately fixed to the three approved questions.
 * Answers are stored as text only; raw microphone recordings are never accepted.
 */
export function normalizeBaselineAnswers(value: unknown): ValidationResult<CoachBaselineAnswer[]> {
  if (!Array.isArray(value) || value.length !== COACH_BASELINE_QUESTION_IDS.length) {
    return { ok: false, error: 'The baseline must contain exactly three answers.' };
  }

  const answers: CoachBaselineAnswer[] = [];
  for (let index = 0; index < COACH_BASELINE_QUESTION_IDS.length; index += 1) {
    const answer = value[index] as Partial<CoachBaselineAnswer> | null;
    const expectedQuestionId = COACH_BASELINE_QUESTION_IDS[index];

    if (!answer || answer.questionId !== expectedQuestionId) {
      return { ok: false, error: 'Baseline answers must use the approved question order.' };
    }

    const normalized = normalizeCoachText(answer.answer);
    if (!normalized.ok) {
      return { ok: false, error: `Baseline answer ${index + 1}: ${normalized.error}` };
    }

    answers.push({
      questionId: expectedQuestionId,
      answer: normalized.value,
    });
  }

  return { ok: true, value: answers };
}

export function normalizeAssessmentData(value: unknown): ValidationResult<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: 'Assessment data must be an object.' };
  }

  try {
    const serialized = JSON.stringify(value);
    if (!serialized || new TextEncoder().encode(serialized).byteLength > MAX_ASSESSMENT_BYTES) {
      return { ok: false, error: 'Assessment data is larger than the supported limit.' };
    }
    return { ok: true, value: JSON.parse(serialized) as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'Assessment data must contain valid JSON values.' };
  }
}
