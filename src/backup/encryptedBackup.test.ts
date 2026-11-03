import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decryptShopBackup,
  encryptShopBackup,
  getBackupFilename,
  validateBackupPassphrase,
} from './encryptedBackup';
import type { ShopDataSnapshot } from '../shopDataSnapshot';

const snapshot: ShopDataSnapshot = {
  shopProfile: {
    shopType: 'kirana',
    shopName: 'Sharma Stores',
    city: 'Mumbai',
    duration: '1to5',
    ownership: 'own',
    workers: 2,
    monthlySales: '1Lto3L',
    udhaarLevel: 'sometimes',
    accounting: 'notebook',
    worries: ['rising_costs'],
  },
  sales: [{
    id: 'sale-1',
    date: '2026-11-04',
    amount: 450,
    itemName: 'Rice',
    numberOfItemsSold: 1,
    quantity: 5,
    quantityUnit: 'kg',
    paymentType: 'cash',
    createdAt: 100,
  }],
  expenses: [{
    id: 'expense-1',
    date: '2026-11-04',
    amount: 100,
    category: 'transport',
    createdAt: 101,
  }],
  udhaar: [{
    id: 'udhaar-1',
    customerName: 'Ravi',
    amount: 75,
    date: '2026-11-04',
    paid: false,
    createdAt: 102,
  }],
  notebookNotes: [{
    id: 'note-1',
    title: 'Restock',
    content: 'Buy rice tomorrow',
    createdAt: 103,
    updatedAt: 103,
  }],
  chatSessions: [],
  insights: [],
  preferences: {
    language: 'en',
    theme: 'light',
    onboardingComplete: true,
    userName: '',
    reminderTime: '20:00',
    streak: 0,
    lastEntryDate: '',
    textSize: 'normal',
    notificationsEnabled: true,
    alertTypes: { daily: true, udhaar: true, festival: true, insights: true },
  },
  tombstones: {
    sales: [],
    expenses: [],
    udhaar: [],
    notebookNotes: [],
    chatSessions: [],
    insights: [],
  },
};

const passphrase = 'Dukaan Dost backup key 2026';

test('encrypted backup round-trip preserves shop records and identity metadata', async () => {
  const encrypted = await encryptShopBackup(
    snapshot,
    'owner-test-1',
    passphrase,
    '2026-11-04T12:30:00.000Z',
  );
  assert.doesNotMatch(encrypted, /Sharma Stores|Ravi|Rice|owner-test-1/);

  const restored = await decryptShopBackup(encrypted, passphrase);
  assert.equal(restored.shopName, 'Sharma Stores');
  assert.equal(restored.ownerId, 'owner-test-1');
  assert.equal(restored.createdAt, '2026-11-04T12:30:00.000Z');
  assert.equal(restored.counts.sales, 1);
  assert.equal(restored.counts.expenses, 1);
  assert.equal(restored.counts.udhaar, 1);
  assert.equal(restored.snapshot.sales[0].quantityUnit, 'kg');
});

test('wrong passphrase and modified ciphertext are rejected', async () => {
  const encrypted = await encryptShopBackup(snapshot, 'owner-test-1', passphrase);
  await assert.rejects(
    decryptShopBackup(encrypted, 'another backup passphrase'),
    /passphrase is incorrect/i,
  );

  const envelope = JSON.parse(encrypted) as { ciphertext: string };
  const original = envelope.ciphertext;
  envelope.ciphertext = (original[0] === 'A' ? 'B' : 'A') + original.slice(1);
  await assert.rejects(
    decryptShopBackup(JSON.stringify(envelope), passphrase),
    /passphrase is incorrect|changed or damaged/i,
  );
});

test('unsupported, oversized and malformed backup files are rejected', async () => {
  await assert.rejects(decryptShopBackup('not json', passphrase), /not a valid/i);
  await assert.rejects(
    decryptShopBackup(JSON.stringify({ format: 'other', formatVersion: 99 }), passphrase),
    /not supported/i,
  );
  await assert.rejects(
    decryptShopBackup('x'.repeat(20 * 1024 * 1024 + 1), passphrase),
    /too large/i,
  );
});

test('passphrase rules and dated filenames are deterministic', () => {
  assert.ok(validateBackupPassphrase('short'));
  assert.ok(validateBackupPassphrase('            '));
  assert.equal(validateBackupPassphrase(passphrase), null);
  assert.equal(getBackupFilename('2026-11-04T12:30:00.000Z'), 'dukaandost-backup-20261104.ddbackup');
});

test('invalid ledger amounts are rejected after decryption validation', async () => {
  const invalid = {
    ...snapshot,
    sales: [{ ...snapshot.sales[0], amount: -100 }],
  };
  await assert.rejects(
    encryptShopBackup(invalid, 'owner-test-1', passphrase),
    /invalid sales record/i,
  );
});
