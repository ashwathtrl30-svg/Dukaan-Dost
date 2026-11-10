import type { PeriodMetrics, InsightsPeriod } from './analytics';
import { aggregateProductSales, normalizeProductIdentity } from './productSales';
import type { ExpenseEntry, SaleEntry, ShopType, UdhaarEntry, UdhaarLevel } from '../types';

export type InsightTone = 'warning' | 'positive' | 'info';

export interface BusinessInsight {
  period: InsightsPeriod;
  tone: InsightTone;
  title: string;
  description: string;
  priority: number;
}

interface InsightEngineInput {
  today: PeriodMetrics;
  week: PeriodMetrics;
  month: PeriodMetrics;
  sales: SaleEntry[];
  expenses: ExpenseEntry[];
  udhaar: UdhaarEntry[];
  shopType: ShopType | null;
  udhaarLevel: UdhaarLevel | null;
  language: 'en' | 'hi';
  now?: Date;
}

interface ItemSummary {
  key: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

const TARGET_COUNTS: Record<InsightsPeriod, number> = { day: 2, week: 3, month: 5 };
const SERVICE_SHOPS = new Set<ShopType>(['salon', 'tailor']);

function shortLabel(value: string, maxLength = 18): string {
  const label = value.replace(/[_-]/gu, ' ').trim();
  return label.length > maxLength ? label.slice(0, maxLength - 1).trimEnd() + '…' : label;
}

function money(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

function createInsight(period: InsightsPeriod, tone: InsightTone, title: string, description: string): BusinessInsight {
  return { period, tone, title, description, priority: 0 };
}

function saleEntriesInRange(sales: SaleEntry[], range: PeriodMetrics['range']): SaleEntry[] {
  return sales.filter(entry => entry.date >= range.start && entry.date <= range.end && Number(entry.amount) > 0);
}

function expenseEntriesInRange(expenses: ExpenseEntry[], range: PeriodMetrics['range']): ExpenseEntry[] {
  return expenses.filter(entry => entry.date >= range.start && entry.date <= range.end && Number(entry.amount) > 0);
}

function totalAmount<T extends { amount: number }>(entries: T[]): number {
  return entries.reduce((sum, entry) => {
    const amount = Number(entry.amount);
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function minutesOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

function comparisonSales(metrics: PeriodMetrics, sales: SaleEntry[], now: Date): SaleEntry[] {
  const entries = saleEntriesInRange(sales, metrics.previousRange);
  if (metrics.period !== 'day') return entries;
  const cutoff = now.getHours() * 60 + now.getMinutes();
  return entries.filter(entry => Number.isFinite(entry.createdAt) && entry.createdAt > 0 && minutesOfDay(entry.createdAt) <= cutoff);
}

function itemSummariesFromEntries(entries: SaleEntry[]): ItemSummary[] {
  const revenueByKey = new Map<string, number>();
  entries.forEach(entry => {
    if (typeof entry.itemName !== 'string' || !entry.itemName.trim()) return;
    const key = normalizeProductIdentity(entry.itemName);
    if (!key) return;
    revenueByKey.set(key, (revenueByKey.get(key) || 0) + (Number(entry.amount) || 0));
  });

  return aggregateProductSales(entries)
    .filter(product => product.unitsSold > 0)
    .map(product => ({
      key: product.key,
      name: product.name,
      unitsSold: product.unitsSold,
      revenue: revenueByKey.get(product.key) || 0,
    }))
    // A bestseller is determined only by units/packs sold. Revenue is never a ranking fallback.
    .sort((a, b) => b.unitsSold - a.unitsSold || a.name.localeCompare(b.name));
}


function buildPeakTimeInsight(
  sales: SaleEntry[],
  range: PeriodMetrics['range'],
  shopType: ShopType | null,
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, range)
    .filter(entry => Number.isFinite(entry.createdAt) && entry.createdAt > 0);
  const windows = [
    { label: 'Morning', hi: 'सुबह', time: '6 AM–12 PM', hiTime: 'सुबह 6–12 बजे', from: 6, to: 12 },
    { label: 'Afternoon', hi: 'दोपहर', time: '12–5 PM', hiTime: 'दोपहर 12–5 बजे', from: 12, to: 17 },
    { label: 'Evening', hi: 'शाम', time: '5–10 PM', hiTime: 'शाम 5–10 बजे', from: 17, to: 22 },
    { label: 'Late night / early morning', hi: 'रात / सुबह जल्दी', time: '10 PM–6 AM', hiTime: 'रात 10–सुबह 6 बजे', from: 22, to: 30 },
  ];
  const groups = new Map<string, { amount: number; count: number }>();

  entries.forEach(entry => {
    const hour = new Date(entry.createdAt).getHours();
    const normalHour = hour < 6 ? hour + 24 : hour;
    const window = windows.find(item => normalHour >= item.from && normalHour < item.to);
    if (!window) return;
    const current = groups.get(window.label) || { amount: 0, count: 0 };
    current.amount += Number(entry.amount);
    current.count += 1;
    groups.set(window.label, current);
  });

  const isServiceShop = SERVICE_SHOPS.has(shopType || 'other');
  if (entries.length >= 3 && groups.size > 0) {
    const best = [...groups.entries()].sort((a, b) => b[1].amount - a[1].amount || b[1].count - a[1].count)[0];
    const bestWindow = windows.find(item => item.label === best[0]);
    const windowName = language === 'hi' ? bestWindow?.hi || best[0] : best[0];
    const timeRange = language === 'hi' ? bestWindow?.hiTime || '' : bestWindow?.time || '';
    return createInsight(
      'day',
      'positive',
      language === 'hi'
        ? (isServiceShop ? 'ग्राहकों का व्यस्त समय' : 'बिक्री का व्यस्त समय')
        : (isServiceShop ? 'Peak customer hours' : 'Peak sales hours'),
      language === 'hi'
        ? windowName + ' (' + timeRange + '): ' + best[1].count + ' बिक्री, ' + money(best[1].amount) + '। ज़रूरी सामान तैयार रखें।'
        : windowName + ' (' + timeRange + '): ' + best[1].count + ' sales worth ' + money(best[1].amount) + '. Keep popular items ready.',
    );
  }

  return createInsight(
    'day',
    'info',
    language === 'hi'
      ? (isServiceShop ? 'व्यस्त समय अभी साफ़ नहीं' : 'बिक्री का व्यस्त समय अभी साफ़ नहीं')
      : 'Peak hours not clear yet',
    language === 'hi'
      ? 'आज ' + entries.length + ' समय वाली बिक्री एंट्री हैं। व्यस्त समय जानने के लिए और रिकॉर्ड जोड़ें।'
      : entries.length + ' sales have a recorded time today. Add more to spot your busiest hours.',
  );
}

function buildTodayPerformance(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  expenses: ExpenseEntry[],
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const saleEntries = saleEntriesInRange(sales, metrics.range);
  const expenseEntries = expenseEntriesInRange(expenses, metrics.range);
  const previousSales = totalAmount(comparisonSales(metrics, sales, now));
  const salesChange = percentChange(metrics.sales, previousSales);
  const balance = metrics.sales - metrics.expenses;
  const tone: InsightTone = balance < 0 || (salesChange !== null && salesChange <= -15)
    ? 'warning'
    : metrics.sales > 0
      ? 'positive'
      : 'info';

  return createInsight(
    'day',
    tone,
    language === 'hi' ? 'आज की बिक्री और खर्च' : "Today's sales and expenses",
    language === 'hi'
      ? 'बिक्री ' + money(metrics.sales) + ' (' + saleEntries.length + ')। खर्च ' + money(metrics.expenses) + ' (' + expenseEntries.length + ')। दर्ज खर्च के बाद ' + money(balance) + ' बचे, दूसरे खर्च से पहले।'
      : 'Sales ' + money(metrics.sales) + ' (' + saleEntries.length + '); expenses ' + money(metrics.expenses) + ' (' + expenseEntries.length + '). Balance: ' + money(balance) + ', before other costs.',
  );
}

function buildWeeklySalesPattern(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const byDate = new Map<string, number>();
  entries.forEach(entry => byDate.set(entry.date, (byDate.get(entry.date) || 0) + Number(entry.amount)));
  const days = [...byDate.entries()].sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return createInsight(
      'week',
      'info',
      language === 'hi' ? 'इस हफ़्ते बिक्री दर्ज नहीं' : 'No sales recorded this week',
      language === 'hi'
        ? 'बिक्री दर्ज करें। इससे सबसे अच्छे बिक्री वाले दिन पता चलेंगे।'
        : 'Add sales entries to see which days perform best.',
    );
  }

  const bestDay = days[0];
  const dateLabel = new Date(bestDay[0] + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const description = days.length >= 3
    ? (language === 'hi'
        ? 'बिक्री ' + money(metrics.sales) + '। सबसे अच्छा दिन: ' + dateLabel + ', ' + money(bestDay[1]) + '।'
        : 'Sales: ' + money(metrics.sales) + '. Best day: ' + dateLabel + ', ' + money(bestDay[1]) + '.')
    : (language === 'hi'
        ? money(metrics.sales) + ' बिक्री, ' + days.length + ' दिनों में। पैटर्न जानने के लिए और रिकॉर्ड जोड़ें।'
        : money(metrics.sales) + ' in sales across ' + days.length + ' day(s). Add records to reveal a pattern.');

  return createInsight(
    'week',
    metrics.salesChange !== null && metrics.salesChange <= -15 ? 'warning' : 'info',
    language === 'hi' ? 'इस हफ़्ते बिक्री का पैटर्न' : 'Weekly sales pattern',
    description,
  );
}

function buildWeeklyExpenseChanges(
  metrics: PeriodMetrics,
  expenses: ExpenseEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const currentEntries = expenseEntriesInRange(expenses, metrics.range);
  const previousEntries = expenseEntriesInRange(expenses, metrics.previousRange);
  const currentByCategory = new Map<string, number>();
  const previousByCategory = new Map<string, number>();
  currentEntries.forEach(entry => currentByCategory.set(entry.category || 'other', (currentByCategory.get(entry.category || 'other') || 0) + Number(entry.amount)));
  previousEntries.forEach(entry => previousByCategory.set(entry.category || 'other', (previousByCategory.get(entry.category || 'other') || 0) + Number(entry.amount)));

  const currentTotal = totalAmount(currentEntries);
  const previousTotal = totalAmount(previousEntries);
  const change = percentChange(currentTotal, previousTotal);
  const categoryChange = [...currentByCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      previous: previousByCategory.get(category) || 0,
      increase: amount - (previousByCategory.get(category) || 0),
      change: percentChange(amount, previousByCategory.get(category) || 0),
    }))
    .filter(item => item.change !== null && item.change >= 20 && item.increase >= 100)
    .sort((a, b) => b.increase - a.increase)[0];

  if (categoryChange && categoryChange.change !== null) {
    const category = shortLabel(categoryChange.category);
    return createInsight(
      'week',
      'warning',
      language === 'hi' ? category + ' का खर्च बढ़ा' : category + ' cost increased',
      language === 'hi'
        ? category + ': ' + money(categoryChange.amount) + ', ' + categoryChange.change + '% ज़्यादा। वजह जाँचें।'
        : category + ': ' + money(categoryChange.amount) + ', up ' + categoryChange.change + '%. Check why.',
    );
  }

  const largest = [...currentByCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (currentTotal <= 0) {
    return createInsight(
      'week',
      'info',
      language === 'hi' ? 'इस हफ़्ते खर्च दर्ज नहीं' : 'No expenses recorded this week',
      language === 'hi'
        ? 'स्टॉक, किराया और बिल जैसे दुकान के खर्च दर्ज करें।'
        : 'Record shop costs such as stock, rent and bills.',
    );
  }

  return createInsight(
    'week',
    change !== null && change >= 25 ? 'warning' : 'info',
    language === 'hi' ? 'इस हफ़्ते के खर्च' : 'Weekly expenses',
    language === 'hi'
      ? 'कुल ' + money(currentTotal) + '। सबसे बड़ा खर्च: ' + (largest ? shortLabel(largest[0]) + ', ' + money(largest[1]) : '—') + '।'
      : 'Total: ' + money(currentTotal) + '. Biggest cost: ' + (largest ? shortLabel(largest[0]) + ', ' + money(largest[1]) : '—') + '.',
  );
}

function buildWeeklyProductPerformance(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
  shopType: ShopType | null,
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const products = itemSummariesFromEntries(entries);
  const isServiceShop = SERVICE_SHOPS.has(shopType || 'other');
  const subject = isServiceShop
    ? (language === 'hi' ? 'सेवाएँ' : 'services')
    : (language === 'hi' ? 'उत्पाद' : 'products');

  if (products.length === 0) {
    const hasNames = entries.some(entry => typeof entry.itemName === 'string' && entry.itemName.trim());
    return createInsight(
      'week',
      'info',
      language === 'hi' ? 'बेस्टसेलर अभी तय नहीं' : 'Best sellers not clear yet',
      language === 'hi'
        ? (hasNames
            ? 'नाम दर्ज हैं, पर संख्या नहीं। बेची गई मात्रा जोड़ें।'
            : 'बिक्री में ' + subject + ' का नाम और मात्रा दर्ज करें।')
        : (hasNames
            ? 'Names are saved, but quantities are missing. Add quantities.'
            : 'Add ' + subject + ' names and quantities to track top sellers.'),
    );
  }

  const top = products.slice(0, 2);
  const list = top.map(item =>
    shortLabel(item.name) + ' (' + item.unitsSold.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN') + ')'
  ).join(', ');

  return createInsight(
    'week',
    'positive',
    language === 'hi'
      ? (isServiceShop ? 'सबसे ज़्यादा की गई सेवाएँ' : 'सबसे ज़्यादा बिके उत्पाद')
      : (isServiceShop ? 'Top services by count' : 'Top products by units'),
    language === 'hi'
      ? 'सबसे ज़्यादा यूनिट: ' + list + '।'
      : 'Top by units: ' + list + '.',
  );
}

function buildMonthlyOverallPerformance(
  metrics: PeriodMetrics,
  language: 'en' | 'hi',
): BusinessInsight {
  const balance = metrics.sales - metrics.expenses;
  const margin = metrics.sales > 0 ? Math.round((balance / metrics.sales) * 100) : null;
  const tone: InsightTone = balance < 0 ? 'warning' : metrics.sales > 0 && metrics.expenses > 0 ? 'positive' : 'info';

  return createInsight(
    'month',
    tone,
    language === 'hi' ? 'इस महीने का कारोबार' : 'Monthly business summary',
    language === 'hi'
      ? 'बिक्री ' + money(metrics.sales) + '। खर्च ' + money(metrics.expenses) + '। बाकी ' + money(balance) + (margin === null ? '।' : ' (' + margin + '%)।') + ' दूसरे खर्च शामिल नहीं हैं।'
      : 'Sales ' + money(metrics.sales) + '; expenses ' + money(metrics.expenses) + '. Balance ' + money(balance) + (margin === null ? '.' : ' (' + margin + '%).') + ' Other costs may apply.',
  );
}

function buildMonthlyBusinessTrend(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const daily = new Map<string, number>();
  entries.forEach(entry => daily.set(entry.date, (daily.get(entry.date) || 0) + Number(entry.amount)));
  const days = [...daily.entries()].sort((a, b) => a[1] - b[1]);

  if (days.length === 0) {
    return createInsight(
      'month',
      'info',
      language === 'hi' ? 'महीने का ट्रेंड उपलब्ध नहीं' : 'Monthly trend not available yet',
      language === 'hi'
        ? 'अलग-अलग दिनों की बिक्री दर्ज करें।'
        : 'Record sales on different days to reveal a pattern.',
    );
  }

  if (days.length < 3) {
    return createInsight(
      'month',
      'info',
      language === 'hi' ? 'ट्रेंड के लिए और दिन चाहिए' : 'More days needed for a trend',
      language === 'hi'
        ? days.length + ' दिनों में बिक्री दर्ज है। पैटर्न के लिए और रिकॉर्ड जोड़ें।'
        : 'Sales are recorded on ' + days.length + ' day(s). Add more to reveal a trend.',
    );
  }

  const low = days[0];
  const high = days[days.length - 1];
  const dateLabel = (key: string) => new Date(key + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return createInsight(
    'month',
    high[1] >= low[1] * 3 ? 'warning' : 'info',
    language === 'hi' ? 'महीने के बिक्री वाले दिन' : 'Sales across the month',
    language === 'hi'
      ? 'सबसे अच्छा: ' + dateLabel(high[0]) + ', ' + money(high[1]) + '। सबसे धीमा: ' + dateLabel(low[0]) + ', ' + money(low[1]) + '।'
      : 'Best day: ' + dateLabel(high[0]) + ', ' + money(high[1]) + '. Quietest: ' + dateLabel(low[0]) + ', ' + money(low[1]) + '.',
  );
}

function buildMonthlyExpenseHealth(
  metrics: PeriodMetrics,
  language: 'en' | 'hi',
): BusinessInsight {
  const largest = metrics.topExpenses[0];
  if (metrics.expenses <= 0) {
    return createInsight(
      'month',
      'info',
      language === 'hi' ? 'खर्च का रिकॉर्ड नहीं' : 'No expenses recorded',
      language === 'hi'
        ? 'स्टॉक, किराया और बिल जैसे खर्च जोड़ें।'
        : 'Add stock, rent and bill costs to complete this view.',
    );
  }

  if (metrics.sales <= 0) {
    return createInsight(
      'month',
      'warning',
      language === 'hi' ? 'खर्च हैं, बिक्री नहीं' : 'Expenses recorded, no sales',
      language === 'hi'
        ? money(metrics.expenses) + ' खर्च दर्ज हैं। छूटी बिक्री की एंट्री जाँचें।'
        : money(metrics.expenses) + ' in expenses. Check for missing sales entries.',
    );
  }

  const share = Math.round((metrics.expenses / metrics.sales) * 100);
  const salesChange = metrics.salesChange;
  const expensesChange = metrics.expensesChange;
  const growthGap = salesChange !== null && expensesChange !== null ? expensesChange - salesChange : null;
  const tone: InsightTone = share >= 85 || (growthGap !== null && growthGap >= 15)
    ? 'warning'
    : share <= 60
      ? 'positive'
      : 'info';
  const largestText = largest
    ? (language === 'hi'
        ? ' सबसे बड़ा खर्च: ' + shortLabel(largest.category) + ', ' + money(largest.amount) + '।'
        : ' Biggest cost: ' + shortLabel(largest.category) + ', ' + money(largest.amount) + '.')
    : '';

  return createInsight(
    'month',
    tone,
    language === 'hi' ? 'इस महीने खर्च की स्थिति' : 'Monthly expense health',
    language === 'hi'
      ? 'खर्च, बिक्री का ' + share + '% हैं।' + largestText
      : 'Expenses are ' + share + '% of sales.' + largestText,
  );
}
function shouldShowUdhaar(level: UdhaarLevel | null, sales: SaleEntry[], udhaar: UdhaarEntry[]): boolean {
  if (level === 'never') return false;
  if (udhaar.length > 0 || sales.some(entry => entry.paymentType === 'udhaar')) return true;
  return level === 'sometimes' || level === 'often';
}


function buildMonthlyRisk(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  udhaar: UdhaarEntry[],
  udhaarLevel: UdhaarLevel | null,
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const risks: Array<{ severity: number; title: string; description: string }> = [];
  const balance = metrics.sales - metrics.expenses;

  if (metrics.sales > 0 && balance < 0) {
    risks.push({
      severity: 100,
      title: language === 'hi' ? 'खर्च बिक्री से ज़्यादा हैं' : 'Expenses exceed sales',
      description: language === 'hi'
        ? 'कमी ' + money(Math.abs(balance)) + ' है। छूटी बिक्री और बड़े बिल जाँचें।'
        : 'Shortfall: ' + money(Math.abs(balance)) + '. Check missing sales and major bills.',
    });
  }

  if (metrics.sales > 0 && metrics.expenses > 0 && metrics.expenses / metrics.sales >= 0.9) {
    risks.push({
      severity: 90,
      title: language === 'hi' ? 'खर्च बिक्री के करीब हैं' : 'Expenses are close to sales',
      description: language === 'hi'
        ? 'खर्च, बिक्री का ' + Math.round((metrics.expenses / metrics.sales) * 100) + '% हैं। बड़ी खरीद जाँचें।'
        : 'Expenses are ' + Math.round((metrics.expenses / metrics.sales) * 100) + '% of sales. Review large purchases.',
    });
  }

  if (metrics.salesChange !== null && metrics.salesChange <= -20) {
    risks.push({
      severity: 80,
      title: language === 'hi' ? 'बिक्री में तेज़ गिरावट' : 'Sales have fallen sharply',
      description: language === 'hi'
        ? 'बिक्री ' + Math.abs(metrics.salesChange) + '% घटी। दुकान के खुले दिन और एंट्री जाँचें।'
        : 'Sales fell ' + Math.abs(metrics.salesChange) + '%. Check trading days and missing entries.',
    });
  }

  const expenseGrowthGap = metrics.salesChange !== null && metrics.expensesChange !== null
    ? metrics.expensesChange - metrics.salesChange
    : null;
  if (expenseGrowthGap !== null && expenseGrowthGap >= 20 && metrics.expensesChange !== null && metrics.expensesChange >= 20) {
    risks.push({
      severity: 75,
      title: language === 'hi' ? 'खर्च बिक्री से तेज़ बढ़े' : 'Expenses are rising faster',
      description: language === 'hi'
        ? 'खर्च ' + metrics.expensesChange + '% बढ़े; बिक्री ' + metrics.salesChange + '% बदली। वजह जाँचें।'
        : 'Expenses rose ' + metrics.expensesChange + '%; sales changed ' + metrics.salesChange + '%. Check why.',
    });
  }

  if (shouldShowUdhaar(udhaarLevel, sales, udhaar)) {
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const overdue = udhaar.filter(entry => !entry.paid && Number(entry.amount) > 0 && Boolean(entry.dueDate && entry.dueDate < todayKey));
    const overdueTotal = totalAmount(overdue);
    if (overdue.length > 0) {
      risks.push({
        severity: 85,
        title: language === 'hi' ? 'कुछ उधार की तारीख़ निकल गई' : 'Some udhaar is overdue',
        description: language === 'hi'
          ? overdue.length + ' बकाया, ' + money(overdueTotal) + '। रिकॉर्ड मिलाएँ और विनम्रता से फ़ॉलो-अप करें।'
          : overdue.length + ' unpaid balances worth ' + money(overdueTotal) + '. Verify records and follow up politely.',
      });
    }
  }

  if (risks.length > 0) {
    const highest = risks.sort((a, b) => b.severity - a.severity)[0];
    return createInsight('month', 'warning', highest.title, highest.description);
  }

  return createInsight(
    'month',
    'info',
    language === 'hi' ? 'कोई बड़ी चेतावनी नहीं दिखी' : 'No major warning found',
    language === 'hi'
      ? 'दर्ज रिकॉर्ड में बड़ी चेतावनी नहीं दिखी। स्टॉक और बिल जाँचते रहें।'
      : 'No major warning in recorded entries. Keep records complete and check stock and bills.',
  );
}

function buildMonthlyProductMix(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const products = itemSummariesFromEntries(entries);
  const categories = new Map<string, { revenue: number; entries: SaleEntry[] }>();

  entries.forEach(entry => {
    const category = String(entry.category || '').trim();
    if (!category) return;
    const existing = categories.get(category) || { revenue: 0, entries: [] };
    existing.revenue += Number(entry.amount) || 0;
    existing.entries.push(entry);
    categories.set(category, existing);
  });

  const byRevenue = [...categories.entries()]
    .map(([name, value]) => ({ name, revenue: value.revenue }))
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));

  const productText = products.length > 0
    ? (language === 'hi'
        ? 'यूनिट में आगे: ' + products.slice(0, 2).map(item => shortLabel(item.name) + ' (' + item.unitsSold.toLocaleString('hi-IN') + ')').join(', ') + '।'
        : 'Top by units: ' + products.slice(0, 2).map(item => shortLabel(item.name) + ' (' + item.unitsSold.toLocaleString('en-IN') + ')').join(', ') + '.')
    : (language === 'hi'
        ? 'बेची गई मात्रा दर्ज करें, तभी बेस्टसेलर दिखेगा।'
        : 'Add sold quantities to identify top products.');

  const categoryText = byRevenue.length > 0
    ? (language === 'hi'
        ? 'सबसे बड़ी श्रेणी: ' + shortLabel(byRevenue[0].name) + ', ' + money(byRevenue[0].revenue) + '।'
        : 'Top sales category: ' + shortLabel(byRevenue[0].name) + ', ' + money(byRevenue[0].revenue) + '.')
    : (language === 'hi'
        ? 'श्रेणी के हिसाब से बिक्री देखने के लिए बिक्री में श्रेणी जोड़ें।'
        : 'Add sale categories to see category totals.');

  return createInsight(
    'month',
    products.length > 0 || byRevenue.length > 0 ? 'positive' : 'info',
    language === 'hi' ? 'उत्पाद और श्रेणी की बिक्री' : 'Top products and categories',
    productText + ' ' + categoryText,
  );
}
export function buildBusinessInsights(input: InsightEngineInput): BusinessInsight[] {
  const now = input.now || new Date();
  const { today, week, month, sales, expenses, udhaar, shopType, udhaarLevel, language } = input;

  const todayCards = [
    buildPeakTimeInsight(sales, today.range, shopType, language),
    buildTodayPerformance(today, sales, expenses, language, now),
  ];
  const weekCards = [
    buildWeeklySalesPattern(week, sales, language),
    buildWeeklyExpenseChanges(week, expenses, language),
    buildWeeklyProductPerformance(week, sales, language, shopType),
  ];
  const monthCards = [
    buildMonthlyOverallPerformance(month, language),
    buildMonthlyBusinessTrend(month, sales, language),
    buildMonthlyExpenseHealth(month, language),
    buildMonthlyRisk(month, sales, udhaar, udhaarLevel, language, now),
    buildMonthlyProductMix(month, sales, language),
  ];

  return [...todayCards, ...weekCards, ...monthCards];
}

export { TARGET_COUNTS as INSIGHT_TARGET_COUNTS };
