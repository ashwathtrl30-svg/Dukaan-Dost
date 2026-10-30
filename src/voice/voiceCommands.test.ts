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


test('keeps sales and expenses separate in one confirmed voice batch', () => {
  const parsed = parseVoiceTransactions(
    'aloo ki bikri 100 rupaye, bijli bill ka kharch 2000 rupaye, kaanda ki bikri 250 rupaye add karo',
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, itemName, amount, expenseCategory }) => ({
      type, itemName, amount, expenseCategory,
    })),
    [
      { type: 'sale', itemName: 'aloo ki', amount: 100, expenseCategory: undefined },
      { type: 'expense', itemName: undefined, amount: 2000, expenseCategory: 'electricity' },
      { type: 'sale', itemName: 'kaanda ki', amount: 250, expenseCategory: undefined },
    ],
  );
});

test('allows five entries but never silently partially accepts six', () => {
  const five = parseVoiceTransactions(
    '100 rupees rent, 200 rupees electricity, 300 rupees salary, 400 rupees transport, 500 rupees packing expenses add',
  );
  assert.equal(five.error, undefined);
  assert.equal(five.transactions.length, 5);
});


test('reads shopkeeper-style number words ending in 5 and 0 in Roman and Devanagari forms', () => {
  const samples: Array<[string, number]> = [
    ['paitalis', 45], ['pachaas', 50], ['pachpan', 55], ['saath', 60],
    ['painsath', 65], ['sattar', 70], ['pachhattar', 75], ['assi', 80],
    ['pachasi', 85], ['nabbe', 90], ['pachanve', 95],
    ['पैंतालीस', 45], ['पचास', 50], ['पचपन', 55], ['साठ', 60],
    ['पैंसठ', 65], ['सत्तर', 70], ['पचहत्तर', 75], ['अस्सी', 80],
    ['पचासी', 85], ['नब्बे', 90], ['पचानवे', 95],
  ];
  for (const [spoken, expected] of samples) {
    const parsed = parseVoiceTransactions(spoken + ' rupaye rent kharch add karo');
    assert.equal(parsed.error, undefined, spoken);
    assert.equal(parsed.transactions[0]?.amount, expected, spoken);
  }
});

test('rejects amounts above ₹1 crore instead of recording a guessed number', () => {
  const parsed = parseVoiceTransactions('ek crore ek rupaye rent kharch add karo');
  assert.equal(parsed.error, 'amount_out_of_range');
  assert.deepEqual(parsed.transactions, []);
});


test('understands a spoken sale described as already sold, without an explicit add command', () => {
  const parsed = parseVoiceTransactions('do kilo sugar bik gaya sattar rupaye');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, itemName, quantity, quantityUnit, amount }) => ({
      type, itemName, quantity, quantityUnit, amount,
    })),
    [{ type: 'sale', itemName: 'sugar', quantity: 2, quantityUnit: 'kg', amount: 70 }],
  );
});

test('parses two naturally spoken sold-item entries in one batch', () => {
  const parsed = parseVoiceTransactions(
    'do kilo sugar bik gaya sattar rupaye, paanch kilo aloo bik gaya do sau pachaas rupaye',
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ itemName, quantity, quantityUnit, amount }) => ({
      itemName, quantity, quantityUnit, amount,
    })),
    [
      { itemName: 'sugar', quantity: 2, quantityUnit: 'kg', amount: 70 },
      { itemName: 'aloo', quantity: 5, quantityUnit: 'kg', amount: 250 },
    ],
  );
});

test('recognizes Devanagari sold phrases as sale commands', () => {
  const parsed = parseVoiceTransactions('दो किलो चीनी बिक गई सत्तर रुपये');
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.transactions[0]?.type, 'sale');
  assert.equal(parsed.transactions[0]?.amount, 70);
});


test('parses digit-form crore amounts as one amount and enforces the ₹1 crore cap', () => {
  const oneCrore = parseVoiceTransactions('1 crore rent kharch add karo');
  assert.equal(oneCrore.error, undefined);
  assert.equal(oneCrore.transactions.length, 1);
  assert.equal(oneCrore.transactions[0]?.amount, 10_000_000);

  const overOneCrore = parseVoiceTransactions('1 crore 1 rupaya rent kharch add karo');
  assert.equal(overOneCrore.error, 'amount_out_of_range');
  assert.deepEqual(overOneCrore.transactions, []);
});

test('parses natural English sold-item speech', () => {
  const parsed = parseVoiceTransactions('2 kg sugar sold 70 rupees');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, itemName, quantity, quantityUnit, amount }) => ({
      type, itemName, quantity, quantityUnit, amount,
    })),
    [{ type: 'sale', itemName: 'sugar', quantity: 2, quantityUnit: 'kg', amount: 70 }],
  );
});

test('accepts the common spoken spelling carod for crore', () => {
  const parsed = parseVoiceTransactions('ek carod rent kharch add karo');
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.transactions[0]?.amount, 10_000_000);
});


test('does not mistake a product quantity and item for an udhaar customer name', () => {
  const parsed = parseVoiceTransactions('do kilo aloo 100 rupaye udhaar add karo');
  assert.equal(parsed.error, 'missing_customer');
  assert.deepEqual(parsed.transactions, []);
});

test('keeps explicit customer names when the credit description also mentions stock', () => {
  const parsed = parseVoiceTransactions('Raju ko do kilo aloo ke 100 rupaye udhaar add karo');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ customerName, amount }) => ({ customerName, amount })),
    [{ customerName: 'Raju', amount: 100 }],
  );
});

test('classifies mixed sales and expenses only when each amount has a clear local cue', () => {
  const parsed = parseVoiceTransactions(
    'aloo 100 rupaye, bijli 2000 rupaye, kaanda 250 rupaye sales aur expenses add karo',
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ type, itemName, amount, expenseCategory }) => ({
      type, itemName, amount, expenseCategory,
    })),
    [
      { type: 'sale', itemName: 'aloo', amount: 100, expenseCategory: undefined },
      { type: 'expense', itemName: undefined, amount: 2000, expenseCategory: 'electricity' },
      { type: 'sale', itemName: 'kaanda', amount: 250, expenseCategory: undefined },
    ],
  );
});

test('does not silently reuse a previous customer for an unnamed udhaar entry', () => {
  const parsed = parseVoiceTransactions('Raju ko 500 rupaye udhaar aur 500 rupaye udhaar add karo');
  assert.equal(parsed.error, 'missing_customer');
  assert.deepEqual(parsed.transactions, []);
});
