import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Lightbulb,
  Minus,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore, formatRupee, getToday } from '../store';
import { t } from '../i18n';
import { formatInsightsDateRange, getInsightsDashboard } from '../insights/analytics';
import type { PeriodMetrics } from '../insights/analytics';

type Language = 'en' | 'hi';
type InsightTone = 'warning' | 'positive' | 'info';

interface BusinessInsight {
  period: 'week' | 'month' | null;
  tone: InsightTone;
  title: string;
  description: string;
  priority: number;
}

function periodName(period: 'week' | 'month', lang: Language): string {
  if (lang === 'hi') return period === 'week' ? 'इस हफ़्ते' : 'इस महीने';
  return period === 'week' ? 'This week' : 'This month';
}

function changePhrase(change: number, lang: Language, subject: 'sales' | 'expenses'): string {
  const amount = Math.abs(change);
  if (lang === 'hi') {
    if (subject === 'sales') {
      return change > 0 ? `बिक्री ${amount}% बढ़ी है` : change < 0 ? `बिक्री ${amount}% घटी है` : 'बिक्री में बदलाव नहीं है';
    }
    return change > 0 ? `खर्च ${amount}% बढ़ा है` : change < 0 ? `खर्च ${amount}% घटा है` : 'खर्च में बदलाव नहीं है';
  }
  if (subject === 'sales') {
    return change > 0 ? `sales are up ${amount}%` : change < 0 ? `sales are down ${amount}%` : 'sales are unchanged';
  }
  return change > 0 ? `expenses are up ${amount}%` : change < 0 ? `expenses are down ${amount}%` : 'expenses are unchanged';
}

type ShopActionScenario = 'growth' | 'shortfall' | 'cost-stock' | 'cost' | 'uneven-days' | 'sales-fall' | 'routine';

function getShopAction(shopType: string | null | undefined, scenario: ShopActionScenario, lang: Language): string {
  const type = shopType || 'other';
  const serviceBusiness = type === 'salon' || type === 'tailor';
  const foodBusiness = ['restaurant', 'tea', 'bakery', 'sweet', 'vegetable'].includes(type);

  const en: Record<ShopActionScenario, string> = {
    growth: 'Keep the items or services customers ask for most ready, and continue your daily closing routine.',
    shortfall: 'Check that every sale or service and every expense was recorded. Match the largest bills, then pause non-urgent spending until you understand the gap.',
    'cost-stock': 'Before replenishing, count what is on hand and compare it with recent item sales. Buy in smaller batches when demand is uncertain.',
    cost: 'Compare recent bills and payment entries. Identify which cost rose and discuss pricing, quantity or alternatives before cutting something customers need.',
    'uneven-days': 'Record each sale for the next two weeks. Compare quieter and busier days, then test one small change suited to your customers and review the result.',
    'sales-fall': 'Check opening hours, missing entries and the availability of the services or items customers most often request. Change one thing at a time before using discounts.',
    routine: 'At closing, reconcile sales, expenses and payments. Review your most requested items or services weekly and make the next plan from those records.',
  };
  const hi: Record<ShopActionScenario, string> = {
    growth: 'ग्राहकों की सबसे ज़्यादा माँग वाली चीज़ें या सेवाएँ तैयार रखें और रोज़ का हिसाब जारी रखें।',
    shortfall: 'हर बिक्री या सेवा और हर खर्च की एंट्री जाँचें। बड़े बिल मिलाएँ और अंतर समझ आने तक गैर-ज़रूरी खर्च रोकें।',
    'cost-stock': 'सामान भरने से पहले मौजूदा स्टॉक गिनें और हाल की बिक्री से तुलना करें। माँग साफ़ न हो तो कम मात्रा में खरीदें।',
    cost: 'हाल के बिल और भुगतान मिलाएँ। कौन-सा खर्च बढ़ा है, पहचानें और ज़रूरी सेवा या गुणवत्ता घटाने से पहले विकल्प देखें।',
    'uneven-days': 'अगले दो हफ़्ते हर बिक्री दर्ज करें। कम और ज़्यादा बिक्री वाले दिनों की तुलना करें, फिर ग्राहकों के हिसाब से एक छोटा बदलाव आज़माएँ।',
    'sales-fall': 'दुकान के समय, छूटी एंट्री और ग्राहकों की माँग वाली चीज़ों या सेवाओं की उपलब्धता जाँचें। छूट देने से पहले एक समय में एक बदलाव करें।',
    routine: 'दुकान बंद करते समय बिक्री, खर्च और भुगतान मिलाएँ। सबसे ज़्यादा माँग वाली चीज़ों या सेवाओं की साप्ताहिक समीक्षा करें।',
  };

  if (serviceBusiness) {
    const serviceEn: Record<ShopActionScenario, string> = {
      growth: type === 'salon'
        ? 'Protect time for your most-requested services, offer rebooking to satisfied customers and keep the consumables used by those services ready.'
        : 'Protect time for your most-requested stitching and alteration work, confirm delivery dates, and replenish thread, lining and fasteners against orders.',
      shortfall: type === 'salon'
        ? 'Check that every haircut, treatment and other service was recorded, then match product-use and utility costs. Pause non-urgent product orders until the gap is understood.'
        : 'Check that every stitching job, alteration and advance payment was recorded. Match material purchases to orders and pause non-urgent fabric buying until the gap is understood.',
      'cost-stock': type === 'salon'
        ? 'Check shampoo, colour, treatment and hygiene consumables on hand. Replenish based on booked services and recent use, not on a general retail-stock list.'
        : 'Check thread, lining, zips, hooks and the materials needed for confirmed jobs. Replenish common consumables first and avoid buying fabric for unconfirmed demand.',
      cost: type === 'salon'
        ? 'Compare utility, rent and product-cost bills. Review service pricing and how much product each service uses before cutting quality or needed hygiene supplies.'
        : 'Compare rent, utility and material costs. Check the time and materials used by common jobs before changing prices or reducing quality.',
      'uneven-days': type === 'salon'
        ? 'Compare appointment counts and service mix on quieter and busier days. Test a reminder or a suitable off-peak appointment offer, then compare bookings.'
        : 'Compare completed jobs and alteration requests by day. Use quieter slots for fittings or follow-ups and record whether this improves paid bookings.',
      'sales-fall': type === 'salon'
        ? 'Check appointment numbers, repeat visits, opening hours and whether popular services were available. Try a booking reminder before cutting prices.'
        : 'Check new orders, repeat customers, fitting capacity and delivery times. Follow up on quotes that were not confirmed before reducing prices.',
      routine: type === 'salon'
        ? 'At closing, record each service and amount, and check consumables used. Review bookings and popular services weekly to plan supplies and appointment capacity.'
        : 'At closing, record each job and amount. Review pending orders, delivery dates and common material use weekly before purchasing more fabric or supplies.',
    };
    return lang === 'hi' ? (type === 'salon' ? ({
      growth: 'सबसे ज़्यादा माँग वाली सेवाओं के लिए समय रखें, संतुष्ट ग्राहकों को दोबारा बुकिंग का विकल्प दें और उन सेवाओं का ज़रूरी सामान तैयार रखें।',
      shortfall: 'हर हेयरकट, ट्रीटमेंट और सेवा की एंट्री जाँचें। प्रोडक्ट और बिजली के खर्च मिलाएँ; अंतर समझ आने तक गैर-ज़रूरी प्रोडक्ट ऑर्डर रोकें।',
      'cost-stock': 'शैम्पू, कलर, ट्रीटमेंट और सफ़ाई का उपलब्ध सामान जाँचें। बुकिंग और हाल के इस्तेमाल के आधार पर भरें, सामान्य रिटेल स्टॉक सूची से नहीं।',
      cost: 'बिजली, किराया और प्रोडक्ट के बिल मिलाएँ। गुणवत्ता या ज़रूरी सफ़ाई का सामान घटाने से पहले सर्विस की कीमत और प्रति सेवा इस्तेमाल देखें।',
      'uneven-days': 'कम और ज़्यादा व्यस्त दिनों की बुकिंग तथा सेवाओं की तुलना करें। शांत समय में रिमाइंडर या उपयुक्त ऑफ-पीक ऑफर आज़माएँ और बुकिंग देखें।',
      'sales-fall': 'अपॉइंटमेंट, दोबारा आने वाले ग्राहक, दुकान के समय और लोकप्रिय सेवाओं की उपलब्धता जाँचें। कीमत घटाने से पहले बुकिंग रिमाइंडर आज़माएँ।',
      routine: 'दिन के अंत में हर सेवा और रकम लिखें और इस्तेमाल हुआ सामान जाँचें। हर हफ़्ते बुकिंग और लोकप्रिय सेवाएँ देखकर सामान और समय की योजना बनाएँ।',
    } as Record<ShopActionScenario, string>)[scenario] : ({
      growth: 'सबसे ज़्यादा माँग वाली सिलाई और अल्टरेशन के लिए समय रखें, डिलीवरी तारीख़ तय करें और पक्के ऑर्डर के हिसाब से धागा, अस्तर व हुक-ज़िप भरें।',
      shortfall: 'हर सिलाई, अल्टरेशन और एडवांस भुगतान दर्ज हुआ या नहीं, जाँचें। सामग्री की खरीद को ऑर्डर से मिलाएँ और अंतर समझ आने तक गैर-ज़रूरी कपड़ा न खरीदें।',
      'cost-stock': 'धागा, अस्तर, ज़िप, हुक और पक्के काम की सामग्री जाँचें। आम इस्तेमाल की चीज़ें पहले भरें और बिना पक्के ऑर्डर के कपड़ा न खरीदें।',
      cost: 'किराया, बिजली और सामग्री के बिल मिलाएँ। भाव या गुणवत्ता बदलने से पहले आम काम में लगने वाला समय और सामग्री देखें।',
      'uneven-days': 'हर दिन पूरे हुए काम और अल्टरेशन की माँग की तुलना करें। शांत समय में फिटिंग या पुराने ग्राहकों से संपर्क करें और पक्के ऑर्डर देखें।',
      'sales-fall': 'नए ऑर्डर, पुराने ग्राहक, फिटिंग की क्षमता और डिलीवरी समय जाँचें। कीमत घटाने से पहले दिए गए भावों पर फॉलो-अप करें।',
      routine: 'दिन के अंत में हर काम और रकम लिखें। नया कपड़ा या सामान लेने से पहले लंबित ऑर्डर, डिलीवरी तारीख़ और सामग्री का इस्तेमाल देखें।',
    } as Record<ShopActionScenario, string>)[scenario]) : serviceEn[scenario];
  }

  if (type === 'medical') {
    const medicalEn: Record<ShopActionScenario, string> = {
      growth: 'Keep frequently requested health essentials available, follow expiry rotation and continue recording every sale accurately.',
      shortfall: 'Reconcile every counter sale with the record and match supplier bills. Check expiry and avoid urgent bulk purchases until the gap is clear.',
      'cost-stock': 'Review recent demand, expiry dates and stock on hand. Restock compliant, fast-moving items first instead of increasing every category.',
      cost: 'Compare supplier invoices and operating bills. Check which compliant products or utility costs changed before adjusting prices or assortment.',
      'uneven-days': 'Compare customer footfall and recorded sales by day, and confirm that counter sales are fully entered. Keep regular essentials organised for busy periods.',
      'sales-fall': 'Check opening hours, missing entries and availability of regularly requested essentials. Review expiry and supplier availability before changing prices.',
      routine: 'At closing, reconcile counter sales and expenses. Review fast-moving categories and upcoming expiry dates each week.',
    };
    return lang === 'hi' ? ({
      growth: 'नियमित माँग वाली स्वास्थ्य संबंधी ज़रूरी चीज़ें उपलब्ध रखें, एक्सपायरी के अनुसार स्टॉक घुमाएँ और हर बिक्री सही दर्ज करें।',
      shortfall: 'काउंटर की हर बिक्री रिकॉर्ड से मिलाएँ और सप्लायर के बिल जाँचें। अंतर स्पष्ट होने तक अनुमान से बड़ी खरीद न करें और एक्सपायरी देखें।',
      'cost-stock': 'हाल की माँग, एक्सपायरी और उपलब्ध स्टॉक देखें। नियमों के अनुसार रखे जाने वाले तेज़ बिकने वाले सामान पहले भरें।',
      cost: 'सप्लायर के बिल और संचालन के खर्च मिलाएँ। भाव या सामान बदलने से पहले पता करें कि कौन-सी लागत बदली है।',
      'uneven-days': 'हर दिन ग्राहकों की संख्या और दर्ज बिक्री की तुलना करें। व्यस्त समय में नियमित ज़रूरी सामान व्यवस्थित रखें और छूटी एंट्री जाँचें।',
      'sales-fall': 'दुकान के समय, छूटी एंट्री और नियमित माँग वाले सामान की उपलब्धता जाँचें। भाव बदलने से पहले एक्सपायरी और सप्लायर की स्थिति देखें।',
      routine: 'दुकान बंद करते समय काउंटर बिक्री और खर्च मिलाएँ। तेज़ बिकने वाली श्रेणियों और नज़दीक आती एक्सपायरी की साप्ताहिक समीक्षा करें।',
    } as Record<ShopActionScenario, string>)[scenario] : medicalEn[scenario];
  }

  if (foodBusiness) {
    const foodEn: Record<ShopActionScenario, string> = {
      growth: type === 'restaurant' || type === 'tea'
        ? 'Prepare staff and fresh ingredients for your busiest times; promote only the dishes or snack pairings that already sell well.'
        : 'Keep your most-requested fresh products available and plan ingredients or packaging around recent sales and confirmed orders.',
      shortfall: 'Check that every order or counter sale was recorded. Match ingredient purchases and bills, then limit non-urgent perishable buying until you understand the gap.',
      'cost-stock': 'Check remaining ingredients or produce, freshness and recent sales before replenishing. Use smaller, more frequent orders for perishable stock.',
      cost: 'Compare ingredient, packaging and utility costs. Check waste and portion sizes before reducing quality or increasing menu prices.',
      'uneven-days': 'Compare orders and waste on quieter and busier days. Prepare smaller fresh batches and test one relevant combo or pre-order option.',
      'sales-fall': 'Check opening hours, missing entries, menu availability and customer orders. Review freshness and waste before using discounts.',
      routine: 'At closing, record orders and waste, then check ingredient use. Plan the next purchase from recent menu or produce demand and confirmed orders.',
    };
    return lang === 'hi' ? ({
      growth: 'सबसे ज़्यादा बिकने वाले व्यंजन या ताज़े उत्पाद उपलब्ध रखें। व्यस्त समय के लिए स्टाफ, सामग्री और पक्के ऑर्डर की योजना बनाएँ।',
      shortfall: 'हर ऑर्डर या काउंटर बिक्री दर्ज हुई या नहीं, जाँचें। सामग्री की खरीद और बिल मिलाएँ, फिर अंतर समझ आने तक गैर-ज़रूरी जल्दी खराब होने वाला सामान कम खरीदें।',
      'cost-stock': 'सामग्री या सब्ज़ी-फल का बचा स्टॉक, ताज़गी और हाल की बिक्री देखकर भरें। जल्दी खराब होने वाली चीज़ें कम मात्रा में, बार-बार मँगाएँ।',
      cost: 'सामग्री, पैकेजिंग और बिजली के खर्च मिलाएँ। गुणवत्ता घटाने या भाव बढ़ाने से पहले बर्बादी और पोर्शन देखें।',
      'uneven-days': 'कम और ज़्यादा बिक्री वाले दिनों के ऑर्डर और बर्बादी की तुलना करें। कम मात्रा में ताज़ा तैयार करें और एक प्रासंगिक कॉम्बो या प्री-ऑर्डर आज़माएँ।',
      'sales-fall': 'दुकान के समय, छूटी एंट्री, मेन्यू की उपलब्धता और ग्राहक ऑर्डर जाँचें। डिस्काउंट से पहले ताज़गी और बर्बादी देखें।',
      routine: 'दिन के अंत में ऑर्डर और बर्बादी लिखें, सामग्री का इस्तेमाल देखें और अगली खरीद हाल की माँग व पक्के ऑर्डर के आधार पर करें।',
    } as Record<ShopActionScenario, string>)[scenario] : foodEn[scenario];
  }

  return lang === 'hi' ? hi[scenario] : en[scenario];
}

function getInsightCards(
  week: PeriodMetrics,
  month: PeriodMetrics,
  lang: Language,
  hasAnyEntries: boolean,
  hasBusinessRisk: boolean,
  shopType?: string | null,
): BusinessInsight[] {
  const celebrateWeek = !hasBusinessRisk &&
    week.profit > 0 &&
    week.profitMargin !== null &&
    week.profitMargin >= 20 &&
    week.salesChange !== null &&
    week.salesChange >= 10 &&
    week.expensesChange !== null &&
    week.expensesChange <= week.salesChange &&
    month.profit >= 0 &&
    (month.salesChange === null || month.salesChange >= 0) &&
    (month.expensesChange === null || month.salesChange === null || month.expensesChange <= month.salesChange + 5);
  const make = (
    period: 'week' | 'month',
    tone: InsightTone,
    title: string,
    description: string,
  ): BusinessInsight => ({ period, tone, title, description, priority: 0 });

  const performanceSummary = (metrics: PeriodMetrics): BusinessInsight => {
    const period = metrics.period;
    if (!metrics.hasEntries) {
      return make(
        period,
        'info',
        lang === 'hi' ? `${periodName(period, lang)} कोई रिकॉर्ड नहीं` : `No records for ${periodName(period, lang).toLowerCase()}`,
        hasAnyEntries
          ? (lang === 'hi'
              ? 'इस अवधि की बिक्री और खर्च दर्ज नहीं हैं। यहाँ सही जानकारी दिखाने के लिए इस अवधि की एंट्री चाहिए।'
              : 'No sales or expenses are recorded in this date range. Add entries for this period to see its performance.')
          : (lang === 'hi'
              ? 'बिक्री और खर्च की एंट्री डालें। जानकारी आपके अपने रिकॉर्ड पर आधारित होगी।'
              : 'Record sales and expenses to see a business snapshot based on your own entries.'),
      );
    }

    const marginText = metrics.profitMargin === null
      ? (lang === 'hi' ? 'बिक्री शून्य होने के कारण मुनाफ़ा प्रतिशत उपलब्ध नहीं है' : 'profit margin is unavailable because recorded sales are zero')
      : (lang === 'hi' ? `मुनाफ़ा प्रतिशत ${metrics.profitMargin}% है` : `profit margin is ${metrics.profitMargin}%`);

    if (period === 'week' && celebrateWeek && metrics.profitMargin !== null && metrics.salesChange !== null) {
      return make(
        period,
        'positive',
        lang === 'hi' ? 'आपकी मेहनत का असर दिख रहा है!' : 'Your hard work is paying off!',
        lang === 'hi'
          ? `इस हफ़्ते बिक्री ${metrics.salesChange}% बढ़ी और दर्ज खर्च के बाद ${formatRupee(metrics.profit)} बचा। मुनाफ़ा प्रतिशत ${metrics.profitMargin}% है। यह अच्छी प्रगति है—${getShopAction(shopType, 'growth', 'hi')}`
          : `Sales are up ${metrics.salesChange}% this week, with ${formatRupee(metrics.profit)} left after recorded expenses and a ${metrics.profitMargin}% margin. That is real progress. ${getShopAction(shopType, 'growth', 'en')}` ,
      );
    }

    return make(
      period,
      metrics.profit < 0 ? 'warning' : metrics.profit > 0 ? 'positive' : 'info',
      lang === 'hi' ? `${periodName(period, lang)} का हिसाब` : `${periodName(period, lang)} at a glance`,
      lang === 'hi'
        ? `दर्ज बिक्री ${formatRupee(metrics.sales)}, खर्च ${formatRupee(metrics.expenses)} और खर्च के बाद ${metrics.profit < 0 ? 'घाटा' : 'मुनाफ़ा'} ${formatRupee(Math.abs(metrics.profit))} है; ${marginText}।`
        : `Recorded sales are ${formatRupee(metrics.sales)} and expenses are ${formatRupee(metrics.expenses)}, leaving ${metrics.profit < 0 ? 'a shortfall' : 'profit'} of ${formatRupee(Math.abs(metrics.profit))}; ${marginText}.`,
    );
  };

  const salesTrendInsight = (metrics: PeriodMetrics): BusinessInsight => {
    const label = periodName(metrics.period, lang);
    if (metrics.salesChange === null) {
      return make(
        metrics.period,
        'info',
        lang === 'hi' ? 'बिक्री की तुलना अभी उपलब्ध नहीं' : `${label} sales comparison unavailable`,
        lang === 'hi'
          ? 'पिछली समान अवधि में दर्ज बिक्री का आधार नहीं है, इसलिए प्रतिशत बदलाव बताना सही नहीं होगा। नियमित एंट्री जारी रखें।'
          : 'There is no recorded-sales baseline in the previous comparable period, so a percentage change would be misleading. Keep recording sales to establish a reliable trend.',
      );
    }

    const change = metrics.salesChange;
    const tone: InsightTone = change < 0 ? 'warning' : change > 0 ? 'positive' : 'info';
    const description = change > 0
      ? (lang === 'hi'
          ? `पिछली समान अवधि के मुकाबले बिक्री ${change}% बढ़ी है। तारीख़वार बिक्री देखें कि किन दिनों ने योगदान दिया।`
          : `Recorded sales are up ${change}% versus the equivalent previous period. Review daily totals to see which dates contributed to the increase.`)
      : change < 0
        ? (lang === 'hi'
            ? `पिछली समान अवधि के मुकाबले बिक्री ${Math.abs(change)}% घटी है। एंट्री पूरी हैं या नहीं, और किन दिनों में बिक्री कम थी, जाँचें।`
            : `Recorded sales are down ${Math.abs(change)}% versus the equivalent previous period. Check entry completeness and identify the dates with lower sales.`)
        : (lang === 'hi'
            ? 'पिछली समान अवधि के मुकाबले दर्ज बिक्री में बदलाव नहीं है। बिक्री बढ़ाने के लिए ग्राहक की माँग और धीमे दिनों को देखें।'
            : 'Recorded sales are unchanged versus the equivalent previous period. Review customer demand and slower days for possible improvements.');
    return make(
      metrics.period,
      tone,
      lang === 'hi' ? `${label} बिक्री का ट्रेंड` : `${label} sales trend`,
      description,
    );
  };

  const expenseInsight = (metrics: PeriodMetrics): BusinessInsight => {
    const label = periodName(metrics.period, lang);
    const topExpense = metrics.topExpenses[0];
    if (!topExpense || metrics.expenses <= 0) {
      return make(
        metrics.period,
        'info',
        lang === 'hi' ? `${label} खर्च का रिकॉर्ड नहीं` : `${label} expense pattern`,
        lang === 'hi'
          ? 'इस अवधि में कोई सकारात्मक खर्च एंट्री नहीं है, इसलिए खर्च की श्रेणियों की तुलना अभी नहीं हो सकती।'
          : 'No positive expense entries are recorded in this period, so expense categories cannot be analysed yet. Add expenses as they occur.',
      );
    }

    const categoryName = t(`ec_${topExpense.category}` as any, lang);
    return make(
      metrics.period,
      topExpense.share >= 40 ? 'warning' : 'info',
      lang === 'hi' ? `${label} सबसे बड़ा खर्च` : `${label} largest expense`,
      lang === 'hi'
        ? `${categoryName} पर ${formatRupee(topExpense.amount)} खर्च हुए, जो दर्ज खर्च का लगभग ${topExpense.share}% है। अगली बार खर्च डालते समय श्रेणी और ज़रूरत जाँचें।`
        : `${categoryName} is the largest recorded category at ${formatRupee(topExpense.amount)} (about ${topExpense.share}% of expenses). Review whether the entries are expected and planned before trying to reduce costs.`,
    );
  };

  const strongestDayInsight = (metrics: PeriodMetrics): BusinessInsight => {
    const label = periodName(metrics.period, lang);
    if (metrics.bestSalesDay && metrics.salesDaysCount >= 2) {
      const dayDate = new Date(`${metrics.bestSalesDay.date}T12:00:00`);
      const formattedDate = dayDate.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return make(
        metrics.period,
        'positive',
        lang === 'hi' ? 'सबसे ज़्यादा बिक्री वाला दिन' : `${label} strongest sales day`,
        lang === 'hi'
          ? `${formattedDate} को ${formatRupee(metrics.bestSalesDay.amount)} की सबसे अधिक बिक्री दर्ज हुई। इसे एक संकेत मानें; कई हफ़्तों का डेटा मिलने पर ही नियमित पैटर्न का भरोसा होगा।`
          : `${formattedDate} had the highest recorded sales at ${formatRupee(metrics.bestSalesDay.amount)}. Treat this as a single-period signal; several weeks of data are needed to confirm a recurring pattern.`,
      );
    }

    return make(
      metrics.period,
      'info',
      lang === 'hi' ? 'दैनिक बिक्री का पैटर्न बन रहा है' : `${label} daily sales pattern`,
      lang === 'hi'
        ? 'अलग-अलग दिनों की बिक्री दर्ज करते रहें। कई दिनों का रिकॉर्ड होने पर ही सबसे अच्छा दिन पहचानना उपयोगी होगा।'
        : 'Record sales across more days. A comparison across multiple dates is needed before identifying a meaningful strongest day.',
    );
  };

  const monthlyExpenseTrend = (): BusinessInsight => {
    if (month.expensesChange === null) {
      return make(
        'month',
        'info',
        lang === 'hi' ? 'मासिक खर्च की तुलना उपलब्ध नहीं' : 'Monthly expense comparison unavailable',
        lang === 'hi'
          ? 'पिछली समान अवधि में दर्ज खर्च का आधार नहीं है। खर्च दर्ज करते रहें ताकि अगले महीने सही तुलना हो सके।'
          : 'There is no expense baseline in the previous comparable period. Keep recording costs so next month’s comparison is meaningful.',
      );
    }

    const change = month.expensesChange;
    const tone: InsightTone = change > 0 ? 'warning' : change < 0 ? 'positive' : 'info';
    return make(
      'month',
      tone,
      lang === 'hi' ? 'मासिक खर्च का ट्रेंड' : 'Monthly expense trend',
      change > 0
        ? (lang === 'hi'
            ? `पिछली समान अवधि से खर्च ${change}% बढ़ा है। देखें कि यह नियोजित खरीद है या कोई खर्च अनावश्यक रूप से बढ़ा है।`
            : `Recorded expenses are up ${change}% versus the same elapsed dates last month. Check whether this reflects planned purchases or costs that have risen unexpectedly.`)
        : change < 0
          ? (lang === 'hi'
              ? `पिछली समान अवधि से खर्च ${Math.abs(change)}% कम है। एंट्री पूरी हैं या नहीं, यह भी जाँचें।`
              : `Recorded expenses are down ${Math.abs(change)}% versus the same elapsed dates last month. Confirm that all expenses have been entered before concluding that costs improved.`)
          : (lang === 'hi'
              ? 'पिछली समान अवधि से दर्ज खर्च लगभग समान हैं। बड़ी श्रेणियों पर नज़र रखें।'
              : 'Recorded expenses are unchanged versus the same elapsed dates last month. Keep an eye on the largest categories.'),
    );
  };

  const monthlyMarginInsight = (): BusinessInsight => {
    if (!month.hasEntries) {
      return make(
        'month',
        'info',
        lang === 'hi' ? 'मासिक मुनाफ़ा अभी उपलब्ध नहीं' : 'Monthly profit insight unavailable',
        lang === 'hi'
          ? 'इस महीने बिक्री और खर्च की एंट्री नहीं है। रिकॉर्ड होने पर ही मुनाफ़ा और उसका प्रतिशत समझा जा सकेगा।'
          : 'There are no entries for this month yet. Record sales and expenses to calculate profit and margin for the current month.',
      );
    }

    if (month.sales <= 0 || month.profitMargin === null) {
      return make(
        'month',
        'warning',
        lang === 'hi' ? 'मुनाफ़ा प्रतिशत की गणना नहीं हो सकती' : 'Profit margin cannot be calculated yet',
        lang === 'hi'
          ? `इस महीने दर्ज बिक्री ${formatRupee(month.sales)} है। बिक्री दर्ज होने पर ही बिक्री में से खर्च घटाकर मुनाफ़ा प्रतिशत निकलेगा।`
          : `Recorded sales this month are ${formatRupee(month.sales)}. A profit margin needs recorded sales; verify that all sales have been entered.`,
      );
    }

    if (month.previousProfitMargin === null) {
      return make(
        'month',
        'info',
        lang === 'hi' ? 'मासिक मुनाफ़ा प्रतिशत' : 'Monthly profit margin',
        lang === 'hi'
          ? `दर्ज खर्च के बाद मुनाफ़ा प्रतिशत ${month.profitMargin}% है। पिछली समान अवधि का आधार उपलब्ध न होने से यह बताना संभव नहीं कि प्रतिशत बढ़ा या घटा।`
          : `Profit after recorded expenses is ${month.profitMargin}% of sales. There is no previous-period margin baseline yet, so we cannot say whether it improved.`,
      );
    }

    const difference = month.profitMargin - month.previousProfitMargin;
    const changeDescription = difference >= 5
      ? (lang === 'hi' ? `मुनाफ़ा प्रतिशत ${difference} अंक बढ़ा है` : `margin is up ${difference} percentage points`)
      : difference <= -5
        ? (lang === 'hi' ? `मुनाफ़ा प्रतिशत ${Math.abs(difference)} अंक घटा है` : `margin is down ${Math.abs(difference)} percentage points`)
        : (lang === 'hi' ? 'मुनाफ़ा प्रतिशत लगभग स्थिर है' : 'margin is broadly stable');
    return make(
      'month',
      difference <= -5 ? 'warning' : difference >= 5 ? 'positive' : 'info',
      lang === 'hi' ? 'मासिक मुनाफ़े का ट्रेंड' : 'Monthly profit margin trend',
      lang === 'hi'
        ? `इस महीने मुनाफ़ा प्रतिशत ${month.profitMargin}% है; ${changeDescription}। बदलाव का कारण समझने के लिए बिक्री और खर्च की एंट्री देखें।`
        : `This month’s recorded profit margin is ${month.profitMargin}%; ${changeDescription}. Review sales and expense entries to understand what contributed to the change.`,
    );
  };

  // Seven compact cards: four weekly signals and three monthly signals.
  // Even when a comparison is unavailable, its card explains the data limitation
  // instead of inventing a percentage or hiding the business question.
  return [
    performanceSummary(week),
    salesTrendInsight(week),
    expenseInsight(week),
    strongestDayInsight(week),
    salesTrendInsight(month),
    monthlyExpenseTrend(),
    monthlyMarginInsight(),
  ];
}


type AdviceTone = 'warning' | 'watch' | 'positive';
interface MyAdviceItem {
  id: string;
  tone: AdviceTone;
  title: string;
  reason: string;
  action: string;
}

function getMyAdvice(
  week: PeriodMetrics,
  month: PeriodMetrics,
  sales: { date: string; amount: number }[],
  udhaar: { customerName: string; amount: number; date: string; dueDate?: string; paid: boolean }[],
  lang: Language,
  shopType?: string | null,
): MyAdviceItem[] {
  const today = getToday();
  const candidates: Array<MyAdviceItem & { priority: number }> = [];
  const add = (
    id: string,
    tone: AdviceTone,
    title: string,
    reason: string,
    action: string,
    priority: number,
  ) => candidates.push({ id, tone, title, reason, action, priority });

  // Credit that is past its agreed date can put pressure on the shop's cash.
  const overdue = udhaar.filter(entry =>
    !entry.paid &&
    typeof entry.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate) &&
    entry.dueDate < today,
  );
  const overdueAmount = overdue.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
  if (overdue.length > 0) {
    add(
      'overdue-credit',
      'warning',
      lang === 'hi' ? 'उधार का पैसा अटका हुआ है' : 'Bring overdue udhaar back into the business',
      lang === 'hi'
        ? `${overdue.length} ग्राहकों से ${formatRupee(overdueAmount)} का भुगतान तय तारीख़ से बाकी है। ज़्यादा देर होने पर रोज़ के खर्च के लिए नकद कम पड़ सकता है।`
        : `${overdue.length} customer balance(s) totalling ${formatRupee(overdueAmount)} are past their due date. Delayed payments can leave less cash for everyday shop costs.`,
      lang === 'hi'
        ? 'आज सबसे पुराने या सबसे बड़े बकाये वाले ग्राहक को सही रकम और तारीख़ के साथ विनम्र संदेश भेजें। ज़रूरत हो तो छोटी किस्त और अगली भुगतान तारीख़ तय करें; नया उधार देने से पहले पुराना हिसाब साफ़ करें।'
        : 'Today, send a polite reminder to the customer with the oldest or largest balance. State the exact amount and agree on a date or a small instalment. Be careful about adding more credit before the old balance is addressed.',
      110,
    );
  }

  const openCredit = udhaar.filter(entry => !entry.paid && Number(entry.amount) > 0);
  const openCreditAmount = openCredit.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
  const dueSoon = openCredit.filter(entry =>
    typeof entry.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate) &&
    entry.dueDate >= today &&
    entry.dueDate <= (() => {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    })(),
  );
  if (overdue.length === 0 && openCredit.length > 0 &&
      (dueSoon.length > 0 || (week.sales > 0 && openCreditAmount >= week.sales * 0.5))) {
    add(
      'credit-cash-pressure',
      'watch',
      lang === 'hi' ? 'आने वाले उधार भुगतान पर नज़र रखें' : 'Protect cash before udhaar comes due',
      lang === 'hi'
        ? `${formatRupee(openCreditAmount)} का उधार अभी बाकी है${dueSoon.length > 0 ? ` और ${dueSoon.length} भुगतान अगले 7 दिनों में तय हैं` : ''}। यह पैसा समय पर न आए तो स्टॉक और रोज़ के बिलों पर दबाव पड़ सकता है।`
        : `${formatRupee(openCreditAmount)} in udhaar is still unpaid${dueSoon.length > 0 ? `, including ${dueSoon.length} balance(s) due within 7 days` : ''}. Late collection can make stock orders and regular bills harder to cover.`,
      lang === 'hi'
        ? 'देय तारीख़ से पहले ग्राहकों को रकम और भुगतान दिन याद दिलाएँ। अगला उधार लिखते समय तारीख़ तय करें और सप्लायर के भुगतान के लिए ज़रूरी नकद अलग रखें।'
        : 'Remind customers of the amount and due date before it arrives. Agree on a date for any new credit and keep enough cash aside for upcoming supplier payments.',
      88,
    );
  }

  const lossPeriod = week.profit < 0 ? week : month.profit < 0 ? month : null;
  if (lossPeriod) {
    const label = periodName(lossPeriod.period, lang);
    const gap = Math.abs(lossPeriod.profit);
    add(
      'recorded-loss',
      'warning',
      lang === 'hi' ? `${label} दर्ज खर्च बिक्री से ज़्यादा हैं` : `Protect cash: ${label.toLowerCase()} is showing a shortfall`,
      lang === 'hi'
        ? `दर्ज खर्च बिक्री से ${formatRupee(gap)} ज़्यादा हैं। यह असली नुकसान भी हो सकता है या कुछ बिक्री छूटने से ऐसा दिख सकता है।`
        : `Recorded expenses are ${formatRupee(gap)} above recorded sales. This may be a real shortfall, or some sales may not have been entered yet.`,
      getShopAction(shopType, 'shortfall', lang),
      105,
    );
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
  if (trendPeriod && !lossPeriod) {
    const expenseGrowth = trendPeriod.expensesChange!;
    const salesGrowth = trendPeriod.salesChange!;
    const topCategory = trendPeriod.topExpenses[0];
    const category = topCategory ? t(`ec_${topCategory.category}` as any, lang) : null;
    add(
      'cost-pressure',
      'warning',
      lang === 'hi' ? 'खर्च बिक्री से तेज़ बढ़ रहे हैं' : 'Costs may be squeezing your earnings',
      lang === 'hi'
        ? `तुलना वाली अवधि में खर्च ${expenseGrowth}% बढ़ा, जबकि बिक्री ${salesGrowth}% बदली।${category ? ` ${category} सबसे बड़ा दर्ज खर्च है।` : ''}`
        : `Compared with the same elapsed period, expenses rose ${expenseGrowth}% while sales changed by ${salesGrowth}%. ${category ? `${category} is the largest recorded expense category.` : ''}`,
      getShopAction(shopType, topCategory?.category === 'stock' ? 'cost-stock' : 'cost', lang),
      96,
    );
  }

  const categoryPeriod = week.topExpenses[0]?.share >= 50
    ? week
    : month.topExpenses[0]?.share >= 55
      ? month
      : null;
  if (categoryPeriod && !candidates.some(item => item.id === 'cost-pressure')) {
    const topCategory = categoryPeriod.topExpenses[0];
    const name = t(`ec_${topCategory.category}` as any, lang);
    add(
      'large-category',
      'watch',
      lang === 'hi' ? `${name} पर नज़र रखें` : `Check your largest cost before paying or reordering`,
      lang === 'hi'
        ? `${name} इस अवधि के दर्ज खर्च का लगभग ${topCategory.share}% है। यह ज़रूरी खर्च हो सकता है, लेकिन इसकी पुष्टि करना सही रहेगा।`
        : `${name} makes up about ${topCategory.share}% of recorded expenses in this period. It may be necessary, but it is worth checking before committing more money.`,
      getShopAction(shopType, topCategory.category === 'stock' ? 'cost-stock' : 'cost', lang),
      70,
    );
  }

  // Compare only dates with actual sales records. Never treat a missing entry
  // as proof that the shop had zero sales on that day.
  const byDay = new Map<string, number>();
  sales.filter(entry => entry.date >= week.range.start && entry.date <= week.range.end).forEach(entry => {
    const amount = Number(entry.amount);
    if (Number.isFinite(amount) && amount > 0) byDay.set(entry.date, (byDay.get(entry.date) || 0) + amount);
  });
  const recordedDays = [...byDay.entries()].sort((a, b) => a[1] - b[1]);
  if (recordedDays.length >= 3) {
    const low = recordedDays[0];
    const high = recordedDays[recordedDays.length - 1];
    if (high[1] >= low[1] * 2.5 && high[1] - low[1] >= 200) {
      const lowDate = new Date(`${low[0]}T12:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const highDate = new Date(`${high[0]}T12:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      add(
        'uneven-sales-days',
        'watch',
        lang === 'hi' ? 'कुछ दर्ज दिनों की बिक्री काफ़ी अलग है' : 'Sales vary a lot across recorded days',
        lang === 'hi'
          ? `${lowDate} को ${formatRupee(low[1])} और ${highDate} को ${formatRupee(high[1])} की बिक्री दर्ज हुई। यह दिन, माँग या अधूरी एंट्री के कारण हो सकता है।`
          : `Recorded sales were ${formatRupee(low[1])} on ${lowDate} and ${formatRupee(high[1])} on ${highDate}. This may reflect the day, demand, or incomplete entries.`,
        getShopAction(shopType, 'uneven-days', lang),
        62,
      );
    }
  }

  const salesFalling = month.salesChange !== null && month.salesChange <= -12 ? month : week.salesChange !== null && week.salesChange <= -15 ? week : null;
  if (salesFalling && !candidates.some(item => item.id === 'recorded-loss')) {
    add(
      'sales-fall',
      'watch',
      lang === 'hi' ? 'बिक्री में गिरावट का कारण खोजें' : 'Find the reason behind the sales dip',
      lang === 'hi'
        ? `तुलना वाली अवधि में दर्ज बिक्री ${Math.abs(salesFalling.salesChange!)}% कम है। अंदाज़े से छूट देने से पहले कारण पहचानें।`
        : `Recorded sales are down ${Math.abs(salesFalling.salesChange!)}% versus the comparable period. Find the cause before offering discounts.`,
      getShopAction(shopType, 'sales-fall', lang),
      82,
    );
  }

  if (candidates.length === 0) {
    const hasPeriodEntries = week.hasEntries || month.hasEntries;
    if (!hasPeriodEntries) {
      add(
        'start-records',
        'positive',
        lang === 'hi' ? 'आज से सही हिसाब की शुरुआत करें' : 'Build a reliable picture of your shop',
        lang === 'hi'
          ? 'अभी इस हफ़्ते या महीने की बिक्री और खर्च की एंट्री नहीं मिली। इस हालत में खतरे या मुनाफ़े का सही अंदाज़ा नहीं लगाया जा सकता।'
          : 'There are no sales or expense entries in the current week or month. Without records, it is not possible to tell whether the shop is doing well or facing a risk.',
        lang === 'hi'
          ? 'आज की हर बिक्री, खर्च और उधार लिखें। दुकान बंद करते समय नकद और UPI मिलाएँ—यही छोटी आदत आगे चलकर बड़ी गलती पकड़ सकती है।'
          : 'Record each sale, expense and udhaar today. At closing, match cash and UPI against the entries. This simple habit can catch costly mistakes early.',
        20,
      );
    } else {
    const strongWeek = week.profit > 0 && week.profitMargin !== null && week.profitMargin >= 15 &&
      (week.salesChange === null || week.salesChange >= 0) &&
      (week.expensesChange === null || week.salesChange === null || week.expensesChange <= week.salesChange + 3);
    add(
      'protect-progress',
      'positive',
      lang === 'hi' ? (strongWeek ? 'आपकी मेहनत रंग ला रही है' : 'अच्छी आदत, मज़बूत दुकान') : (strongWeek ? 'Your hard work is showing in the numbers' : 'Build on the good work you are doing'),
      lang === 'hi'
        ? (strongWeek
            ? `इस हफ़्ते दर्ज खर्च के बाद ${formatRupee(week.profit)} बचा और मुनाफ़ा प्रतिशत ${week.profitMargin}% है। यह अच्छी दिशा है।`
            : 'अभी कोई बड़ा ख़तरे का संकेत दर्ज आँकड़ों से साफ़ नहीं दिखता। नियमित हिसाब रखने से छोटी समस्या भी जल्दी पकड़ी जा सकती है।')
        : (strongWeek
            ? `Your records show ${formatRupee(week.profit)} left after recorded expenses and a ${week.profitMargin}% margin this week. That is encouraging progress.`
            : 'No major warning stands out in the entries available. Consistent records help you spot small problems early, while there is still time to act.'),
      getShopAction(shopType, 'routine', lang),
      20,
    );
    }
  }

  // Priorities are ordered by urgency. Keep the section useful and compact.
  const unique = candidates.sort((a, b) => b.priority - a.priority)
    .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index);
  return unique.slice(0, 3).map(({ priority: _priority, ...item }) => item);
}

function MyAdviceSection({ items, lang }: { items: MyAdviceItem[]; lang: Language }) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-primary" />
        <h2 className="text-body-lg font-semibold text-text">
          {lang === 'hi' ? 'मेरी सलाह' : 'My Advice'}
        </h2>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const Icon = item.tone === 'warning' ? AlertTriangle : item.tone === 'positive' ? TrendingUp : Lightbulb;
          const tone = item.tone === 'warning' ? 'text-problem bg-problem/10' : item.tone === 'positive' ? 'text-positive bg-positive/10' : 'text-primary bg-primary/10';
          return (
            <article key={item.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-semibold text-text leading-snug">{item.title}</h3>
                  <p className="text-small text-text-secondary mt-1.5 leading-relaxed">{item.reason}</p>
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-small font-semibold text-primary mb-1">{lang === 'hi' ? 'आज यह करें' : 'What to do next'}</p>
                    <p className="text-small text-text leading-relaxed">{item.action}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChangeIndicator({
  change,
  lang,
  kind,
}: {
  change: number | null;
  lang: Language;
  kind: 'sales' | 'expenses';
}) {
  // A missing comparison baseline is shown as a neutral dash.
  if (change === null) {
    return <span className="text-[11px] text-text-secondary">—</span>;
  }

  const positiveDirection = kind === 'sales' ? change > 0 : change < 0;
  const negativeDirection = kind === 'sales' ? change < 0 : change > 0;
  const tone = positiveDirection ? 'text-positive' : negativeDirection ? 'text-problem' : 'text-text-secondary';
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  const value = `${change > 0 ? '+' : ''}${change}%`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${tone}`} title={lang === 'hi' ? 'पिछली समान अवधि से तुलना' : 'Compared with the previous equivalent period'}>
      <Icon size={13} />
      {value}
    </span>
  );
}

function PeriodSummary({ metrics, lang }: { metrics: PeriodMetrics; lang: Language }) {
  const label = periodName(metrics.period, lang);
  const profitTone = metrics.profit >= 0 ? 'text-positive' : 'text-problem';
  const salesChange = metrics.salesChange;
  const expensesChange = metrics.expensesChange;

  return (
    <section className="card p-4 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-body-lg font-semibold text-text">{label}</h3>
          <p className="text-small text-text-secondary mt-0.5">
            {formatInsightsDateRange(metrics.range, lang)}
          </p>
        </div>
        <Calendar size={17} className="text-text-secondary mt-1 shrink-0" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'बिक्री' : 'Sales'}</p>
            <p className="text-lg font-bold text-positive leading-tight">{formatRupee(metrics.sales)}</p>
          </div>
          <ChangeIndicator change={salesChange} lang={lang} kind="sales" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'खर्च' : 'Expenses'}</p>
            <p className="text-lg font-bold text-problem leading-tight">{formatRupee(metrics.expenses)}</p>
          </div>
          <ChangeIndicator change={expensesChange} lang={lang} kind="expenses" />
        </div>

        <div className="border-t border-border pt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'दर्ज खर्च के बाद मुनाफ़ा' : 'Profit after recorded expenses'}</p>
            <p className={`text-lg font-bold leading-tight ${profitTone}`}>{formatRupee(metrics.profit)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'मुनाफ़ा %' : 'Profit margin'}</p>
            <p className="text-body font-semibold text-text">{metrics.profitMargin === null ? '—' : `${metrics.profitMargin}%`}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InsightsScreen() {
  const { state } = useStore();
  const lang: Language = state.language === 'hi' ? 'hi' : 'en';
  const dashboard = getInsightsDashboard(state.sales, state.expenses);
  const hasAnyEntries = state.sales.length > 0 || state.expenses.length > 0;

  const advice = getMyAdvice(dashboard.week, dashboard.month, state.sales, state.udhaar, lang, state.shopProfile.shopType);
  const hasBusinessRisk = advice.some(item => item.tone !== 'positive');
  const insights = hasAnyEntries
    ? getInsightCards(dashboard.week, dashboard.month, lang, hasAnyEntries, hasBusinessRisk, state.shopProfile.shopType)
    : [];

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{lang === 'hi' ? 'विश्लेषण' : 'Insights'}</h1>
      </div>

      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Insights come first: seven compact, data-backed signals. */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-body-lg font-semibold text-text">
              {lang === 'hi' ? 'आपकी दुकान की जानकारी' : 'Your business insights'}
            </h2>
          </div>

          {!hasAnyEntries ? (
            <div className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb size={19} className="text-primary" />
              </div>
              <div>
                <p className="text-body font-semibold text-text">
                  {lang === 'hi' ? 'अपनी पहली एंट्री डालें' : 'Start with your first entries'}
                </p>
                <p className="text-small text-text-secondary mt-1">
                  {lang === 'hi'
                    ? 'बिक्री और खर्च दर्ज करें। हम आपके रिकॉर्ड से ट्रेंड और काम की सलाह दिखाएँगे।'
                    : 'Record sales and expenses to unlock useful trends and recommendations based on your own business data.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((insight, index) => {
                const Icon = insight.tone === 'warning' ? AlertTriangle : insight.tone === 'positive' ? TrendingUp : Lightbulb;
                const iconTone = insight.tone === 'warning' ? 'text-problem bg-problem/10' : insight.tone === 'positive' ? 'text-positive bg-positive/10' : 'text-primary bg-primary/10';
                return (
                  <div key={`${insight.period ?? 'general'}-${index}`} className="card p-3.5 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-body font-semibold text-text leading-snug">{insight.title}</p>
                        {insight.period && (
                          <span className="text-[10px] text-text-secondary whitespace-nowrap shrink-0">
                            {periodName(insight.period, lang)}
                          </span>
                        )}
                      </div>
                      <p className="text-small text-text-secondary leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <MyAdviceSection items={advice} lang={lang} />

        {/* Compact period summaries use the same date ranges as their insights. */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-primary" />
            <h2 className="text-body-lg font-semibold text-text">
              {lang === 'hi' ? 'बिक्री और खर्च' : 'Sales & expenses'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PeriodSummary metrics={dashboard.week} lang={lang} />
            <PeriodSummary metrics={dashboard.month} lang={lang} />
          </div>
          <p className="text-[11px] text-text-secondary mt-3 leading-relaxed">
            {lang === 'hi'
              ? 'सभी आँकड़े दर्ज एंट्री पर आधारित हैं। मुनाफ़ा = दर्ज बिक्री − दर्ज खर्च। तुलना पिछली समान अवधि से है।'
              : 'Based on recorded entries only. Profit = recorded sales − recorded expenses. Changes compare equivalent elapsed periods.'}
          </p>
        </section>
      </div>
    </div>
  );
}
