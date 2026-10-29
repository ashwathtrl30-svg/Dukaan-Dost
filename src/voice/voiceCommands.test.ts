import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceTransactions } from './voiceCommands.ts';

test('parses three named sales with unit quantities from natural Hinglish', () => {
  const parsed = parseVoiceTransactions(
    'do kilo aloo 100 rupaya, 5 kg kaanda 250 rupaya, 2 aadhe kilo ke packet Fortune Maida packet 100 rupaya sales mai add kardo',
  );
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.transactions.length, 3);
  assert.deepEqual(
    parsed.transactions.map(({ type, itemName, quantity, quantityUnit, amount }) => ({
      type, itemName, quantity, quantityUnit, amount,
    })),
    [
      { type: 'sale', itemName: 'aloo', quantity: 2, quantityUnit: 'kg', amount: 100 },
      { type: 'sale', itemName: 'kaanda', quantity: 5, quantityUnit: 'kg', amount: 250 },
      { type: 'sale', itemName: 'Fortune Maida packet', quantity: 2, quantityUnit: '500 g packet', amount: 100 },
    ],
  );
});

test('recognizes spoken Hindi amount words and assigns separate expense categories', () => {
  const parsed = parseVoiceTransactions(
    'do hazar rupaye bijli, paanch hazar saaman, ek hazar saaman bhejne mein kharch ho gaya, kharch mein add karo',
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, amount, expenseCategory }) => ({ type, amount, expenseCategory })),
    [
      { type: 'expense', amount: 2000, expenseCategory: 'electricity' },
      { type: 'expense', amount: 5000, expenseCategory: 'stock' },
      { type: 'expense', amount: 1000, expenseCategory: 'transport' },
    ],
  );
});

test('recognizes the Hindi numbers 45, 60 and 70', () => {
  const parsed = parseVoiceTransactions('paitalis rupaye rent kharch, saath rupaye bijli, sattar rupaye transport kharch add karo');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions.map(({ amount }) => amount), [45, 60, 70]);
});

test('parses multiple udhaar entries with explicit customer names', () => {
  const parsed = parseVoiceTransactions('Raju ko 500 rupaye udhaar, Suresh ko 300 rupaye udhaar add karo');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, customerName, amount }) => ({ type, customerName, amount })),
    [
      { type: 'udhaar', customerName: 'Raju', amount: 500 },
      { type: 'udhaar', customerName: 'Suresh', amount: 300 },
    ],
  );
});

test('rejects a batch of more than five entries with no partial transactions', () => {
  const parsed = parseVoiceTransactions(
    '100 rupees rent, 200 rupees electricity, 300 rupees salary, 400 rupees transport, 500 rupees packing, 600 rupees stock expenses add',
  );
  assert.equal(parsed.error, 'too_many_entries');
  assert.deepEqual(parsed.transactions, []);
});

test('supports ₹1 crore as the inclusive upper bound', () => {
  const parsed = parseVoiceTransactions('ek crore transport kharch add karo');
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.transactions[0]?.amount, 10_000_000);
});

test('rejects an unclear sale with no item name', () => {
  const parsed = parseVoiceTransactions('100 rupaye sale add karo');
  assert.equal(parsed.error, 'missing_item');
  assert.deepEqual(parsed.transactions, []);
});


test('classifies saaman as stock and saaman bhejne as transport', () => {
  const stock = parseVoiceTransactions('paanch hazar saaman kharch add karo');
  assert.equal(stock.error, undefined);
  assert.equal(stock.transactions[0]?.expenseCategory, 'stock');

  const shipping = parseVoiceTransactions('ek hazar saaman bhejne mein kharch add karo');
  assert.equal(shipping.error, undefined);
  assert.equal(shipping.transactions[0]?.expenseCategory, 'transport');
});
