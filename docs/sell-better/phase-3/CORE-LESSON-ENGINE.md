# Sell Better — Phase 3 Core Lesson Engine

**Status:** Implemented in a branch-only preview; draft content and human validation remain open.  
**Branch:** `feature/sales-customer-handling-coach`

## Objective

Complete a deterministic, no-AI lesson loop while keeping the shopkeeper-facing Learn navigation compact:

`Learn → Sell Better → Think/Respond → Discover → Apply → Next situation`

## Implemented behaviour

- Enter Sell Better directly from the three-path Learn screen.
- Select the first lesson with an explicit match for the shop's known category; otherwise select the general fallback lesson.
- Show one situation, one open-ended prompt and one response field.
- Require a non-empty response before continuing.
- Show the learner's own response back to them.
- Reveal the lesson's authored objective as a general consideration, not an evaluation of that particular answer.
- Reveal one authored takeaway as the practical application.
- Continue to the next available lesson in catalogue order.
- Show a simple completion state after the last lesson.
- Return to Learn at any time.

## Non-goals and safety boundaries

- No AI or network request is made by this lesson flow.
- No score, grade, judgement, streak, mastery claim or performance label is generated.
- The engine does not claim the learner's answer is right or wrong.
- Responses remain component state only; they are not persisted to local storage, cloud storage or analytics.
- No voice settings, speech recognition, read-aloud, production screens or business records are changed.
- Save Better and Manage Stock Better remain visibly marked Coming soon.

## Content and personalisation limitations

- The current catalogue is draft English copy.
- The objective and takeaway are static authored content, not personalised feedback.
- Category selection is a simple explicit tag match; it is not a learned profile or inference about customer behaviour.
- The curriculum remains subject to founder, shopkeeper and language/expert review.

## Acceptance checks

- Learn shows only the three agreed paths.
- Sell Better opens directly into a lesson.
- Empty responses cannot advance.
- A non-empty response advances to Discover.
- Discover distinguishes general lesson guidance from assessment.
- Apply shows one practical takeaway.
- Next situation clears the previous response.
- Completion is handled without indexing beyond the catalogue.
- Back returns to Learn and clears the draft response.
- Preview remains branch-only and does not touch production data or services.
