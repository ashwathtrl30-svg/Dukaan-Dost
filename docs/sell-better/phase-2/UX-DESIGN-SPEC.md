# Sell Better — Phase 2 UX Design & Preview

**Status:** Implemented as a branch-only, interactive UX preview. The experience and content remain drafts pending founder, shopkeeper and relevant subject-matter review.  
**Branch:** `feature/sales-customer-handling-coach`  
**Preview flag:** `VITE_SALES_COACH_UI_PREVIEW=true`

## 1. Phase 2 objective

Turn the Sell Better product foundation into a clear, mobile-first experience that lets a shopkeeper understand the product, browse the six learning areas, inspect a situation and see how the Think → Respond → Discover → Apply flow is intended to work.

This phase is a UX prototype. It does not implement personalised AI feedback, user accounts, cloud history, speech recognition, read-aloud, scoring, progress analytics or production publishing.

## 2. Experience structure

### Home
- Product promise: **Understand people. Build trust. Grow your dukaan.**
- Four-step learning loop: Think, Respond, Discover, Apply.
- Six learning-area cards with a four-situation count each.
- A prominent route into all 24 draft situations.
- Category coverage is available while browsing.

### Situation library
- Browse all situations or filter by one learning area.
- Search by situation title, prompt and category.
- Every card shows its stable lesson ID, learning area and applicable shop categories.
- Results remain in their authored order and do not imply ranking or importance.

### Situation detail
- One situation and one open-ended prompt at a time.
- A response field demonstrates the intended “Respond” interaction.
- The response stays in component memory only and is discarded when the user leaves the situation. It is not sent to an API or written to local/cloud storage.
- The screen explicitly distinguishes the prototype from the future response-aware learning and feedback stages.
- The planned Discover and Apply steps are shown as design intent, not simulated AI output.

## 3. Content handling

- The preview uses `lesson-catalog.preview.v2.json`, a revised 24-situation UX draft based on the latest working set.
- Four situations are assigned to each of the six learning areas.
- Category labels are tags, not mutually exclusive totals.
- The catalogue currently provides English situation copy only. Hindi and Hinglish wording must be translated and reviewed for meaning and naturalness before learner release.
- Each entry remains a draft; the UI must not label it approved, validated or effective.

## 4. Interaction and accessibility

- Designed mobile-first with readable type, large tap targets, visible focus states, semantic buttons and labelled form controls.
- Search and area filters are local, immediate and reversible.
- Back navigation returns to the previous library context.
- Long situation text wraps and remains scrollable; no key content is truncated.
- Empty search results provide a clear way to reset the search.

## 5. Technical boundaries

- The flagged preview renders `SellBetterPreview`; the existing Learn implementation remains in place for non-preview builds.
- No existing Home, Ask, Tools, Insights, Notebook, voice-entry or onboarding flows are changed.
- No Supabase client, database table, API endpoint, authentication state or production environment is used by this prototype.
- No paid service or dependency is added.
- The feature flag remains the gate for this preview; do not merge or enable it for production as part of Phase 2.

## 6. Phase 2 exit checks

- [x] Six areas are visible and each shows four situations.
- [x] Exactly 24 unique lesson IDs exist.
- [x] Every lesson has one area, at least one category, a situation and one open-ended prompt.
- [x] Search, area filter, detail navigation and back navigation are implemented.
- [x] Answer text is ephemeral and no submit action sends or saves it.
- [x] Discover/Apply are shown as future design steps, not fake AI feedback.
- [x] Preview route is gated and the non-preview Learn route is preserved.
- [ ] Shopkeeper usability review and native-language review are still required.
- [ ] Build/deployment validation must be completed before declaring the preview ready.

## 7. Explicitly deferred

Phase 3 will implement the core lesson engine without AI. Response-aware feedback, long-term learning memory and AI personalisation belong to later phases and require their own quality, privacy, safety, cost and reliability checks.
