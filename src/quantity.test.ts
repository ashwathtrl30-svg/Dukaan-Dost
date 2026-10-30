import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSaleQuantityInput, parseSaleQuantityInput } from './quantity';

test('parses compact number-plus-unit quantities', () => {
  assert.deepEqual(parseSaleQuantityInput('500g'), { quantity: 500, quantityUnit: 'g' });
  assert.deepEqual(parseSaleQuantityInput('1l'), { quantity: 1, quantityUnit: 'litre' });
  assert.deepEqual(parseSaleQuantityInput('2kg'), { quantity: 2, quantityUnit: 'kg' });
  assert.deepEqual(parseSaleQuantityInput('750ml'), { quantity: 750, quantityUnit: 'ml' });
  assert.deepEqual(parseSaleQuantityInput('1 piece'), { quantity: 1, quantityUnit: 'piece' });
  assert.deepEqual(parseSaleQuantityInput('3 packets'), { quantity: 3, quantityUnit: 'packet' });
});

test('preserves pack count and total measured quantity', () => {
  assert.deepEqual(parseSaleQuantityInput('2 packets, 2kg'), {
    quantity: 2, quantityUnit: 'kg', packageCount: 2, packageUnit: 'packet',
  });
  assert.equal(
    formatSaleQuantityInput({ quantity: 2, quantityUnit: 'kg', packageCount: 2, packageUnit: 'packet' }),
    '2 packets, 2 kg',
  );
  assert.equal(
    formatSaleQuantityInput({ quantity: 1, quantityUnit: 'kg', packageCount: 1, packageUnit: 'packet' }),
    '1 packet, 1 kg',
  );
});

test('rejects quantities without a recognized unit', () => {
  assert.equal(parseSaleQuantityInput('500'), null);
  assert.equal(parseSaleQuantityInput('500 unknown'), null);
  assert.equal(parseSaleQuantityInput('0g'), null);
  assert.equal(parseSaleQuantityInput('-5kg'), null);
});
