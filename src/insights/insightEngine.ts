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

function comparisonExpenses(metrics: PeriodMetrics, expenses: ExpenseEntry[], now: Date): ExpenseEntry[] {
  const entries = expenseEntriesInRange(expenses, metrics.previousRange);
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
    return createInsight('day', 'positive',
      language === 'hi'
        ? (isServiceShop ? 'ग्राहकों का सबसे व्यस्त समय' : 'बिक्री का सबसे व्यस्त समय')
        : (isServiceShop ? 'Your peak customer hours' : 'Your peak sales hours'),
      language === 'hi'
        ? windowName + ' (' + timeRange + ') के दौरान ' + best[1].count + ' बिक्री एंट्री और ' + money(best[1].amount) + ' दर्ज हुए। इस समय ज़रूरी सामान, तैयारी या स्टाफ़ की उपलब्धता पर ध्यान दें।'
        : windowName + ' (' + timeRange + ') is the strongest recorded window, with ' + best[1].count + ' sale entries worth ' + money(best[1].amount) + '. Plan availability, preparation or staffing around this time.');
  }

  return createInsight('day', 'info',
    language === 'hi'
      ? (isServiceShop ? 'व्यस्त समय पहचानने के लिए और रिकॉर्ड चाहिए' : 'बिक्री का व्यस्त समय पहचानने के लिए और रिकॉर्ड चाहिए')
      : 'More sales records are needed to identify peak hours',
    language === 'hi'
      ? 'आज अभी ' + entries.length + ' समय सहित बिक्री एंट्री हैं। कम से कम 3 एंट्री दर्ज होने पर शुरुआती पैटर्न दिखेगा; कई दिनों के रिकॉर्ड से यह और भरोसेमंद होगा।'
      : 'There are ' + entries.length + ' sales entries with timestamps today. At least 3 are needed for an initial signal; several days of records will make the pattern more reliable.');
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
  const previousExpenses = totalAmount(comparisonExpenses(metrics, expenses, now));
  const salesChange = percentChange(metrics.sales, previousSales);
  const expensesChange = percentChange(metrics.expenses, previousExpenses);
  const balance = metrics.sales - metrics.expenses;
  const tone: InsightTone = balance < 0 || (salesChange !== null && salesChange <= -15)
    ? 'warning'
    : metrics.sales > 0
      ? 'positive'
      : 'info';

  const salesComparison = salesChange === null
    ? (language === 'hi' ? 'कल इसी समय से बिक्री की तुलना के लिए पर्याप्त आधार नहीं है।' : 'There is not enough data to compare sales with yesterday at this time.')
    : (language === 'hi'
        ? 'कल इसी समय से बिक्री ' + Math.abs(salesChange) + '% ' + (salesChange > 0 ? 'ज़्यादा' : salesChange < 0 ? 'कम' : 'बराबर') + 'है।'
        : 'Sales are ' + Math.abs(salesChange) + '% ' + (salesChange > 0 ? 'higher' : salesChange < 0 ? 'lower' : 'unchanged') + ' than yesterday at this time.');
  const expenseComparison = expensesChange === null
    ? (language === 'hi' ? 'खर्च की पिछली समान समय वाली तुलना उपलब्ध नहीं है।' : 'There is not enough comparable expense history yet.')
    : (language === 'hi'
        ? 'दर्ज खर्च ' + Math.abs(expensesChange) + '% ' + (expensesChange > 0 ? 'ज़्यादा' : expensesChange < 0 ? 'कम' : 'बराबर') + 'हैं।'
        : 'Recorded expenses are ' + Math.abs(expensesChange) + '% ' + (expensesChange > 0 ? 'higher' : expensesChange < 0 ? 'lower' : 'unchanged') + '.');

  return createInsight('day', tone,
    language === 'hi' ? 'आज की बिक्री और खर्च' : "Today's sales and expense performance",
    language === 'hi'
      ? 'बिक्री ' + money(metrics.sales) + ' (' + saleEntries.length + ' एंट्री), खर्च ' + money(metrics.expenses) + ' (' + expenseEntries.length + ' एंट्री) हैं। दर्ज खर्च घटाने के बाद ' + money(balance) + ' बचते हैं; यह पूरा नेट प्रॉफिट नहीं है। ' + salesComparison + ' ' + expenseComparison
      : 'Recorded sales are ' + money(metrics.sales) + ' across ' + saleEntries.length + ' entries; recorded expenses are ' + money(metrics.expenses) + ' across ' + expenseEntries.length + ' entries. ' + money(balance) + ' remains after recorded expenses, not necessarily net profit. ' + salesComparison + ' ' + expenseComparison);
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
    return createInsight('week', 'info',
      language === 'hi' ? 'इस हफ़्ते बिक्री का पैटर्न उपलब्ध नहीं' : 'No weekly sales pattern is available yet',
      language === 'hi'
        ? 'इस हफ़्ते बिक्री की एंट्री दर्ज करें। कई अलग-अलग दिनों के रिकॉर्ड से मज़बूत और धीमे दिनों की पहचान होगी।'
        : 'Record sales through the week. Entries across several different days are needed to identify stronger and quieter trading days.');
  }

  const change = metrics.salesChange;
  const comparison = change === null
    ? (language === 'hi' ? ' पिछली समान अवधि से तुलना के लिए अभी पर्याप्त आधार नहीं है।' : ' There is not enough history for a reliable comparison with the previous equivalent week.')
    : (language === 'hi'
        ? ' पिछली समान अवधि से कुल बिक्री ' + Math.abs(change) + '% ' + (change > 0 ? 'बढ़ी' : change < 0 ? 'घटी' : 'बदली नहीं') + ' है।'
        : ' Total sales are ' + Math.abs(change) + '% ' + (change > 0 ? 'higher' : change < 0 ? 'lower' : 'unchanged') + ' than the comparable week.');
  const bestDay = days[0];
  const dateLabel = new Date(bestDay[0] + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const dayPattern = days.length >= 3
    ? (language === 'hi'
        ? 'सबसे ज़्यादा बिक्री ' + dateLabel + ' को ' + money(bestDay[1]) + ' रही। ' + days.length + ' अलग-अलग दिनों में एंट्री दर्ज हुई।'
        : 'The strongest recorded day was ' + dateLabel + ' at ' + money(bestDay[1]) + '. Sales were recorded on ' + days.length + ' different days.')
    : (language === 'hi'
        ? 'अभी केवल ' + days.length + ' अलग-अलग दिनों में बिक्री दर्ज है; नियमित दिन-पैटर्न के लिए कम से कम 3 दिन चाहिए।'
        : 'Sales are recorded on only ' + days.length + ' different day(s); at least 3 recorded days are needed for a useful weekly pattern.');
  return createInsight('week', change !== null && change <= -15 ? 'warning' : 'info',
    language === 'hi' ? 'इस हफ़्ते बिक्री का पैटर्न' : 'This week’s sales pattern',
    language === 'hi'
      ? 'कुल दर्ज बिक्री ' + money(metrics.sales) + ' है। ' + dayPattern + comparison
      : 'Recorded sales total ' + money(metrics.sales) + '. ' + dayPattern + comparison);
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
    return createInsight('week', 'warning',
      language === 'hi' ? categoryChange.category + ' का खर्च बढ़ा' : categoryChange.category.replace(/[_-]/gu, ' ') + ' spending increased',
      language === 'hi'
        ? categoryChange.category + ' पर ' + money(categoryChange.amount) + ' खर्च हुआ, पिछली समान अवधि से ' + categoryChange.change + '% ज़्यादा। बिल और खरीद की वजह जाँचें।'
        : categoryChange.category.replace(/[_-]/gu, ' ') + ' spending reached ' + money(categoryChange.amount) + ', up ' + categoryChange.change + '% from the comparable week. Check the bills and whether the increase was planned.');
  }

  const largest = [...currentByCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (currentTotal <= 0) {
    return createInsight('week', 'info',
      language === 'hi' ? 'इस हफ़्ते खर्च दर्ज नहीं हुए' : 'No expenses recorded this week',
      language === 'hi'
        ? 'अगर खर्च हुए हैं तो स्टॉक खरीद, किराया, बिल और दूसरे खर्च दर्ज करें। अधूरा रिकॉर्ड खर्च के ट्रेंड को छिपा सकता है।'
        : 'Record stock purchases, rent, bills and other shop costs if they occurred. Missing entries can hide the true expense trend.');
  }
  const summary = largest
    ? (language === 'hi'
        ? 'सबसे बड़ा खर्च ' + largest[0] + ' पर ' + money(largest[1]) + ' है।'
        : 'The largest category is ' + largest[0].replace(/[_-]/gu, ' ') + ' at ' + money(largest[1]) + '.')
    : '';
  const changeText = change === null
    ? (language === 'hi' ? ' पिछली समान अवधि से तुलना उपलब्ध नहीं है।' : ' There is not enough previous-week data for a comparison.')
    : (language === 'hi'
        ? ' कुल खर्च ' + Math.abs(change) + '% ' + (change > 0 ? 'बढ़ा' : change < 0 ? 'घटा' : 'बदला नहीं') + ' है।'
        : ' Total expenses are ' + Math.abs(change) + '% ' + (change > 0 ? 'higher' : change < 0 ? 'lower' : 'unchanged') + '.');
  return createInsight('week', change !== null && change >= 25 ? 'warning' : 'info',
    language === 'hi' ? 'इस हफ़्ते खर्च में बदलाव' : 'This week’s expense changes',
    language === 'hi'
      ? summary + changeText + ' खर्च की एंट्री और बिलों का मिलान करें।'
      : summary + changeText + ' Reconcile expense entries with bills before drawing conclusions.');
}

function buildWeeklyProductPerformance(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
  shopType: ShopType | null,
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const products = itemSummariesFromEntries(entries);
  const subject = SERVICE_SHOPS.has(shopType || 'other')
    ? (language === 'hi' ? 'सेवाएँ' : 'services')
    : (language === 'hi' ? 'उत्पाद' : 'products');
  if (products.length === 0) {
    const hasNames = entries.some(entry => typeof entry.itemName === 'string' && entry.itemName.trim());
    return createInsight('week', 'info',
      language === 'hi' ? 'सबसे ज़्यादा बिकने वाले का पता नहीं चला' : 'Best-selling ' + subject + ' cannot be identified yet',
      language === 'hi'
        ? (hasNames
            ? 'नाम दर्ज हैं, लेकिन बेची गई वस्तुओं/पैकों की संख्या उपलब्ध नहीं है। सही संख्या दर्ज करें; केवल ज़्यादा रकम से बेस्टसेलर तय नहीं होगा।'
            : 'हर बिक्री में उत्पाद/सेवा का नाम और बेची गई संख्या दर्ज करें। सबसे ज़्यादा यूनिट वाली चीज़ को ही बेस्टसेलर माना जाएगा।')
        : (hasNames
            ? 'Names are recorded, but sold item/pack counts are missing. Record quantities; a higher sale amount alone does not determine a bestseller.'
            : 'Record the product or service name and number sold with each sale. The bestseller is the one with the highest unit count.'));
  }

  const top = products.slice(0, 3);
  const list = top.map((item, index) =>
    (index + 1) + '. ' + item.name + ' — ' + item.unitsSold.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN') +
    (language === 'hi' ? ' आइटम/पैक' : ' items/packs') + ' (' + money(item.revenue) + ')'
  ).join('; ');
  const totalUnits = products.reduce((sum, item) => sum + item.unitsSold, 0);
  const isServiceShop = SERVICE_SHOPS.has(shopType || 'other');
  return createInsight('week', 'positive',
    language === 'hi'
      ? (isServiceShop ? 'सबसे ज़्यादा की गई सेवाएँ' : 'सबसे ज़्यादा बिके उत्पाद')
      : (isServiceShop ? 'Most frequently completed services' : 'Best-selling products by units sold'),
    language === 'hi'
      ? 'सबसे ज़्यादा यूनिट से क्रम: ' + list + '। कुल ' + totalUnits.toLocaleString('hi-IN') + ' यूनिट दर्ज हुईं। रैंकिंग बिक्री की रकम से नहीं, संख्या से है।'
      : 'Ranked by units/packs sold: ' + list + '. Total recorded units: ' + totalUnits.toLocaleString('en-IN') + '. Ranking is based on quantity sold, never revenue.');
}

function buildMonthlyOverallPerformance(
  metrics: PeriodMetrics,
  language: 'en' | 'hi',
): BusinessInsight {
  const balance = metrics.sales - metrics.expenses;
  const margin = metrics.sales > 0 ? Math.round((balance / metrics.sales) * 100) : null;
  const tone: InsightTone = balance < 0 ? 'warning' : metrics.sales > 0 && metrics.expenses > 0 ? 'positive' : 'info';
  const salesChange = metrics.salesChange === null
    ? (language === 'hi' ? ' बिक्री की पिछली समान अवधि से तुलना उपलब्ध नहीं है।' : ' There is not enough previous-period sales history for comparison.')
    : (language === 'hi'
        ? ' बिक्री पिछली समान अवधि से ' + Math.abs(metrics.salesChange) + '% ' + (metrics.salesChange > 0 ? 'बढ़ी' : metrics.salesChange < 0 ? 'घटी' : 'बदली नहीं') + ' है।'
        : ' Sales are ' + Math.abs(metrics.salesChange) + '% ' + (metrics.salesChange > 0 ? 'higher' : metrics.salesChange < 0 ? 'lower' : 'unchanged') + ' than the comparable period.');
  const expenseChange = metrics.expensesChange === null
    ? (language === 'hi' ? ' खर्च की तुलना के लिए पर्याप्त पुराना रिकॉर्ड नहीं है।' : ' There is not enough previous expense history for comparison.')
    : (language === 'hi'
        ? ' खर्च ' + Math.abs(metrics.expensesChange) + '% ' + (metrics.expensesChange > 0 ? 'बढ़े' : metrics.expensesChange < 0 ? 'घटे' : 'बदले नहीं') + 'हैं।'
        : ' Expenses are ' + Math.abs(metrics.expensesChange) + '% ' + (metrics.expensesChange > 0 ? 'higher' : metrics.expensesChange < 0 ? 'lower' : 'unchanged') + '.');
  return createInsight('month', tone,
    language === 'hi' ? 'इस महीने दुकान का कुल प्रदर्शन' : 'Overall business performance this month',
    language === 'hi'
      ? 'दर्ज बिक्री ' + money(metrics.sales) + ', दर्ज खर्च ' + money(metrics.expenses) + ' और खर्च के बाद बची रकम ' + money(balance) + ' है' + (margin === null ? '।' : ' (' + margin + '% दर्ज बिक्री)।') + salesChange + expenseChange + ' यह पूरा नेट प्रॉफिट नहीं है; केवल दर्ज लेन-देन शामिल हैं।'
      : 'Recorded sales are ' + money(metrics.sales) + ', recorded expenses are ' + money(metrics.expenses) + ', and the balance after recorded expenses is ' + money(balance) + (margin === null ? '.' : ' (' + margin + '% of recorded sales).') + salesChange + expenseChange + ' This is not verified net profit; only entries recorded in Dukaan Dost are included.');
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
    return createInsight('month', 'info',
      language === 'hi' ? 'महीने का बिक्री ट्रेंड उपलब्ध नहीं' : 'Monthly sales trend is not available yet',
      language === 'hi'
        ? 'अलग-अलग दिनों की बिक्री दर्ज करें। लगातार रिकॉर्ड से पता चलेगा कि बिक्री नियमित है या कुछ दिनों पर निर्भर है।'
        : 'Record sales across different days. Consistent daily entries reveal whether sales are steady or concentrated on a few days.');
  }
  if (days.length < 3) {
    return createInsight('month', 'info',
      language === 'hi' ? 'बिक्री ट्रेंड के लिए और दिन चाहिए' : 'More trading days are needed for a monthly trend',
      language === 'hi'
        ? 'अभी ' + days.length + ' अलग-अलग दिनों में बिक्री दर्ज हुई है। कम से कम 3 रिकॉर्ड वाले दिनों के बाद तेज़ और धीमे दिनों की तुलना करें। खाली दिन अपने-आप शून्य बिक्री नहीं माने जाते।'
        : 'Sales are recorded on only ' + days.length + ' different days. Compare stronger and quieter days after at least 3 recorded trading days. Dates without entries are not assumed to be zero-sales days.');
  }
  const low = days[0];
  const high = days[days.length - 1];
  const dateLabel = (key: string) => new Date(key + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const ratio = low[1] > 0 ? high[1] / low[1] : null;
  return createInsight('month', ratio !== null && ratio >= 3 ? 'warning' : 'info',
    language === 'hi' ? 'महीने के दिनों में बिक्री का ट्रेंड' : 'Business trend across recorded days',
    language === 'hi'
      ? 'सबसे ज़्यादा बिक्री ' + dateLabel(high[0]) + ' को ' + money(high[1]) + 'रही, जबकि सबसे कम ' + dateLabel(low[0]) + ' को ' + money(low[1]) + 'रही। ' + days.length + ' अलग दिनों का रिकॉर्ड है। बड़े अंतर वाले दिनों के कारण और एंट्री की पूरी जानकारी जाँचें।'
      : 'The strongest recorded day was ' + dateLabel(high[0]) + ' at ' + money(high[1]) + ', while the quietest was ' + dateLabel(low[0]) + ' at ' + money(low[1]) + '. This covers ' + days.length + ' recorded trading days. Review what drove the difference and whether entries are complete.');
}

function buildMonthlyExpenseHealth(
  metrics: PeriodMetrics,
  language: 'en' | 'hi',
): BusinessInsight {
  const largest = metrics.topExpenses[0];
  if (metrics.expenses <= 0) {
    return createInsight('month', 'info',
      language === 'hi' ? 'खर्च की स्थिति मापने के लिए रिकॉर्ड चाहिए' : 'Expense health needs more complete records',
      language === 'hi'
        ? 'इस महीने खर्च दर्ज नहीं हुए। स्टॉक खरीद, किराया, वेतन, बिजली और दूसरे खर्च दर्ज करें; बिना खर्च के रिकॉर्ड के लागत का आकलन अधूरा रहेगा।'
        : 'No expenses are recorded this month. Add stock purchases, rent, wages, electricity and other shop costs; expense health cannot be assessed from an empty cost record.');
  }
  if (metrics.sales <= 0) {
    return createInsight('month', 'warning',
      language === 'hi' ? 'खर्च दर्ज हैं, लेकिन बिक्री का रिकॉर्ड नहीं' : 'Expenses are recorded without sales entries',
      language === 'hi'
        ? 'दर्ज खर्च ' + money(metrics.expenses) + ' हैं, लेकिन बिक्री दर्ज नहीं है। पहले जाँचें कि बिक्री की एंट्री छूटी तो नहीं; लागत की तुलना बिना बिक्री डेटा के संभव नहीं।'
        : money(metrics.expenses) + ' in expenses are recorded, but no sales are recorded. Check whether sales entries are missing; costs cannot be evaluated properly without sales data.');
  }

  const share = Math.round((metrics.expenses / metrics.sales) * 100);
  const salesChange = metrics.salesChange;
  const expensesChange = metrics.expensesChange;
  const growthGap = salesChange !== null && expensesChange !== null ? expensesChange - salesChange : null;
  const tone: InsightTone = share >= 85 || (growthGap !== null && growthGap >= 15) ? 'warning' : share <= 60 ? 'positive' : 'info';
  const largestText = largest
    ? (language === 'hi'
        ? ' सबसे बड़ा दर्ज खर्च ' + largest.category.replace(/[_-]/gu, ' ') + ' है: ' + money(largest.amount) + ' (' + largest.share + '%)।'
        : ' The largest expense category is ' + largest.category.replace(/[_-]/gu, ' ') + ': ' + money(largest.amount) + ' (' + largest.share + '%).')
    : '';
  const comparison = growthGap === null
    ? (language === 'hi' ? ' बिक्री और खर्च की रफ़्तार की तुलना के लिए पर्याप्त पुराना रिकॉर्ड नहीं है।' : ' There is not enough prior-period history to compare sales and expense growth.')
    : (language === 'hi'
        ? ' खर्च की वृद्धि बिक्री की वृद्धि से ' + Math.abs(growthGap) + ' अंक ' + (growthGap > 0 ? 'तेज़' : growthGap < 0 ? 'धीमी' : 'बराबर') + 'है।'
        : ' Expense growth is ' + Math.abs(growthGap) + ' percentage points ' + (growthGap > 0 ? 'faster' : growthGap < 0 ? 'slower' : 'equal') + ' to sales growth.');
  return createInsight('month', tone,
    language === 'hi' ? 'इस महीने खर्च की सेहत' : 'Expense health this month',
    language === 'hi'
      ? 'दर्ज खर्च, बिक्री का ' + share + '% हैं (' + money(metrics.expenses) + ' खर्च बनाम ' + money(metrics.sales) + ' बिक्री)।' + largestText + comparison + ' यह अनुपात केवल दर्ज एंट्री पर आधारित है।'
      : 'Recorded expenses equal ' + share + '% of recorded sales (' + money(metrics.expenses) + ' expenses against ' + money(metrics.sales) + ' sales).' + largestText + comparison + ' This ratio is based only on entries recorded in the app.');
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
      title: language === 'hi' ? 'दर्ज खर्च, बिक्री से ज़्यादा हैं' : 'Recorded expenses are higher than sales',
      description: language === 'hi'
        ? 'इस महीने बिक्री ' + money(metrics.sales) + ' और खर्च ' + money(metrics.expenses) + ' हैं। दर्ज रकम के हिसाब से ' + money(Math.abs(balance)) + ' की कमी है। छूटी हुई बिक्री या खर्च की एंट्री और बड़े बिल जाँचें।'
        : 'This month has ' + money(metrics.sales) + ' in sales and ' + money(metrics.expenses) + ' in expenses, leaving a recorded shortfall of ' + money(Math.abs(balance)) + '. Check for missing sales entries and review major bills.'
    });
  }
  if (metrics.sales > 0 && metrics.expenses > 0 && metrics.expenses / metrics.sales >= 0.9) {
    risks.push({
      severity: 90,
      title: language === 'hi' ? 'खर्च बिक्री के बहुत करीब पहुँच रहे हैं' : 'Expenses are close to recorded sales',
      description: language === 'hi'
        ? 'दर्ज खर्च, बिक्री का ' + Math.round((metrics.expenses / metrics.sales) * 100) + '% हैं। अगली खरीद या बड़े खर्च से पहले बिल, ज़रूरत और बिक्री की एंट्री जाँचें।'
        : 'Recorded expenses are ' + Math.round((metrics.expenses / metrics.sales) * 100) + '% of recorded sales. Before the next large purchase, review bills, necessity and whether all sales have been entered.'
    });
  }
  if (metrics.salesChange !== null && metrics.salesChange <= -20) {
    risks.push({
      severity: 80,
      title: language === 'hi' ? 'बिक्री में तेज़ गिरावट' : 'A sharp sales decline needs attention',
      description: language === 'hi'
        ? 'पिछली समान अवधि की तुलना में दर्ज बिक्री ' + Math.abs(metrics.salesChange) + '% घटी है। बिक्री के दिन, खुले रहने के समय और मुख्य उत्पादों की एंट्री जाँचें।'
        : 'Recorded sales are down ' + Math.abs(metrics.salesChange) + '% versus the comparable period. Review trading days, opening hours and entries for your main products or services.'
    });
  }
  const expenseGrowthGap = metrics.salesChange !== null && metrics.expensesChange !== null
    ? metrics.expensesChange - metrics.salesChange
    : null;
  if (expenseGrowthGap !== null && expenseGrowthGap >= 20 && metrics.expensesChange !== null && metrics.expensesChange >= 20) {
    risks.push({
      severity: 75,
      title: language === 'hi' ? 'खर्च बिक्री से तेज़ बढ़ रहे हैं' : 'Expenses are growing faster than sales',
      description: language === 'hi'
        ? 'खर्च ' + metrics.expensesChange + '% बढ़े, जबकि बिक्री ' + (metrics.salesChange as number) + '% बदली। अगली खरीद से पहले खर्च की बढ़ोतरी का कारण जाँचें।'
        : 'Expenses rose ' + metrics.expensesChange + '% while sales changed by ' + metrics.salesChange + '%. Check what is driving the increase before committing to more spending.'
    });
  }

  if (shouldShowUdhaar(udhaarLevel, sales, udhaar)) {
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const overdue = udhaar.filter(entry => !entry.paid && Number(entry.amount) > 0 && Boolean(entry.dueDate && entry.dueDate < todayKey));
    const overdueTotal = totalAmount(overdue);
    if (overdue.length > 0) {
      risks.push({
        severity: 85,
        title: language === 'hi' ? 'कुछ उधार की तय तारीख़ निकल चुकी है' : 'Some recorded udhaar is overdue',
        description: language === 'hi'
          ? overdue.length + ' बकाया एंट्री की तय तारीख़ निकल चुकी है; कुल ' + money(overdueTotal) + ' अभी बाकी है। रिकॉर्ड मिलाएँ और तय तारीख़ के अनुसार विनम्र फ़ॉलो-अप करें।'
          : overdue.length + ' unpaid balance(s) are past their recorded due dates, totalling ' + money(overdueTotal) + '. Reconcile the entries and follow up politely according to the agreed dates.'
      });
    }
  }

  if (risks.length > 0) {
    const highest = risks.sort((a, b) => b.severity - a.severity)[0];
    return createInsight('month', 'warning', highest.title, highest.description);
  }

  return createInsight('month', 'info',
    language === 'hi' ? 'अभी कोई बड़ी समस्या दर्ज डेटा से नहीं दिखी' : 'No major risk is visible in the recorded data',
    language === 'hi'
      ? 'मौजूदा बिक्री, खर्च और उपलब्ध उधार रिकॉर्ड में कोई बड़ा चेतावनी संकेत नहीं मिला। इसका मतलब यह नहीं कि हर समस्या दर्ज है—एंट्री पूरी रखें और बिल/स्टॉक की वास्तविक जाँच करते रहें।'
      : 'No major warning signal appears in the available sales, expense and credit records. This does not prove the shop has no problems; keep entries complete and continue checking bills and physical stock.');
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

  const categoryRows = [...categories.entries()].map(([name, value]) => ({
    name,
    revenue: value.revenue,
    units: aggregateProductSales(value.entries).reduce((sum, product) => sum + product.unitsSold, 0),
  }));
  const byRevenue = categoryRows.slice().sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
  const byUnits = categoryRows.slice().sort((a, b) => b.units - a.units || a.name.localeCompare(b.name));
  const productText = products.length > 0
    ? (language === 'hi'
        ? 'यूनिट के हिसाब से सबसे ज़्यादा बिके: ' + products.slice(0, 3).map(item => item.name + ' (' + item.unitsSold.toLocaleString('hi-IN') + ' आइटम/पैक)').join(', ') + '।'
        : 'Top products by units sold: ' + products.slice(0, 3).map(item => item.name + ' (' + item.unitsSold.toLocaleString('en-IN') + ' items/packs)').join(', ') + '.')
    : (language === 'hi'
        ? 'बेस्टसेलर तय करने के लिए बेची गई यूनिट/पैक की संख्या दर्ज नहीं है; सिर्फ़ बिक्री की रकम से बेस्टसेलर तय नहीं होगा।'
        : 'A unit-based bestseller cannot be identified because sold item/pack counts are not recorded; revenue alone is not used to rank bestsellers.');
  const revenueText = byRevenue.length > 0
    ? (language === 'hi'
        ? 'बिक्री की रकम में सबसे बड़ी श्रेणी ' + byRevenue[0].name + ' है (' + money(byRevenue[0].revenue) + ')'
        : 'By revenue, the largest recorded category is ' + byRevenue[0].name + ' (' + money(byRevenue[0].revenue) + ')')
    : (language === 'hi' ? 'श्रेणी के हिसाब से बिक्री की रकम उपलब्ध नहीं है' : 'Category-wise revenue is not available because sale categories are missing');
  const unitCategoryText = byUnits.length > 0 && byUnits[0].units > 0
    ? (language === 'hi'
        ? 'सबसे ज़्यादा यूनिट वाली श्रेणी ' + byUnits[0].name + ' है (' + byUnits[0].units.toLocaleString('hi-IN') + ' यूनिट)'
        : 'The category with the most recorded units is ' + byUnits[0].name + ' (' + byUnits[0].units.toLocaleString('en-IN') + ' units)')
    : (language === 'hi' ? 'श्रेणी-वार यूनिट संख्या उपलब्ध नहीं है' : 'Category-wise unit counts are not available yet');
  return createInsight('month', products.length > 0 || byRevenue.length > 0 ? 'positive' : 'info',
    language === 'hi' ? 'उत्पाद और श्रेणी की बिक्री का बँटवारा' : 'Product and category sales mix',
    productText + ' ' + revenueText + '. ' + unitCategoryText + '. ' +
      (language === 'hi'
        ? 'बेस्टसेलर की रैंकिंग हमेशा सबसे ज़्यादा बेची गई यूनिट से होती है, सबसे ज़्यादा कमाई से नहीं।'
        : 'Bestseller ranking is always based on the highest number of units sold, not the highest revenue.'));
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
