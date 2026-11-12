import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseGates, rupeesToPaise, scoreRun } from './camera-v1-benchmark.mjs';

const groundTruth = {
  schemaVersion: 1,
  datasetId: 'test-fixture-not-real-benchmark-data',
  documents: [{
    documentId: 'P01',
    documentType: 'printed_invoice',
    language: 'en',
    items: [
      { rowIndex: 1, productName: 'Rice', quantity: 2, quantityUnit: 'kg', finalAmountPaise: 17000, needsReview: false },
      { rowIndex: 2, productName: 'Soap', quantity: 5, quantityUnit: 'packet', finalAmountPaise: 10000, needsReview: false },
      { rowIndex: 3, productName: 'Toor Dal', quantity: 10, quantityUnit: 'kg', finalAmountPaise: null, needsReview: true },
    ],
  }],
};

function result(items) {
  return {
    schemaVersion: 1,
    provider: 'test-provider',
    model: 'fixture-model',
    configuration: 'synthetic-test-fixture',
    documents: [{ documentId: 'P01', latencyMs: 1000, estimatedCostUsd: 0.001, items }],
  };
}
const perfectItems = [
  { productName: 'Rice', quantity: 2, quantityUnit: 'kg', finalAmount: 170, needsReview: false },
  { productName: 'Soap', quantity: 5, quantityUnit: 'packets', finalAmount: 100, needsReview: false },
  { productName: 'Toor Dal', quantity: 10, quantityUnit: 'kilograms', finalAmount: null, needsReview: true },
];

test('scores exact rows, unit aliases, paise amounts and review flags', () => {
  const scored = scoreRun(groundTruth, result(perfectItems));
  assert.equal(scored.summary.productNameAccuracy, 1);
  assert.equal(scored.summary.quantityUnitAccuracy, 1);
  assert.equal(scored.summary.finalAmountAccuracy, 1);
  assert.equal(scored.summary.reviewFlagRecall, 1);
  assert.equal(scored.summary.fullyCorrectRowAccuracy, 1);
  assert.equal(scored.summary.unsafeAcceptedRows, 0);
  assert.equal(evaluateReleaseGates(scored).passed, true);
});

test('does not round a prediction with more than two meaningful decimals', () => {
  assert.equal(rupeesToPaise(136.5), 13650);
  assert.equal(rupeesToPaise(136.501), '__invalid__');
  const items = perfectItems.map(item => ({ ...item }));
  items[0].finalAmount = 170.001;
  const scored = scoreRun(groundTruth, result(items));
  assert.equal(scored.summary.finalAmountAccuracy, 0.666667);
  assert.equal(scored.summary.unsafeAcceptedRows, 1);
});

test('counts omitted and extra rows without hiding them in field accuracy', () => {
  const scored = scoreRun(groundTruth, result([
    perfectItems[0], perfectItems[1],
    { productName: 'Extra', quantity: 1, quantityUnit: 'piece', finalAmount: 10, needsReview: true },
  ]));
  assert.equal(scored.summary.omittedRows, 1);
  assert.equal(scored.summary.extraRows, 1);
  assert.equal(scored.summary.rowRecall, 0.666667);
  assert.equal(scored.summary.unsafeAcceptedRows, 0);
});

test('counts an unflagged ambiguous row as unsafe acceptance', () => {
  const items = perfectItems.map(item => ({ ...item }));
  items[2].needsReview = false;
  const scored = scoreRun(groundTruth, result(items));
  assert.equal(scored.summary.reviewFlagRecall, 0);
  assert.equal(scored.summary.unsafeAcceptedRows, 1);
  assert.equal(evaluateReleaseGates(scored).passed, false);
});

test('tracks missing, unexpected and duplicate document results', () => {
  const run = {
    schemaVersion: 1, provider: 'test-provider', model: 'fixture-model',
    documents: [
      { documentId: 'P01', items: perfectItems },
      { documentId: 'P01', items: perfectItems },
      { documentId: 'UNKNOWN', items: [] },
    ],
  };
  const scored = scoreRun(groundTruth, run);
  assert.equal(scored.summary.duplicateResultDocuments, 1);
  assert.equal(scored.summary.documentsUnexpected, 1);
  assert.equal(evaluateReleaseGates(scored).passed, false);

  const missing = scoreRun(groundTruth, {
    schemaVersion: 1, provider: 'test-provider', model: 'fixture-model', documents: [],
  });
  assert.equal(missing.summary.documentsMissing, 1);
  assert.equal(missing.summary.omittedRows, 3);
  assert.equal(missing.summary.finalAmountAccuracy, 0);
});

test('records latency and cost only when supplied', () => {
  const scored = scoreRun(groundTruth, result(perfectItems));
  assert.equal(scored.summary.averageLatencyMs, 1000);
  assert.equal(scored.summary.totalEstimatedCostUsd, 0.001);
  assert.equal(scored.summary.averageEstimatedCostUsd, 0.001);
});

test('rejects malformed human ground-truth row indexes', () => {
  const invalid = structuredClone(groundTruth);
  invalid.documents[0].items[1].rowIndex = 1;
  assert.throws(() => scoreRun(invalid, result(perfectItems)), /ascending reading order/);
});
