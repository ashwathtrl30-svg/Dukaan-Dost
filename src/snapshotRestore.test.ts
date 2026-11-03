import assert from 'node:assert/strict';
import test from 'node:test';
import {
  replaceSnapshotWithConflictGuard,
  type CloudSnapshotRow,
  type SnapshotWriteAdapter,
} from './snapshotSync';
import type { ShopDataSnapshot } from './shopDataSnapshot';

const backupSnapshot: ShopDataSnapshot = {
  shopProfile: {
    shopType: 'kirana', shopName: 'Restored Shop', city: 'Mumbai',
    duration: null, ownership: null, workers: 1, monthlySales: null,
    udhaarLevel: null, accounting: null, worries: [],
  },
  sales: [{
    id: 'backup-sale', date: '2026-11-04', amount: 120,
    itemName: 'Milk', paymentType: 'cash', createdAt: 1,
  }],
  expenses: [], udhaar: [], notebookNotes: [], chatSessions: [], insights: [],
  preferences: {
    language: 'en', theme: 'light', onboardingComplete: true, userName: '',
    reminderTime: '20:00', streak: 0, lastEntryDate: '', textSize: 'normal',
    notificationsEnabled: true, alertTypes: {},
  },
  tombstones: {
    sales: [], expenses: [], udhaar: [], notebookNotes: [], chatSessions: [], insights: [],
  },
};

test('exact restore replaces the row only when the row version has not changed', async () => {
  let row: CloudSnapshotRow = {
    state: { previous: true }, schema_version: 2, updated_at: '2026-11-04T10:00:00.000Z',
  };
  const adapter: SnapshotWriteAdapter = {
    read: async () => ({ ...row }),
    insert: async () => { throw new Error('Unexpected insert'); },
    compareAndSwap: async (_userId, expectedUpdatedAt, snapshot) => {
      if (row.updated_at !== expectedUpdatedAt) return null;
      row = { state: snapshot, schema_version: 2, updated_at: '2026-11-04T10:00:01.000Z' };
      return { ...row };
    },
  };

  const result = await replaceSnapshotWithConflictGuard('owner-1', backupSnapshot, adapter);
  assert.equal(result.snapshot.shopProfile.shopName, 'Restored Shop');
  assert.equal(result.snapshot.sales[0].id, 'backup-sale');
  assert.equal(result.updatedAt, '2026-11-04T10:00:01.000Z');
});

test('exact restore aborts when another device writes during the restore', async () => {
  const competingRow: CloudSnapshotRow = {
    state: { competing: true }, schema_version: 2, updated_at: '2026-11-04T10:00:02.000Z',
  };
  const adapter: SnapshotWriteAdapter = {
    read: async () => ({
      state: { old: true }, schema_version: 2, updated_at: '2026-11-04T10:00:00.000Z',
    }),
    insert: async () => { throw new Error('Unexpected insert'); },
    compareAndSwap: async () => null,
  };

  await assert.rejects(
    replaceSnapshotWithConflictGuard('owner-1', backupSnapshot, adapter),
    /Cloud shop data changed/i,
  );
  assert.equal(competingRow.schema_version, 2);
});

test('exact restore creates a missing row instead of issuing an unguarded upsert', async () => {
  let inserted: CloudSnapshotRow | null = null;
  const adapter: SnapshotWriteAdapter = {
    read: async () => null,
    insert: async (_userId, snapshot) => {
      inserted = { state: snapshot, schema_version: 2, updated_at: '2026-11-04T10:00:03.000Z' };
      return { ...inserted };
    },
    compareAndSwap: async () => null,
  };

  const result = await replaceSnapshotWithConflictGuard('owner-1', backupSnapshot, adapter);
  assert.equal(result.snapshot.shopProfile.shopName, 'Restored Shop');
  assert.ok(inserted);
});
