#!/usr/bin/env node
/**
 * Offline, provider-neutral benchmark scorer for Dukaan Dost Camera V1.
 * Reads JSON only. Never calls a model provider or reads image files.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEMA_VERSION = 1;
const UNIT_ALIASES = {
  kilogram: 'kg', kilograms: 'kg', gram: 'g', grams: 'g',
  litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  pc: 'piece', pcs: 'piece', pieces: 'piece', unit: 'piece', units: 'piece', each: 'piece',
  pack: 'packet', packs: 'packet', packets: 'packet',
};

function fail(message) { throw new Error(message); }
function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' must be a JSON object.');
}
function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(label + ' must be a non-empty string.');
}
function assertArray(value, label) {
  if (!Array.isArray(value)) fail(label + ' must be an array.');
}

function assertDataset(document, label, { results = false } = {}) {
  assertObject(document, label);
  if (document.schemaVersion !== SCHEMA_VERSION) fail(label + '.schemaVersion must equal ' + SCHEMA_VERSION + '.');
  assertArray(document.documents, label + '.documents');
  const seen = new Set();

  for (let i = 0; i < document.documents.length; i += 1) {
    const doc = document.documents[i];
    const prefix = label + '.documents[' + i + ']';
    assertObject(doc, prefix);
    assertString(doc.documentId, prefix + '.documentId');
    if (!results && seen.has(doc.documentId)) fail(label + ' contains duplicate documentId ' + doc.documentId + '.');
    seen.add(doc.documentId);
    assertArray(doc.items, prefix + '.items');

    if (!results) {
      let previousRowIndex = 0;
      for (let j = 0; j < doc.items.length; j += 1) {
        const item = doc.items[j];
        const itemPrefix = prefix + '.items[' + j + ']';
        assertObject(item, itemPrefix);
        if (!Number.isInteger(item.rowIndex) || item.rowIndex <= previousRowIndex) {
          fail(itemPrefix + '.rowIndex must be a positive integer in ascending reading order.');
        }
        previousRowIndex = item.rowIndex;
        assertString(item.productName, itemPrefix + '.productName');
        if (item.quantity !== null && item.quantity !== undefined &&
            (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
          fail(itemPrefix + '.quantity must be a positive number or null.');
        }
        if (item.quantityUnit !== null && item.quantityUnit !== undefined && typeof item.quantityUnit !== 'string') {
          fail(itemPrefix + '.quantityUnit must be a string or null.');
        }
        if (item.finalAmountPaise !== null && item.finalAmountPaise !== undefined &&
            (!Number.isSafeInteger(item.finalAmountPaise) || item.finalAmountPaise <= 0)) {
          fail(itemPrefix + '.finalAmountPaise must be a positive integer or null.');
        }
        if (typeof item.needsReview !== 'boolean') fail(itemPrefix + '.needsReview must be boolean.');
      }
    }
  }

  if (results) {
    assertString(document.provider, label + '.provider');
    assertString(document.model, label + '.model');
  }
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  return value.normalize('NFC').trim().toLocaleLowerCase('en-IN').replace(/\s+/g, ' ');
}
function normalizeUnit(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return '__invalid__';
  const token = value.normalize('NFC').trim().toLocaleLowerCase('en-IN').replace(/[\s._-]+/g, '');
  return UNIT_ALIASES[token] ?? token;
}
function numericEqual(left, right) {
  if (left === null || left === undefined) return right === null || right === undefined;
  if (right === null || right === undefined || typeof right !== 'number' || !Number.isFinite(right)) return false;
  return typeof left === 'number' && Number.isFinite(left) && Math.abs(left - right) <= 1e-9;
}
export function rupeesToPaise(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '__invalid__';
  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise) || paise <= 0 || Math.abs(value - paise / 100) > 1e-7) return '__invalid__';
  return paise;
}

function compareItem(expected, actual) {
  if (!actual) return { name: false, quantity: false, unit: false, quantityUnit: false, amount: false, review: false, core: false, fully: false };
  const name = normalizeText(expected.productName) === normalizeText(actual.productName);
  const quantity = numericEqual(expected.quantity ?? null, actual.quantity ?? null);
  const unit = normalizeUnit(expected.quantityUnit ?? null) === normalizeUnit(actual.quantityUnit ?? null);
  const quantityUnit = quantity && unit;
  const actualPaise = rupeesToPaise(actual.finalAmount ?? null);
  const amount = actualPaise !== '__invalid__' && actualPaise === (expected.finalAmountPaise ?? null);
  const review = typeof actual.needsReview === 'boolean' && actual.needsReview === expected.needsReview;
  const core = name && quantity && unit && amount;
  return { name, quantity, unit, quantityUnit, amount, review, core, fully: core && review };
}

function makeCounters() {
  return {
    expectedRows: 0, returnedRows: 0, alignedRows: 0, nameCorrect: 0,
    quantityCorrect: 0, unitCorrect: 0, quantityUnitCorrect: 0, amountCorrect: 0,
    reviewCorrect: 0, fullyCorrectRows: 0, expectedReviewRows: 0,
    expectedReviewFlagged: 0, predictedReviewFlags: 0, truePositiveReviewFlags: 0,
    falsePositiveReviewFlags: 0, unsafeAcceptedRows: 0, omittedRows: 0, extraRows: 0,
    documentsExpected: 0, documentsReturned: 0, documentsMissing: 0,
    documentsUnexpected: 0, duplicateResultDocuments: 0,
    latencyTotalMs: 0, latencyCount: 0, estimatedCostTotalUsd: 0, estimatedCostCount: 0,
  };
}

function accumulateDocument(counter, expectedDoc, resultDoc) {
  const expectedItems = expectedDoc.items;
  const actualItems = resultDoc?.items ?? [];
  counter.expectedRows += expectedItems.length;
  counter.returnedRows += actualItems.length;
  counter.alignedRows += Math.min(expectedItems.length, actualItems.length);
  counter.omittedRows += Math.max(0, expectedItems.length - actualItems.length);
  counter.extraRows += Math.max(0, actualItems.length - expectedItems.length);

  for (let i = 0; i < expectedItems.length; i += 1) {
    const expected = expectedItems[i];
    const actual = actualItems[i];
    const result = compareItem(expected, actual);
    if (result.name) counter.nameCorrect += 1;
    if (result.quantity) counter.quantityCorrect += 1;
    if (result.unit) counter.unitCorrect += 1;
    if (result.quantityUnit) counter.quantityUnitCorrect += 1;
    if (result.amount) counter.amountCorrect += 1;
    if (result.review) counter.reviewCorrect += 1;
    if (result.fully) counter.fullyCorrectRows += 1;

    if (expected.needsReview) {
      counter.expectedReviewRows += 1;
      if (actual?.needsReview === true) {
        counter.expectedReviewFlagged += 1;
        counter.truePositiveReviewFlags += 1;
      }
    } else if (actual?.needsReview === true) {
      counter.falsePositiveReviewFlags += 1;
    }
    if (actual?.needsReview === true) counter.predictedReviewFlags += 1;
    if (actual?.needsReview === false && (expected.needsReview || !result.core)) counter.unsafeAcceptedRows += 1;
  }

  for (let i = expectedItems.length; i < actualItems.length; i += 1) {
    const actual = actualItems[i];
    if (actual?.needsReview === true) {
      counter.predictedReviewFlags += 1;
      counter.falsePositiveReviewFlags += 1;
    } else if (actual?.needsReview === false) {
      counter.unsafeAcceptedRows += 1;
    }
  }
}

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(6)) : null;
}
function summarise(c) {
  const rows = c.expectedRows;
  return {
    documentsExpected: c.documentsExpected,
    documentsReturned: c.documentsReturned,
    documentsMissing: c.documentsMissing,
    documentsUnexpected: c.documentsUnexpected,
    duplicateResultDocuments: c.duplicateResultDocuments,
    rowsExpected: rows,
    rowsReturned: c.returnedRows,
    rowsAlignedByReadingOrder: c.alignedRows,
    omittedRows: c.omittedRows,
    extraRows: c.extraRows,
    rowRecall: ratio(c.alignedRows, rows),
    rowPrecision: ratio(c.alignedRows, c.returnedRows),
    productNameAccuracy: ratio(c.nameCorrect, rows),
    quantityAccuracy: ratio(c.quantityCorrect, rows),
    unitAccuracy: ratio(c.unitCorrect, rows),
    quantityUnitAccuracy: ratio(c.quantityUnitCorrect, rows),
    finalAmountAccuracy: ratio(c.amountCorrect, rows),
    reviewDecisionAccuracy: ratio(c.reviewCorrect, rows),
    fullyCorrectRowAccuracy: ratio(c.fullyCorrectRows, rows),
    expectedReviewRows: c.expectedReviewRows,
    expectedReviewRowsFlagged: c.expectedReviewFlagged,
    reviewFlagRecall: ratio(c.expectedReviewFlagged, c.expectedReviewRows),
    predictedReviewFlags: c.predictedReviewFlags,
    truePositiveReviewFlags: c.truePositiveReviewFlags,
    falsePositiveReviewFlags: c.falsePositiveReviewFlags,
    reviewFlagPrecision: ratio(c.truePositiveReviewFlags, c.predictedReviewFlags),
    unsafeAcceptedRows: c.unsafeAcceptedRows,
    averageLatencyMs: ratio(c.latencyTotalMs, c.latencyCount),
    totalEstimatedCostUsd: c.estimatedCostCount > 0 ? Number(c.estimatedCostTotalUsd.toFixed(8)) : null,
    averageEstimatedCostUsd: c.estimatedCostCount > 0 ? Number((c.estimatedCostTotalUsd / c.estimatedCostCount).toFixed(8)) : null,
  };
}

export function scoreRun(groundTruth, run) {
  assertDataset(groundTruth, 'groundTruth');
  assertDataset(run, 'run', { results: true });
  const expectedById = new Map(groundTruth.documents.map(doc => [doc.documentId, doc]));
  const resultsById = new Map();
  const duplicateIds = new Set();

  for (const doc of run.documents) {
    if (!expectedById.has(doc.documentId)) continue;
    if (resultsById.has(doc.documentId)) duplicateIds.add(doc.documentId);
    else resultsById.set(doc.documentId, doc);
  }

  const counter = makeCounters();
  counter.documentsExpected = groundTruth.documents.length;
  counter.documentsReturned = resultsById.size;
  counter.documentsMissing = [...expectedById.keys()].filter(id => !resultsById.has(id)).length;
  counter.documentsUnexpected = run.documents.filter(doc => !expectedById.has(doc.documentId)).length;
  counter.duplicateResultDocuments = duplicateIds.size;

  const detail = [];
  for (const expectedDoc of groundTruth.documents) {
    const resultDoc = resultsById.get(expectedDoc.documentId) ?? null;
    accumulateDocument(counter, expectedDoc, resultDoc);
    if (resultDoc && Number.isFinite(resultDoc.latencyMs) && resultDoc.latencyMs >= 0) {
      counter.latencyTotalMs += resultDoc.latencyMs;
      counter.latencyCount += 1;
    }
    if (resultDoc && Number.isFinite(resultDoc.estimatedCostUsd) && resultDoc.estimatedCostUsd >= 0) {
      counter.estimatedCostTotalUsd += resultDoc.estimatedCostUsd;
      counter.estimatedCostCount += 1;
    }
    detail.push({
      documentId: expectedDoc.documentId,
      documentType: expectedDoc.documentType ?? 'unspecified',
      expectedRows: expectedDoc.items.length,
      returnedRows: resultDoc?.items.length ?? 0,
      missingDocument: !resultDoc,
    });
  }

  return {
    provider: run.provider,
    model: run.model,
    configuration: run.configuration ?? null,
    runId: run.runId ?? null,
    summary: summarise(counter),
    documents: detail,
    duplicateDocumentIds: [...duplicateIds],
  };
}

export function evaluateReleaseGates(score) {
  const s = score.summary;
  const checks = [
    { name: 'all expected documents returned', pass: s.documentsMissing === 0 },
    { name: 'no unexpected documents', pass: s.documentsUnexpected === 0 },
    { name: 'no duplicate document results', pass: s.duplicateResultDocuments === 0 },
    { name: 'row recall at least 98%', pass: s.rowRecall !== null && s.rowRecall >= 0.98 },
    { name: 'product-name accuracy at least 95%', pass: s.productNameAccuracy !== null && s.productNameAccuracy >= 0.95 },
    { name: 'quantity-and-unit accuracy at least 95%', pass: s.quantityUnitAccuracy !== null && s.quantityUnitAccuracy >= 0.95 },
    { name: 'final-amount accuracy at least 98%', pass: s.finalAmountAccuracy !== null && s.finalAmountAccuracy >= 0.98 },
    { name: 'fully correct row accuracy at least 95%', pass: s.fullyCorrectRowAccuracy !== null && s.fullyCorrectRowAccuracy >= 0.95 },
    { name: 'no unsafe accepted rows', pass: s.unsafeAcceptedRows === 0 },
    { name: 'all expected uncertain rows flagged', pass: s.reviewFlagRecall === 1 },
  ];
  return { passed: checks.every(check => check.pass), checks };
}

function parseArgs(argv) {
  const parsed = { results: [], out: null, strict: false, help: false, groundTruth: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--strict') parsed.strict = true;
    else if (arg === '--ground-truth') parsed.groundTruth = argv[++i];
    else if (arg === '--results') parsed.results.push(argv[++i]);
    else if (arg === '--out') parsed.out = argv[++i];
    else fail('Unknown argument: ' + arg);
  }
  if (parsed.results.some(value => !value)) fail('--results requires a file path after it.');
  if (parsed.help) return parsed;
  if (!parsed.groundTruth) fail('Missing --ground-truth <file.json>.');
  if (parsed.results.length === 0) fail('Provide at least one --results <file.json>.');
  return parsed;
}

async function readJson(filePath) {
  let raw;
  try { raw = await readFile(resolve(filePath), 'utf8'); }
  catch (error) { fail('Cannot read ' + filePath + ': ' + error.message); }
  try { return JSON.parse(raw); }
  catch (error) { fail('Invalid JSON in ' + filePath + ': ' + error.message); }
}
function helpText() {
  return [
    'Dukaan Dost Camera V1 — offline benchmark scorer',
    '',
    'Usage:',
    '  npm run camera:benchmark -- --ground-truth <truth.json> --results <run.json> [--results <run2.json>] [--out <report.json>] [--strict]',
    '',
    'The scorer reads JSON only. It does not call model APIs or read image files.',
    'Predicted item order must preserve source reading order.',
    'Use --strict to enforce the documented screening gates.',
  ].join('\n');
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(helpText() + '\n');
    return 0;
  }
  const groundTruth = await readJson(args.groundTruth);
  assertDataset(groundTruth, 'groundTruth');
  const runs = [];
  for (const path of args.results) {
    const run = await readJson(path);
    const score = scoreRun(groundTruth, run);
    runs.push({ sourceFile: path, ...score, releaseGates: evaluateReleaseGates(score) });
  }

  const report = {
    reportSchemaVersion: 1,
    benchmark: groundTruth.datasetId ?? 'unspecified',
    generatedAt: new Date().toISOString(),
    note: 'Offline comparison only. Results are only as trustworthy as the human-labelled ground truth.',
    runs,
  };
  for (const run of runs) {
    const s = run.summary;
    process.stdout.write([
      run.provider + ' / ' + run.model,
      '  rows: ' + s.rowsReturned + '/' + s.rowsExpected + ' (recall ' + (s.rowRecall ?? 'n/a') + ')',
      '  amount: ' + (s.finalAmountAccuracy ?? 'n/a'),
      '  qty+unit: ' + (s.quantityUnitAccuracy ?? 'n/a'),
      '  unsafe accepted: ' + s.unsafeAcceptedRows,
      '  gates: ' + (run.releaseGates.passed ? 'PASS' : 'NOT PASSED'),
    ].join('\n') + '\n\n');
  }
  if (args.out) {
    const output = resolve(args.out);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
    process.stdout.write('Report written to ' + output + '\n');
  }
  return args.strict && runs.some(run => !run.releaseGates.passed) ? 2 : 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  runCli().then(code => { process.exitCode = code; }).catch(error => {
    process.stderr.write('Benchmark failed: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
