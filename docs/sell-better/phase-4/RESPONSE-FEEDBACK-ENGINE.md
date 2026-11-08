# Sell Better — Phase 4 Response-Aware Feedback Foundation

**Status:** Implemented in the isolated development preview; content and phrase guides remain drafts.  
**Branch:** `feature/sales-customer-handling-coach`  
**Implementation:** deterministic, local, non-AI reflection

## 1. Objective

Make Discover respond to what the shopkeeper actually typed, without introducing a paid model, network dependency, scoring, or unsupported claims about the quality of the answer.

The learner flow remains:

`Learn → Sell Better → Think/Respond → Discover → Apply → Next situation`

## 2. Feedback behaviour

Each of the 24 draft situations has a lesson-specific guide containing three important considerations, a concise explanation of why each matters, and a reflective question.

The engine:
- normalises case, punctuation and common formatting before matching authored phrases;
- recognises a lesson idea only when one of its guide phrases is present;
- acknowledges the recognised idea without claiming the whole answer has been understood;
- offers one relevant additional angle, or a balanced closing thought when all guide ideas were mentioned;
- treats an unrecognised answer as uncertain, not incorrect;
- asks for a little more detail when the response is too short to support reflection;
- blocks likely phone numbers, email addresses and common UPI IDs, asking the learner to anonymise the example;
- returns a safe unavailable state if a lesson guide is missing.

## 3. Product and accuracy boundaries

This is a transparent phrase-based reflection foundation. It is **not semantic AI**, a grade, a score, a complete evaluation, or evidence of mastery.

A valid answer may use words the guide does not contain. The UI therefore states that the matcher may not recognise every valid way of expressing an idea, and explicitly says that an unrecognised answer is not necessarily wrong.

The initial phrase guides and UI are English-first. Hindi and Hinglish response recognition are not claimed; natural-language variants need separate authoring and native-speaker review before they can be used reliably.

## 4. Data and privacy

- The response is processed in browser memory only.
- No response is written to local storage, cloud storage, analytics, logs or an API by this feature.
- The engine does not retain the full response in its result; it returns a lesson signal and authored feedback only.
- Likely customer phone numbers, email addresses and common UPI IDs are rejected before the Discover screen.
- The existing response is cleared when moving to another situation or leaving Sell Better.
- Raw microphone audio, speech recognition and read-aloud are not added or changed.

## 5. Lesson progression correction

The category-recommended lesson may start in the middle of the 24-record catalogue. The prior Phase 3 implementation advanced only to the end of the array, which meant earlier lessons were skipped.

The preview now wraps to catalogue index zero, while a separate lesson-step counter caps the session at 24 situations. This visits every record once per session, starting from the recommended lesson, without a second lap.

## 6. Automated checks

A Node built-in test suite covers:
- all 24 guide records and their required fields;
- lesson-specific phrase recognition;
- unrecognised wording remaining non-judgemental;
- short-response handling;
- phone, email and UPI privacy checks;
- safe handling of missing lesson guides;
- no scores and no full-answer echo in the feedback object;
- wraparound and invalid lesson indexes.

The Vite build is configured to run this suite before bundling, so a failing feedback test fails the build.

## 7. Explicitly not included

- AI model calls, API keys, network requests or paid services.
- Deep semantic interpretation, free-form generated prose or adaptive dialogue.
- Long-term learning profile, learner history, cloud persistence or account-linked memory.
- Hindi/Hinglish phrase understanding in this version.
- Production activation or changes to the production app/database.

## 8. Acceptance criteria

- The engine uses a separate authored guide for all 24 situations.
- Feedback acknowledges a recognised phrase and offers one further relevant consideration.
- It never treats a missing phrase as proof of a missing skill.
- It does not output numeric scores, rankings or mastery labels.
- Personal identifiers are blocked by conservative checks.
- The response is never sent or persisted.
- The lesson sequence covers all 24 situations exactly once, even when it begins from a category-specific index.
- Test suite and production bundle build pass.
- Preview deployment remains on the feature branch and uses empty/disabled Supabase preview settings.
