import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore, formatRupee } from '../store';
import { formatInsightsDateRange, getInsightsDashboard } from '../insights/analytics';
import type { InsightsPeriod, PeriodMetrics } from '../insights/analytics';
import { buildBusinessInsights, type BusinessInsight } from '../insights/insightEngine';
import { getMyAdvice, type MyAdviceItem } from '../insights/myAdvice';

type Language = 'en' | 'hi';
function periodSummaryName(period: InsightsPeriod, lang: Language): string {
  if (lang === 'hi') {
    return period === 'day' ? 'आज' : period === 'week' ? 'इस हफ़्ते अब तक' : 'इस महीने अब तक';
  }
  return period === 'day' ? 'Today' : period === 'week' ? 'This week so far' : 'This month so far';
}

function periodName(period: InsightsPeriod, lang: Language): string {
  if (lang === 'hi') {
    return period === 'day' ? 'आज' : period === 'week' ? 'इस हफ़्ते' : 'इस महीने';
  }
  return period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month';
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
          const categoryLabel = lang === 'hi'
            ? ({ 'Immediate action': 'तत्काल कदम', 'Better buying': 'बेहतर खरीद', 'Improve sales': 'बिक्री बढ़ाएँ', 'Plan ahead': 'आगे की तैयारी' } as const)[item.category]
            : item.category;
          return (
            <article key={item.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-primary mb-1">{categoryLabel}</p>
                  <h3 className="text-body font-semibold text-text leading-snug">{item.title}</h3>
                  <p className="text-small text-text-secondary mt-1.5 leading-relaxed">{item.reason}</p>
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-small font-semibold text-primary mb-1">{lang === 'hi' ? 'अगला कदम' : 'What to do next'}</p>
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

function PeriodSummary({ metrics, lang }: { metrics: PeriodMetrics; lang: Language }) {
  const label = periodSummaryName(metrics.period, lang);
  const profitTone = metrics.profit >= 0 ? 'text-positive' : 'text-problem';

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
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-text-secondary">{lang === 'hi' ? 'खर्च' : 'Expenses'}</p>
            <p className="text-lg font-bold text-problem leading-tight">{formatRupee(metrics.expenses)}</p>
          </div>
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
  const now = new Date();
  const calculationMinute = [
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  ].join('-');
  const dashboard = useMemo(
    () => getInsightsDashboard(state.sales, state.expenses, now),
    [state.sales, state.expenses, calculationMinute],
  );
  const advice = useMemo(
    () => getMyAdvice(dashboard.week, dashboard.month, state.sales, state.udhaar, lang, state.shopProfile.shopType, now),
    [dashboard.week, dashboard.month, state.sales, state.udhaar, lang, state.shopProfile.shopType, calculationMinute],
  );
  const insights = useMemo(
    () => buildBusinessInsights({
      today: dashboard.today,
      week: dashboard.week,
      month: dashboard.month,
      sales: state.sales,
      expenses: state.expenses,
      udhaar: state.udhaar,
      shopType: state.shopProfile.shopType,
      udhaarLevel: state.shopProfile.udhaarLevel,
      language: lang,
      now,
    }),
    [
      dashboard.today,
      dashboard.week,
      dashboard.month,
      state.sales,
      state.expenses,
      state.udhaar,
      state.shopProfile.shopType,
      state.shopProfile.udhaarLevel,
      lang,
      calculationMinute,
    ],
  );
  const insightGroups = useMemo<{ period: InsightsPeriod; items: BusinessInsight[] }[]>(
    () => [
      { period: 'day', items: insights.filter(item => item.period === 'day') },
      { period: 'week', items: insights.filter(item => item.period === 'week') },
      { period: 'month', items: insights.filter(item => item.period === 'month') },
    ],
    [insights],
  );

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{lang === 'hi' ? 'विश्लेषण' : 'Insights'}</h1>
      </div>

      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Ten focused, data-backed insights across Today, This Week and This Month. */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-body-lg font-semibold text-text">
              {lang === 'hi' ? 'आपकी दुकान की जानकारी' : 'Your business insights'}
            </h2>
          </div>

          <div className="space-y-4">
            {insightGroups.map(group => (
              <div key={group.period}>
                <h3 className="text-small font-semibold text-text-secondary mb-2">
                  {periodName(group.period, lang)}
                </h3>
                <div className="space-y-2">
                  {group.items.map((insight, index) => {
                    const Icon = insight.tone === 'warning' ? AlertTriangle : insight.tone === 'positive' ? TrendingUp : Lightbulb;
                    const iconTone = insight.tone === 'warning' ? 'text-problem bg-problem/10' : insight.tone === 'positive' ? 'text-positive bg-positive/10' : 'text-primary bg-primary/10';
                    return (
                      <div key={`${group.period}-${index}`} className="card p-3.5 flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-semibold text-text leading-snug">{insight.title}</p>
                          <p className="text-small text-text-secondary leading-relaxed mt-1">{insight.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
              ? 'सभी आँकड़े दर्ज एंट्री पर आधारित हैं। मुनाफ़ा = दर्ज बिक्री − दर्ज खर्च।'
              : 'Based on recorded entries only. Profit = recorded sales − recorded expenses.'}
          </p>
        </section>
      </div>
    </div>
  );
}
