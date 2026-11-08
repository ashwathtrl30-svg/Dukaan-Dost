# Sell Better — Phase 2 UX Design & Preview

**Status:** Implemented as a branch-only, interactive UX preview. The experience and content remain drafts pending founder, shopkeeper and relevant subject-matter review.  
**Branch:** `feature/sales-customer-handling-coach`  
**Preview flag:** `VITE_SALES_COACH_UI_PREVIEW=true`

## 1. Phase 2 objective

Turn the Sell Better product foundation into a clear, mobile-first experience that lets a shopkeeper understand the product, browse the six learning areas, inspect a situation and see how the Think → Respond → Discover → Apply flow is intended to work.

This phase is a UX prototype. It does not implement personalised AI feedback, user accounts, cloud history, speech recognition, read-aloud, scoring, progress analytics or production publishing.

## 2. Experience structure — deliberately compact

### Shopkeeper home
- Show the Sell Better promise in a short headline and one supporting line.
- Show a single **Your next practice** card, selected from the shop category when a reviewed category match exists.
- One clear action opens that practice.
- Do not display a situation library, search, six-area catalogue, lesson counts, or a long explanation of the learning method.
- Do not claim category-personalised recommendations for categories that do not yet have a specific lesson. They receive a general cross-category practice.

### Practice screen
- One compact title, one short situation, one open-ended question, and one response field.
- A simple back action returns to the home screen.
- No large instructional panel, process explainer, progress meter, score, or artificial next-step action.
- The preview response remains in component memory and is cleared on exit. It is not sent to an API or written to local/cloud storage.
- The screen identifies this as a prototype and does not pretend to provide response-aware feedback.

The user-facing preview therefore has only two states: **Next practice** and **Respond**. The six learning areas and full 24-situation catalogue remain internal curriculum structure, not a shopkeeper-facing menu.

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

- [x] A compact home screen shows one next practice.
- [x] The recommended practice uses a shop-category match only where a specific category lesson exists; otherwise it uses a general cross-category lesson.
- [x] The full 24-situation catalogue stays internal and is not exposed as a user-facing library.
- [x] The practice screen shows one situation, one open-ended question and one response field.
- [x] Answer text is ephemeral and no submit action sends or saves it.
- [x] No fake AI feedback, scoring, progress meter or extra lesson-selection actions are shown.
- [x] Preview route is gated and the non-preview Learn route is preserved.
- [ ] Shopkeeper usability review and native-language review are still required.
- [x] Vercel preview build completed successfully; final preview page and JavaScript bundle returned HTTP 200.

## 7. Explicitly deferred

Phase 3 will implement the core lesson engine without AI. Response-aware feedback, long-term learning memory and AI personalisation belong to later phases and require their own quality, privacy, safety, cost and reliability checks.


## 8. Implementation validation note

The Phase 2 UI preview was deployed successfully from the development branch. A source-level audit confirmed 24 unique situation IDs, six declared learning areas with four situations each, valid category references, and complete title/situation/open-ended-prompt/objective/takeaway fields. The flagged preview route selects the new screen while the non-preview route retains the existing Learn screen.

The response field is component state only. Navigation clears its contents; there is no API call, browser storage write, Supabase use or AI-feedback request in the preview component. The all-situations library, area filtering, search and detail/back navigation paths were checked in source. A navigation edge case for returning from the featured situation was found and fixed before the final deployment.

Vercel reported the final development-branch deployment as `READY`. Its page and compiled JavaScript bundle returned HTTP 200, and the served bundle included the Sell Better headline, revised situation copy and preview disclaimers. The final deployment is linked below in the handoff.

**Validation limitation:** This was a source, build, deployment and served-bundle smoke audit. It was not a full device/browser automation run or a shopkeeper usability test. Check the UI on an Android phone and desktop before treating the layout as accepted. The curriculum remains draft content pending founder, shopkeeper and language/expert review.


## 9. Compact UX revision

After founder review, the original Phase 2 preview was judged too long and too catalogue-driven. It has been simplified to two user-facing states:
1. **Next practice:** product promise, one supporting line, one recommended practice and one Start practice action.
2. **Respond:** situation, open-ended prompt and response field, with a simple Back action.

The situation library, search interface, six-area card grid, long four-step explainer and extended Discover/Apply explainer have been removed from the shopkeeper-facing preview. The complete curriculum remains in the internal JSON catalogue.

The current selector only claims shop-category matching where an explicit matching category exists in the draft catalogue. For currently uncovered shop types (including medical, tea stall and restaurant), the preview uses a broad cross-category fallback rather than pretending it has dedicated category-specific lessons.

This is still an English-only UI and content preview. Hindi/Hinglish, voice response and actual response-aware feedback remain future implementation/review work.
