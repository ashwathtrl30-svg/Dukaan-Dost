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

function bestInsight(metrics: PeriodMetrics, lang: Language, hasAnyEntries: boolean): BusinessInsight {
  const period = metrics.period;
  const label = periodName(period, lang);
  const topExpense = metrics.topExpenses[0];

  if (!metrics.hasEntries) {
    return {
      period,
      tone: 'info',
      title: lang === 'hi' ? `${label} अभी कोई एंट्री नहीं` : `No entries recorded ${period === 'week' ? 'this week' : 'this month'}`,
      description: hasAnyEntries
        ? (lang === 'hi'
          ? 'इस अवधि की बिक्री और खर्च डालें, ताकि सही तुलना और सलाह मिल सके।'
          : 'Add sales and expenses for this period to get accurate comparisons and useful advice.')
        : (lang === 'hi'
          ? 'बिक्री और खर्च डालना शुरू करें। आपकी सलाह इन्हीं रिकॉर्ड पर आधारित होगी।'
          : 'Start recording sales and expenses. Your insights will be based on your own entries.'),
      priority: 10,
    };
  }

  const candidates: BusinessInsight[] = [];

  if (metrics.profit < 0) {
    candidates.push({
      period,
      tone: 'warning',
      title: lang === 'hi' ? `${label} खर्च बिक्री से ज़्यादा है` : `Recorded expenses exceed sales`,
      description: lang === 'hi'
        ? `दर्ज खर्च बिक्री से ${formatRupee(Math.abs(metrics.profit))} ज़्यादा हैं। खर्च और छूटी हुई बिक्री की एंट्री जाँचें।`
        : `Recorded expenses are ${formatRupee(Math.abs(metrics.profit))} above recorded sales. Review expenses and check that all sales were entered.`,
      priority: 100,
    });
  }

  if (
    metrics.salesChange !== null &&
    metrics.expensesChange !== null &&
    metrics.expensesChange > metrics.salesChange + 5 &&
    metrics.expenses > metrics.previousExpenses
  ) {
    candidates.push({
      period,
      tone: 'warning',
      title: lang === 'hi' ? 'खर्च बिक्री से तेज़ बढ़ रहे हैं' : 'Expenses are growing faster than sales',
      description: lang === 'hi'
        ? `तुलना वाली अवधि में ${changePhrase(metrics.expensesChange, lang, 'expenses')} जबकि ${changePhrase(metrics.salesChange, lang, 'sales')}। सबसे बड़े खर्च की समीक्षा करें।`
        : `Against the comparable period, ${changePhrase(metrics.expensesChange, lang, 'expenses')} while ${changePhrase(metrics.salesChange, lang, 'sales')}. Review the largest expense before your next purchase.`,
      priority: 92,
    });
  }

  if (metrics.previousProfitMargin !== null && metrics.profitMargin !== null) {
    const marginDrop = metrics.previousProfitMargin - metrics.profitMargin;
    if (marginDrop >= 5) {
      candidates.push({
        period,
        tone: 'warning',
        title: lang === 'hi' ? 'मुनाफ़े का प्रतिशत घटा है' : 'Profit margin has narrowed',
        description: lang === 'hi'
          ? `दर्ज बिक्री में खर्च के बाद बचने वाला प्रतिशत ${marginDrop} अंक घटा है। कीमतों और खर्चों की समीक्षा करें।`
          : `The share left after recorded expenses is down ${marginDrop} percentage points. Review pricing and costs.`,
        priority: 88,
      });
    }
  }

  if (metrics.salesChange !== null && metrics.salesChange <= -10) {
    candidates.push({
      period,
      tone: 'warning',
      title: lang === 'hi' ? 'बिक्री में गिरावट' : 'Sales are down',
      description: lang === 'hi'
        ? `पिछली समान अवधि के मुकाबले ${Math.abs(metrics.salesChange)}% कम बिक्री दर्ज हुई है। दिनों के हिसाब से बिक्री देखें।`
        : `Recorded sales are down ${Math.abs(metrics.salesChange)}% versus the comparable period. Check which days contributed to the drop.`,
      priority: 84,
    });
  } else if (metrics.salesChange !== null && metrics.salesChange >= 10) {
    candidates.push({
      period,
      tone: 'positive',
      title: lang === 'hi' ? 'बिक्री बढ़ रही है' : 'Sales are improving',
      description: lang === 'hi'
        ? `पिछली समान अवधि के मुकाबले बिक्री ${metrics.salesChange}% बढ़ी है। जिन दिनों में बिक्री अच्छी रही, उन पर ध्यान दें।`
        : `Recorded sales are up ${metrics.salesChange}% versus the comparable period. Look for what worked on stronger sales days.`,
      priority: 72,
    });
  }

  if (topExpense && topExpense.share >= 35) {
    const categoryName = t(`ec_${topExpense.category}` as any, lang);
    candidates.push({
      period,
      tone: 'info',
      title: lang === 'hi' ? 'सबसे बड़ा खर्च' : 'Largest expense category',
      description: lang === 'hi'
        ? `${categoryName} पर ${formatRupee(topExpense.amount)} खर्च हुए — इस अवधि के दर्ज खर्च का ${topExpense.share}%। अगली खरीद से पहले स्टॉक और ज़रूरत जाँचें।`
        : `${categoryName} accounts for ${formatRupee(topExpense.amount)}, or ${topExpense.share}% of recorded expenses for this period. Review need and stock movement before the next order.`,
      priority: 58,
    });
  }

  if (metrics.salesDaysCount >= 2 && metrics.bestSalesDay) {
    const dayDate = new Date(`${metrics.bestSalesDay.date}T12:00:00`);
    const dayName = dayDate.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long' });
    candidates.push({
      period,
      tone: 'info',
      title: lang === 'hi' ? 'सबसे अच्छी बिक्री वाला दिन' : 'Your strongest sales day',
      description: lang === 'hi'
        ? `${dayName} को सबसे ज़्यादा बिक्री दर्ज हुई: ${formatRupee(metrics.bestSalesDay.amount)}।`
        : `${dayName} had the highest recorded sales in this period: ${formatRupee(metrics.bestSalesDay.amount)}.`,
      priority: 40,
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      period,
      tone: 'info',
      title: lang === 'hi' ? 'रिकॉर्ड नियमित रखें' : 'Keep your records up to date',
      description: metrics.previousHasEntries
        ? (lang === 'hi'
          ? 'अभी कोई बड़ा बदलाव स्पष्ट नहीं है। नियमित एंट्री से तुलना भरोसेमंद बनेगी।'
          : 'No major change stands out from the recorded numbers. Regular entries make comparisons more reliable.')
        : (lang === 'hi'
          ? 'अभी पिछली अवधि से तुलना करने के लिए पर्याप्त रिकॉर्ड नहीं हैं। एंट्री जारी रखें।'
          : 'There is not enough previous-period data for a reliable comparison yet. Keep recording entries.'),
      priority: 15,
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority)[0];
}

function ChangeIndicator({
  current,
  previous,
  change,
  lang,
  kind,
}: {
  current: number;
  previous: number;
  change: number | null;
  lang: Language;
  kind: 'sales' | 'expenses';
}) {
  if (change === null) {
    if (current > 0 && previous <= 0) {
      return (
        <span className="text-[11px] font-medium text-text-secondary">
          {lang === 'hi' ? 'नई एंट्री' : 'New activity'}
        </span>
      );
    }
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
          <ChangeIndicator current={metrics.sales} previous={metrics.previousSales} change={salesChange} lang={lang} kind="sales" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'खर्च' : 'Expenses'}</p>
            <p className="text-lg font-bold text-problem leading-tight">{formatRupee(metrics.expenses)}</p>
          </div>
          <ChangeIndicator current={metrics.expenses} previous={metrics.previousExpenses} change={expensesChange} lang={lang} kind="expenses" />
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

  const weeklyInsight = bestInsight(dashboard.week, lang, hasAnyEntries);
  const monthlyInsight = bestInsight(dashboard.month, lang, hasAnyEntries);
  const insights = !hasAnyEntries || (!dashboard.week.hasEntries && !dashboard.month.hasEntries)
    ? [weeklyInsight]
    : [
        weeklyInsight,
        ...(monthlyInsight.title === weeklyInsight.title
          ? []
          : [monthlyInsight]),
      ].slice(0, 2);

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{lang === 'hi' ? 'विश्लेषण' : 'Insights'}</h1>
      </div>

      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Insights come first: concise, data-backed and limited to two. */}
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
