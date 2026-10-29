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
import { useStore, formatRupee } from '../store';
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

function getInsightCards(
  week: PeriodMetrics,
  month: PeriodMetrics,
  lang: Language,
  hasAnyEntries: boolean,
): BusinessInsight[] {
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

  const insights = hasAnyEntries
    ? getInsightCards(dashboard.week, dashboard.month, lang, hasAnyEntries)
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
