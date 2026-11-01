import assert from 'node:assert/strict';
import testCase from 'node:test';
import type { ShopDataSnapshot } from './shopDataSnapshot';
import {
  createShopDataSnapshot,
  mergeShopDataSnapshots,
  normalizeShopDataSnapshot,
} from './shopDataSnapshot';
import type { AppState, ShopProfile } from './types';

const profile: ShopProfile = {
  shopType: 'kirana',
  shopName: 'Sharma Stores',
  city: 'Mumbai',
  duration: '1to5',
  ownership: 'own',
  workers: 2,
  monthlySales: '1Lto3L',
  udhaarLevel: 'sometimes',
  accounting: 'notebook',
  worries: ['low_profit'],
};

const baseState = {
  shopProfile: profile,
  sales: [{ id: 'sale-1', date: '2026-11-02', amount: 120, itemName: 'Rice', paymentType: 'cash' as const, createdAt: 10 }],
  expenses: [{ id: 'expense-1', date: '2026-11-02', amount: 40, category: 'stock', createdAt: 11 }],
  udhaar: [{ id: 'udhaar-1', customerName: 'Amit', amount: 50, date: '2026-11-02', paid: false, createdAt: 12 }],
  notebookNotes: [{ id: 'note-1', title: 'Supplier', content: 'Call tomorrow', createdAt: 13, updatedAt: 13 }],
};

testCase('cloud snapshot contains business data but excludes local identity and PIN fields', () => {
  const fullState = {
    ...baseState,
    phoneNumber: '+919999999999',
    lockPin: '1234',
    lockEnabled: true,
  } as unknown as AppState;

  const snapshot = createShopDataSnapshot(fullState);
  assert.deepEqual(Object.keys(snapshot).sort(), [
    'expenses', 'notebookNotes', 'sales', 'shopProfile', 'udhaar',
  ]);
  assert.equal('phoneNumber' in snapshot, false);
  assert.equal('lockPin' in snapshot, false);
  assert.equal(snapshot.sales.length, 1);
  assert.equal(snapshot.expenses.length, 1);
  assert.equal(snapshot.udhaar.length, 1);
  assert.equal(snapshot.notebookNotes.length, 1);
});

testCase('first-sync merge preserves unique local and remote records and local edits', () => {
  const local: ShopDataSnapshot = {
    ...baseState,
    sales: [
      ...baseState.sales,
      { id: 'sale-local', date: '2026-11-02', amount: 35, itemName: 'Tea', paymentType: 'cash', createdAt: 15 },
      { id: 'sale-1', date: '2026-11-02', amount: 125, itemName: 'Rice', paymentType: 'cash', createdAt: 10 },
    ],
  };
  const remote: ShopDataSnapshot = {
    ...baseState,
    shopProfile: { ...profile, shopName: 'Cloud Shop' },
    sales: [
      ...baseState.sales,
      { id: 'sale-remote', date: '2026-11-01', amount: 60, itemName: 'Oil', paymentType: 'cash', createdAt: 8 },
    ],
  };

  const merged = mergeShopDataSnapshots(local, remote);
  assert.deepEqual(new Set(merged.sales.map(item => item.id)), new Set(['sale-1', 'sale-local', 'sale-remote']));
  assert.equal(merged.sales.find(item => item.id === 'sale-1')?.amount, 125);
  assert.equal(merged.shopProfile.shopName, 'Sharma Stores');
});

testCase('a blank local device adopts the cloud profile without losing cloud records', () => {
  const blankProfile = {
    ...profile,
    shopType: null,
    shopName: '',
    city: '',
    duration: null,
    ownership: null,
    monthlySales: null,
    udhaarLevel: null,
    accounting: null,
    worries: [],
  } as ShopProfile;
  const local: ShopDataSnapshot = {
    shopProfile: blankProfile,
    sales: [],
    expenses: [],
    udhaar: [],
    notebookNotes: [],
  };

  const merged = mergeShopDataSnapshots(local, baseState);
  assert.equal(merged.shopProfile.shopName, 'Sharma Stores');
  assert.equal(merged.sales.length, 1);
});

testCase('normalization strips unapproved fields and rejects malformed snapshots', () => {
  const normalized = normalizeShopDataSnapshot({
    ...baseState,
    phoneNumber: '+919999999999',
    lockPin: '1234',
  });
  assert.ok(normalized);
  assert.equal('phoneNumber' in normalized, false);
  assert.equal('lockPin' in normalized, false);
  assert.equal(normalizeShopDataSnapshot({ sales: [] }), null);
});
