import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceTransactions } from './voiceCommands.ts';
import { parseSaleQuantityInput, formatSaleQuantityInput, getSaleCountCopy, getSaleNameLabel } from '../quantity';

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
    parsed.transactions.map(({ type, amount, expenseCategory }) => ({ type, amount, expenseCategory })¶»§q«^