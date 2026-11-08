# Sell Better — Phase 1 Curriculum Map

**Status:** Draft curriculum for founder, shopkeeper and subject-matter review  
**Version:** 1.0  
**Lesson data:** `lesson-library.v1.json`  
**Phase 0 foundation:** `../PHASE-0-PRODUCT-FOUNDATION.md`

## 1. Phase 1 outcome

Create a coherent first-release curriculum with 24 distinct short situations: four in each of the six learning areas. Each lesson has one objective, one open-ended prompt, a concise teaching explanation, one takeaway, language drafts, category tags, and explicit guardrails.

This is an authored draft informed by the sources listed in `RESEARCH-NOTES.md`. It is **not** represented as field-validated or expert-approved. The JSON marks every lesson `draft_needs_shopkeeper_and_expert_review`. Do not ship or label it approved until the review steps in section 7 are complete.

## 2. Curriculum map

| ID | Learning area | Lesson | Primary shop context | One idea |
|---|---|---|---|---|
| UC-01 | Understand the Customer | Clarify who the purchase is for and how it will be used | Kirana | Ask about need before recommending |
| UC-02 | Understand the Customer | Find the occasion and practical requirement | Clothing | Understand context before suggesting style |
| UC-03 | Understand the Customer | Discover the customer's actual phone use | Mobile shop | Match features to use |
| UC-04 | Understand the Customer | Balance freshness, quantity and budget | Fruit/vegetable vendor | Understand timing before quantity |
| CO-01 | Communicate Better | Explain two similar-looking options clearly | Clothing | Explain verified differences |
| CO-02 | Communicate Better | Clarify a tailoring request before confirming | Tailoring | Confirm the requested change |
| CO-03 | Communicate Better | Explain a service and its limits | Salon | Set realistic expectations |
| CO-04 | Communicate Better | Explain compatibility before selling a part | Hardware | Verify fit and safety |
| PN-01 | Prices & Negotiations | Respond to a request for a discount | Kirana | Check actual economics before discounting |
| PN-02 | Prices & Negotiations | Handle a competitor price comparison | Mobile shop | Compare like-for-like total offers |
| PN-03 | Prices & Negotiations | Evaluate a bulk-order discount request | Bakery/sweet shop | Check workload and costs |
| PN-04 | Prices & Negotiations | Handle repeated bargaining respectfully | Clothing | State genuine price and offers calmly |
| HO-01 | Hesitation & Objections | Respond when a customer says they will think about it | Mobile shop | Respect the pause |
| HO-02 | Hesitation & Objections | Respond when a customer wants to consult family | Clothing | Support the decision without pressure |
| HO-03 | Hesitation & Objections | Understand a customer's quality concern | Bakery/sweet shop | Verify storage guidance |
| HO-04 | Hesitation & Objections | Understand hesitation about a service | Salon | Explain process and limits |
| CD-01 | Complaints & Difficult Situations | Respond to a complaint about produce quality | Produce/kirana | Listen and check facts |
| CD-02 | Complaints & Difficult Situations | Handle a delayed order honestly | Tailoring | Own the update and give a realistic next step |
| CD-03 | Complaints & Difficult Situations | Handle a compatibility complaint | Mobile shop | Verify model and policy |
| CD-04 | Complaints & Difficult Situations | Respond when a customer is unhappy with a service | Salon | Understand the gap before suggesting a fix |
| LR-01 | Long-Term Customer Relationships | Remember a regular customer's preference respectfully | Kirana | Confirm today's need |
| LR-02 | Long-Term Customer Relationships | Set a clear boundary around customer credit | Kirana/small retail | Clear terms protect both sides |
| LR-03 | Long-Term Customer Relationships | Follow up only when it is useful and welcome | Tailoring/mobile/salon | Use contact details only for agreed purpose |
| LR-04 | Long-Term Customer Relationships | Invite a recommendation without pressure | Clothing/bakery/small retail | Invite; never demand |

## 3. Coverage snapshot

The library deliberately uses multiple independent retail contexts rather than treating every shop as a kirana.

| Category tag | Lessons tagged |
|---|---:|
| Kirana/grocery | 5 |
| Clothing/apparel | 5 |
| Mobile-phone shops | 5 |
| Salons | 4 |
| Tailoring | 3 |
| Bakery/sweet shop | 3 |
| Fruit/vegetable vendors | 2 |
| Hardware | 1 |
| Small retail (cross-category) | 2 |

Counts are tags, not mutually exclusive lesson totals. The category mix is a starting content sample, not evidence of market demand or category importance. The first pilot categories should be selected after short conversations with actual shopkeepers. Do not infer that a category needs more lessons solely from this count.

## 4. Design standards used

- One lesson = one primary teachable idea.
- Situation is short and gives only the facts needed.
- Prompt is open-ended and does not hint at a single scripted answer.
- Feedback guidance recognises trade-offs and multiple reasonable approaches.
- The teaching explanation gives the principle even if the learner's answer is brief.
- The takeaway is one practical reminder, not a guaranteed business outcome.
- Hindi and Hinglish are written as conversational drafts, not formal word-for-word translations.
- Category-specific situations use operational context, not assumptions about the people who shop there.
- Any missing fact that would change the advice must be checked, not invented.

## 5. Content that must not be added by the AI

The AI may not invent:
- Prices, costs, margins, discount limits or profit calculations.
- Product specifications, compatibility, stock, quality or shelf life.
- Warranty, refund, replacement, return or credit policies.
- Legal rights or regulatory requirements.
- A customer's motive, household role, identity or financial situation.
- Service outcomes, completion dates or guaranteed sales/retention results.

If relevant facts are missing, the feedback should say what needs checking or ask one focused clarification. It must not fill gaps with confident-sounding guesses.

## 6. Important coverage gaps

These are deliberate review items, not defects to hide:

1. **Category breadth:** Only nine tags are represented; restaurants, tea stalls, medical stores and several other categories are not yet covered. Medical retail needs a separate high-safety content review before any lesson is authored.
2. **Local language quality:** Hindi and Hinglish need review by native-speaking shopkeepers from different language backgrounds. Marathi and other regional languages are not in this first content draft.
3. **Real-world validation:** The situations are plausible authored examples, not verified transcripts of customer interactions. Replace or refine them using consented, anonymised field observations.
4. **Commercial accuracy:** Discount, credit, returns, tailoring timelines, salon services and hardware compatibility scenarios require practitioner review to ensure advice fits real small-shop constraints.
5. **Accessibility:** Readability, speech transcription quality and low-connectivity behaviour are implementation/test work in later phases.

## 7. Required review before publication

For every lesson, record review evidence and update its review status only after the review actually happens.

### Review A — Shopkeeper reality check
Ask at least one relevant shopkeeper:
- Does this situation happen in your kind of shop?
- Is any important detail missing or unrealistic?
- Would the question make sense in the middle of a busy workday?
- Is the suggested takeaway practical without requiring resources they may not have?

### Review B — Business/practitioner review
Check that the teaching principle does not invent business facts, violate common shop policies, or ignore important cost, safety or operational constraints.

### Review C — Language review
A fluent reviewer checks natural speech, respectful tone, local phrasing and whether the Hindi/Hinglish version preserves the lesson rather than translating mechanically.

### Review D — Safety and fairness review
Check for pressure selling, stereotypes, sensitive personal data, unsupported medical/food-safety/legal claims, and unfair treatment of customers.

### Review E — Learning quality review
Confirm that the question elicits independent thinking, the teaching explanation addresses the objective, and the takeaway is memorable and usable.

Only after all required reviews are recorded may a lesson status change from draft to approved. Keep reviewer identity, date, notes and content version in the review record.

## 8. Phase 1 exit criteria

Phase 1 is ready for founder review when:
- There are 24 unique lesson IDs, four in each learning area.
- Every lesson has all required canonical fields and three language drafts.
- Every lesson has one clear objective and one open-ended prompt.
- No lesson relies on a fixed single correct answer where context can change the decision.
- No lesson asks the learner to disclose real customer personal information.
- Every AI guardrail is explicit enough to guide later feedback generation.
- The category mix and known gaps are transparent.
- The JSON parses and passes the structural checks in the Phase 1 audit report.

**Important:** These criteria establish a complete authored draft. They do not substitute for shopkeeper, language or subject-matter review. Phase 1 content should not be marked field-validated until those reviews are actually performed.

## 9. Next step

Founder reviews the 24-lesson map and content direction. Then collect a small number of anonymised shopkeeper observations and revise the drafts before Phase 2 UX design. Do not start AI integration or claim that the lesson content is validated merely because the JSON is structurally complete.
