import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInsightsDashboard } from './analytics';
import { buildBusinessInsights, INSIGHT_TARGET_COUNTS } from './insightEngine';
import type { ExpenseEntry, SaleEntry, UdhaarEntry } from '../types';

const now = new Date(2026, 9, 31, 18, 0, 0);
const today = '2026-10-31';

function sale(
  id: string,
  date: string,
  amount: number,
  itemName: string,
  paymentType: SaleEntry['paymentType'] = 'cash',
  hour = 10,
): SaleEntry {
  return {
    id,
    date,
    amount,
    itemName,
    numberOfItemsSold: 1,
    paymentType,
    createdAt: new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), hour).getTime(),
  };
}

function expense(id: string, date: string, amount: number): ExpenseEntry {
  return {
    id,
    date,
    amount,
    category: 'stock',
    createdAt: new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 11).getTime(),
  };
}

function build(
  sales: SaleEntry[],
  expenses: ExpenseEntry[] = [],
  udhaar: UdhaarEntry[] = [],
  udhaarLevel: 'never' | 'sometimes' | 'often' | null = 'never',
  shopType: 'kirana' | 'salon' = 'kirana',
) {
  const dashboard = getInsightsDashboard(sales, expenses, now);
  return buildBusinessInsights({
    ...dashboard,
    sales,
    expenses,
    udhaar,
    shopType,
    udhaarLevel,
    language: 'en',
    now,
  });
}

function countsByPeriod(cards: ReturnType<typeof build>) {
  return {
    day: cards.filter(card => card.period === 'day').length,
    week: cards.filter(card => card.period === 'week').length,
    month: cards.filter(card => card.period === 'month').length,
  };
}

const sampleSales = [
  sale('s1', today, 120, 'Fortune Soya', 'cash', 9),
  sale('s2', today, 180, 'Rice', 'upi', 10),
  sale('s3', today, 90, 'Fortune Soya', 'cash', 18),
  sale('s4', '2026-10-30', 100, 'Fortune Soya', 'upi', 9),
  sale('s5', '2026-10-29', 150, 'Rice', 'cash', 13),
  sale('s6', '2026-10-28', 200, 'Tea', 'upi', 18),
  sale('s7', '2026-10-27', 110, 'Rice', 'cash', 10),
  sale('s8', '2026-10-26', 160, 'Tea', 'upi', 19),
  sale('s9', '2026-10-25', 100, 'Rice', 'cash', 11),
  sale('s10', '2026-10-24', 130, 'Tea', 'upi', 17),
  sale('s11', '2026-09-30', 90, 'Fortune Soya', 'cash', 10),
];

test('always renders 6 Today, 7 This Week and 8 This Month insights', () => {
  const cards = build(sampleSales, [expense('e1', today, 50)]);
  assert.deepEqual(countsByPeriod(cards), INSIGHT_TARGET_COUNTS);
  assert.equal(cards.length, 21);
});

test('a shop that never gives udhaar gets useful payment insights instead of udhaar cards', () => {
  const cards = build(sampleSales, [expense('e1', today, 50)], [], 'never');
  const todayCards = cards.filter(card => card.period === 'day');
  const weekCards = cards.filter(card => card.period === 'week');
  const monthCards = cards.filter(card => card.period === 'month');

  assert.equal(todayCards.length, 6);
  assert.equal(weekCards.length, 7);
  assert.equal(monthCards.length, 8);
  assert.ok(todayCards.some(card => card.title === 'Cash and UPI payment mix'));
  assert.ok(monthCards.some(card => card.title === 'Cash and UPI payment mix'));
  assert.ok(weekCards.some(card => card.title === 'Sales vary across recorded days' || card.title === 'More recorded days are needed for a weekly operating pattern'));
  assert.equal(cards.some(card => /udhaar|credit balance/i.test(card.title)), false);
});

test('a shop that uses udhaar gets a credit insight while retaining all insight slots', () => {
  const credit: UdhaarEntry = {
    id: 'u1',
    customerName: 'Customer',
    amount: 1250,
    date: today,
    dueDate: '2026-10-30',
    paid: false,
    createdAt: now.getTime(),
  };
  const sales = [...sampleSales, sale('s12', today, 250, 'Rice', 'udhaar', 16)];
  const cards = build(sales, [expense('e1', today, 50)], [credit], 'sometimes');

  assert.deepEqual(countsByPeriod(cards), INSIGHT_TARGET_COUNTS);
  assert.ok(cards.some(card => card.title === 'Udhaar and outstanding balance'));
});

test('Today comparisons use yesterday sales only up to the current local time', () => {
  const sales = [
    sale('today', today, 150, 'Rice', 'cash', 10),
    sale('yesterday-morning', '2026-10-30', 100, 'Rice', 'cash', 9),
    sale('yesterday-evening', '2026-10-30', 900, 'Rice', 'cash', 20),
  ];
  const cards = build(sales);
  const salesCard = cards.find(card => card.period === 'day' && card.title === 'Today sales and average recorded sale');
  assert.ok(salesCard);
  assert.match(salesCard.description, /50% higher/);
});

test('service businesses receive service-specific insight wording', () => {
  const sales = [
    sale('a', today, 300, 'Haircut', 'cash', 9),
    sale('b', today, 500, 'Hair colour', 'upi', 18),
    sale('c', today, 300, 'Haircut', 'cash', 19),
  ];
  const cards = build(sales, [], [], 'never', 'salon');
  assert.ok(cards.some(card => card.title === 'Top-performing service'));
  assert.ok(cards.some(card => card.title === 'Your busiest recorded time'));
});
