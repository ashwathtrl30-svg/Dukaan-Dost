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
  records: number;
  unitsSold: number;
}

const TARGET_COUNTS: Record<InsightsPeriod, number> = { day: 6, week: 7, month: 8 };
const SERVICE_SHOPS = new Set<ShopType>(['salon', 'tailor']);

function money(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

function periodLabel(period: InsightsPeriod, language: 'en' | 'hi'): string {
  if (language === 'hi') return period === 'day' ? 'आज' : period === 'week' ? 'इस हफ़्ते' : 'इस महीने';
  return period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month';
}

function saleEntriesInRange(sales: SaleEntry[], range: PeriodMetrics['range']): SaleEntry[] {
  return sales.filter(entry => entry.date >= range.start && entry.date <= range.end && Number(entry.amount) > 0);
}

function expenseEntriesInRange(expenses: ExpenseEntry[], range: PeriodMetrics['range']): ExpenseEntry[] {
  return expenses.filter(entry => entry.date >= range.start && entry.date <= range.end && Number(entry.amount) > 0);
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

function createInsight(
  period: InsightsPeriod,
  tone: InsightTone,
  title: string,
  description: string,
): BusinessInsight {
  return { period, tone, title, description, priority: 0 };
}

function itemSummaries(sales: SaleEntry[], range: PeriodMetrics['range']): ItemSummary[] {
  const rows = new Map<string, ItemSummary>();
  saleEntriesInRange(sales, range).forEach(entry => {
    if (typeof entry.itemName !== 'string' || !entry.itemName.trim()) return;
    const key = normalizeProductIdentity(entry.itemName);
    if (!key) return;
    const row = rows.get(key) || {
      key,
      name: entry.itemName.trim().replace(/\s+/gu, ' '),
      revenue: 0,
      records: 0,
      unitsSold: 0,
    };
    row.revenue += Number(entry.amount);
    row.records += 1;
    rows.set(key, row);
  });

  aggregateProductSales(sales, range).forEach(product => {
    const row = rows.get(product.key);
    if (row) row.unitsSold = product.unitsSold;
  });

  return [...rows.values()];
}

function itemType(shopType: ShopType | null, language: 'en' | 'hi'): string {
  if (SERVICE_SHOPS.has(shopType || 'other')) return language === 'hi' ? 'सेवा' : 'service';
  return language === 'hi' ? 'उत्पाद' : 'product';
}

function buildSalesPerformance(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const label = periodLabel(metrics.period, language);
  if (entries.length === 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? label + ' बिक्री की एंट्री नहीं मिली' : 'No sales entries recorded ' + label.toLowerCase(),
      language === 'hi'
        ? 'इस अवधि की हर बिक्री दर्ज करें। तभी कुल बिक्री, औसत बिल और पिछले समय से सही तुलना दिखाई जा सकेगी।'
        : 'Record each sale during this period. Dukaan Dost can then calculate sales, average recorded sale value and a reliable comparison.');
  }

  const average = totalAmount(entries) / entries.length;
  let comparison = '';
  if (metrics.period === 'day') {
    const previous = comparisonSales(metrics, sales, now);
    const previousTotal = totalAmount(previous);
    const change = percentChange(metrics.sales, previousTotal);
    comparison = change === null
      ? (language === 'hi'
          ? ' अभी कल के इसी समय तक का पर्याप्त आधार नहीं है।'
          : ' There is not enough recorded data from yesterday up to this same time for a fair comparison.')
      : (language === 'hi'
          ? ' कल इसी समय तक की तुलना में बिक्री ' + Math.abs(change) + '% ' + (change > 0 ? 'ज़्यादा' : change < 0 ? 'कम' : 'बराबर') + ' है।'
          : ' Sales are ' + Math.abs(change) + '% ' + (change > 0 ? 'higher' : change < 0 ? 'lower' : 'unchanged') + ' than yesterday up to this same time.');
  } else if (metrics.salesChange !== null) {
    comparison = language === 'hi'
      ? ' पिछली समान अवधि से बिक्री ' + Math.abs(metrics.salesChange) + '% ' + (metrics.salesChange > 0 ? 'बढ़ी' : metrics.salesChange < 0 ? 'घटी' : 'बदली नहीं') + ' है।'
      : ' Sales are ' + (metrics.salesChange > 0 ? 'up ' : metrics.salesChange < 0 ? 'down ' : 'unchanged ') + Math.abs(metrics.salesChange) + '% versus the comparable period.';
  } else {
    comparison = language === 'hi'
      ? ' पिछली समान अवधि का भरोसेमंद आधार अभी उपलब्ध नहीं है।'
      : ' There is not enough previous-period data for a reliable comparison yet.';
  }

  return createInsight(metrics.period, metrics.salesChange !== null && metrics.salesChange < -10 ? 'warning' : 'positive',
    language === 'hi' ? label + ' की बिक्री और औसत बिल' : label + ' sales and average recorded sale',
    language === 'hi'
      ? 'कुल बिक्री ' + money(metrics.sales) + ' है। ' + entries.length + ' बिक्री एंट्री का औसत ' + money(average) + ' है।' + comparison
      : 'Recorded sales total ' + money(metrics.sales) + ' across ' + entries.length + ' sale entries, averaging ' + money(average) + ' per entry.' + comparison);
}

function buildTopPerformer(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  shopType: ShopType | null,
  language: 'en' | 'hi',
): BusinessInsight {
  const items = itemSummaries(sales, metrics.range);
  const type = itemType(shopType, language);
  if (items.length === 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'सबसे ज़्यादा बिकने वाला नाम अभी उपलब्ध नहीं' : 'Top-selling ' + type + ' is not identified yet',
      language === 'hi'
        ? 'बिक्री में उत्पाद या सेवा का नाम और संख्या दर्ज करें। इससे पता चलेगा कि ग्राहक सबसे ज़्यादा क्या खरीद रहे हैं या कौन-सी सेवा ले रहे हैं।'
        : 'Add the item or service name and its sold quantity to sales entries. This will show what customers buy or book most often.');
  }
  const counted = items.filter(item => item.unitsSold > 0);
  const best = (counted.length > 0
    ? counted.slice().sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    : items.slice().sort((a, b) => b.revenue - a.revenue))[0];
  const measurement = best.unitsSold > 0
    ? (language === 'hi' ? best.unitsSold.toLocaleString('hi-IN') + ' आइटम/पैक दर्ज हुए' : best.unitsSold.toLocaleString('en-IN') + ' items/packs were recorded')
    : (language === 'hi' ? money(best.revenue) + ' की बिक्री दर्ज हुई' : money(best.revenue) + ' in recorded sales');
  return createInsight(metrics.period, 'positive',
    language === 'hi' ? 'सबसे ज़्यादा बिकने वाला ' + type : 'Top-performing ' + type,
    language === 'hi'
      ? best.name + ' सबसे आगे है। ' + measurement + '। अलग-अलग ब्रांड या नाम को अपने-आप एक नहीं माना गया है।'
      : best.name + ' is leading. ' + measurement + '. Distinct product names and brands are kept separate rather than being guessed as the same item.');
}

function buildProductMovement(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const current = itemSummaries(sales, metrics.range);
  const previous = itemSummaries(sales, metrics.previousRange);
  const previousByKey = new Map(previous.map(item => [item.key, item]));
  const movements = current.map(item => {
    const prior = previousByKey.get(item.key);
    if (!prior || prior.unitsSold <= 0 || item.unitsSold <= 0) return null;
    const change = percentChange(item.unitsSold, prior.unitsSold);
    if (change === null || Math.abs(change) < 20 || Math.abs(item.unitsSold - prior.unitsSold) < 1) return null;
    return { item, prior, change };
  }).filter((item): item is { item: ItemSummary; prior: ItemSummary; change: number } => item !== null)
    .sort((a, b) => Math.abs(b.item.unitsSold - b.prior.unitsSold) - Math.abs(a.item.unitsSold - a.prior.unitsSold));

  if (movements.length > 0) {
    const trend = movements[0];
    const rising = trend.change > 0;
    return createInsight(metrics.period, rising ? 'positive' : 'warning',
      language === 'hi' ? 'उत्पाद/सेवा की माँग में बदलाव' : 'A product or service demand shift',
      language === 'hi'
        ? trend.item.name + ' की दर्ज बिक्री ' + trend.prior.unitsSold + ' से ' + trend.item.unitsSold + ' आइटम/पैक हुई (' + Math.abs(trend.change) + '% ' + (rising ? 'बढ़ी' : 'घटी') + ')। बदलाव की वजह और उपलब्धता जाँचें।'
        : trend.item.name + ' moved from ' + trend.prior.unitsSold + ' to ' + trend.item.unitsSold + ' recorded items/packs (' + Math.abs(trend.change) + '% ' + (rising ? 'higher' : 'lower') + '). Check what changed in demand and whether availability matched it.');
  }

  if (current.length > 0 && previous.length > 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'दर्ज उत्पाद बिक्री में बड़ा बदलाव नहीं' : 'No major item movement detected',
      language === 'hi'
        ? 'दोनों तुलनीय अवधियों में दर्ज उत्पादों की संख्या में बड़ा बदलाव नहीं दिखा। एंट्री पूरी होने पर ही इस ट्रेंड पर भरोसा करें।'
        : 'No large change appears in item counts for products recorded in both periods. Treat this as a record-based signal and check that entries are complete.');
  }

  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'उत्पाद ट्रेंड के लिए और रिकॉर्ड चाहिए' : 'More item history is needed for a demand trend',
    language === 'hi'
      ? 'एक ही उत्पाद या सेवा का नाम और संख्या लगातार दर्ज करें। ब्रांड सहित अलग नाम अलग ही रहेंगे।'
      : 'Record the same product or service name and quantity consistently. Different names, including branded and unbranded names, remain separate.');
}

function buildSlowMovers(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const items = itemSummaries(sales, metrics.range).filter(item => item.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold);
  if (items.length < 2) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'धीमी बिक्री की पहचान के लिए और डेटा चाहिए' : 'More item counts are needed to identify slow movers',
      language === 'hi'
        ? 'कम से कम दो अलग-अलग उत्पादों या सेवाओं की संख्या दर्ज होने पर धीमी बिक्री की तुलना हो सकती है। केवल कम एंट्री को कम माँग न मानें।'
        : 'Record sold-item or completed-service counts for at least two distinct names before comparing slow movers. A missing entry is not proof of low demand.');
  }
  const slow = items[0];
  const fast = items[items.length - 1];
  return createInsight(metrics.period, 'warning',
    language === 'hi' ? 'सबसे धीमी और तेज़ बिक्री' : 'Slowest and fastest recorded movers',
    language === 'hi'
      ? slow.name + ' के ' + slow.unitsSold + ' आइटम/सेवाएँ दर्ज हुईं, जबकि ' + fast.name + ' के ' + fast.unitsSold + '। खरीद या काम की योजना बदलने से पहले वास्तविक स्टॉक/लंबित ऑर्डर भी जाँचें।'
      : slow.name + ' has ' + slow.unitsSold + ' recorded items/services, compared with ' + fast.name + ' at ' + fast.unitsSold + '. Check actual stock or pending orders before changing purchase or workload plans.');
}

function buildExpenseInsight(
  metrics: PeriodMetrics,
  expenses: ExpenseEntry[],
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const currentEntries = expenseEntriesInRange(expenses, metrics.range);
  const previousEntries = comparisonExpenses(metrics, expenses, now);
  const currentByCategory = new Map<string, number>();
  const previousByCategory = new Map<string, number>();
  currentEntries.forEach(entry => currentByCategory.set(entry.category || 'other', (currentByCategory.get(entry.category || 'other') || 0) + Number(entry.amount)));
  previousEntries.forEach(entry => previousByCategory.set(entry.category || 'other', (previousByCategory.get(entry.category || 'other') || 0) + Number(entry.amount)));
  const currentTotal = totalAmount(currentEntries);
  const previousTotal = totalAmount(previousEntries);
  const minimumIncrease = metrics.period === 'day' ? 50 : 100;

  const rising = [...currentByCategory.entries()].map(([category, amount]) => {
    const previousAmount = previousByCategory.get(category) || 0;
    return { category, amount, previousAmount, change: percentChange(amount, previousAmount), increase: amount - previousAmount };
  }).filter(item => item.change !== null && item.change >= 30 && item.increase >= minimumIncrease)
    .sort((a, b) => b.increase - a.increase)[0];

  if (rising && rising.change !== null) {
    return createInsight(metrics.period, 'warning',
      language === 'hi' ? (rising.category + ' का खर्च बढ़ा') : rising.category.replace(/[_-]/gu, ' ') + ' spending is rising',
      language === 'hi'
        ? rising.category + ' पर ' + money(rising.amount) + ' खर्च हुआ, पिछली तुलनीय अवधि में ' + money(rising.previousAmount) + ' था (' + rising.change + '% ज़्यादा)। बिल और खरीद की वजह जाँचें।'
        : rising.category.replace(/[_-]/gu, ' ') + ' spending reached ' + money(rising.amount) + ', up from ' + money(rising.previousAmount) + ' in the comparable period (+' + rising.change + '%). Check the bill and whether the increase was planned.');
  }

  const totalChange = percentChange(currentTotal, previousTotal);
  if (totalChange !== null && totalChange >= 25 && currentTotal - previousTotal >= minimumIncrease) {
    return createInsight(metrics.period, 'warning',
      language === 'hi' ? 'कुल दर्ज खर्च तेज़ी से बढ़े' : 'Total recorded expenses are rising quickly',
      language === 'hi'
        ? 'दर्ज खर्च पिछली तुलनीय अवधि से ' + totalChange + '% बढ़े हैं। बिक्री के मुकाबले खर्च की रफ़्तार और सबसे बड़े बिल जाँचें।'
        : 'Recorded expenses are up ' + totalChange + '% versus the comparable period. Check which bills or purchases are driving the increase and compare this with sales growth.');
  }

  const largest = [...currentByCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (largest) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'सबसे बड़ा दर्ज खर्च' : 'Largest recorded expense category',
      language === 'hi'
        ? largest[0] + ' पर ' + money(largest[1]) + ' खर्च दर्ज हुआ। यह ज़रूरी भी हो सकता है; अगली खरीद से पहले बिल से मिलान करें।'
        : largest[0].replace(/[_-]/gu, ' ') + ' is the largest recorded expense category at ' + money(largest[1]) + '. It may be necessary spending; check it against the bill before deciding to cut costs.');
  }

  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'खर्च का रिकॉर्ड अधूरा है' : 'Expense tracking can be improved',
    language === 'hi'
      ? 'इस अवधि में खर्च की एंट्री नहीं है। दुकान के खर्च दर्ज करें ताकि बिक्री के साथ असली लागत की तुलना हो सके।'
      : 'No expense entries are available for this period. Record rent, stock purchases, bills and other shop costs to compare sales with the costs of running the business.');
}

function buildPaymentMix(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const current = saleEntriesInRange(sales, metrics.range).filter(entry => entry.paymentType !== 'udhaar');
  const previous = comparisonSales(metrics, sales, now).filter(entry => entry.paymentType !== 'udhaar');
  const cash = current.filter(entry => entry.paymentType === 'cash');
  const upi = current.filter(entry => entry.paymentType === 'upi');
  const total = totalAmount(current);
  const cashAmount = totalAmount(cash);
  const upiAmount = totalAmount(upi);
  if (current.length === 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'भुगतान का पैटर्न अभी उपलब्ध नहीं' : 'Payment mix is not available yet',
      language === 'hi'
        ? 'बिक्री दर्ज करते समय सही भुगतान तरीका चुनें। इससे नकद और UPI की हिस्सेदारी समझने में मदद मिलेगी।'
        : 'Choose the correct payment method when recording each sale. This will make the cash and UPI split useful for planning daily collections.');
  }

  const cashShare = Math.round((cashAmount / total) * 100);
  const upiShare = Math.round((upiAmount / total) * 100);
  const previousTotal = totalAmount(previous);
  const previousUpiShare = previousTotal > 0
    ? Math.round((totalAmount(previous.filter(entry => entry.paymentType === 'upi')) / previousTotal) * 100)
    : null;
  const shareChange = previousUpiShare === null ? null : upiShare - previousUpiShare;
  const movement = shareChange === null
    ? (language === 'hi' ? ' पिछली अवधि से तुलना के लिए पर्याप्त रिकॉर्ड नहीं है।' : ' There is not enough previous-period data for a payment-mix comparison.')
    : (language === 'hi'
        ? ' UPI की हिस्सेदारी पिछली तुलनीय अवधि से ' + Math.abs(shareChange) + ' अंक ' + (shareChange > 0 ? 'बढ़ी' : shareChange < 0 ? 'घटी' : 'बदली नहीं') + ' है।'
        : ' UPI share is ' + Math.abs(shareChange) + ' percentage points ' + (shareChange > 0 ? 'higher' : shareChange < 0 ? 'lower' : 'unchanged') + ' than the comparable period.');
  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'नकद और UPI भुगतान का बँटवारा' : 'Cash and UPI payment mix',
    language === 'hi'
      ? 'दर्ज बिक्री में नकद ' + cashShare + '% (' + money(cashAmount) + ') और UPI ' + upiShare + '% (' + money(upiAmount) + ') है।' + movement
      : 'Recorded non-credit sales are ' + cashShare + '% cash (' + money(cashAmount) + ') and ' + upiShare + '% UPI (' + money(upiAmount) + ').' + movement);
}

function buildUdhaarInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  udhaar: UdhaarEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const outstanding = udhaar.filter(entry => !entry.paid && Number(entry.amount) > 0);
  const outstandingTotal = totalAmount(outstanding);
  const todayKey = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
  const overdue = outstanding.filter(entry => Boolean(entry.dueDate && entry.dueDate < todayKey));
  const newCreditEntries = saleEntriesInRange(sales, metrics.range).filter(entry => entry.paymentType === 'udhaar');
  const separateCreditEntries = udhaar.filter(entry => entry.date >= metrics.range.start && entry.date <= metrics.range.end);
  const newCreditAmount = separateCreditEntries.length > 0
    ? totalAmount(separateCreditEntries)
    : totalAmount(newCreditEntries);
  const newCreditCount = separateCreditEntries.length > 0 ? separateCreditEntries.length : newCreditEntries.length;

  return createInsight(metrics.period, overdue.length > 0 || outstandingTotal > 1000 ? 'warning' : 'info',
    language === 'hi' ? 'उधार और बकाया की स्थिति' : 'Udhaar and outstanding balance',
    language === 'hi'
      ? 'इस अवधि में ' + newCreditCount + ' नई उधार एंट्री (' + money(newCreditAmount) + ') दर्ज हुईं। कुल बकाया ' + money(outstandingTotal) + ' है' + (overdue.length > 0 ? ', जिनमें ' + overdue.length + ' की तारीख़ निकल चुकी है' : '') + '। बकाया की एंट्री सही रखें और तय तारीख़ पर विनम्र फ़ॉलो-अप करें।'
      : newCreditCount + ' new credit entr' + (newCreditCount === 1 ? 'y' : 'ies') + ' (' + money(newCreditAmount) + ') were recorded in this period. Total unpaid balance is ' + money(outstandingTotal) + (overdue.length > 0 ? ', including ' + overdue.length + ' overdue balance(s)' : '') + '. Keep due dates accurate and follow up politely when agreed dates pass.');
}

function shouldShowUdhaar(level: UdhaarLevel | null, sales: SaleEntry[], udhaar: UdhaarEntry[]): boolean {
  if (level === 'never') return false;
  if (udhaar.length > 0 || sales.some(entry => entry.paymentType === 'udhaar')) return true;
  return level === 'sometimes' || level === 'often';
}

function buildPeakTimeInsight(
  period: InsightsPeriod,
  sales: SaleEntry[],
  range: PeriodMetrics['range'],
  shopType: ShopType | null,
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, range).filter(entry => Number.isFinite(entry.createdAt) && entry.createdAt > 0);
  const minRecords = period === 'day' ? 3 : period === 'week' ? 4 : 5;
  const groups = new Map<string, { amount: number; count: number }>();
  const windows = [
    { label: 'Morning', hi: 'सुबह', from: 6, to: 12 },
    { label: 'Afternoon', hi: 'दोपहर', from: 12, to: 17 },
    { label: 'Evening', hi: 'शाम', from: 17, to: 22 },
    { label: 'Late night / early morning', hi: 'रात / सुबह जल्दी', from: 22, to: 30 },
  ];
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

  if (entries.length >= minRecords && groups.size >= 2) {
    const best = [...groups.entries()].sort((a, b) => b[1].amount - a[1].amount)[0];
    const name = language === 'hi' ? windows.find(item => item.label === best[0])?.hi || best[0] : best[0];
    const subject = SERVICE_SHOPS.has(shopType || 'other')
      ? (language === 'hi' ? 'सेवाओं की' : 'service')
      : (language === 'hi' ? 'बिक्री की' : 'sales');
    return createInsight(period, 'positive',
      language === 'hi' ? 'सबसे सक्रिय दर्ज समय' : 'Your busiest recorded time',
      language === 'hi'
        ? name + ' के समय ' + best[1].count + ' एंट्री और ' + money(best[1].amount) + ' की ' + subject + ' दर्ज हुई। इस समय के लिए तैयारी और ज़रूरी सामान/स्टाफ़ की योजना बनाएँ।'
        : best[0] + ' is your busiest recorded period, with ' + best[1].count + ' entries worth ' + money(best[1].amount) + '. Plan availability, supplies or service capacity around this window.');
  }

  const namedCount = entries.filter(entry => typeof entry.itemName === 'string' && entry.itemName.trim()).length;
  return createInsight(period, 'info',
    language === 'hi' ? 'व्यस्त समय पहचानने के लिए लगातार एंट्री करें' : 'Build a clearer picture of your busiest hours',
    language === 'hi'
      ? 'अभी ' + entries.length + ' बिक्री एंट्री में से ' + namedCount + ' में नाम दर्ज है। हर बिक्री तुरंत दर्ज करें; कुछ दिनों के रिकॉर्ड से व्यस्त समय की तुलना ज़्यादा भरोसेमंद होगी।'
      : 'There are ' + entries.length + ' timestamped sales entries in this period, and ' + namedCount + ' include an item or service name. Record sales as they happen so the busiest-time pattern is based on a fuller sample.');
}

function buildSalesBehaviour(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const current = saleEntriesInRange(sales, metrics.range);
  const previous = saleEntriesInRange(sales, metrics.previousRange);
  const currentAverage = current.length > 0 ? totalAmount(current) / current.length : 0;
  const previousAverage = previous.length > 0 ? totalAmount(previous) / previous.length : 0;
  if (current.length === 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'बिक्री के व्यवहार का डेटा नहीं है' : 'More sales records are needed to analyse buying behaviour',
      language === 'hi'
        ? 'हर बिक्री अलग एंट्री में दर्ज करें। इससे औसत बिल और बिक्री की संख्या का ट्रेंड समझ आएगा।'
        : 'Record each sale as a separate entry. This allows Dukaan Dost to compare the number of recorded sales and the average value per entry.');
  }

  const countChange = previous.length > 0 ? percentChange(current.length, previous.length) : null;
  const averageChange = previousAverage > 0 ? percentChange(currentAverage, previousAverage) : null;
  const details = language === 'hi'
    ? 'इस अवधि में ' + current.length + ' बिक्री एंट्री हैं और औसत एंट्री ' + money(currentAverage) + ' की है।' +
      (countChange === null ? ' पिछली अवधि का आधार उपलब्ध नहीं है।' : ' एंट्री की संख्या ' + Math.abs(countChange) + '% ' + (countChange > 0 ? 'बढ़ी' : countChange < 0 ? 'घटी' : 'बदली नहीं') + '।') +
      (averageChange === null ? '' : ' औसत रकम ' + Math.abs(averageChange) + '% ' + (averageChange > 0 ? 'बढ़ी' : averageChange < 0 ? 'घटी' : 'बदली नहीं') + '।')
    : 'There are ' + current.length + ' recorded sales entries, averaging ' + money(currentAverage) + ' each.' +
      (countChange === null ? ' There is no previous-period transaction-count baseline yet.' : ' Entry count is ' + Math.abs(countChange) + '% ' + (countChange > 0 ? 'higher' : countChange < 0 ? 'lower' : 'unchanged') + '.') +
      (averageChange === null ? '' : ' Average recorded sale value is ' + Math.abs(averageChange) + '% ' + (averageChange > 0 ? 'higher' : averageChange < 0 ? 'lower' : 'unchanged') + '.');
  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'औसत बिक्री और एंट्री का व्यवहार' : 'Average sale and transaction behaviour',
    details);
}

function buildProfitabilityInsight(
  metrics: PeriodMetrics,
  language: 'en' | 'hi',
): BusinessInsight {
  if (metrics.sales <= 0 || metrics.expenses <= 0) {
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'मुनाफ़े का आकलन अभी अधूरा है' : 'Profitability assessment is incomplete',
      language === 'hi'
        ? 'दर्ज बिक्री ' + money(metrics.sales) + ' और दर्ज खर्च ' + money(metrics.expenses) + ' हैं। बिक्री के साथ स्टॉक खरीद, किराया, वेतन और दूसरे खर्च भी दर्ज करें। यह पूरा नेट प्रॉफिट नहीं है।'
        : 'Recorded sales are ' + money(metrics.sales) + ' and recorded expenses are ' + money(metrics.expenses) + '. Record stock purchases, rent, wages and other shop costs as well. This is not a complete net-profit calculation.');
  }
  const margin = Math.round((metrics.profit / metrics.sales) * 100);
  const previousMargin = metrics.previousSales > 0 && metrics.previousExpenses > 0
    ? Math.round((metrics.previousProfit / metrics.previousSales) * 100)
    : null;
  const difference = previousMargin === null ? null : margin - previousMargin;
  return createInsight(metrics.period, difference !== null && difference <= -5 ? 'warning' : difference !== null && difference >= 5 ? 'positive' : 'info',
    language === 'hi' ? 'दर्ज खर्च के बाद बची रकम' : 'Earnings after recorded expenses',
    language === 'hi'
      ? 'इस अवधि में दर्ज खर्च घटाने के बाद ' + money(metrics.profit) + ' बचते हैं (' + margin + '% दर्ज बिक्री)।' + (difference === null ? ' पिछली अवधि का भरोसेमंद मुनाफ़ा आधार नहीं है।' : ' पिछली तुलनीय अवधि से मुनाफ़ा प्रतिशत ' + Math.abs(difference) + ' अंक ' + (difference > 0 ? 'बढ़ा' : difference < 0 ? 'घटा' : 'बदला नहीं') + '।') + ' जो खर्च दर्ज नहीं हैं, वे असली मुनाफ़ा बदल सकते हैं।'
      : money(metrics.profit) + ' remains after recorded expenses, equal to ' + margin + '% of recorded sales.' + (difference === null ? ' There is no reliable previous-period margin baseline.' : ' The margin is ' + Math.abs(difference) + ' percentage points ' + (difference > 0 ? 'higher' : difference < 0 ? 'lower' : 'unchanged') + ' than the comparable period.') + ' Costs not entered here can change actual profit.');
}

function buildDayPatternInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const byDate = new Map<string, number>();
  entries.forEach(entry => byDate.set(entry.date, (byDate.get(entry.date) || 0) + Number(entry.amount)));
  const recordedDays = [...byDate.entries()].sort((a, b) => b[1] - a[1]);
  if (recordedDays.length >= 3) {
    const high = recordedDays[0];
    const low = recordedDays[recordedDays.length - 1];
    const highDate = new Date(high[0] + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const lowDate = new Date(low[0] + 'T12:00:00').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const ratio = low[1] > 0 ? high[1] / low[1] : null;
    return createInsight(metrics.period, ratio !== null && ratio >= 2 ? 'warning' : 'info',
      language === 'hi' ? 'दर्ज दिनों में बिक्री का अंतर' : 'Sales vary across recorded days',
      language === 'hi'
        ? highDate + ' को ' + money(high[1]) + ' की बिक्री दर्ज हुई, जबकि ' + lowDate + ' को ' + money(low[1]) + '। कम बिक्री वाले दिन की वजह, दुकान के समय और एंट्री की पूरी जानकारी जाँचें। खाली दिनों को शून्य बिक्री नहीं माना गया है।'
        : 'Recorded sales were ' + money(high[1]) + ' on ' + highDate + ' and ' + money(low[1]) + ' on ' + lowDate + '. Review opening hours, demand and entry completeness on quieter recorded days. Dates with no entries are not treated as zero-sales days.');
  }
  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'साप्ताहिक बिक्री पैटर्न के लिए और दिन चाहिए' : 'More recorded days are needed for a weekly operating pattern',
    language === 'hi'
      ? 'कम से कम तीन अलग-अलग दिनों की बिक्री दर्ज करें। खाली दिन को अपने-आप शून्य बिक्री नहीं माना जाएगा।'
      : 'Record sales on at least three different days before comparing stronger and quieter trading days. A day with no entry is not automatically treated as zero sales.');
}

function buildCategoryMixInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const entries = saleEntriesInRange(sales, metrics.range);
  const categories = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.category) categories.set(entry.category, (categories.get(entry.category) || 0) + Number(entry.amount));
  });
  const categoryRows = [...categories.entries()].sort((a, b) => b[1] - a[1]);
  const totalCategorySales = categoryRows.reduce((sum, row) => sum + row[1], 0);
  if (categoryRows.length >= 2 && totalCategorySales > 0) {
    const first = categoryRows[0];
    const second = categoryRows[1];
    const share = Math.round((first[1] / totalCategorySales) * 100);
    return createInsight(metrics.period, share >= 60 ? 'info' : 'positive',
      language === 'hi' ? 'बिक्री की श्रेणी का बँटवारा' : 'Sales mix by recorded category',
      language === 'hi'
        ? first[0] + ' सबसे बड़ी श्रेणी है (' + share + '%), उसके बाद ' + second[0] + ' है। दोनों की माँग और कमाई देखकर अगली खरीद/सेवा योजना बनाएँ।'
        : first[0].replace(/[_-]/gu, ' ') + ' is the largest recorded category at ' + share + '% of categorised sales, followed by ' + second[0].replace(/[_-]/gu, ' ') + '. Use both demand and earnings—not revenue alone—when planning the next period.');
  }

  const items = itemSummaries(sales, metrics.range).sort((a, b) => b.revenue - a.revenue);
  const namedRevenue = items.reduce((sum, item) => sum + item.revenue, 0);
  if (items.length >= 2 && namedRevenue > 0) {
    const first = items[0];
    const share = Math.round((first.revenue / namedRevenue) * 100);
    return createInsight(metrics.period, share >= 60 ? 'info' : 'positive',
      language === 'hi' ? 'उत्पादों से आने वाली बिक्री' : 'Revenue mix across recorded items',
      language === 'hi'
        ? first.name + ' से दर्ज उत्पाद बिक्री का ' + share + '% आया। बाकी उत्पादों की बिक्री भी देखें ताकि अगली योजना एक ही उत्पाद पर निर्भर न हो।'
        : first.name + ' contributes ' + share + '% of itemised sales revenue. Review the rest of the mix as well so planning does not depend on one item alone.');
  }
  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'उत्पाद श्रेणी की तुलना के लिए और विवरण चाहिए' : 'More item details are needed for a sales-mix view',
    language === 'hi'
      ? 'बिक्री में उत्पाद/सेवा का नाम और सही श्रेणी दर्ज करें। इससे पता चलेगा कि कमाई किन हिस्सों से आ रही है।'
      : 'Record product or service names and their categories with each sale. This will show which parts of the business contribute to recorded revenue.');
}

function buildInventoryMovementInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  shopType: ShopType | null,
  language: 'en' | 'hi',
): BusinessInsight {
  const items = itemSummaries(sales, metrics.range).filter(item => item.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold);
  const type = itemType(shopType, language);
  if (items.length >= 2) {
    const slow = items[0];
    const fast = items[items.length - 1];
    return createInsight(metrics.period, 'info',
      language === 'hi' ? 'माँग के आधार पर स्टॉक/काम की समीक्षा' : 'Demand-led stock and workload review',
      language === 'hi'
        ? fast.name + ' के ' + fast.unitsSold + ' और ' + slow.name + ' के ' + slow.unitsSold + ' आइटम/सेवाएँ दर्ज हुईं। वास्तविक बचा स्टॉक या लंबित काम देखकर खरीद/समय तय करें; बिक्री रिकॉर्ड में उपलब्ध स्टॉक की संख्या नहीं है।'
        : fast.name + ' has ' + fast.unitsSold + ' recorded units/services, while ' + slow.name + ' has ' + slow.unitsSold + '. Check actual stock on hand or pending work before deciding what to reorder or schedule; sales entries do not contain remaining-stock counts.');
  }
  return createInsight(metrics.period, 'info',
    language === 'hi' ? 'स्टॉक की सही दक्षता अभी नहीं मापी जा सकती' : 'On-hand inventory efficiency cannot be measured yet',
    language === 'hi'
      ? 'बिक्री एंट्री माँग दिखाती हैं, बचा हुआ स्टॉक नहीं। कम से कम दो उत्पादों की संख्या लगातार दर्ज करें और खरीद से पहले वास्तविक स्टॉक गिनें।'
      : 'Sales entries show recorded demand, not how many units remain on the shelf. Record item counts consistently and check physical stock before changing purchase quantities.');
}

function buildConcentrationInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  language: 'en' | 'hi',
): BusinessInsight {
  const items = itemSummaries(sales, metrics.range).filter(item => item.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  const total = items.reduce((sum, item) => sum + item.revenue, 0);
  if (items.length >= 2 && total > 0) {
    const lead = items[0];
    const share = Math.round((lead.revenue / total) * 100);
    return createInsight(metrics.period, share >= 50 ? 'warning' : 'info',
      language === 'hi' ? 'एक उत्पाद पर बिक्री की निर्भरता' : 'Revenue concentration to keep an eye on',
      language === 'hi'
        ? lead.name + ' से दर्ज उत्पाद बिक्री का ' + share + '% आया। इसकी उपलब्धता पर ध्यान दें और बाकी उत्पादों की बिक्री भी बढ़ाने के अवसर देखें।'
        : lead.name + ' accounts for ' + share + '% of itemised sales revenue. Keep its availability in view, while looking for sensible ways to strengthen the rest of the product mix.');
  }
  return buildDayPatternInsight(metrics, sales, language);
}

function buildUdhaarOrPaymentInsight(
  metrics: PeriodMetrics,
  sales: SaleEntry[],
  udhaar: UdhaarEntry[],
  level: UdhaarLevel | null,
  language: 'en' | 'hi',
  now: Date,
): BusinessInsight {
  const exists = level !== 'never' && (
    udhaar.length > 0 ||
    sales.some(entry => entry.paymentType === 'udhaar') ||
    level === 'sometimes' ||
    level === 'often'
  );
  return exists
    ? buildUdhaarInsight(metrics, sales, udhaar, language)
    : buildPaymentMix(metrics, sales, language, now);
}

function fillPeriod(
  period: InsightsPeriod,
  cards: BusinessInsight[],
): BusinessInsight[] {
  const target = TARGET_COUNTS[period];
  const result = cards.slice(0, target);
  const fallbackTitles = new Set(result.map(item => item.title));
  let suffix = 1;
  while (result.length < target) {
    result.push(createInsight(period, 'info',
      'Keep recording business activity',
      'More consistent sales and expense records will unlock additional business comparisons (' + suffix + ').'));
    suffix += 1;
  }
  return result.map(item => ({ ...item, period }));
}

export function buildBusinessInsights(input: InsightEngineInput): BusinessInsight[] {
  const now = input.now || new Date();
  const { today, week, month, sales, expenses, udhaar, shopType, udhaarLevel, language } = input;

  const todayCards = [
    buildSalesPerformance(today, sales, language, now),
    buildTopPerformer(today, sales, shopType, language),
    buildProductMovement(today, sales, language),
    buildExpenseInsight(today, expenses, language, now),
    buildUdhaarOrPaymentInsight(today, sales, udhaar, udhaarLevel, language, now),
    buildPeakTimeInsight('day', sales, today.range, shopType, language),
  ];

  const weekCards = [
    buildSalesPerformance(week, sales, language, now),
    buildTopPerformer(week, sales, shopType, language),
    buildSlowMovers(week, sales, language),
    buildSalesBehaviour(week, sales, language),
    buildProfitabilityInsight(week, language),
    buildExpenseInsight(week, expenses, language, now),
    shouldShowUdhaar(udhaarLevel, sales, udhaar)
      ? buildUdhaarInsight(week, sales, udhaar, language)
      : buildDayPatternInsight(week, sales, language),
  ];

  const monthCards = [
    buildSalesPerformance(month, sales, language, now),
    buildProfitabilityInsight(month, language),
    buildTopPerformer(month, sales, shopType, language),
    buildCategoryMixInsight(month, sales, language),
    buildInventoryMovementInsight(month, sales, shopType, language),
    buildExpenseInsight(month, expenses, language, now),
    shouldShowUdhaar(udhaarLevel, sales, udhaar)
      ? buildUdhaarInsight(month, sales, udhaar, language)
      : buildPaymentMix(month, sales, language, now),
    buildConcentrationInsight(month, sales, language),
  ];

  return [
    ...fillPeriod('day', todayCards),
    ...fillPeriod('week', weekCards),
    ...fillPeriod('month', monthCards),
  ];
}

export { TARGET_COUNTS as INSIGHT_TARGET_COUNTS };
