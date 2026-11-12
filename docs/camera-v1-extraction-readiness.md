# Dukaan Dost Camera V1 — Extraction Readiness

Status: Phase 0.5 implementation baseline  
Scope: Option A — product names, quantities, quantity units and final item amounts  
Out of scope: full invoice/accounting extraction

## 1. Product behaviour

Camera V1 reads a photograph of a printed bill or handwritten sales list and prepares individual sale rows for shopkeeper review.

For each sale row, the system aims to identify:

- Product or service name, preserving visible brand and variant details.
- Quantity and its unit, when shown.
- Final amount for that item line, in INR.
- Confidence and reasons requiring manual review.

The AI output is untrusted input. The application validates it, presents editable rows, and saves nothing until the shopkeeper explicitly confirms the batch.

## 2. Pricing interpretation

The saved amount is the final amount for one item row, not a unit rate.

| Source text | Expected final item amount | Rule |
| --- | ---: | --- |
| 2 kg Rice @ ₹85/kg | ₹170.00 | Calculate only from an explicit matching rate and quantity |
| 5 soap packets @ ₹20 each | ₹100.00 | Calculate only when “each” is clear |
| Sugar, 2 kg — ₹90 | ₹90.00 | Treat as the written line amount when the layout clearly places it as the item's price |
| Atta: taxable ₹240, GST ₹12, line total ₹252 | ₹252.00 | Use the printed final line total |
| ₹500 beside “10 kg Toor Dal”, with no clear rate/total cue | Unresolved | Set amount to null and require review |

Rules:
- Prefer a clearly printed final line total.
- If only an explicit unit rate is present, calculate quantity × rate only when the rate unit and quantity unit match. The model returns this rate as internal verification evidence; it is not displayed as a separate price or saved in Sales.
- Do not mistake the unit rate, taxable value, subtotal or invoice grand total for an item line amount.
- Do not allocate invoice-level discounts or round-off across rows.
- Preserve paise (two decimal places). Use integer paise for validation and arithmetic.
- Any amount calculated from a per-unit rate must be highlighted for human confirmation, even at high model confidence.
- If the price basis is ambiguous or illegible, do not guess.

## 3. Quantity interpretation

- Extract the quantity and unit as written, including decimal quantities.
- Do not infer quantity 1 when no quantity is printed or written.
- A quantity without a unit, or a unit without a trustworthy quantity, requires review.
- Product pack size and sold quantity must not be conflated. For example, “1 packet, 500 g” is one packet with a 500 g pack size, not 500 packets.
- The later Sales mapping must preserve Dukaan Dost's existing distinction between discrete item count and measured quantity. This Phase 0.5 contract does not dispatch or write SaleEntry records.

## 4. Canonical response contract

The implementation baseline lives in src/camera/extractionContract.ts. The model response uses schemaVersion 1 and an items array. Each row contains:

| Field | Meaning |
| --- | --- |
| productName | Item/service name |
| quantity | Positive number or null |
| quantityUnit | Unit string or null |
| finalAmount | Final INR amount for the row, or null |
| amountSource | printed_line_total, explicit_unit_rate_calculation or uncertain |
| amountCalculation | Internal unit-rate evidence for arithmetic validation; null for printed totals |
| confidence | high, medium or low |
| needsReview | Model's review signal; application rules can override it |
| reviewReasons | Human-readable reasons to inspect or correct the row |

The model also returns amountCalculation as ephemeral evidence only when a final amount is calculated from an explicit unit rate. The application independently recomputes quantity × rate in paise, checks that the rate unit matches the quantity unit, and flags any mismatch. This evidence is not shown as a separate price field and is not persisted in SaleEntry. The application adds sourceIndex and finalAmountPaise during validation; those are also not model-generated fields and are not persisted sale fields.

Every uncertain or incomplete row must stay visible in the review list. A malformed individual row is converted into an editable placeholder with mandatory review rather than being silently dropped. An invalid top-level response blocks review and saving.

## 5. Prompt policy

The model-independent prompt is in src/camera/extractionPrompt.ts. It instructs the model to:
- Read English, Hindi, Hinglish and Devanagari numerals.
- Preserve individual product identities, names and variants.
- Extract only sale line items and the essential V1 fields.
- Distinguish final item amounts from per-unit rates and invoice totals.
- Calculate only from an explicit matching unit rate and quantity.
- Flag illegible or ambiguous values instead of guessing.
- Return structured JSON only.

Do not add GST breakdowns, customer identity, supplier identity, invoice metadata, HSN codes, tax calculations or payment-method inference to V1.

## 6. Test corpus preparation

Create 40 permissioned or synthetic sample documents and retain the original images outside the source repository:

| Group | Count | Coverage |
| --- | ---: | --- |
| Printed invoices | 10 | Clear printed item rows, tax-inclusive line totals, varied columns |
| Handwritten lists | 10 | Informal layouts, prices aligned to the right, mixed handwriting quality |
| Hindi/Hinglish | 10 | Hindi, Devanagari numbers, Romanised Hindi and mixed terms |
| Difficult/ambiguous | 10 | Dense rows, faint but readable writing, overwritten entries, rate-vs-total ambiguity |

For each image, create a human-verified ground-truth record with:
- document ID, document type, language and image filename;
- row index;
- exact expected product name;
- expected quantity and unit, or null;
- expected final item amount in INR, or null;
- whether the row must be flagged for review;
- a short note explaining ambiguity or special layout behaviour.

Do not commit real customer invoices to GitHub. Use synthetic or explicitly permissioned, anonymised material. Remove or crop customer names, phone numbers, addresses, GSTINs and other unnecessary personal data before a sample is sent to an external vision provider.

Suggested ground-truth CSV columns:

document_id,document_type,language,image_filename,row_index,expected_product_name,expected_quantity,expected_unit,expected_final_amount_inr,expected_needs_review,notes

## 7. Vision-model benchmark

Run at least two eligible vision-model configurations against the same 40 images and the same ground truth. Record:

- exact product-name match and whether brand/variant identity was preserved;
- quantity and unit exact match;
- final amount exact match to paise;
- rate-vs-line-total mistakes;
- ambiguous/illegible rows correctly flagged;
- rows omitted or hallucinated;
- end-to-end response time;
- image-processing and inference cost per document.

Do not choose a model based on a handful of attractive demos. The first benchmark is a screening exercise, not proof of production reliability.

Proposed pilot release gates:
1. Every row accepted without review must have the correct product, quantity/unit where present, and exact final amount.
2. Any uncertain, illegible, incomplete or low/medium-confidence row must be flagged.
3. No subtotal, grand total, unit rate or invoice-level adjustment may be silently saved as an item amount.
4. Every amount calculated from a per-unit rate must be highlighted for human confirmation.
5. The 60+ row stress test must preserve all rows through validation and review.
6. The chosen model's privacy terms, data-retention behaviour, rate limits and cost must be checked before real shopkeeper invoices are sent.

These gates intentionally prioritise trust over auto-acceptance. Review may be required for many rows in the first release.

## 8. Privacy and cost checks

Before real customer images are processed:
- Verify the exact API project/tier and applicable data-use terms; do not infer the tier from the key's existence.

Provider-specific finding checked on 12 November 2026: Google's Gemini Developer API pricing page marks Free-tier submitted content as used to improve Google products, while Paid-tier submitted content is marked as not used for product improvement. This does not reveal which tier Dukaan Dost's existing key belongs to. Until the exact project's tier and current terms are verified, use only synthetic or appropriately anonymised/permissioned samples; do not send real shopkeeper invoices containing customer information through an unverified free-tier project. Reference: https://ai.google.dev/gemini-api/docs/pricing
- Do not send unredacted customer data to a provider tier whose terms allow submitted content to be used for product improvement.
- Show a clear disclosure before image upload, naming the external provider and purpose.
- Authenticate the shop session on the server-side extraction endpoint.
- Keep provider credentials server-side.
- Do not store original images in the app database, browser cache or object storage by default.
- Enforce file-size and image-dimension limits and delete temporary data after processing.
- Avoid paid model tiers or infrastructure without an explicit cost review and approval.

## 9. Phase 0.5 completion checklist

- [x] Lock Option A scope and non-goals.
- [x] Add canonical response contract.
- [x] Add model-independent extraction instructions.
- [x] Add deterministic row validation and paise conversion.
- [x] Add Node tests, including 65-row support, uncertainty handling, calculated-amount arithmetic validation and mandatory review of calculated amounts.
- [ ] Prepare the 40-image permissioned/synthetic benchmark corpus.
- [ ] Verify current Gemini API project/tier and data handling.
- [ ] Benchmark at least two vision-model configurations.
- [ ] Approve one model and its cost/privacy posture.

Phase 1 should begin only after the remaining data and provider checks are complete. It will add the camera experience and secure extraction endpoint without changing the current voice pipeline.
