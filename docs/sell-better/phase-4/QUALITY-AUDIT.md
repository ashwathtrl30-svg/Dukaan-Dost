# Sell Better — Phase 4 Quality Audit

**Status:** Source and automated checks defined; final Vercel build must pass before marking this phase preview-ready.  
**Branch:** `feature/sales-customer-handling-coach`

## Implementation inventory

- `docs/sell-better/phase-4/feedback-guides.v1.json`: 24 lesson-specific guides, 72 authored response signals.
- `src/sellBetter/feedbackEngine.js`: deterministic phrase matching, short-answer guard, personal-identifier guard, safe fallback and tested progression helper.
- `src/sellBetter/feedbackEngine.d.ts`: TypeScript types for the JavaScript module.
- `src/sellBetter/feedbackEngine.test.js`: Node built-in tests.
- `src/screens/SellBetterPreview.tsx`: Discover feedback UI and complete 24-situation rotation.
- `package.json`: Vite build runs `npm run test:sell-better` before `vite build`.

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

The branch preview is expected to retain:
- `VITE_SALES_COACH_UI_PREVIEW=true`
- `VITE_COACH_CLOUD_ENABLED=false`
- blank preview Supabase URL and key values.

Do not merge to `main`, deploy to production, connect a production database, or enable persistence as part of this phase.

## Release gate

Phase 4 is for founder review in the isolated preview only after the CI-style test run and Vercel build both succeed. It is not approved for real shopkeeper data or production release.
