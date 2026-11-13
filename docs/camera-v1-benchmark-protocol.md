# Camera V1 — Offline benchmark protocol

## Synthetic corpus

The repository includes scripts/generate-camera-v1-corpus.py. Install Pillow, then run:

    python -m pip install -r requirements-camera-benchmark.txt
    python scripts/generate-camera-v1-corpus.py
    python scripts/generate-camera-v1-corpus.py --verify
    npm run test:camera-corpus

Default output is private-benchmark/camera-v1-synthetic-corpus/. It contains 40 PNG documents, manifest.csv and ground-truth.json. The generated data is ignored by Git and is not uploaded to an external service by the generator.

Composition:
- P01–P10: printed invoices.
- H01–H10: handwriting-style italic typeface examples. These are simulated and are not genuine handwriting.
- L01–L10: typeset Hindi/Devanagari and mixed-language examples.
- D01–D10: difficult examples, including price-basis ambiguity, missing quantity, overwritten amount, discount/totals, decimal paise, explicit rate calculation and D10 with 65 rows.

There are 263 labelled item rows. Synthetic results are not production evidence. Add permissioned real handwriting from consenting shopkeepers before drawing conclusions about real-world handwriting performance.

## Ground truth and image integrity

Each generated document has documentId, documentType, language, imageSha256 and its complete row-level items. Each item has rowIndex, productName, quantity, quantityUnit, finalAmountPaise, needsReview and a note for the expected interpretation.

The manifest maps each ID to its PNG and matching SHA-256. The generator's --verify option checks all image hashes, document counts and manifest mappings.

## Provider and privacy gates

Do not use an external model until provider eligibility, account ownership, project tier, current data-use terms and retention settings have been confirmed by an authorised project operator. The synthetic corpus is safe for local development but does not override any provider's access terms. Do not use real shopkeeper invoices in an unverified provider project.

## Model result export

Use docs/camera-v1-benchmark-results.template.json. Export one result file per exact model/configuration. Required top-level fields:
- schemaVersion: 1
- provider: provider name
- model: exact model ID
- configuration: prompt version, image detail/resolution and generation settings
- documents: one object for each submitted document

Each result document contains documentId, items in source reading order, latencyMs if measured, and estimatedCostUsd if measurable from the provider usage response and current published pricing. Each item includes productName, quantity, quantityUnit, finalAmount in INR and needsReview.

Do not invent token usage or cost values. Leave optional measurements absent when unavailable.

## Scoring

Run the offline scorer against the generated ground truth:

    npm run camera:benchmark -- --ground-truth ./private-benchmark/camera-v1-synthetic-corpus/ground-truth.json --results ./private-benchmark/model-a.json --results ./private-benchmark/model-b.json --strict

The scorer reports product names, quantities, units, exact paise amounts, row recall/precision, omissions, extra predictions, review flags, unsafe accepted rows, latency and supplied costs. It reports each document category separately so strong printed performance cannot hide weak simulated-handwriting or Devanagari performance.

Proposed screening gates include at least 98% overall row recall and final-amount accuracy, at least 95% overall name, quantity/unit and fully-correct-row accuracy, at least 90% performance for each key metric in each category, no unsafe accepted rows and all expected uncertain rows flagged. These are screening targets, not measured results or production guarantees. A synthetic-only pass does not approve production release.
