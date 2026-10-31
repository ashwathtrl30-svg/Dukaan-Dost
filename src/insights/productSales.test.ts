import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregateProductSales, normalizeProductIdentity } from './productSales';
import type { SaleEntry } from '../types';

let nextId = 0;
function sale(overrides: Partial<SaleEntry> & Pick<SaleEntry, 'itemName'>): SaleEntry {
  nextId += 1;
  return {
    id: 'product-test-' + nextId,
    date: '2026-10-31',
    amount: 100,
    paymentType: 'cash',
    createdAt: 1,
    numberOfItemsSold: 1,
    ...overrides,
  };
}

test('groups one branded product across pack sizes and counts packs, not grams', () => {
  const result = aggregateProductSales([
    sale({
      itemName: 'Fortune Soya',
      numberOfItemsSold: 1,
      quantity: 500,
      quantityUnit: 'g',
      packageCount: 1,
      packageUnit: 'packet',
    }),
    sale({
      itemName: 'fortune   soya',
      numberOfItemsSold: 1,
      quantity: 1,
      quantityUnit: 'kg',
      packageCount: 1,
      packageUnit: 'packet',
    }),
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Fortune Soya');
  assert.equal(result[0].unitsSold, 2);
  assert.deepEqual(
    result[0].sizes.map(size => [size.label, size.unitsSold]).sort(),
    [['1 kg', 1], ['500 g', 1]],
  );
});

test('keeps unbranded Soya separate from Fortune Soya', () => {
  const result = aggregateProductSales([
    sale({ itemName: 'Fortune Soya', numberOfItemsSold: 1, quantity: 500, quantityUnit: 'g' }),
    sale({ itemName: 'Soya', numberOfItemsSold: 2, quantity: 1, quantityUnit: 'kg' }),
  ]);

  assert.equal(result.length, 2);
  assert.equal(result.find(item => item.key === normalizeProductIdentity('Fortune Soya'))?.unitsSold, 1);
  assert.equal(result.find(item => item.key === normalizeProductIdentity('Soya'))?.unitsSold, 2);
});

test('does not rank measured weight as a sold-item count without an item or pack count', () => {
  const result = aggregateProductSales([
    sale({
      itemName: 'Loose Soya',
      numberOfItemsSold: undefined,
      quantity: 500,
      quantityUnit: 'g',
    }),
  ]);
  assert.equal(result.length, 0);
});

test('recognises legacy pack-size units such as 500 g packet', () => {
  const result = aggregateProductSales([
    sale({
      itemName: 'Fortune Soya',
      numberOfItemsSold: undefined,
      quantity: 2,
      quantityUnit: '500 g packet',
    }),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].unitsSold, 2);
  assert.deepEqual(result[0].sizes, [{ label: '500 g', unitsSold: 2 }]);
});
