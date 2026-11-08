# Sell Better — Phase 0 Product Foundation

**Status:** Phase 0 specification drafted; pending founder review  
**Product:** Dukaan Dost — Sell Better  
**Branch:** `feature/sales-customer-handling-coach`  
**Scope:** Documentation only. No application code, database, production configuration, or production data changed.

## 1. Product definition

Sell Better is a short, practical, personalised learning experience that helps Indian independent shopkeepers understand customers, communicate clearly, make sound selling decisions, resolve difficult situations, and build long-term trust.

**Product promise:** Understand people. Build trust. Grow your dukaan.

**Learning loop:** Think → Respond → Discover → Apply.

Sell Better is not a conventional course, a chatbot, an exam, or a customer-roleplay simulator. Its primary job is to help a shopkeeper think through a realistic situation, articulate their own reasoning, receive a useful explanation, and leave with one idea they can apply.

## 2. Target users and context

- Independent Indian shopkeepers and small local-business operators.
- Mobile-first, with ordinary Android phones as the primary design target; retain compatibility with iOS and desktop.
- Users may have limited time, variable connectivity, different levels of digital confidence, and different literacy preferences.
- Use plain, conversational language and familiar business situations.
- Initial language scope: English, Hindi, and natural Hinglish. Language coverage must be content-reviewed, not merely machine-translated.
- Initial shop-category coverage should represent varied independent businesses. Candidate categories include kirana/grocery, clothing, mobile shops, salons, bakeries/sweet shops, tailoring, hardware, fruit and vegetable shops, tea stalls and small restaurants. Prioritisation must be validated with shopkeepers; this list is not a claim that all categories are ready at launch.

Do not stereotype customers or shopkeepers based on region, gender, age, language, religion, or community. Adapt examples to shop context and observed needs, not demographic assumptions.

## 3. Learning principles — non-negotiable

1. The shopkeeper thinks independently before seeing the teaching explanation.
2. Responses are open-ended. No MCQ, forced choice, or “pick the correct answer” flow.
3. Each activity teaches one primary idea.
4. A good answer may have multiple reasonable approaches. Feedback must account for context and trade-offs rather than enforce one script.
5. Feedback responds to what the shopkeeper actually wrote or said. No generic praise or canned feedback.
6. Explain what was considered well, what important factor may be missing, and why it matters — only where supported by the answer and lesson guide.
7. Every activity ends with one practical, memorable takeaway.
8. Use concise copy and few interactions. Avoid unnecessary screens, menus, reading, or repeated navigation.
9. No grades, marks, public leaderboards, competitive rankings, pressure mechanics, or childish gamification.
10. Teach ethical selling: understand needs, explain honestly, respect a customer's decision, and protect the shop's legitimate interests without manipulation or pressure.
11. Never invent stock, product specifications, warranty terms, return policies, discounts, prices, margins, customer history, or business facts.
12. Do not treat a single answer as proof of a stable strength, weakness, or mastery.

## 4. First-release learning areas

The first release is organised into six learning areas. These are content groupings, not six separate courses or mandatory sequential levels.

| Learning area | Intended learning |
|---|---|
| Understand the Customer | Identify needs, context, uncertainty, and buying considerations by listening and asking useful questions. |
| Communicate Better | Explain products and differences clearly, listen actively, and make relevant recommendations. |
| Handle Prices and Negotiations | Respond to bargaining and comparisons while considering cost, margin, quantity, repeat business, and fairness. |
| Handle Hesitation and Objections | Understand uncertainty, value concerns, comparison, and delayed decisions without pressuring the customer. |
| Handle Complaints and Difficult Situations | Listen, clarify facts, acknowledge concerns, and resolve issues within the shop's actual policies and capabilities. |
| Build Long-Term Customer Relationships | Build trust, serve regular customers consistently, handle recommendations and credit-related conversations responsibly. |

### Initial content target

- Target: 24 carefully authored situations, four per learning area.
- This is a content target, not a reason to publish weak or repetitive lessons. If quality review shows that fewer are ready, release fewer.
- Situations should be drawn from real, anonymised shopkeeper experiences and reviewed for business accuracy.
- Include varied business contexts across the library; do not make every situation a kirana example.
- Avoid repeating the same principle with only names or product nouns changed.

## 5. Canonical lesson specification

Every lesson must be stored as structured, versioned content with the following fields:

| Field | Requirement |
|---|---|
| Lesson ID and version | Stable unique ID and explicit content version. |
| Learning area | One of the six approved areas. |
| Applicable shop categories | Explicit list; use a general tag only when genuinely applicable. |
| Situation | Short, realistic, self-contained context; normally 1–3 sentences. |
| Customer context | Only facts stated in the situation; no invented hidden motives. |
| Thinking prompt | One clear open-ended question. |
| Learning objective | One observable idea the activity is intended to teach. |
| Key principle | The central business/communication principle. |
| Considerations | Relevant factors and trade-offs that may support a sound answer. |
| Common blind spots | Plausible omissions, not predetermined diagnoses of the learner. |
| Teaching explanation | Concise, plain-language explanation. |
| Practical takeaway | One memorable action or idea. |
| Safety and accuracy boundaries | Claims, advice, or assumptions the feedback must avoid. |
| Language versions | Reviewed English, Hindi and Hinglish copy, with meaning preserved. |
| Review metadata | Author/reviewer, review status, and last-reviewed date. |

A lesson is not publishable until its situation, question, objective, explanation, takeaway, language, and safety boundaries have been reviewed together.

## 6. Core learner experience

The preferred experience is one continuous lesson screen, not a chain of separate wizard pages.

1. **Situation:** Show one short, recognisable shop situation.
2. **Think:** Ask one open-ended question.
3. **Respond:** Let the shopkeeper type or use speech input. They can review and edit the transcript before submission.
4. **Discover:** Reveal a concise teaching explanation and, when available, contextual feedback based on the submitted answer.
5. **Apply:** End with one memorable takeaway and a clear, low-friction path to the next relevant situation.

The exact visual layout is a Phase 2 design decision. The product requirement is the simple continuous flow, not a predetermined visual treatment.

### Interaction requirements

- Voice input is an alternative input method, not a requirement.
- Preserve the existing app's voice behaviour unless a specific, tested change is necessary.
- Do not change voice selection, voice quality, or unrelated speech behaviour as part of Sell Better.
- Provide optional read-aloud for the situation and teaching explanation where supported.
- Clearly indicate listening, transcription, submission, and error states.
- Prevent accidental duplicate submissions and preserve a draft through recoverable interruptions where feasible.
- Do not require users to disclose real customer names, phone numbers, account details, or other identifying information.

## 7. Personalised feedback contract

AI personalisation is an enhancement to the reviewed lesson, not the source of the curriculum.

### Inputs allowed

- The approved lesson and its version.
- The shopkeeper's submitted response.
- The shop category and selected language, when available and relevant.
- Minimal prior learning evidence, only when the learner has consented to the relevant data use and the evidence materially helps the response.

### Required behaviour

- Refer to the actual response and the lesson's objective.
- Recognise reasonable reasoning without reflexive praise.
- Surface a relevant missing consideration when there is evidence for it.
- Explain the business principle in plain, concise language.
- Respect multiple valid approaches and contextual trade-offs.
- Do not claim to know the customer's real intention or the shop's actual economics unless provided.
- Do not infer a skill profile from one answer.
- Do not fabricate facts, policies, prices, margins, stock, product quality, or outcomes.
- Never recommend deception, coercion, discriminatory treatment, false scarcity, or pressure selling.

### Output shape

The response may naturally cover:
- What the learner considered.
- What else may be worth considering.
- Why that consideration matters.
- One practical takeaway.

These are guidance elements, not four mandatory headings. Keep the response short and natural. If the answer is unclear or too brief to assess, ask at most one focused clarification or provide the approved general teaching explanation without pretending to have analysed more than was supplied.

### Fallback

The prewritten teaching explanation and takeaway must work without AI. If the AI service is unavailable, show the approved lesson content and clearly indicate that personalised feedback could not be generated. Never present fallback copy as AI analysis.

## 8. Learning history and personalisation boundaries

- Track completed lesson IDs/versions and minimal evidence needed to support continuity.
- Skill signals must be evidence-based and accumulated across multiple relevant responses.
- Distinguish “not observed yet” from “needs practice.”
- Do not label a learner as weak, poor, expert, or mastered based on a single answer.
- Recommendations should explain themselves in simple language and remain optional.
- Learners should be free to explore any available learning area.
- Revisit a previously taught principle in a changed situation (“Think Again”) only after the core experience is proven; this is not required for the first working prototype.
- Do not create public profiles, leaderboards, or social comparisons.

## 9. Privacy, safety, and business-advice boundaries

- Collect the minimum data necessary to provide the learning experience.
- Do not record or retain raw microphone audio for learning analytics. Process speech into text using the approved speech mechanism and disclose relevant processing.
- Do not ask for real customer personal data. Encourage anonymised or fictional examples.
- Keep learner responses and learning history private to the authenticated account/workspace, with access controls and row-level isolation verified before cloud persistence is enabled.
- Define retention, deletion, export, and consent behaviour before storing learner responses in a hosted database.
- Keep AI credentials server-side. Never expose secret keys in browser code or client bundles.
- Validate request size, input shape, output schema, timeouts, rate limits, and errors.
- Treat AI output as untrusted until validated against the lesson constraints.
- Medical/health, legal, tax, investment, and other regulated or high-stakes advice are outside Sell Better's scope. Medical-shop examples must not generate diagnosis, prescription, or treatment guidance.
- For refunds, replacements, warranties, credit, and complaints, never invent legal entitlements or shop policies. Ask the shopkeeper to follow applicable law and their actual stated policy; recommend qualified advice where needed.
- Do not make guaranteed claims about increased sales, profit, or customer retention.

## 10. First-release exclusions

The following are deliberately outside the first release unless separately approved:

- AI customer role-play or simulated multi-turn customer conversations.
- Ten customer archetype rotation or personality classification.
- Traditional courses, long articles, video libraries, quizzes, or exams.
- MCQs and forced-choice learning.
- Marks, grades, public leaderboards, competitive rankings, and pressure-based streaks.
- Complex levels, badges, or reward economies.
- AI-generated curriculum or unreviewed lessons.
- Large-scale regional language rollout before quality review.
- Audio storage or voice analytics.
- Paid infrastructure or paid API provisioning without explicit approval.
- Any changes to unrelated Dukaan Dost features.

## 11. Technical and repository boundaries

- All Sell Better development remains on `feature/sales-customer-handling-coach` until the founder explicitly approves a different branch or merge.
- Do not commit to or modify `main` as part of this work.
- Do not deploy to production or change production environment variables.
- Do not read from, write to, migrate, pause, delete, or otherwise alter the production Dukaan Dost or Highway Speedster Supabase projects.
- The existing preview is UI-only and must remain disconnected from production Supabase.
- The current branch configuration has `VITE_SALES_COACH_UI_PREVIEW=true`, `VITE_COACH_CLOUD_ENABLED=false`, and empty branch-scoped Supabase environment values. Keep these isolation controls until a separate, explicitly approved development data environment exists.
- Do not provision paid services, upgrade plans, or incur API/hosting costs without explicit approval.
- Reuse existing utilities only after reviewing their behaviour and tests. Do not carry forward the legacy Coach flow, data model, customer simulation, or milestone mechanics by default.
- Keep unrelated Home, Ask, Notebook, sales, expense, udhaar, authentication, and voice behaviour unchanged.

## 12. Quality gates and definition of done

A phase is not complete merely because the code compiles.

### Product gate
- The feature matches the approved product definition and does not reintroduce excluded mechanics.
- The lesson is understandable without a tutorial.
- The learner can complete the activity with minimal reading and navigation.

### Content/learning gate
- The situation is realistic and factually reviewed.
- The prompt elicits independent reasoning.
- The explanation teaches the stated objective.
- More than one reasonable answer is handled fairly where applicable.
- The takeaway is actionable without inventing business facts.

### Technical gate
- TypeScript and production build pass.
- Relevant automated tests pass.
- Error, timeout, retry, duplicate-submit, and offline/fallback states are tested.
- Existing app regression checks pass.
- Privacy, access control, and environment isolation are verified before real learner data is stored.
- Preview deployment is confirmed to use the intended development branch and isolated environment.

### Phase 0 exit criteria
Phase 0 is complete when:
1. This specification is reviewed and approved by the founder.
2. Product principles, initial six learning areas, and exclusions are accepted.
3. The first-release target and category-prioritisation approach are agreed.
4. The lesson schema and feedback contract are accepted.
5. Technical isolation and no-paid-work boundaries are confirmed.
6. Any remaining founder decisions are explicitly recorded rather than silently assumed.

## 13. Decisions intentionally deferred

These must be decided with evidence in later phases, not guessed during Phase 0:

- Exact first six shop categories for the pilot cohort.
- The final 24 lesson topics and their order.
- Exact screen layout, typography, and visual styling.
- Whether the initial pilot stores responses locally or in an isolated development database.
- AI provider/model and budget limits; no provider is approved by this document.
- Exact response-length limits after prototype testing.
- Retention and deletion schedule, consent copy, and production data model.
- Pilot recruitment, language mix, and success thresholds.

## 14. Immediate next phase

After founder approval, Phase 1 creates the reviewed knowledge foundation: lesson-topic map, research/observation notes, category coverage, and the first set of complete lesson records. Do not begin AI integration or build a large UI before the first lessons meet the content quality gate.
