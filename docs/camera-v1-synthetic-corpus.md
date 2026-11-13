# Dukaan Dost Camera V1 — Synthetic benchmark corpus

Status: generated and locally checksum-verified  
Dataset: 40 documents, 263 labelled item rows  
Safety: fictional content only; no real shop, customer, supplier or invoice data

## Contents

- P01–P10: 10 printed sample invoices.
- H01–H10: 10 handwriting-style informal sales lists.
- L01–L10: 10 Hindi/Devanagari and mixed-language lists.
- D01–D10: 10 difficult cases, including ambiguous amount basis, decimal amounts, invoice-level discount, explicit unit-rate calculation, pack size vs sold quantity, missing quantity, overwritten amount and a 65-row stress list.

D10 contains 65 separate rows. The complete dataset contains 263 labelled item rows.

## Important limitations

1. H-series documents use an italic typeface and layout jitter. They are not genuine human handwriting. They can test informal layout reading and slanted text, but cannot establish performance on real handwriting. A later pilot needs permissioned examples written by actual shopkeepers.
2. L-series uses typeset Devanagari and mixed-language text. It does not cover all Indian languages or regional handwriting.
3. D-series contains deliberately selected edge cases. It is not a statistically representative sample of Indian invoices.
4. This synthetic engineering fixture is not evidence that any model is accurate or production-ready.

## Ground truth

- ground-truth.json contains row-level labels and an SHA-256 checksum for each image.
- manifest.csv maps each document ID to its PNG path and the same checksum.
- finalAmountPaise is an integer number of paise. Null means the source does not establish a reliable final line amount.
- needsReview=true marks incomplete, uncertain, overwritten or calculated information that must be confirmed by a shopkeeper.
- For an explicitly shown unit rate with a matching quantity, ground truth records the mathematically calculated total but still requires human confirmation.

## Generate locally

Requires Python 3.10+, Pillow, DejaVu fonts and Noto Sans Devanagari fonts.

    python -m pip install -r requirements-camera-benchmark.txt
    python scripts/generate-camera-v1-corpus.py

The default output is private-benchmark/camera-v1-synthetic-corpus/, containing images/, ground-truth.json, manifest.csv and README.md.

To replace an existing generated corpus:

    python scripts/generate-camera-v1-corpus.py --force

To verify image count and all SHA-256 hashes:

    python scripts/generate-camera-v1-corpus.py --verify

Run all corpus metadata checks:

    npm run test:camera-corpus

Generated images and labels stay outside the source repository under the git-ignored private-benchmark/ directory. No API key or provider connection is required, and no AI model is called. Follow the separate provider eligibility, privacy and data-use gate before any external model evaluation.
