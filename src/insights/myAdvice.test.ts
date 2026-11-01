import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInsightsDashboard } from './analytics';
import { getMyAdvice } from './myAdvice';
import type { SaleEntry, UdhaarEntry } from '../types';

const now = new Date(2026, 10, 1, 18, 0, 0);
const today = '2026-11-01';

function sale(
  id: string,
  date: string,
  amount: number,
  itemName: string,
  hour = 18,
  overrides: Partial<SaleEntry> = {},
): SaleEntry {
  const [year, month, day] = date.split('-').map(Number);
  return {
    id,
    date,
    amount,
    itemName,
    numberOfItemsSold: 1,
    paymentType: 'cash',
    createdAt: new Date(year, month - 1, day, hour).getTime(),
    ...overrides,
  };
}

function advice(
  sales: SaleEntry[] = [],
  udhaar: UdhaarEntry[] = [],
  shopType: NonNullable<Parameters<typeof getMyAdvice>[5]> = 'kirana',
) {
  const dashboard = getInsightsDashboard(sales, [], now);
  return getMyAdvice(dashboard.week, dashboard.month, sales, udhaar, 'en', shopType, now);
}

test('returns exactly four cards in the required priority order', () => {
  const items = advice();
  assert.equal(items.length, 4);
  assert.deepEqual(items.map(item => item.category), [
    'Immediate action',
    'Better buying',
    'Improve sales',
    'Plan ahead',
  ]);
  assert.equal(new Set(items.map(item => item.id)).size, 4);
});

test('prioritises overdue udhaar even when the outstanding amount is below ₹1,000', () => {
  const credit: UdhaarEntry = {
    id: 'u1',
    customerName: 'Customer',
    amount: 850,
    date: today,
    dueDate: '2026-10-30',
    paid: false,
    createdAt: now.getTime(),
  };
  const items = advice([], [credit]);
  assert.equal(items[0].id, 'immediate-overdue-udhaar');
  assert.match(items[0].reason, /₹850/);
});

test('buying advice ranks discrete product counts across multiple dates, not measured weight', () => {
  const sales = [
    sale('g1', '2026-10-29', 80, 'Chewing Gum', 10, { numberOfItemsSold: undefined, quantity: 8, quantityUnit: 'piece' }),
    sale('g2', '2026-10-30', 60, 'Chewing Gum', 11, { numberOfItemsSold: undefined, quantity: 6, quantityUnit: 'PCS' }),
    sale('g3', today, 50, 'Chewing Gum', 12, { numberOfItemsSold: undefined, quantity: 5, quantityUnit: 'Piece' }),
    sale('r1', today, 200, 'Loose Rice', 13, { numberOfItemsSold: undefined, quantity: 500, quantityUnit: 'g' }),
  ];
  const buying = advice(sales)[1];
  assert.equal(buying.id, 'buying-repeat-sellers');
  assert.match(buying.reason, /Chewing Gum \(19 items\/packs\)/);
  assert.doesNotMatch(buying.reason, /Loose Rice/);
});

test('does not call a product a fast mover when it was recorded on only one date', () => {
  const sales = [
    sale('g1', today, 80, 'Chewing Gum', 10, { numberOfItemsSold: undefined, quantity: 25, quantityUnit: 'piece' }),
  ];
  assert.equal(advice(sales)[1].id, 'buying-build-item-history');
});

test('sales advice identifies a repeated time window only across multiple dates', () => {
  const sales = [
    sale('s1', '2026-10-28', 100, 'Tea', 18),
    sale('s2', '2026-10-28', 100, 'Snacks', 19),
    sale('s3', '2026-10-29', 100, 'Tea', 18),
    sale('s4', '2026-10-30', 100, 'Tea', 18),
    sale('s5', today, 100, 'Tea', 19),
  ];
  const salesAdvice = advice(sales)[2];
  assert.equal(salesAdvice.id, 'sales-strongest-time');
  assert.match(salesAdvice.title, /5–10 pm/);
  assert.match(salesAdvice.reason, /4 separate dates/);
});

test('does not infer peak hours from too few distinct dates', () => {
  const sales = [
    sale('s1', today, 100, 'Tea', 18),
    sale('s2', today, 100, 'Snacks', 19),
    sale('s3', today, 100, 'Tea', 18),
    sale('s4', today, 100, 'Tea', 18),
  ];
  assert.equal(advice(sales)[2].id, 'sales-test-and-learn');
});

test('forward plan uses the upcoming Dhanteras and Diwali calendar for this shop type', () => {
  const planning = advice([], [], 'kirana')[3];
  assert.equal(planning.id, 'plan-upcoming-festival');
  assert.match(planning.title, /Dhanteras and Diwali/);
  assert.match(planning.reason, /6 Nov 2026/);
  assert.match(planning.reason, /8 Nov 2026/);
  assert.match(planning.action, /dry fruits|gift packs|diyas/i);
});

test('forward plan and actions are available in Hindi too', () => {
  const dashboard = getInsightsDashboard([], [], now);
  const items = getMyAdvice(dashboard.week, dashboard.month, [], [], 'hi', 'salon', now);
  assert.equal(items.length, 4);
  assert.match(items[3].title, /धनतेरस और दिवाली/);
  assert.match(items[3].action, /अपॉइंटमेंट|बुकिंग/);
});
