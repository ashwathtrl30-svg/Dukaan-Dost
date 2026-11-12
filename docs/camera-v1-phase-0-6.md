# Dukaan Dost Camera V1 — Phase 0.6

Status: Offline benchmark tooling implemented; provider and data gates remain pending.  
Date reviewed: 12 November 2026  
Scope: Prepare a reproducible, provider-neutral evaluation process before Phase 1.

## Executive decision

Do not connect the camera to a live model yet. Phase 0.6 first establishes a trustworthy evaluation process and checks that any provider can legally and appropriately be used by the responsible project operator.

The Phase 0.6 code in this change is deliberately offline:
- It reads human-labelled JSON and model-result JSON.
- It calculates extraction metrics and safety-gate results.
- It does not call Gemini, OpenAI, Anthropic or any other provider.
- It does not read or upload image files.
- It does not need an API key, paid account, new database, storage bucket or production setting.

## Important provider eligibility gate

The Gemini API Additional Terms page retrieved on 12 November 2026 states:
- Minimum age: the person using Gemini API / Google AI Studio must be at least 18.
- It also restricts use in API clients directed to, or likely to be accessed by, people under 18.

The current project contributor is under 18. They must not create, operate or personally use a Gemini API account or run provider tests that would violate the provider's age terms. Do not falsify age, borrow/share another person's credentials, or route around access restrictions.

Before any external model test, an eligible adult with genuine responsibility and authority for Dukaan Dost must independently review the current provider terms, account ownership, API-client audience restrictions and whether the planned use is permitted. Adult involvement is not an automatic waiver of any provider restriction. If the project is not eligible, do not use that provider.

The current Gemini pricing documentation also distinguishes data use:
- Free tier: submitted content may be used to improve Google's products.
- Paid tier: submitted content is not used to improve Google's products.

The exact tier and settings of the existing Dukaan Dost project remain unverified. No real shopkeeper invoice may be sent until the responsible operator has verified the exact project, tier, data terms, logging/retention settings and user disclosure requirements.

References checked 12 November 2026:
- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms
- Gemini Developer API pricing and tier data-use table: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API logging policy: https://ai.google.dev/gemini-api/docs/logs-policy
- OpenAI Services Agreement (business/API): https://openai.com/policies/services-agreement/
- Anthropic legal terms index: https://www.anthropic.com/legal

Provider terms can change. Re-check the current primary terms at the time of any future evaluation.

## What has been built

1. scripts/camera-v1-benchmark.mjs
   - Local JSON-only scorer; no network or provider dependency.
   - Supports more than one model-result file in a single comparison.
   - Scores product names, quantity, units, quantity+unit, exact paise amounts, review decisions, row recall/precision, missing/extra rows and documents.
   - Tracks ambiguous rows that were not flagged for review as unsafe accepted rows.
   - Tracks latency and per-document estimated cost when supplied.
   - Optional --strict mode enforces screening gates and returns a non-zero exit code on failure.

2. scripts/camera-v1-benchmark.test.mjs
   - Synthetic fixtures only; clearly not model benchmark evidence.
   - Tests correct scoring, unit aliases, paise precision, missing/extra rows, unsafe accepted rows, duplicate/unexpected documents, latency/cost and invalid ground truth.

3. Updated corpus manifest
   - One record per document, not one record per sale line.
   - Ground-truth rows are captured separately in JSON so a document with many item rows is represented correctly.

4. CI integration
   - The offline benchmark scorer tests run in GitHub Actions.
   - No provider calls are made in CI.

## What remains before any model benchmark

- [ ] An eligible adult project operator has confirmed provider eligibility and account ownership.
- [ ] The exact provider/project/tier and current data-processing terms have been reviewed.
- [ ] A disclosure and retention plan is approved for permitted images.
- [ ] The 40 synthetic or explicitly permissioned documents have been assembled outside the Git repository.
- [ ] Each document has complete, independently human-verified row-level ground truth.
- [ ] The same corpus and exact prompt are used for every eligible model configuration.
- [ ] Each exported result file records provider, exact model ID, configuration, latency and estimated cost.
- [ ] Benchmark reports meet the screening criteria before a model is selected.

## Phase 0.6 exit criteria

Phase 0.6 is complete only when provider eligibility/privacy is cleared, the corpus is labelled, at least two eligible model configurations have been run under the same protocol, and the comparison has been reviewed.

Until then, do not start Phase 1's live image endpoint or send real shopkeeper invoices to a model.
