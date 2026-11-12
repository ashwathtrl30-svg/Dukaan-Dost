# Camera V1 — Offline benchmark protocol

## Purpose

Compare eligible image-understanding configurations on the same permissioned/synthetic Indian shop-document corpus. The benchmark is a screening exercise, not proof of production reliability.

## Privacy and handling rules

- Store image files outside the Git repository and outside public links.
- Use synthetic documents wherever possible. Otherwise obtain explicit permission and anonymise/crop unrelated personal data before any permitted provider submission.
- Never commit real customer invoices, names, phone numbers, addresses, GSTINs, account numbers or other personal data.
- Do not use any external model until provider eligibility, account ownership, tier, data-use terms and retention settings have been confirmed by an authorised adult project operator.
- The scoring script never reads images or makes network requests. It only reads JSON ground truth and JSON model-result exports.

## Corpus composition

Use 40 documents:
- P01–P10: printed invoices.
- H01–H10: handwritten sales lists.
- L01–L10: Hindi/Hinglish/mixed language and Devanagari numerals.
- D01–D10: difficult, dense or ambiguous documents.

docs/camera-v1-test-corpus-template.csv is a document-level manifest. The actual image paths and hashes remain local. Do not put the images in this repository.

## Human ground truth

Use docs/camera-v1-benchmark-ground-truth.template.json as the starting point. For each document:
- documentId must match the manifest.
- imageSha256 identifies the exact local image used by every model run.
- items must contain every genuine sale row in the document, in visual reading order.
- rowIndex values must be positive and strictly increasing.
- finalAmountPaise is an integer in paise, or null where the final row amount is genuinely unknown/ambiguous.
- needsReview must be true whenever a reasonable shopkeeper should verify an unreadable, incomplete or ambiguous value.

Two people should independently label difficult/ambiguous rows where practical, then reconcile disagreements before the dataset is used.

## Model result export

Use docs/camera-v1-benchmark-results.template.json. Export one result file per exact model/configuration. Required top-level fields:
- schemaVersion: 1
- provider: provider name
- model: exact model ID, not a marketing family name
- configuration: prompt/version, image detail/resolution and generation settings
- documents: one object for each submitted document

Each result document contains:
- documentId
- items, in the same reading order as the source
- latencyMs, if measured
- estimatedCostUsd, if measurable from the provider's usage response and current published price

Each item uses the Camera V1 canonical fields relevant to scoring:
- productName
- quantity (number or null)
- quantityUnit (string or null)
- finalAmount (INR number or null)
- needsReview (boolean)

Do not invent token usage or cost figures. Leave optional values absent when unavailable. Model confidence is not treated as proof of correctness.

## Run the scorer

With Node.js 22 or later:

    npm run test:camera-benchmark

Score one run:

    npm run camera:benchmark -- --ground-truth ./private-benchmark/ground-truth.json --results ./private-benchmark/gemini-run.json --out ./private-benchmark/gemini-report.json

Compare two eligible model runs in one report:

    npm run camera:benchmark -- --ground-truth ./private-benchmark/ground-truth.json --results ./private-benchmark/model-a.json --results ./private-benchmark/model-b.json --out ./private-benchmark/comparison.json

Apply the screening gates and return a failing process code when a gate is missed:

    npm run camera:benchmark -- --ground-truth ./private-benchmark/ground-truth.json --results ./private-benchmark/model-a.json --results ./private-benchmark/model-b.json --strict

Keep ground-truth and result files in a private local directory. Do not commit them when they contain private image paths, private notes or business data.

## Metrics

- rowRecall: returned rows aligned to expected source rows / expected rows.
- rowPrecision: aligned rows / all returned rows.
- productNameAccuracy: exact normalized product-name matches / expected rows.
- quantityAccuracy: exact quantity matches / expected rows.
- unitAccuracy: normalized unit matches / expected rows.
- quantityUnitAccuracy: quantity and unit both match / expected rows.
- finalAmountAccuracy: exact integer-paise match / expected rows. Null must match null.
- reviewFlagRecall: proportion of expected-review rows correctly flagged by the model.
- fullyCorrectRowAccuracy: product, quantity, unit, amount and review decision all exact / expected rows.
- unsafeAcceptedRows: rows marked as not needing review despite an expected review requirement or an incorrect core field. Extra unreviewed rows also count as unsafe.
- omittedRows and extraRows: row-count mismatches.
- averageLatencyMs, totalEstimatedCostUsd, averageEstimatedCostUsd: reported only from supplied measurements.

The scorer aligns output rows by source reading order. That is intentional: V1 should preserve row order so omissions and row shifts are visible. If a provider reorders rows, the benchmark should not silently hide that defect by matching on amounts or names.

## Screening gates

The current proposed gates are:
- All expected documents returned; no duplicate or unexpected documents.
- Row recall >= 98%.
- Product-name accuracy >= 95%.
- Quantity+unit accuracy >= 95%.
- Final amount accuracy >= 98%.
- Fully correct row accuracy >= 95%.
- No unsafe accepted rows.
- All expected ambiguous/uncertain rows flagged for review.

These are screening targets, not measured results or guarantees. Report each document type separately during human review; a high aggregate score must not hide poor handwriting or Hindi/Hinglish performance. Any dangerous error pattern blocks release regardless of the aggregate score.
