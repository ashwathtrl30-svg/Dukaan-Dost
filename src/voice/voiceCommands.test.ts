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
    '2 kg aloo ki bikri 100 rupaye, bijli bill ka kharch 2000 rupaye, 3 kg kaanda ki bikri 250 rupaye add karo',
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
    '2 kg aloo 100 rupaye, bijli ka kharch 2000 rupaye, 3 kg kaanda 250 rupaye sales aur expenses add karo',
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


test('does not absorb a product name into a customer name spoken after the product', () => {
  const parsed = parseVoiceTransactions('do kilo aloo Raju ko 100 rupaye udhaar add karo');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ customerName, amount }) => ({ customerName, amount })),
    [{ customerName: 'Raju', amount: 100 }],
  );
});


test('parses every common Hindi and Hinglish amount ending in 5 or 0 from 5 to 95', () => {
  const samples: Array<[string, number]> = [
    ['paanch', 5], ['das', 10], ['pandrah', 15], ['bees', 20],
    ['pachis', 25], ['tees', 30], ['paintis', 35], ['chalis', 40],
    ['paitalis', 45], ['pachaas', 50], ['pachpan', 55], ['saath', 60],
    ['painsath', 65], ['sattar', 70], ['pachhattar', 75], ['assi', 80],
    ['pachasi', 85], ['nabbe', 90], ['pachanve', 95],
    ['पाँच', 5], ['दस', 10], ['पंद्रह', 15], ['बीस', 20],
    ['पच्चीस', 25], ['तीस', 30], ['पैंतीस', 35], ['चालीस', 40],
    ['पैंतालीस', 45], ['पचास', 50], ['पचपन', 55], ['साठ', 60],
    ['पैंसठ', 65], ['सत्तर', 70], ['पचहत्तर', 75], ['अस्सी', 80],
    ['पचासी', 85], ['नब्बे', 90], ['पचानवे', 95],
  ];
  for (const [spoken, expected] of samples) {
    const parsed = parseVoiceTransactions(spoken + ' rupaye rent kharch add karo');
    assert.equal(parsed.error, undefined, spoken);
    assert.equal(parsed.transactions.length, 1, spoken);
    assert.equal(parsed.transactions[0]?.amount, expected, spoken);
  }
});

test('combines spoken hundreds, thousands and lakhs without splitting amounts', () => {
  const samples: Array<[string, number]> = [
    ['ek sau pachaas', 150],
    ['paanch sau pachpan', 555],
    ['ek hazar paanch sau pachaas', 1550],
    ['do hazar paanch sau pachpan', 2555],
    ['ek lakh pachaas hazar paanch sau pachpan', 150555],
    ['do lakh pachaas hazar pachaas', 250050],
    ['2 lakh 50 thousand 50', 250050],
    ['1,00,000', 100000],
  ];
  for (const [spoken, expected] of samples) {
    const parsed = parseVoiceTransactions(spoken + ' rupaye rent kharch add karo');
    assert.equal(parsed.error, undefined, spoken);
    assert.equal(parsed.transactions.length, 1, spoken);
    assert.equal(parsed.transactions[0]?.amount, expected, spoken);
  }
});

test('never accepts a sale without an item name or explicit quantity and unit', () => {
  const noItem = parseVoiceTransactions('add 100 rupees sales');
  assert.equal(noItem.error, 'missing_item');
  assert.deepEqual(noItem.transactions, []);

  const noQuantity = parseVoiceTransactions('add maida 100 rupees sales');
  assert.equal(noQuantity.error, 'missing_quantity');
  assert.deepEqual(noQuantity.transactions, []);

  const noUnit = parseVoiceTransactions('add 2 maida 100 rupees sales');
  assert.equal(noUnit.error, 'missing_quantity');
  assert.deepEqual(noUnit.transactions, []);
});

test('records both packet count and total weight when a sale includes both', () => {
  const parsed = parseVoiceTransactions('2 packet maida, 2 kg, 500 rupaye');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions, [{
    type: 'sale',
    amount: 500,
    itemName: 'maida',
    quantity: 2,
    quantityUnit: 'kg',
    packageCount: 2,
    packageUnit: 'packet',
  }]);
});

test('recognizes ml and litre quantities in voice sales', () => {
  const milk = parseVoiceTransactions('add 500 ml milk 30 rupees sale');
  assert.equal(milk.error, undefined);
  assert.equal(milk.transactions[0]?.quantity, 500);
  assert.equal(milk.transactions[0]?.quantityUnit, 'ml');

  const oil = parseVoiceTransactions('add 1 litre oil 150 rupees sale');
  assert.equal(oil.error, undefined);
  assert.equal(oil.transactions[0]?.quantity, 1);
  assert.equal(oil.transactions[0]?.quantityUnit, 'litre');
});

test('rejects the entire batch when one sale has no explicit quantity', () => {
  const parsed = parseVoiceTransactions(
    '2 kg sugar 70 rupees, maida 100 rupees sales add',
  );
  assert.equal(parsed.error, 'missing_quantity');
  assert.deepEqual(parsed.transactions, []);
});

test('manual sales quantity input accepts measured quantities and package counts', () => {
  assert.deepEqual(parseSaleQuantityInput('500 ml'), { quantity: 500, quantityUnit: 'ml' });
  assert.deepEqual(parseSaleQuantityInput('500 मिली'), { quantity: 500, quantityUnit: 'ml' });
  assert.deepEqual(parseSaleQuantityInput('1 litre'), { quantity: 1, quantityUnit: 'litre' });
  assert.deepEqual(parseSaleQuantityInput('2 kg'), { quantity: 2, quantityUnit: 'kg' });
  assert.deepEqual(parseSaleQuantityInput('3 packets'), { quantity: 3, quantityUnit: 'packet' });
  assert.deepEqual(parseSaleQuantityInput('2 packets, 2 kg'), {
    quantity: 2, quantityUnit: 'kg', packageCount: 2, packageUnit: 'packet',
  });
  assert.equal(parseSaleQuantityInput('2'), null);
  assert.equal(parseSaleQuantityInput('0 kg'), null);
  assert.equal(parseSaleQuantityInput('two kg'), null);
});

test('formats saved sale quantities for editing without losing package count', () => {
  assert.equal(formatSaleQuantityInput({
    quantity: 2, quantityUnit: 'kg', packageCount: 2, packageUnit: 'packet',
  }), '2 packet, 2 kg');
});

test('infers a sale from a complete quantity-item-price phrase without an add command', () => {
  const parsed = parseVoiceTransactions('2 kg sugar, 70 rupaye');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions, [{
    type: 'sale',
    amount: 70,
    itemName: 'sugar',
    quantity: 2,
    quantityUnit: 'kg',
  }]);
});

test('parses conversational Hindi chawal sale as rice with count and measured quantity', () => {
  const parsed = parseVoiceTransactions('maine do kilo chawal 200 rupaye mai bech di', 'kirana');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, quantityUnit, amount }) => ({
      itemName, numberOfItemsSold, quantity, quantityUnit, amount,
    })),
    [{ itemName: 'rice', numberOfItemsSold: 2, quantity: 2, quantityUnit: 'kg', amount: 200 }],
  );
});

test('multiplies a spoken price per item by the number sold', () => {
  const parsed = parseVoiceTransactions('maine 2 kg chawal bech di, ek kii kimat 100 thii', 'kirana');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, quantityUnit, amount }) => ({
      itemName, numberOfItemsSold, quantity, quantityUnit, amount,
    })),
    [{ itemName: 'rice', numberOfItemsSold: 2, quantity: 2, quantityUnit: 'kg', amount: 200 }],
  );
});

test('hardware and salon sales use item counts without measured quantities', () => {
  const hardware = parseVoiceTransactions('maine do charger 500 rupaye mein bech diye', 'hardware');
  assert.equal(hardware.error, undefined);
  assert.deepEqual(
    hardware.transactions.map(({ itemName, numberOfItemsSold, quantity, quantityUnit, amount }) => ({
      itemName, numberOfItemsSold, quantity, quantityUnit, amount,
    })),
    [{ itemName: 'charger', numberOfItemsSold: 2, quantity: undefined, quantityUnit: undefined, amount: 500 }],
  );

  const salon = parseVoiceTransactions('ek haircut 300 rupaye mein becha', 'salon');
  assert.equal(salon.error, undefined);
  assert.equal(salon.transactions[0]?.numberOfItemsSold, 1);
  assert.equal(salon.transactions[0]?.quantity, undefined);
  assert.equal(salon.transactions[0]?.amount, 300);
});

test('uses work-specific count labels for tailor, salon, restaurant, and tea businesses', () => {
  assert.equal(getSaleCountCopy('tailor', 'en').inputLabel, 'Number of dresses altered *');
  assert.equal(getSaleCountCopy('salon', 'en').inputLabel, 'Number of services completed *');
  assert.equal(getSaleCountCopy('restaurant', 'en').inputLabel, 'Number of servings sold *');
  assert.equal(getSaleCountCopy('tea', 'en').inputLabel, 'Number of cups / glasses sold *');
  assert.equal(getSaleCountCopy('hardware', 'en').inputLabel, 'Number of items sold *');
  assert.equal(getSaleCountCopy('medical', 'en').inputLabel, 'Number of items sold *');
  assert.equal(getSaleCountCopy('tailor', 'hi').inputLabel, 'अल्टर किए गए कपड़ों की संख्या *');
});

test('cleans English grammar from counted-item voice sales', () => {
  const parsed = parseVoiceTransactions('2 bulbs are sold for 200 rupees', 'hardware');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, amount }) => ({ itemName, numberOfItemsSold, quantity, amount })), [{ itemName: 'bulb', numberOfItemsSold: 2, quantity: undefined, amount: 200 }]);
});

test('parses Roman Hindi counted-item sale as two bulbs for two hundred rupees', () => {
  const parsed = parseVoiceTransactions('do bulb do sau rupaye mein bik gaye', 'hardware');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, amount }) => ({ itemName, numberOfItemsSold, quantity, amount })), [{ itemName: 'bulb', numberOfItemsSold: 2, quantity: undefined, amount: 200 }]);
});

test('parses Devanagari counted-item sale as two bulbs for two hundred rupees', () => {
  const parsed = parseVoiceTransactions('मैंने दो बल्ब दो सौ रुपये में बेच दिए', 'hardware');
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, amount }) => ({ itemName, numberOfItemsSold, quantity, amount })), [{ itemName: 'bulb', numberOfItemsSold: 2, quantity: undefined, amount: 200 }]);
});

test('uses count-only natural voice descriptions for salon services and tailor alterations', () => {
  const salon = parseVoiceTransactions('maine do haircut kiye 500 rupaye', 'salon');
  assert.equal(salon.error, undefined);
  assert.deepEqual(salon.transactions.map(({ itemName, numberOfItemsSold, quantity, amount }) => ({ itemName, numberOfItemsSold, quantity, amount })), [{ itemName: 'haircut', numberOfItemsSold: 2, quantity: undefined, amount: 500 }]);
  const tailor = parseVoiceTransactions('maine teen dress alter kiye 900 rupaye', 'tailor');
  assert.equal(tailor.error, undefined);
  assert.deepEqual(tailor.transactions.map(({ itemName, numberOfItemsSold, quantity, amount }) => ({ itemName, numberOfItemsSold, quantity, amount })), [{ itemName: 'dress', numberOfItemsSold: 3, quantity: undefined, amount: 900 }]);
});

test('uses service and alteration wording for salon and tailor name fields', () => {
  assert.equal(getSaleNameLabel('salon', 'en'), 'Service name');
  assert.equal(getSaleNameLabel('tailor', 'en'), 'Garment / alteration type');
  assert.equal(getSaleNameLabel('kirana', 'en'), 'Item or service name');
});


test('parses natural Hinglish sugar sales with rupee symbol, so, and bech de', () => {
  const samples = [
    'Maine 2 kilo shakkar ₹100 Mein Bech De',
    '2 kilo sugar so rupaye sales add karo',
    'मैंने दो किलो शक्कर ₹100 में बेच दे',
  ];

  for (const spoken of samples) {
    const parsed = parseVoiceTransactions(spoken, 'kirana');
    assert.equal(parsed.error, undefined, spoken);
    assert.deepEqual(
      parsed.transactions.map(({ type, itemName, numberOfItemsSold, quantity, quantityUnit, amount }) => ({
        type, itemName, numberOfItemsSold, quantity, quantityUnit, amount,
      })),
      [{
        type: 'sale',
        itemName: 'sugar',
        numberOfItemsSold: 2,
        quantity: 2,
        quantityUnit: 'kg',
        amount: 100,
      }],
      spoken,
    );
  }
});

test('parses udhaar customer names with ke naam per, pe, and name-first wording', () => {
  const samples: Array<[string, string]> = [
    ['₹50 ashwat ke naam per udhari add karo', 'ashwat'],
    ['50 rupaye ashwat ke naam pe udhaar jodo', 'ashwat'],
    ['Ashwat ke naam par ₹50 udhari add karo', 'Ashwat'],
  ];

  for (const [spoken, expectedCustomer] of samples) {
    const parsed = parseVoiceTransactions(spoken, 'kirana');
    assert.equal(parsed.error, undefined, spoken);
    assert.deepEqual(
      parsed.transactions.map(({ type, customerName, amount }) => ({ type, customerName, amount })),
      [{ type: 'udhaar', customerName: expectedCustomer, amount: 50 }],
      spoken,
    );
  }
});

test('keeps branded and unbranded product identities while extracting different pack sizes', () => {
  const parsed = parseVoiceTransactions(
    '1 packet Fortune Soya 500 g 50 rupaye, 1 packet Fortune Soya 1 kg 90 rupaye, 1 packet Soya 500 g 45 rupaye sales mai add kardo',
    'kirana',
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.transactions.map(({ itemName, numberOfItemsSold, quantity, quantityUnit, packageCount, packageUnit }) => ({
      itemName, numberOfItemsSold, quantity, quantityUnit, packageCount, packageUnit,
    })),
    [
      { itemName: 'Fortune Soya', numberOfItemsSold: 1, quantity: 500, quantityUnit: 'g', packageCount: 1, packageUnit: 'packet' },
      { itemName: 'Fortune Soya', numberOfItemsSold: 1, quantity: 1, quantityUnit: 'kg', packageCount: 1, packageUnit: 'packet' },
      { itemName: 'Soya', numberOfItemsSold: 1, quantity: 500, quantityUnit: 'g', packageCount: 1, packageUnit: 'packet' },
    ],
  );
});
