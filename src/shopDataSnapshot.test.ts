import assert from 'node:assert/strict';
import testCase from 'node:test';
import {
  collectSnapshotTombstones,
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

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    language: 'en',
    theme: 'light',
    onboardingStep: 0,
    onboardingComplete: true,
    shopProfile: profile,
    sales: [
      { id: 'sale-1', date: '2026-11-02', amount: 120, itemName: 'Rice', paymentType: 'cash', createdAt: 10 },
    ],
    expenses: [
      { id: 'expense-1', date: '2026-11-02', amount: 40, category: 'stock', createdAt: 11 },
    ],
    udhaar: [
      { id: 'udhaar-1', customerName: 'Amit', amount: 50, date: '2026-11-02', paid: false, createdAt: 12 },
    ],
    notebookNotes: [
      { id: 'note-1', title: 'Supplier', content: 'Call tomorrow', createdAt: 13, updatedAt: 13 },
    ],
    chatSessions: [
      {
        id: 'chat-1',
        title: 'Sales advice',
        createdAt: 14,
        updatedAt: 15,
        messages: [
          { id: 'message-1', role: 'user', content: 'How were sales today?', timestamp: 15 },
        ],
      },
    ],
    activeSessionId: 'chat-1',
    insights: [
      {
        id: 'insight-1',
        type: 'profit',
        headline: 'Track margins',
        explanation: 'Review product margins.',
        action: 'Review costs',
        dataSource: 'sales and expenses',
        useful: true,
        createdAt: 16,
        updatedAt: 17,
      },
    ],
    phoneNumber: '+919999999999',
    userName: 'Ash',
    reminderTime: '20:30',
    streak: 4,
    lastEntryDate: '2026-11-02',
    textSize: 'large',
    lockEnabled: true,
    lockPin: '1234',
    notificationsEnabled: false,
    alertTypes: { daily: false, udhaar: true, festival: true, insights: false },
    ...overrides,
  };
}

const baseState = makeState();
const baseSnapshot = createShopDataSnapshot(baseState);

testCase('cloud snapshot stores business data, chat history, insights and safe preferences', () => {
  const snapshot = createShopDataSnapshot(baseState);
  assert.deepEqual(Object.keys(snapshot).sort(), [
    'chatSessions',
    'expenses',
    'insights',
    'notebookNotes',
    'preferences',
    'sales',
    'shopProfile',
    'tombstones',
    'udhaar',
  ]);
  assert.equal('phoneNumber' in snapshot, false);
  assert.equal('lockPin' in snapshot, false);
  assert.equal('lockEnabled' in snapshot, false);
  assert.equal(snapshot.sales.length, 1);
  assert.equal(snapshot.expenses.length, 1);
  assert.equal(snapshot.udhaar.length, 1);
  assert.equal(snapshot.notebookNotes.length, 1);
  assert.equal(snapshot.chatSessions.length, 1);
  assert.equal(snapshot.insights.length, 1);
  assert.equal(snapshot.preferences.userName, 'Ash');
  assert.equal(snapshot.preferences.theme, 'light');
  assert.equal(snapshot.preferences.notificationsEnabled, false);
});

testCase('first-sync merge preserves unique local and remote records and the newer edit', () => {
  const local = {
    ...baseSnapshot,
    sales: [
      ...baseSnapshot.sales,
      { id: 'sale-local', date: '2026-11-02', amount: 35, itemName: 'Tea', paymentType: 'cash' as const, createdAt: 15 },
      { id: 'sale-1', date: '2026-11-02', amount: 125, itemName: 'Rice', paymentType: 'cash' as const, createdAt: 10 },
    ],
  };
  const remote = {
    ...baseSnapshot,
    shopProfile: { ...profile, shopName: 'Cloud Shop' },
    sales: [
      ...baseSnapshot.sales,
      { id: 'sale-remote', date: '2026-11-01', amount: 60, itemName: 'Oil', paymentType: 'cash' as const, createdAt: 8 },
    ],
  };

  const merged = mergeShopDataSnapshots(local, remote);
  assert.deepEqual(
    new Set(merged.sales.map((item) => item.id)),
    new Set(['sale-1', 'sale-local', 'sale-remote']),
  );
  assert.equal(merged.sales.find((item) => item.id === 'sale-1')?.amount, 125);
  assert.equal(merged.shopProfile.shopName, 'Sharma Stores');

  const staleLocal = {
    ...baseSnapshot,
    udhaar: [{ ...baseSnapshot.udhaar[0], paid: false, updatedAt: 20 }],
  };
  const newerRemote = {
    ...baseSnapshot,
    udhaar: [{ ...baseSnapshot.udhaar[0], paid: true, updatedAt: 30 }],
  };
  const updateMerge = mergeShopDataSnapshots(staleLocal, newerRemote);
  assert.equal(updateMerge.udhaar[0].paid, true);
});

testCase('a blank local device adopts the cloud profile and all cloud data', () => {
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

  const local = createShopDataSnapshot(makeState({
    shopProfile: blankProfile,
    sales: [],
    expenses: [],
    udhaar: [],
    notebookNotes: [],
    chatSessions: [],
    insights: [],
  }));

  const merged = mergeShopDataSnapshots(local, baseSnapshot);
  assert.equal(merged.shopProfile.shopName, 'Sharma Stores');
  assert.equal(merged.sales.length, 1);
  assert.equal(merged.chatSessions.length, 1);
  assert.equal(merged.insights.length, 1);
  assert.equal(merged.preferences.userName, 'Ash');
});

testCase('legacy schema v1 cloud rows are normalized into the current snapshot shape', () => {
  const legacyRow = {
    shopProfile: profile,
    sales: baseSnapshot.sales,
    expenses: baseSnapshot.expenses,
    udhaar: baseSnapshot.udhaar,
    notebookNotes: baseSnapshot.notebookNotes,
    phoneNumber: '+919999999999',
    lockPin: '1234',
  };
  const normalized = normalizeShopDataSnapshot(legacyRow);
  assert.ok(normalized);
  assert.equal(normalized.chatSessions.length, 0);
  assert.equal(normalized.insights.length, 0);
  assert.equal(normalized.preferences.theme, 'light');
  assert.equal('phoneNumber' in normalized, false);
  assert.equal('lockPin' in normalized, false);
  assert.equal(normalizeShopDataSnapshot({ sales: [] }), null);
});

testCase('deletion tombstones stop an old local cache from restoring deleted records', () => {
  const afterDelete = {
    ...baseSnapshot,
    sales: [],
  };
  afterDelete.tombstones = collectSnapshotTombstones(baseSnapshot, afterDelete);

  const merged = mergeShopDataSnapshots(baseSnapshot, afterDelete);
  assert.equal(merged.sales.some((sale) => sale.id === 'sale-1'), false);
  assert.deepEqual(merged.tombstones.sales, ['sale-1']);
});
