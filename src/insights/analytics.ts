import type { ExpenseEntry, SaleEntry } from '../types';

export type InsightsPeriod = 'day' | 'week' | 'month';

export interface DateRange {
  start: string;
  end: string;
}

export interface ExpenseCategoryTotal {
  category: string;
  amount: number;
  share: number;
}

export interface PeriodMetrics {
  period: InsightsPeriod;
  range: DateRange;
  previousRange: DateRange;
  sales: number;
  expenses: number;
  profit: number;
  profitMargin: number | null;
  previousSales: number;
  previousExpenses: number;
  previousProfit: number;
  previousProfitMargin: number | null;
  salesChange: number | null;
  expensesChange: number | null;
  profitChange: number | null;
  topExpenses: ExpenseCategoryTotal[];
  bestSalesDay: { date: string; amount: number } | null;
  salesDaysCount: number;
  hasEntries: boolean;
  previousHasEntries: boolean;
}

export interface InsightsDashboard {
  today: PeriodMetrics;
  week: PeriodMetrics;
  month: PeriodMetrics;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

function range(start: Date, end: Date): DateRange {
  return { start: localDateKey(start), end: localDateKey(end) };
}

function sumEntriesInRange<T extends { date: string; amount: number }>(
  entries: T[],
  dateRange: DateRange,
): number {
  return entries.reduce((total, entry) => {
    // Compare validated YYYY-MM-DD values rather than Date('YYYY-MM-DD'), which
    // interprets date-only strings as UTC and can shift calendar days in India.
    if (!dateFromKey(entry.date) || entry.date < dateRange.start || entry.date > dateRange.end) return total;
    const amount = Number(entry.amount);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function filteredEntries<T extends { date: string; amount: number }>(
  entries: T[],
  dateRange: DateRange,
): T[] {
  return entries.filter(entry =>
    dateFromKey(entry.date) !== null &&
    entry.date >= dateRange.start &&
    entry.date <= dateRange.end &&
    Number.isFinite(Number(entry.amount)),
  );
}

function percentageChange(current: number, previous: number): number | null {
  // A zero baseline cannot produce a meaningful percentage change.
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function profitMargin(sales: number, expenses: number): number | null {
  // Avoid implying a 0% margin when no sales were recorded.
  if (sales <= 0) return null;
  return Math.round(((sales - expenses) / sales) * 100);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getRanges(now: Date, period: InsightsPeriod): { current: DateRange; previous: DateRange } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'day') {
    return {
      current: range(today, today),
      previous: range(addDays(today, -1), addDays(today, -1)),
    };
  }

  if (period === 'week') {
    // Monday through today, compared with the same weekdays in the prior week.
    const mondayOffset = (today.getDay() + 6) % 7;
    const weekStart = addDays(today, -mondayOffset);
    return {
      current: range(weekStart, today),
      previous: range(addDays(weekStart, -7), addDays(today, -7)),
    };
  }

  // Month-to-date, compared with the same elapsed dates in the previous month.
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const comparableDay = Math.min(today.getDate(), daysInMonth(previousMonthStart.getFullYear(), previousMonthStart.getMonth()));
  const previousMonthEnd = new Date(previousMonthStart.getFullYear(), previousMonthStart.getMonth(), comparableDay);

  return {
    current: range(monthStart, today),
    previous: range(previousMonthStart, previousMonthEnd),
  };
}

function calculatePeriod(
  period: InsightsPeriod,
  sales: SaleEntry[],
  expenses: ExpenseEntry[],
  currentRange: DateRange,
  previousRange: DateRange,
): PeriodMetrics {
  const currentSalesEntries = filteredEntries(sales, currentRange);
  const currentExpenseEntries = filteredEntries(expenses, currentRange);
  const previousSalesEntries = filteredEntries(sales, previousRange);
  const previousExpenseEntries = filteredEntries(expenses, previousRange);

  const currentSales = sumEntriesInRange(currentSalesEntries, currentRange);
  const currentExpenses = sumEntriesInRange(currentExpenseEntries, currentRange);
  const previousSales = sumEntriesInRange(previousSalesEntries, previousRange);
  const previousExpenses = sumEntriesInRange(previousExpenseEntries, previousRange);
  const categoryTotals = new Map<string, number>();

  currentExpenseEntries.forEach(entry => {
    const category = entry.category || 'other';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(entry.amount));
  });

  const topExpenses = [...categoryTotals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: currentExpenses > 0 ? Math.round((amount / currentExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const dailySales = new Map<string, number>();
  currentSalesEntries.forEach(entry => {
    dailySales.set(entry.date, (dailySales.get(entry.date) || 0) + Number(entry.amount));
  });
  const bestDay = [...dailySales.entries()].sort((a, b) => b[1] - a[1])[0];

  const profit = currentSales - currentExpenses;
  const previousProfit = previousSales - previousExpenses;

  return {
    period,
    range: currentRange,
    previousRange,
    sales: currentSales,
    expenses: currentExpenses,
    profit,
    profitMargin: profitMargin(currentSales, currentExpenses),
    previousSales,
    previousExpenses,
    previousProfit,
    previousProfitMargin: profitMargin(previousSales, previousExpenses),
    salesChange: percentageChange(currentSales, previousSales),
    expensesChange: percentageChange(currentExpenses, previousExpenses),
    profitChange: percentageChange(profit, previousProfit),
    topExpenses,
    bestSalesDay: bestDay ? { date: bestDay[0], amount: bestDay[1] } : null,
    salesDaysCount: dailySales.size,
    hasEntries: currentSalesEntries.length > 0 || currentExpenseEntries.length > 0,
    previousHasEntries: previousSalesEntries.length > 0 || previousExpenseEntries.length > 0,
  };
}

export function getInsightsDashboard(
  sales: SaleEntry[],
  expenses: ExpenseEntry[],
  now: Date = new Date(),
): InsightsDashboard {
  const dayRanges = getRanges(now, 'day');
  const weekRanges = getRanges(now, 'week');
  const monthRanges = getRanges(now, 'month');

  return {
    today: calculatePeriod('day', sales, expenses, dayRanges.current, dayRanges.previous),
    week: calculatePeriod('week', sales, expenses, weekRanges.current, weekRanges.previous),
    month: calculatePeriod('month', sales, expenses, monthRanges.current, monthRanges.previous),
  };
}

export function formatInsightsDateRange(dateRange: DateRange, language: 'en' | 'hi'): string {
  const start = dateFromKey(dateRange.start);
  const end = dateFromKey(dateRange.end);
  if (!start || !end) return '';
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const format = (date: Date) => date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${format(start)} – ${format(end)}`;
}
