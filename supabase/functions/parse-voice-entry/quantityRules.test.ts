import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getProductQuantityFamily,
  resolveVoiceSaleQuantity,
} from './quantityRules.ts';

test('recognises common product families without guessing the actual pack size', () => {
  assert.equal(getProductQuantityFamily('Fortune Oil'), 'volume');
  assert.equal(getProductQuantityFamily('Amul Milk'), 'volume');
  assert.equal(getProductQuantityFamily('Sugar'), 'weight');
  assert.equal(getProductQuantityFamily('Basmati Rice'), 'weight');
  assert.equal(getProductQuantityFamily('Copper Wire'), 'length');
  assert.equal(getProductQuantityFamily('Chewing Gum'), undefined);
});

test('moves a packet-only Fortune Oil quantity into package count and requests the missing measure', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Fortune Oil',
    quantity: 1,
    quantityUnit: 'packet',
    numberOfItemsSold: 1,
  });

  assert.equal(result.quantity, undefined);
  assert.equal(result.quantityUnit, undefined);
  assert.equal(result.packageCount, 1);
  assert.equal(result.packageUnit, 'packet');
  assert.equal(result.numberOfItemsSold, 1);
  assert.equal(result.requiresQuantityConfirmation, true);
  assert.equal(result.expectedFamily, 'volume');
});

test('keeps package count and measured quantity in separate fields', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Fortune Oil',
    quantity: 500,
    quantityUnit: 'ml',
    packageCount: 1,
    packageUnit: 'packet',
    numberOfItemsSold: 1,
  });

  assert.equal(result.quantity, 500);
  assert.equal(result.quantityUnit, 'ml');
  assert.equal(result.packageCount, 1);
  assert.equal(result.packageUnit, 'packet');
  assert.equal(result.numberOfItemsSold, 1);
  assert.equal(result.requiresQuantityConfirmation, false);
});

test('does not turn 500 ml into 500 items sold', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Fortune Oil',
    quantity: 500,
    quantityUnit: 'ml',
    numberOfItemsSold: 500,
  });

  assert.equal(result.numberOfItemsSold, 1);
  assert.equal(result.quantity, 500);
  assert.equal(result.requiresQuantityConfirmation, false);
});

test('does not impose a fixed unit family when the shopkeeper explicitly says another unit', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Fortune Oil',
    quantity: 2,
    quantityUnit: 'kg',
    numberOfItemsSold: 1,
  });

  assert.equal(result.quantity, 2);
  assert.equal(result.quantityUnit, 'kg');
  assert.equal(result.numberOfItemsSold, 1);
  assert.equal(result.requiresQuantityConfirmation, false);
});

test('does not require a measured amount for an explicitly counted product', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Fortune Oil',
    quantity: 1,
    quantityUnit: 'piece',
    numberOfItemsSold: 1,
  });

  assert.equal(result.quantityUnit, 'piece');
  assert.equal(result.requiresQuantityConfirmation, false);
});

test('keeps ordinary discrete packaged products countable', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Chewing Gum',
    quantity: 1,
    quantityUnit: 'packet',
  });

  assert.equal(result.quantity, 1);
  assert.equal(result.quantityUnit, 'packet');
  assert.equal(result.numberOfItemsSold, 1);
  assert.equal(result.requiresQuantityConfirmation, false);
});

test('asks for quantity when a sale has no usable count or quantity', () => {
  const result = resolveVoiceSaleQuantity({
    itemName: 'Unknown Item',
    numberOfItemsSold: 0,
  });

  assert.equal(result.requiresQuantityConfirmation, true);
});
