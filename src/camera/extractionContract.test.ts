import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  paiseToRupees,
  rupeesToPaise,
  validateCameraExtraction,
  type CameraExtractedItem,
} from './extractionContract';

function item(overrides: Partial<CameraExtractedItem> = {}): CameraExtractedItem {
  return {
    productName: 'Basmati Rice',
    quantity: 2,
    quantityUnit: 'kg',
    finalAmount: 170,
    amountSource: 'printed_line_total',
    confidence: 'high',
    needsReview: false,
    reviewReasons: [],
    ...overrides,
  };
}

function response(items: unknown[]) {
  return { schemaVersion: 1, items };
}

test('accepts an unambiguous item and preserves its final amount', () => {
  const result = validateCameraExtraction(response([item()]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].productName, 'Basmati Rice');
  assert.equal(result.items[0].finalAmount, 170);
  assert.equal(result.items[0].finalAmountPaise, 17000);
  assert.equal(result.items[0].needsReview, false);
});

test('preserves decimal INR amounts exactly to paise', () => {
  assert.equal(rupeesToPaise(136.5), 13650);
  assert.equal(rupeesToPaise(0.1), 10);
  assert.equal(paiseToRupees(13650), 136.5);

  const result = validateCameraExtraction(response([
    item({ productName: 'Sunflower Oil', quantity: 1, quantityUnit: 'litre', finalAmount: 136.5 }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].finalAmountPaise, 13650);
  assert.equal(result.items[0].finalAmount, 136.5);
});

test('rejects non-positive, unsafe and over-precision monetary values', () => {
  assert.equal(rupeesToPaise(0), null);
  assert.equal(rupeesToPaise(-20), null);
  assert.equal(rupeesToPaise(Number.NaN), null);
  assert.equal(rupeesToPaise(10.001), null);
  assert.equal(rupeesToPaise(Number.MAX_VALUE), null);
});

test('requires manual confirmation when the final amount was calculated from a unit rate', () => {
  const result = validateCameraExtraction(response([
    item({
      quantity: 2,
      quantityUnit: 'kg',
      finalAmount: 170,
      amountSource: 'explicit_unit_rate_calculation',
      confidence: 'high',
      needsReview: false,
    }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].finalAmount, 170);
  assert.equal(result.items[0].needsReview, true);
  assert.ok(result.items[0].reviewReasons.some(reason => reason.includes('calculated from a unit rate')));
});

test('flags a unit rate or line total ambiguity instead of accepting the amount', () => {
  const result = validateCameraExtraction(response([
    item({
      productName: 'Toor Dal',
      quantity: 10,
      quantityUnit: 'kg',
      finalAmount: null,
      amountSource: 'uncertain',
      confidence: 'medium',
      needsReview: true,
      reviewReasons: ['₹500 may be a rate or a line total.'],
    }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].finalAmount, null);
  assert.equal(result.items[0].needsReview, true);
  assert.ok(result.items[0].reviewReasons.some(reason => reason.includes('rate or a line total')));
});

test('flags missing quantity, unit and amount while preserving the row', () => {
  const result = validateCameraExtraction(response([
    item({
      productName: 'Sugar',
      quantity: null,
      quantityUnit: null,
      finalAmount: null,
      amountSource: 'uncertain',
    }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].needsReview, true);
  assert.ok(result.items[0].reviewReasons.some(reason => reason.includes('Quantity was not identified')));
  assert.ok(result.items[0].reviewReasons.some(reason => reason.includes('Final item amount is missing')));
});

test('does not trust a model false flag when its values are incomplete', () => {
  const result = validateCameraExtraction(response([
    item({ quantity: 0, quantityUnit: '', finalAmount: 0, amountSource: 'printed_line_total', needsReview: false }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].needsReview, true);
  assert.ok(result.items[0].reviewReasons.length >= 2);
});

test('forces manual review for medium and low confidence rows', () => {
  const result = validateCameraExtraction(response([
    item({ confidence: 'medium' }),
    item({ confidence: 'low' }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.reviewCount, 2);
  assert.ok(result.items.every(row => row.needsReview));
});

test('supports 65 rows without a five-item or small-list parser limit', () => {
  const rows = Array.from({ length: 65 }, (_, index) =>
    item({
      productName: 'Product ' + (index + 1),
      quantity: index + 1,
      finalAmount: (index + 1) * 10,
    }),
  );
  const result = validateCameraExtraction(response(rows));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items.length, 65);
  assert.equal(result.items[0].sourceIndex, 0);
  assert.equal(result.items[64].sourceIndex, 64);
  assert.equal(result.items[64].finalAmount, 650);
});

test('keeps malformed rows visible as review rows rather than silently dropping them', () => {
  const result = validateCameraExtraction(response([
    item(),
    null,
    'not-an-object',
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items.length, 3);
  assert.equal(result.items[1].productName, '');
  assert.equal(result.items[2].productName, '');
  assert.ok(result.items[1].needsReview);
  assert.ok(result.items[2].needsReview);
});

test('accepts JSON text and rejects malformed JSON', () => {
  const valid = JSON.stringify(response([item()]));
  assert.equal(validateCameraExtraction(valid).ok, true);

  const invalid = validateCameraExtraction('{not-json');
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, 'invalid_json');
});

test('rejects unsupported envelopes and empty item lists', () => {
  const unsupported = validateCameraExtraction({ schemaVersion: 2, items: [item()] });
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.code, 'invalid_response');

  const empty = validateCameraExtraction(response([]));
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.code, 'empty_items');
});

test('does not silently accept a row with an oversized product name', () => {
  const result = validateCameraExtraction(response([
    item({ productName: 'A'.repeat(130) }),
  ]));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.items[0].productName.length, 120);
  assert.equal(result.items[0].needsReview, true);
});
