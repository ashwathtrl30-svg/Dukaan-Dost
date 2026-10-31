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
  units = 1,
): SaleEntry {
  return {
    id,
    date,
    amount,
    itemName,
    numberOfItemsSold: units,
    paymentType,
    createdAt: new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), hour).getTime(),
  };
}

function expense(id: string, date: string, amount: number, category = 'stock'): ExpenseEntry {
  return {
    id,
    date,
    amount,
    category,
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

test('renders exactly 2 Today, 3 This Week and 5 This Month insights', () => {
  const cards = build(sampleSales, [expense('e1', today, 50)]);
  assert.deepEqual(INSIGHT_TARGET_COUNTS, { day: 2, week: 3, month: 5 });
  assert.deepEqual(countsByPeriod(cards), { day: 2, week: 3, month: 5 });
  assert.equal(cards.length, 10);
  assert.equal(cards.some(card => /data is still building/i.test(card.title)), false);
});

test('a shop that never gives udhaar does not receive credit-risk advice in Insights', () => {
  const cards = build(sampleSales, [expense('e1', today, 50)], [], 'never');
  assert.equal(cards.length, 10);
  assert.equal(cards.some(card => /udhaar|credit balance/i.test(card.title)), false);
});

test('a shop that uses udhaar sees an overdue-credit risk when a due date has passed', () => {
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
  const risk = cards.find(card => card.period === 'month' && card.title === 'Some recorded udhaar is overdue');
  assert.ok(risk);
});

test('Today comparisons use yesterday sales and expenses only up to the current local time', () => {
  const sales = [
    sale('today', today, 150, 'Rice', 'cash', 10),
    sale('yesterday-morning', '2026-10-30', 100, 'Rice', 'cash', 9),
    sale('yesterday-evening', '2026-10-30', 900, 'Rice', 'cash', 20),
  ];
  const expenses = [
    expense('today-cost', today, 40),
    { ...expense('yesterday-morning-cost', '2026-10-30', 20), createdAt: new Date(2026, 9, 30, 9).getTime() },
    { ...expense('yesterday-evening-cost', '2026-10-30', 500), createdAt: new Date(2026, 9, 30, 20).getTime() },
  ];
  const cards = build(sales, expenses);
  const performance = cards.find(card => card.period === 'day' && card.title === "Today's sales and expense performance");
  assert.ok(performance);
  assert.match(performance.description, /50% higher/);
  assert.doesNotMatch(performance.description, /500/);
});

test('bestseller ranking is based on units sold, not revenue', () => {
  const sales = [
    sale('premium', today, 10000, 'Premium Item', 'cash', 10, 1),
    sale('value-1', today, 100, 'Value Item', 'cash', 11, 3),
    sale('value-2', '2026-10-30', 100, 'Value Item', 'cash', 12, 2),
    sale('premium-2', '2026-10-29', 10000, 'Premium Item', 'cash', 13, 1),
  ];
  const cards = build(sales);
  const productInsight = cards.find(card => card.period === 'week' && card.title === 'Best-selling products by units sold');
  assert.ok(productInsight);
  assert.ok(productInsight.description.indexOf('Value Item') < productInsight.description.indexOf('Premium Item'));
  assert.match(productInsight.description, /Value Item — 5 items\/packs/);
  assert.match(productInsight.description, /Ranking is based on quantity sold, never revenue/);
});

test('products without recorded quantities are not falsely ranked by revenue', () => {
  const sales = [
    { ...sale('premium', today, 10000, 'Premium Item'), numberOfItemsSold: undefined },
    { ...sale('cheap', today, 100, 'Cheap Item'), numberOfItemsSold: undefined },
  ];
  const cards = build(sales);
  const productInsight = cards.find(card => card.period === 'week' && card.title === 'Best-selling products cannot be identified yet');
  assert.ok(productInsight);
  assert.match(productInsight.description, /higher sale amount alone does not determine a bestseller/i);
});

test('service businesses receive service-specific peak-hour and weekly performance wording', () => {
  const sales = [
    sale('a', today, 300, 'Haircut', 'cash', 9, 2),
    sale('b', today, 500, 'Hair colour', 'upi', 18, 1),
    sale('c', today, 300, 'Haircut', 'cash', 19, 3),
  ];
  const cards = build(sales, [], [], 'never', 'salon');
  assert.ok(cards.some(card => card.title === 'Your peak customer hours'));
  assert.ok(cards.some(card => card.title === 'Most frequently completed services'));
});

test('monthly product mix reports category revenue and unit-based product leaders', () => {
  const sales = [
    { ...sale('a', today, 500, 'Soap', 'cash', 9, 10), category: 'Personal Care' },
    { ...sale('b', today, 1000, 'Shampoo', 'upi', 10, 2), category: 'Personal Care' },
    { ...sale('c', today, 200, 'Rice', 'cash', 11, 5), category: 'Grocery' },
  ];
  const cards = build(sales);
  const mix = cards.find(card => card.period === 'month' && card.title === 'Product and category sales mix');
  assert.ok(mix);
  assert.match(mix.description, /Soap \(10 items\/packs\)/);
  assert.match(mix.description, /largest recorded category is Personal Care/);
  assert.match(mix.description, /highest number of units sold, not the highest revenue/);
});
