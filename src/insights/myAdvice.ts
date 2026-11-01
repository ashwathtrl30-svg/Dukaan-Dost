import type { Language, ShopType, SaleEntry, UdhaarEntry } from '../types';
import type { PeriodMetrics } from './analytics';
import { aggregateProductSales, normalizeProductIdentity } from './productSales';
import {
  getFestivalDateLabel,
  getFestivalName,
  getFestivalShopAdvice,
  getLocalDateKey,
  getUpcomingFestivals,
} from '../festivals';

export type MyAdviceCategory = 'Immediate action' | 'Better buying' | 'Improve sales' | 'Plan ahead';
type AdviceTone = 'warning' | 'watch' | 'positive';

export interface MyAdviceItem {
  id: string;
  category: MyAdviceCategory;
  tone: AdviceTone;
  title: string;
  reason: string;
  action: string;
}

function money(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  return (negative ? '-' : '') + '₹' + Math.abs(safe).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

function daysBetween(start: string, end: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(end) - parse(start)) / 86400000);
}

function immediateAction(shopType: ShopType | null | undefined, lang: Language): string {
  if (lang === 'hi') {
    if (shopType === 'salon') return 'आज की हर सेवा और रकम मिलाएँ। अगले उत्पाद ऑर्डर से पहले उपलब्ध सामान, बुकिंग और ज़रूरी सफ़ाई सामग्री जाँचें।';
    if (shopType === 'tailor') return 'हर सिलाई, अल्टरेशन और एडवांस मिलाएँ। कपड़ा या सामग्री खरीदने से पहले पक्के ऑर्डर और डिलीवरी तारीख़ जाँचें।';
    if (shopType === 'medical') return 'काउंटर बिक्री और सप्लायर बिल मिलाएँ। स्टॉक खरीदने से पहले उपलब्ध मात्रा, एक्सपायरी और सही स्टोरेज जाँचें।';
    if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'हर बिक्री, खर्च और बची/खराब हुई सामग्री दर्ज करें। अगली ताज़ी खरीद से पहले बचा स्टॉक और वास्तविक माँग जाँचें।';
    return 'आज की बिक्री, खर्च और भुगतान मिलाएँ। अगली खरीद से पहले सबसे बड़े बिल और दुकान में मौजूद वास्तविक स्टॉक की जाँच करें।';
  }
  if (shopType === 'salon') return 'Reconcile every service and payment today. Before the next product order, check what is on hand, upcoming bookings and essential hygiene supplies.';
  if (shopType === 'tailor') return 'Reconcile each job, alteration and advance. Check confirmed orders and delivery dates before buying more fabric or materials.';
  if (shopType === 'medical') return 'Match counter sales with supplier bills. Before replenishing, check physical stock, expiry dates and appropriate storage.';
  if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'Record sales, expenses and any leftover or wasted ingredients. Check remaining stock and actual demand before the next fresh purchase.';
  return 'Reconcile today’s sales, expenses and payments. Check the largest bill and count physical stock before committing to another purchase.';
}

function getImmediateAdvice(
  week: PeriodMetrics,
  month: PeriodMetrics,
  udhaar: UdhaarEntry[],
  shopType: ShopType | null | undefined,
  lang: Language,
  now: Date,
): MyAdviceItem {
  const today = getLocalDateKey(now);
  const sevenDaysAhead = getLocalDateKey(addDays(now, 7));
  const openCredit = udhaar.filter(entry => !entry.paid && Number.isFinite(Number(entry.amount)) && Number(entry.amount) > 0);
  const overdue = openCredit.filter(entry =>
    typeof entry.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate) &&
    entry.dueDate < today,
  );
  const overdueAmount = overdue.reduce((sum, entry) => sum + Number(entry.amount), 0);
  if (overdue.length > 0) {
    return {
      id: 'immediate-overdue-udhaar',
      category: 'Immediate action',
      tone: 'warning',
      title: lang === 'hi' ? 'बकाया उधार का आज फ़ॉलो-अप करें' : 'Follow up on overdue udhaar',
      reason: lang === 'hi'
        ? `${overdue.length} ग्राहकों से कुल ${money(overdueAmount)} की रकम दर्ज देय तारीख़ के बाद भी बाकी है।`
        : `${overdue.length} customer balance(s), totalling ${money(overdueAmount)}, are still unpaid after their recorded due dates.`,
      action: lang === 'hi'
        ? 'सबसे पुरानी या बड़ी बकाया रकम से शुरुआत करें। विनम्रता से भुगतान की नई तारीख़ तय करें और रिकॉर्ड अपडेट करें।'
        : 'Start with the oldest or largest balance. Send a polite reminder, agree on a realistic payment date and update the record.',
    };
  }

  const dueSoon = openCredit.filter(entry =>
    typeof entry.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate) &&
    entry.dueDate >= today &&
    entry.dueDate <= sevenDaysAhead,
  );
  const dueSoonAmount = dueSoon.reduce((sum, entry) => sum + Number(entry.amount), 0);
  if (dueSoon.length > 0) {
    return {
      id: 'immediate-udhaar-due',
      category: 'Immediate action',
      tone: 'watch',
      title: lang === 'hi' ? 'अगले 7 दिनों के उधार भुगतान तैयार रखें' : 'Prepare for udhaar due in the next 7 days',
      reason: lang === 'hi'
        ? `${dueSoon.length} भुगतान की कुल ${money(dueSoonAmount)} रकम अगले 7 दिनों में देय है। समय पर भुगतान न आने पर खरीद और रोज़ के बिल प्रभावित हो सकते हैं।`
        : `${dueSoon.length} unpaid balance(s), totalling ${money(dueSoonAmount)}, are due within 7 days. Delays could put pressure on stock purchases and everyday bills.`,
      action: lang === 'hi'
        ? 'देय तारीख़ से पहले ग्राहकों को रकम याद दिलाएँ। ज़रूरी सप्लायर भुगतान और रोज़ के खर्च के लिए नकदी की योजना रखें।'
        : 'Remind customers before the due date and plan cash for essential supplier payments and everyday expenses.',
    };
  }

  const lossPeriod = week.hasEntries && week.profit < 0 ? week : month.hasEntries && month.profit < 0 ? month : null;
  if (lossPeriod) {
    const period = lossPeriod.period === 'week' ? (lang === 'hi' ? 'इस हफ़्ते' : 'this week') : (lang === 'hi' ? 'इस महीने' : 'this month');
    return {
      id: 'immediate-recorded-shortfall',
      category: 'Immediate action',
      tone: 'warning',
      title: lang === 'hi' ? 'दर्ज खर्च बिक्री से ज़्यादा हैं' : 'Recorded expenses are above recorded sales',
      reason: lang === 'hi'
        ? `${period} दर्ज खर्च बिक्री से ${money(Math.abs(lossPeriod.profit))} ज़्यादा हैं। यह वास्तविक दबाव हो सकता है या कुछ बिक्री की एंट्री छूटी हो सकती है।`
        : `For ${period}, recorded expenses exceed recorded sales by ${money(Math.abs(lossPeriod.profit))}. This may be a real cash squeeze or some sales may not have been entered.`,
      action: immediateAction(shopType, lang),
    };
  }

  const trendPeriod = month.salesChange !== null &&
    month.expensesChange !== null &&
    month.expensesChange > month.salesChange + 8 &&
    month.expenses > month.previousExpenses
      ? month
      : week.salesChange !== null &&
        week.expensesChange !== null &&
        week.expensesChange > week.salesChange + 8 &&
        week.expenses > week.previousExpenses
          ? week
          : null;
  if (trendPeriod) {
    const category = trendPeriod.topExpenses[0];
    const categoryName = category?.category ? category.category.replace(/[_-]/gu, ' ') : '';
    return {
      id: 'immediate-rising-costs',
      category: 'Immediate action',
      tone: 'warning',
      title: lang === 'hi' ? 'खर्च बिक्री से तेज़ बढ़ रहे हैं' : 'Costs are rising faster than sales',
      reason: lang === 'hi'
        ? `तुलना वाली अवधि में खर्च ${trendPeriod.expensesChange}% बढ़े, जबकि बिक्री ${trendPeriod.salesChange}% बदली।${categoryName ? ` सबसे बड़ा दर्ज खर्च ${categoryName} है।` : ''}`
        : `Compared with the equivalent period, expenses rose ${trendPeriod.expensesChange}% while sales changed by ${trendPeriod.salesChange}%. ${categoryName ? `${categoryName} is the largest recorded expense category.` : ''}`,
      action: immediateAction(shopType, lang),
    };
  }

  const categoryPeriod = week.topExpenses[0]?.share >= 50
    ? week
    : month.topExpenses[0]?.share >= 55
      ? month
      : null;
  if (categoryPeriod?.topExpenses[0]) {
    const top = categoryPeriod.topExpenses[0];
    return {
      id: 'immediate-largest-cost',
      category: 'Immediate action',
      tone: 'watch',
      title: lang === 'hi' ? 'सबसे बड़े खर्च को दोबारा जाँचें' : 'Review the largest expense before paying',
      reason: lang === 'hi'
        ? `${top.category.replace(/[_-]/gu, ' ')} इस अवधि के दर्ज खर्च का लगभग ${top.share}% है। यह ज़रूरी हो सकता है, पर बिल और मात्रा मिलाना उपयोगी रहेगा।`
        : `${top.category.replace(/[_-]/gu, ' ')} accounts for about ${top.share}% of recorded expenses in this period. It may be necessary, but checking the bill and quantity is worthwhile.`,
      action: immediateAction(shopType, lang),
    };
  }

  const fallingPeriod = month.salesChange !== null && month.salesChange <= -12
    ? month
    : week.salesChange !== null && week.salesChange <= -15
      ? week
      : null;
  if (fallingPeriod) {
    return {
      id: 'immediate-sales-dip',
      category: 'Immediate action',
      tone: 'watch',
      title: lang === 'hi' ? 'बिक्री में गिरावट का कारण जाँचें' : 'Find the reason behind the sales dip',
      reason: lang === 'hi'
        ? `तुलना वाली अवधि के मुकाबले दर्ज बिक्री ${Math.abs(fallingPeriod.salesChange || 0)}% कम है। छूटी एंट्री, दुकान के समय और माँग वाली चीज़ों की उपलब्धता जाँचें।`
        : `Recorded sales are down ${Math.abs(fallingPeriod.salesChange || 0)}% against the comparable period. Check for missing entries, opening hours and availability of requested items or services.`,
      action: immediateAction(shopType, lang),
    };
  }

  const hasEntries = week.hasEntries || month.hasEntries;
  return {
    id: hasEntries ? 'immediate-daily-control' : 'immediate-start-recording',
    category: 'Immediate action',
    tone: hasEntries ? 'positive' : 'watch',
    title: lang === 'hi'
      ? (hasEntries ? 'आज का हिसाब साफ़ रखें' : 'सही सलाह के लिए रिकॉर्ड शुरू करें')
      : (hasEntries ? 'Keep today’s shop records in control' : 'Start recording to spot problems early'),
    reason: lang === 'hi'
      ? (hasEntries
          ? 'उपलब्ध एंट्री में अभी कोई बड़ा नकदी चेतावनी संकेत नहीं दिख रहा। इसका मतलब यह नहीं कि भौतिक स्टॉक या हर भुगतान की जाँच हो चुकी है।'
          : 'इस हफ़्ते या महीने में बिक्री और खर्च की पर्याप्त एंट्री नहीं है, इसलिए दुकान की नकदी स्थिति का भरोसेमंद आकलन नहीं हो सकता।')
      : (hasEntries
          ? 'No major cash warning stands out in the available entries. This does not confirm that physical stock or every payment has been checked.'
          : 'There are not enough sales and expense entries this week or month to assess the shop’s cash position reliably.'),
    action: hasEntries
      ? immediateAction(shopType, lang)
      : (lang === 'hi'
          ? 'आज की हर बिक्री, खर्च और उधार दर्ज करें। दुकान बंद करते समय नकद और UPI का कुल रिकॉर्ड से मिलान करें।'
          : 'Record every sale, expense and udhaar today. At closing, match the cash and UPI totals against the entries.'),
  };
}

function getBuyingAdvice(
  sales: SaleEntry[],
  shopType: ShopType | null | undefined,
  lang: Language,
  now: Date,
): MyAdviceItem {
  const today = getLocalDateKey(now);
  const start = getLocalDateKey(addDays(now, -29));
  const recentSales = sales.filter(entry =>
    typeof entry.date === 'string' &&
    entry.date >= start &&
    entry.date <= today &&
    typeof entry.itemName === 'string' &&
    entry.itemName.trim().length > 0,
  );
  const saleDaysByProduct = new Map<string, Set<string>>();
  recentSales.forEach(entry => {
    const key = normalizeProductIdentity(entry.itemName || '');
    if (!key) return;
    const dates = saleDaysByProduct.get(key) || new Set<string>();
    dates.add(entry.date);
    saleDaysByProduct.set(key, dates);
  });

  const reliableProducts = aggregateProductSales(recentSales)
    .filter(product => (saleDaysByProduct.get(product.key)?.size || 0) >= 2)
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 3);

  const productNames = reliableProducts.map(product => {
    const label = product.unitsSold.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN');
    const unitLabel = shopType === 'salon' ? (lang === 'hi' ? 'सेवाएँ' : 'services')
      : shopType === 'tailor' ? (lang === 'hi' ? 'काम' : 'jobs')
        : (lang === 'hi' ? 'आइटम/पैक' : 'items/packs');
    return `${product.name} (${label} ${unitLabel})`;
  });

  if (reliableProducts.length > 0) {
    return {
      id: 'buying-repeat-sellers',
      category: 'Better buying',
      tone: 'watch',
      title: lang === 'hi' ? 'अगली खरीद रिकॉर्ड देखकर तय करें' : 'Use repeat sellers to guide your next order',
      reason: lang === 'hi'
        ? `पिछले 30 दिनों में अलग-अलग तारीख़ों पर दर्ज सबसे मज़बूत यूनिट बिक्री: ${productNames.join(', ')}। रैंकिंग दर्ज यूनिट/सेवा संख्या से है, सिर्फ़ कमाई से नहीं।`
        : `Across separate dates in the last 30 days, the strongest recorded unit sales were: ${productNames.join(', ')}. This ranking uses recorded item/service counts, not revenue alone.`,
      action: buyingAction(shopType, lang),
    };
  }

  const hasNamedSales = recentSales.length > 0;
  return {
    id: 'buying-build-item-history',
    category: 'Better buying',
    tone: 'watch',
    title: lang === 'hi' ? 'अगली खरीद से पहले स्टॉक की पुष्टि करें' : 'Verify stock before your next purchase',
    reason: lang === 'hi'
      ? (hasNamedSales
          ? 'पिछले 30 दिनों में नाम के साथ बिक्री दर्ज है, लेकिन अलग-अलग तारीख़ों पर भरोसेमंद यूनिट/पैक संख्या नहीं मिली। सिर्फ़ बिक्री की रकम से तेज़ बिकने वाला सामान तय नहीं किया जा सकता।'
          : 'पिछले 30 दिनों में सामान या सेवा के नाम के साथ पर्याप्त बिक्री रिकॉर्ड नहीं है। इसलिए अभी भरोसेमंद बेस्टसेलर तय नहीं किया जा सकता।')
      : (hasNamedSales
          ? 'Named sales are recorded, but there are not yet reliable item/pack counts across separate dates in the last 30 days. Revenue alone cannot identify fast-moving stock.'
          : 'There are not enough named item or service sales in the last 30 days to identify reliable bestsellers yet.'),
    action: buyingAction(shopType, lang, true),
  };
}

function buyingAction(shopType: ShopType | null | undefined, lang: Language, buildingHistory = false): string {
  if (lang === 'hi') {
    if (shopType === 'salon') return buildingHistory
      ? 'अगले 7 दिनों तक सेवा का नाम और पूरी की गई सेवाओं की संख्या दर्ज करें। फिर बुकिंग देखकर शैम्पू, कलर और सफ़ाई का सामान भरें।'
      : 'पहले उपलब्ध शैम्पू, कलर और सफ़ाई का सामान गिनें। अगली खरीद को लोकप्रिय सेवाओं की बुकिंग और वास्तविक इस्तेमाल से जोड़ें।';
    if (shopType === 'tailor') return buildingHistory
      ? 'अगले 7 दिनों तक सिलाई/अल्टरेशन का नाम और पूरे किए काम की संख्या दर्ज करें। फिर पक्के ऑर्डर के हिसाब से धागा, अस्तर और ज़िप भरें।'
      : 'धागा, अस्तर, ज़िप और पक्के काम की सामग्री गिनें। कपड़ा नई खरीदने से पहले पक्के ऑर्डर और डिलीवरी तारीख़ देखें।';
    if (shopType === 'medical') return buildingHistory
      ? 'अगले 7 दिनों तक सामान का नाम और बेची गई पैक संख्या दर्ज करें। खरीद से पहले उपलब्ध स्टॉक, एक्सपायरी और लागू नियम जाँचें।'
      : 'तेज़ बिकने वाले दर्ज सामान का उपलब्ध स्टॉक और एक्सपायरी जाँचें। खरीद को वास्तविक माँग और लागू फार्मेसी नियमों के अनुसार रखें।';
    if (['vegetable', 'bakery', 'sweet', 'tea', 'restaurant'].includes(shopType || '')) return buildingHistory
      ? 'अगले 7 दिनों तक सामान/व्यंजन और बेची गई मात्रा लिखें। बचा स्टॉक और बर्बादी देखकर ताज़ी सामग्री कम मात्रा में, ज़रूरत के अनुसार मँगाएँ।'
      : 'बची सामग्री, ताज़गी और बर्बादी जाँचें। जल्दी खराब होने वाली चीज़ें छोटी मात्रा में और हाल की बिक्री के करीब मँगाएँ।';
    if (shopType === 'mobile') return buildingHistory
      ? 'अगले 7 दिनों तक एक्सेसरी का सही मॉडल/नाम और बेची गई संख्या दर्ज करें। फिर उसी मॉडल का उपलब्ध स्टॉक जाँचकर खरीदें।'
      : 'कवर, चार्जर और केबल का सही मॉडल मिलाएँ। उपलब्ध स्टॉक गिनकर लोकप्रिय वैरिएंट पहले भरें; महँगे डिवाइस अनुमान से न लें।';
    if (shopType === 'hardware') return buildingHistory
      ? 'अगले 7 दिनों तक सामान का नाम और पीस संख्या दर्ज करें। फिर सही मॉडल/माप और गुणवत्ता जाँचकर उपलब्ध स्टॉक के हिसाब से खरीदें।'
      : 'सही माप, मॉडल और गुणवत्ता की पुष्टि करें। पहले भौतिक स्टॉक गिनें और साबित बिकने वाले सामान ही भरें।';
    return buildingHistory
      ? 'अगले 7 दिनों तक हर बिक्री में सामान का नाम और पीस/पैक संख्या दर्ज करें। फिर भौतिक स्टॉक से तुलना करके अगला ऑर्डर तय करें।'
      : 'दर्ज बिक्री की संख्या को शेल्फ़ पर मौजूद स्टॉक से मिलाएँ। कमी और सप्लायर के समय के अनुसार ही अगला ऑर्डर दें।';
  }

  if (shopType === 'salon') return buildingHistory
    ? 'For the next 7 days, record each service name and the number completed. Then match shampoo, colour and hygiene supplies to bookings and actual use.'
    : 'Count shampoo, colour and hygiene supplies on hand. Tie the next order to popular-service bookings and actual product use.';
  if (shopType === 'tailor') return buildingHistory
    ? 'For the next 7 days, record each stitching/alteration type and completed-job count. Then replenish thread, lining and zips against confirmed work.'
    : 'Count thread, lining, zips and materials for confirmed jobs. Check orders and delivery dates before buying more fabric.';
  if (shopType === 'medical') return buildingHistory
    ? 'For the next 7 days, record each product name and packs sold. Before ordering, check physical stock, expiry and applicable pharmacy requirements.'
    : 'Check physical stock and expiry for the products with repeat sales. Replenish against actual demand and applicable pharmacy requirements.';
  if (['vegetable', 'bakery', 'sweet', 'tea', 'restaurant'].includes(shopType || '')) return buildingHistory
    ? 'For the next 7 days, record each item/dish and quantity sold. Check leftovers and waste, then buy fresh ingredients in smaller quantities closer to actual demand.'
    : 'Check remaining ingredients, freshness and waste. Buy perishables in smaller, more frequent batches guided by recorded sales.';
  if (shopType === 'mobile') return buildingHistory
    ? 'For the next 7 days, record the exact accessory model/name and units sold. Then check on-hand stock for that model before ordering.'
    : 'Match exact models for covers, chargers and cables. Count stock and replenish proven variants first; avoid speculative purchases of expensive devices.';
  if (shopType === 'hardware') return buildingHistory
    ? 'For the next 7 days, record each item name and piece count. Confirm the exact model/size and product quality before replenishing.'
    : 'Confirm exact sizes, models and quality. Count physical stock first and replenish only proven sellers.';
  return buildingHistory
    ? 'For the next 7 days, record each sale with the item name and number of pieces/packs sold. Compare that with physical stock before placing the next order.'
    : 'Compare recorded units sold with the stock physically on the shelf. Order only after checking the gap and supplier lead time.';
}

function getSalesAdvice(
  sales: SaleEntry[],
  shopType: ShopType | null | undefined,
  lang: Language,
  now: Date,
): MyAdviceItem {
  type Slot = { id: 'morning' | 'afternoon' | 'evening' | 'late'; labelEn: string; labelHi: string; start: number; end: number; amount: number; entries: number; days: Set<string> };
  const slots: Slot[] = [
    { id: 'morning', labelEn: '6 am–12 pm', labelHi: 'सुबह 6–12 बजे', start: 6, end: 12, amount: 0, entries: 0, days: new Set<string>() },
    { id: 'afternoon', labelEn: '12–5 pm', labelHi: 'दोपहर 12–5 बजे', start: 12, end: 17, amount: 0, entries: 0, days: new Set<string>() },
    { id: 'evening', labelEn: '5–10 pm', labelHi: 'शाम 5–10 बजे', start: 17, end: 22, amount: 0, entries: 0, days: new Set<string>() },
    { id: 'late', labelEn: '10 pm–6 am', labelHi: 'रात 10–सुबह 6 बजे', start: 22, end: 6, amount: 0, entries: 0, days: new Set<string>() },
  ];
  const today = getLocalDateKey(now);
  const start = getLocalDateKey(addDays(now, -29));
  const recent = sales.filter(entry =>
    entry.date >= start &&
    entry.date <= today &&
    Number.isFinite(Number(entry.amount)) &&
    Number(entry.amount) > 0 &&
    Number.isFinite(Number(entry.createdAt)) &&
    Number(entry.createdAt) > 0,
  );
  let totalAmount = 0;
  const recordedDays = new Set<string>();
  recent.forEach(entry => {
    const hour = new Date(Number(entry.createdAt)).getHours();
    const slot = slots.find(candidate => candidate.id === 'late'
      ? hour >= 22 || hour < 6
      : hour >= candidate.start && hour < candidate.end);
    if (!slot) return;
    slot.amount += Number(entry.amount);
    slot.entries += 1;
    slot.days.add(entry.date);
    recordedDays.add(entry.date);
    totalAmount += Number(entry.amount);
  });

  const strongest = slots.slice().sort((a, b) => b.amount - a.amount)[0];
  const share = totalAmount > 0 ? strongest.amount / totalAmount : 0;
  if (strongest.entries >= 4 && strongest.days.size >= 3 && recordedDays.size >= 3 && share >= 0.35) {
    const slotLabel = lang === 'hi' ? strongest.labelHi : strongest.labelEn;
    return {
      id: 'sales-strongest-time',
      category: 'Improve sales',
      tone: 'positive',
      title: lang === 'hi' ? `${slotLabel} के समय की तैयारी बेहतर करें` : `Make the most of your ${slotLabel} rush`,
      reason: lang === 'hi'
        ? `पिछले 30 दिनों में दर्ज बिक्री की रकम का लगभग ${Math.round(share * 100)}% इस समय दर्ज हुआ, और यह कम से कम ${strongest.days.size} अलग दिनों में दिखा। यह रिकॉर्ड किए गए लेन-देन का पैटर्न है—वास्तविक ग्राहक आवाजाही से इसकी पुष्टि करें।`
        : `About ${Math.round(share * 100)}% of recorded sales value in the last 30 days fell in this time window across ${strongest.days.size} separate dates. This is an entry-time pattern; check it against actual customer footfall.`,
      action: salesAction(shopType, lang, strongest.id),
    };
  }

  return {
    id: 'sales-test-and-learn',
    category: 'Improve sales',
    tone: 'watch',
    title: lang === 'hi' ? 'ग्राहकों की माँग समझकर बिक्री बढ़ाएँ' : 'Find one practical way to improve sales',
    reason: lang === 'hi'
      ? 'अभी अलग-अलग दिनों में समय के हिसाब से बिक्री का भरोसेमंद पैटर्न नहीं मिला। कुछ एंट्री से व्यस्त समय या ग्राहक की पसंद तय करना जल्दबाज़ी होगी।'
      : 'There is not yet a reliable time-of-day pattern across enough separate dates. A few entries are not enough to identify peak hours or customer preferences.',
    action: salesAction(shopType, lang, null),
  };
}

function salesAction(
  shopType: ShopType | null | undefined,
  lang: Language,
  slot: 'morning' | 'afternoon' | 'evening' | 'late' | null,
): string {
  if (lang === 'hi') {
    if (slot) {
      if (shopType === 'salon' || shopType === 'tailor') return 'इस समय लोकप्रिय सेवाओं/काम के लिए समय रखें, अपॉइंटमेंट या डिलीवरी का समय साफ़ बताएँ और संतुष्ट ग्राहक को अगली बुकिंग का विकल्प दें।';
      if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'इस समय से ठीक पहले ताज़ी सामग्री का छोटा बैच तैयार रखें, ज़रूरी स्टाफ उपलब्ध रखें और बची मात्रा दर्ज करें।';
      return 'इस समय सबसे अधिक माँग वाली चीज़ें सामने रखें, उनका स्टॉक जाँचें और काउंटर पर जल्दी बिलिंग की व्यवस्था रखें।';
    }
    if (shopType === 'salon') return 'अगले 7 दिनों में ग्राहक को अगली बुकिंग का विकल्प दें और पूछें कि कौन-सी सेवा का समय उन्हें सुविधाजनक है; फिर बुकिंग का रिकॉर्ड देखें।';
    if (shopType === 'tailor') return 'अगले 7 दिनों तक ग्राहकों की नई पूछताछ, दिए गए भाव और पक्के ऑर्डर दर्ज करें। बार-बार माँगे गए काम के लिए वास्तविक डिलीवरी समय तय करें।';
    if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'अगले 7 दिनों तक ग्राहकों की माँग और बची सामग्री लिखें। एक छोटा कॉम्बो या प्री-ऑर्डर विकल्प आज़माएँ और बिक्री व बर्बादी की तुलना करें।';
    return 'अगले 7 दिनों तक ग्राहक की पूछताछ और न मिलने वाली चीज़ों/सेवाओं को लिखें। एक साबित बिकने वाली चीज़ को काउंटर के पास रखें और परिणाम देखें।';
  }

  if (slot) {
    if (shopType === 'salon' || shopType === 'tailor') return 'Protect time for popular services or jobs in this window, state realistic appointment or delivery times, and offer satisfied customers a chance to rebook.';
    if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'Prepare a small fresh batch just before this window, keep the required staff ready and record what remains unsold.';
    return 'Keep the most-requested items visible and in stock during this window, and make checkout quick when the counter is busy.';
  }
  if (shopType === 'salon') return 'For the next 7 days, offer customers a chance to rebook and ask which appointment times suit them; review the bookings actually made.';
  if (shopType === 'tailor') return 'For the next 7 days, record new enquiries, quotes and confirmed jobs. Set realistic delivery times for the work customers request repeatedly.';
  if (['bakery', 'sweet', 'vegetable', 'tea', 'restaurant'].includes(shopType || '')) return 'For the next 7 days, record customer requests and leftover ingredients. Test one small combo or pre-order option and compare sales with waste.';
  return 'For the next 7 days, note customer requests and items/services you could not supply. Keep one proven seller near the counter and review the result.';
}

function getPlanningAdvice(
  shopType: ShopType | null | undefined,
  lang: Language,
  now: Date,
): MyAdviceItem {
  const relevantEvents = getUpcomingFestivals(now, 2).filter(festival => {
    const id = festival.id.toLocaleLowerCase();
    return ['dhanteras', 'diwali', 'bhai-dooj', 'christmas', 'makar-sankranti', 'vasant-panchami', 'maha-shivratri', 'holi', 'gudi-padwa', 'ram-navami', 'akshaya-tritiya', 'guru-purnima', 'raksha-bandhan', 'janmashtami', 'ganesh-chaturthi', 'onam', 'navratri', 'dussehra', 'karwa-chauth'].some(name => id.includes(name));
  }).filter(festival => daysBetween(getLocalDateKey(now), festival.date) >= 1);

  const next = relevantEvents[0];
  if (next) {
    const pairedDiwali = next.id.toLocaleLowerCase().includes('dhanteras')
      ? relevantEvents.find(event => event.id.toLocaleLowerCase().includes('diwali') && daysBetween(next.date, event.date) <= 7)
      : undefined;
    const planFestival = pairedDiwali || next;
    const festivalAdvice = getFestivalShopAdvice(planFestival.id, shopType, lang);
    const primaryName = getFestivalName(next, lang);
    const pairName = pairedDiwali ? getFestivalName(pairedDiwali, lang) : '';
    const days = daysBetween(getLocalDateKey(now), next.date);
    const date = getFestivalDateLabel(next.date, lang);
    const dateTwo = pairedDiwali ? getFestivalDateLabel(pairedDiwali.date, lang) : '';
    return {
      id: 'plan-upcoming-festival',
      category: 'Plan ahead',
      tone: 'watch',
      title: lang === 'hi'
        ? (pairedDiwali ? 'धनतेरस और दिवाली की तैयारी करें' : `${primaryName} की तैयारी पहले करें`)
        : (pairedDiwali ? 'Plan for Dhanteras and Diwali' : `Prepare for ${primaryName}`),
      reason: lang === 'hi'
        ? (pairedDiwali
            ? `धनतेरस ${date} को और ${pairName} ${dateTwo} को है। त्योहार से माँग बदल सकती है, लेकिन हर इलाके और दुकान में एक जैसी बिक्री नहीं होती।`
            : `${primaryName} ${date} को, यानी ${days} दिन बाद है। इसे तैयारी का संकेत मानें, बिक्री की गारंटी नहीं—स्थानीय ग्राहकों की माँग देखें।`)
        : (pairedDiwali
            ? `Dhanteras is on ${date} and ${pairName} follows on ${dateTwo}. These dates may change what customers ask for, but demand differs by neighbourhood and shop type.`
            : `${primaryName} is on ${date}, in ${days} days. Treat it as a planning prompt, not a sales forecast; check what local customers actually request.`),
      action: `${festivalAdvice.keepReady} ${festivalAdvice.restock}`,
    };
  }

  return {
    id: 'plan-next-30-days',
    category: 'Plan ahead',
    tone: 'watch',
    title: lang === 'hi' ? 'अगले 30 दिनों की तैयारी करें' : 'Prepare for the next 30 days',
    reason: lang === 'hi'
      ? 'आने वाले समय में सूचीबद्ध बड़ा स्थानीय त्योहार नहीं दिख रहा। नियमित माँग, सप्लायर के समय और तय ऑर्डर के आधार पर योजना बनाना बेहतर है।'
      : 'There is no major listed festival in the next two months. Plan around regular demand, supplier lead times and confirmed orders instead of assuming a seasonal rush.',
    action: lang === 'hi'
      ? 'महीना शुरू होने से पहले तेज़ बिकने वाले सामान/सेवाएँ देखें, भौतिक स्टॉक गिनें, सप्लायर का समय और किराया/वेतन/बिजली जैसे ज़रूरी खर्च लिखें।'
      : 'Before the next month begins, review repeat sellers or services, count physical stock, note supplier lead times and list essential costs such as rent, wages and electricity.',
  };
}

/** Returns exactly four ranked cards: immediate action, buying, sales improvement and forward planning. */
export function getMyAdvice(
  week: PeriodMetrics,
  month: PeriodMetrics,
  sales: SaleEntry[],
  udhaar: UdhaarEntry[],
  lang: Language,
  shopType: ShopType | null | undefined,
  now: Date = new Date(),
): MyAdviceItem[] {
  return [
    getImmediateAdvice(week, month, udhaar, shopType, lang, now),
    getBuyingAdvice(sales, shopType, lang, now),
    getSalesAdvice(sales, shopType, lang, now),
    getPlanningAdvice(shopType, lang, now),
  ];
}
