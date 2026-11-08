# Sell Better — Phase 2 UX Design & Preview

**Status:** Implemented as a branch-only, interactive UX preview. The experience and content remain drafts pending founder, shopkeeper and relevant subject-matter review.  
**Branch:** `feature/sales-customer-handling-coach`  
**Preview flag:** `VITE_SALES_COACH_UI_PREVIEW=true`

## 1. Phase 2 objective

Turn the Sell Better product foundation into a clear, mobile-first experience that lets a shopkeeper choose one of three business-improvement paths and enter an available lesson with minimal friction.

This phase is a UX prototype. It does not implement personalised AI feedback, user accounts, cloud history, speech recognition, read-aloud, scoring, progress analytics or production publishing.

## 2. Experience structure — three paths, direct lesson entry

### Learn landing screen
- When the shopkeeper opens Learn, show three clear business-improvement paths:
  1. **Sell Better** — understand customers, build trust and improve selling decisions.
  2. **Save Better** — make smarter money and cost decisions.
  3. **Manage Stock Better** — make better stock and replenishment decisions.
- Sell Better is available in this preview. Save Better and Manage Stock Better are visible as **Coming soon** because their curriculum and experience have not been built yet.
- Do not show a situation library, search, six-area curriculum catalogue or lesson-selection menu.

### Sell Better entry
- Tapping **Sell Better** opens a lesson immediately. There is no intermediate recommendation card or Start Practice screen.
- Select a draft lesson for the shop category only where an explicit matching situation exists. Otherwise, use a general cross-category draft and do not imply dedicated category coverage.
- The lesson screen contains one short title, one situation, one open-ended prompt and one response field.
- A simple Back action returns to the three-path Learn screen.
- The preview response remains in component memory and is cleared on exit. It is not sent to an API or written to local/cloud storage.
- The screen does not pretend to provide response-aware feedback.

The user-facing flow is **Learn → Sell Better → Lesson**. Save Better and Manage Stock Better remain visible, but are not yet interactive.

## 3. Content handling

- The preview uses `lesson-catalog.preview.v2.json`, a revised 24-situation UX draft based on the latest working set.
- Four situations are assigned to each of the six learning areas.
- Category labels are tags, not mutually exclusive totals.
- The catalogue currently provides English situation copy only. Hindi and Hinglish wording must be translated and reviewed for meaning and naturalness before learner release.
- Each entry remains a draft; the UI must not label it approved, validated or effective.

## 4. Interaction and accessibility

- Designed mobile-first with readable type, large tap targets, visible focus states, semantic buttons and labelled form controls.
- The three path cards have clear labels and concise descriptions.
- Sell Better opens the lesson directly; Save Better and Manage Stock Better are labelled Coming soon.
- Back navigation returns from the lesson to the three-path Learn screen.
- Long situation text wraps and remains scrollable; no key content is truncated.

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

The final Phase 2 implementation uses three top-level Learn paths and direct Sell Better lesson entry. Source-level checks confirmed the 24-situation internal curriculum structure, the three visible learning-path labels, the Coming soon state for the two unbuilt areas, direct entry into one Sell Better lesson, and back navigation to Learn.

The response field is component state only. It is cleared on exit and is not sent to an API or written to local/cloud storage. The preview route is gated and the non-preview Learn screen is preserved. The branch-scoped preview environment keeps cloud persistence disabled and Supabase URL/key variables blank.

The final preview build and served JavaScript bundle must be checked after the latest UX commit. This validation is not a full device/browser automation run or a shopkeeper usability test. The curriculum remains draft content pending founder, shopkeeper and language/expert review.

## 9. Final information architecture

The shopkeeper-facing Learn screen presents three paths: **Sell Better**, **Save Better** and **Manage Stock Better**. Tapping Sell Better opens one recommended lesson directly. There is no next-practice interstitial, lesson library, search or six-area menu. Save Better and Manage Stock Better are marked Coming soon until their own content and UX are developed.
