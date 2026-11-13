import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('private-benchmark/camera-v1-synthetic-corpus');
const groundTruth = JSON.parse(await readFile(resolve(root, 'ground-truth.json'), 'utf8'));
const manifestText = (await readFile(resolve(root, 'manifest.csv'), 'utf8')).replace(/^\uFEFF/, '');
const manifestLines = manifestText.trim().split(/\r?\n/);
const documentsById = new Map(groundTruth.documents.map(document => [document.documentId, document]));

test('has 40 synthetic documents split evenly across four categories', () => {
  assert.equal(groundTruth.syntheticOnly, true);
  assert.equal(groundTruth.documents.length, 40);
  const counts = Object.fromEntries(
    [...new Set(groundTruth.documents.map(document => document.documentType))]
      .map(type => [type, groundTruth.documents.filter(document => document.documentType === type).length]),
  );
  assert.deepEqual(counts, {
    printed_invoice: 10,
    handwritten_list: 10,
    hindi_hinglish: 10,
    difficult_ambiguous: 10,
  });
});

test('all documents have unique IDs, image hashes and non-empty row-level labels', () => {
  assert.equal(documentsById.size, 40);
  for (const document of groundTruth.documents) {
    assert.match(document.imageSha256, /^[a-f0-9]{64}$/);
    assert.ok(document.items.length > 0);
    document.items.forEach((item, index) => {
      assert.equal(item.rowIndex, index + 1);
      assert.equal(typeof item.productName, 'string');
      assert.ok(item.productName.trim().length > 0);
      assert.equal(typeof item.needsReview, 'boolean');
      assert.ok(item.finalAmountPaise === null || (Number.isSafeInteger(item.finalAmountPaise) && item.finalAmountPaise > 0));
      assert.ok(item.quantity === null || (typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0));
      assert.ok(item.quantityUnit === null || typeof item.quantityUnit === 'string');
    });
  }
  assert.equal(groundTruth.documents.reduce((total, document) => total + document.items.length, 0), 263);
});

test('65-row stress document preserves 65 separate source rows', () => {
  const stress = documentsById.get('D10');
  assert.ok(stress);
  assert.equal(stress.items.length, 65);
  assert.equal(stress.items[0].rowIndex, 1);
  assert.equal(stress.items[64].rowIndex, 65);
  assert.equal(new Set(stress.items.map(item => item.productName)).size, 65);
});

test('ambiguous, unreadable and incomplete cases require review', () => {
  const ambiguous = documentsById.get('D01').items.find(item => item.productName === 'Toor Dal');
  assert.equal(ambiguous.finalAmountPaise, null);
  assert.equal(ambiguous.needsReview, true);

  const unreadable = documentsById.get('D07').items[0];
  assert.equal(unreadable.finalAmountPaise, null);
  assert.equal(unreadable.needsReview, true);

  const missingQuantity = documentsById.get('D06').items.find(item => item.productName === 'Mustard Oil');
  assert.equal(missingQuantity.quantity, null);
  assert.equal(missingQuantity.finalAmountPaise, 18000);
  assert.equal(missingQuantity.needsReview, true);
});

test('explicit unit-rate calculation has correct total but still requires confirmation', () => {
  const rateOnly = documentsById.get('D04').items[0];
  assert.equal(rateOnly.productName, 'Rice');
  assert.equal(rateOnly.quantity, 2);
  assert.equal(rateOnly.quantityUnit, 'kg');
  assert.equal(rateOnly.finalAmountPaise, 17000);
  assert.equal(rateOnly.needsReview, true);
});

test('Hindi/Devanagari examples contain Devanagari names', () => {
  const hindiDocuments = groundTruth.documents.filter(document => document.documentType === 'hindi_hinglish');
  assert.equal(hindiDocuments.length, 10);
  assert.ok(hindiDocuments.some(document => document.items.some(item => /[\u0900-\u097F]/u.test(item.productName))));
  assert.ok(hindiDocuments.every(document => document.language === 'mixed'));
});

test('CSV manifest maps each exact generated document checksum to its file', () => {
  assert.equal(manifestLines.length, 41);
  const header = manifestLines[0].split(',');
  assert.deepEqual(header, [
    'document_id', 'document_type', 'language', 'image_sha256', 'local_image_path',
    'permission_basis', 'redaction_checked', 'ground_truth_status', 'notes',
  ]);
  const rows = manifestLines.slice(1).map(line => line.split(','));
  assert.equal(rows.length, 40);
  const byManifestId = new Map(rows.map(row => [row[0], row]));
  assert.equal(byManifestId.size, 40);
  for (const document of groundTruth.documents) {
    const row = byManifestId.get(document.documentId);
    assert.ok(row, 'manifest missing ' + document.documentId);
    assert.equal(row[3], document.imageSha256);
    assert.equal(row[4], 'images/' + document.documentId + '.png');
    assert.equal(row[5], 'synthetic');
    assert.equal(row[6], 'true');
    assert.equal(row[7], 'verified_synthetic');
  }
});
