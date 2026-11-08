/**
 * Transparent, deterministic response reflection for Sell Better.
 * This is not semantic AI, grading, or a definitive assessment of a learner.
 */

/** @typedef {{ lessonId: string, principle: string, signals: Array<{ id?: string, label: string, phrases: string[], why: string, question: string }> }} LessonFeedbackGuide */
/** @typedef {{ schemaVersion: number, lessons: LessonFeedbackGuide[] }} FeedbackGuideCatalog */

/**
 * @typedef {Object} LessonFeedback
 * @property {'matched'|'unmatched'|'needs_detail'|'privacy'|'unavailable'} status
 * @property {string} recognition
 * @property {{label: string, why: string, question: string, heading: string}|null} consideration
 * @property {string|null} matchedPhrase
 * @property {string|null} message
 */

/** @param {string} value */
function normalizePhrase(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9₹]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** @param {string} response */
function containsPrivateIdentifier(response) {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const indianMobile = /(?:^|\D)(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}(?:\D|$)/;
  const upiId = /\b[\w.-]{2,}@(okaxis|okhdfcbank|oksbi|ybl|paytm|upi)\b/i;
  return email.test(response) || indianMobile.test(response) || upiId.test(response);
}

/** @param {string} haystack @param {string} needle */
function includesWholePhrase(haystack, needle) {
  return (' ' + haystack + ' ').includes(' ' + needle + ' ');
}

/**
 * @param {string} lessonId
 * @param {string} response
 * @param {FeedbackGuideCatalog} catalog
 * @returns {LessonFeedback}
 */
export function buildLessonFeedback(lessonId, response, catalog) {
  const raw = typeof response === 'string' ? response.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim() : '';

  if (containsPrivateIdentifier(raw)) {
    return {
      status: 'privacy',
      recognition: '',
      consideration: null,
      matchedPhrase: null,
      message: 'Please remove any real customer phone number, email address or payment ID. Sell Better only needs an anonymised answer.',
    };
  }

  if (!raw || raw.length < 12 || raw.split(/\s+/).filter(Boolean).length < 3) {
    return {
      status: 'needs_detail',
      recognition: '',
      consideration: null,
      matchedPhrase: null,
      message: 'Add a little more detail about what you would ask, check or explain. Your answer does not need to be long.',
    };
  }

  const guide = Array.isArray(catalog?.lessons)
    ? catalog.lessons.find((item) => item.lessonId === lessonId)
    : undefined;
  if (!guide || !Array.isArray(guide.signals) || guide.signals.length === 0) {
    return {
      status: 'unavailable',
      recognition: '',
      consideration: null,
      matchedPhrase: null,
      message: 'The reflection guide for this situation is not available yet. You can still use the lesson takeaway.',
    };
  }

  const normalized = normalizePhrase(raw);
  const matches = guide.signals
    .map((signal) => {
      const found = (signal.phrases || [])
        .map((phrase) => normalizePhrase(phrase))
        .filter(Boolean)
        .filter((phrase) => includesWholePhrase(normalized, phrase))
        .sort((a, b) => b.length - a.length)[0];
      return found ? { signal, phrase: found } : null;
    })
    .filter(Boolean);

  const best = matches
    .slice()
    .sort((a, b) => b.phrase.length - a.phrase.length)[0] || null;

  const remaining = guide.signals.find((signal) => !matches.some((match) => match.signal === signal));
const consideration = remaining
    ? {
        label: remaining.label,
        why: remaining.why,
        question: remaining.question,
        heading: matches.length ? 'ANOTHER ANGLE TO CONSIDER' : 'ONE ANGLE TO CONSIDER',
      }
    : {
        label: 'Keep the decision grounded in the situation',
        why: guide.principle,
        question: 'Which factor matters most for this customer and the facts you can verify?',
        heading: 'PUT IT INTO PRACTICE',
      };

  if (best) {
    return {
      status: 'matched',
      recognition: 'You mentioned “' + best.phrase + '”. That connects to ' + best.signal.label.toLowerCase() + ': ' + best.signal.why,
      consideration,
      matchedPhrase: best.phrase,
      message: null,
    };
  }

  return {
    status: 'unmatched',
    recognition: 'I could not confidently recognise one of this lesson’s key ideas from the wording alone. That does not mean your approach is wrong.',
    consideration,
    matchedPhrase: null,
    message: null,
  };
}

/**
 * Return the next catalogue index, wrapping to the beginning.
 * The caller tracks the number of completed lessons to prevent a second lap.
 * @param {number} currentIndex
 * @param {number} totalLessons
 * @returns {number|null}
 */
export function getNextLessonIndex(currentIndex, totalLessons) {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(totalLessons) || totalLessons <= 0) return null;
  if (currentIndex < 0 || currentIndex >= totalLessons) return null;
  return (currentIndex + 1) % totalLessons;
}
