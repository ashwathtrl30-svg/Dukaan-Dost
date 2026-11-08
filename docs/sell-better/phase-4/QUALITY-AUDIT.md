# Sell Better — Phase 4 Quality Audit

**Status:** The exact feedback-engine source passed 14 targeted code-mode checks. The repository's Node test command is committed and wired into the Vercel build, but the latest Node test/build run could not be confirmed because Vercel's deployment API reached its free daily deployment quota (HTTP 402).  
**Branch:** `feature/sales-customer-handling-coach`

## Implementation inventory

- `docs/sell-better/phase-4/feedback-guides.v1.json`: 24 lesson-specific guides, 72 authored response signals.
- `src/sellBetter/feedbackEngine.js`: deterministic phrase matching, short-answer guard, personal-identifier guard, safe fallback and tested progression helper.
- `src/sellBetter/feedbackEngine.d.ts`: TypeScript types for the JavaScript module.
- `src/sellBetter/feedbackEngine.test.js`: Node built-in test suite.
- `src/screens/SellBetterPreview.tsx`: Discover feedback UI and complete 24-situation rotation.
- `package.json`: Vite build runs `npm run test:sell-better` before `vite build`.

## Code-mode checks executed against the exact committed engine source

| Check | Result |
|---|---|
| 24 lesson guides, unique IDs and 72 signals | Pass |
| Lesson-specific phrase recognition | Pass |
| Unrecognised wording is not labelled wrong | Pass |
| Short-response guard | Pass |
| Standalone and in-sentence Indian mobile number detection | Pass |
| Formatted +91 number detection (including spaces) | Pass |
| Email and UPI ID detection | Pass |
| Unknown-lesson fallback | Pass |
| 24-lesson wraparound | Pass |
| Invalid progression indexes | Pass |
| No numeric assessment and no full-response echo | Pass |

**Result: 14/14 targeted checks passed.** These checks executed the committed engine source in an isolated JavaScript runtime against the committed guide JSON. They are not a substitute for the repository's full Node test command or a Vite build.

## Deployment and automated test limitation

The Vercel API rejected the latest preview deployment request with HTTP 402 because the project/team reached its free daily deployment API limit (`api-deployments-free-per-day`, more than 100 deployments in the rolling 24-hour period). No billing or plan changes were made. A local Vercel CLI was not installed, and the container could not reach GitHub to clone the source for a local build.

Therefore:
- The final Node test run through `npm run test:sell-better` is pending.
- The final Vite production bundle build is pending.
- No new Phase 4 preview URL is available yet.
- Earlier Phase 3 preview URLs do not contain this Phase 4 implementation.

## Known limitations

- Phrase matching is not natural-language understanding. Synonyms, paraphrases, Hindi/Hinglish and nuanced context may not be recognised.
- Unrecognised phrasing is not labelled incorrect; the learner is reminded that this is not a full assessment.
- The guide copy is draft content and needs founder, shopkeeper and subject-matter review.
- The current screen and content remain English-first.
- Real Android/iOS interaction testing remains a separate founder review; a successful web build is not a device test.

## Privacy boundary

- Responses remain React component state and are not submitted to an API or persisted.
- The engine output does not contain the full response.
- Common email, Indian phone-number and UPI-ID patterns are blocked.
- This pattern check is a protective convenience, not a complete DLP system. Users are still told not to enter identifying information.

## Isolation checklist

The branch preview configuration was rechecked:
- `VITE_SALES_COACH_UI_PREVIEW=true`
- `VITE_COACH_CLOUD_ENABLED=false`
- blank preview `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

No production database, production environment variable, or main-branch code was changed.

## Release gate

**Not yet preview-ready or production-approved.** Complete the Node test command, Vite build, Vercel preview deployment, and real-device founder review when deployment capacity is available. Real shopkeeper and language/expert review remains required before learner-facing release.
