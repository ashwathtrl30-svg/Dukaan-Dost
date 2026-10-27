import React, { useState } from 'react';
import { useStore, formatRupee, getTodaySales, getTodayExpenses, getWeekSales, getWeekExpenses, getMonthSales, getMonthExpenses, getProfitPercent, getTopExpenseCategories, getBestDay, getLast7DaysData } from '../store';
import { t } from '../i18n';
import { TrendingUp, TrendingDown, Calendar, PieChart } from 'lucide-react';

type Period = 'today' | 'week' | 'month';

export function InsightsScreen() {
  const { state } = useStore();
  const lang = state.language!;
  const [period, setPeriod] = useState<Period>('today');

  // Calculate metrics based on selected period
  const getMetrics = () => {
    switch (period) {
      case 'today':
        return {
          sales: getTodaySales(state.sales),
          expenses: getTodayExpenses(state.expenses),
          prevSales: 0,
          prevExpenses: 0,
        };
      case 'week':
        return {
          sales: getWeekSales(state.sales, 0),
          expenses: getWeekExpenses(state.expenses, 0),
          prevSales: getWeekSales(state.sales, 1),
          prevExpenses: getWeekExpenses(state.expenses, 1),
        };
      case 'month':
        return {
          sales: getMonthSales(state.sales),
          expenses: getMonthExpenses(state.expenses),
          prevSales: 0,
          prevExpenses: 0,
        };
    }
  };

  const metrics = getMetrics();
  const profit = metrics.sales - metrics.expenses;
  const profitPercent = getProfitPercent(metrics.sales, metrics.expenses);
  const topCategories = getTopExpenseCategories(state.expenses, 3);
  const bestDay = getBestDay(state.sales);
  const weekData = getLast7DaysData(state.sales);

  // Calculate trend
  const salesTrend = metrics.prevSales > 0 
    ? Math.round(((metrics.sales - metrics.prevSales) / metrics.prevSales) * 100)
    : 0;

  const hasData = metrics.sales > 0 || metrics.expenses > 0;

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{lang === 'hi' ? 'विश्लेषण' : 'Insights'}</h1>
      </div>

      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Period Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPeriod('today')}
            className={`flex-1 h-12 rounded-xl font-medium text-body transition-all ${
              period === 'today'
                ? 'bg-primary text-white'
                : 'bg-card text-text-secondary'
            }`}
          >
            {lang === 'hi' ? 'आज' : 'Today'}
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 h-12 rounded-xl font-medium text-body transition-all ${
              period === 'week'
                ? 'bg-primary text-white'
                : 'bg-card text-text-secondary'
            }`}
          >
            {lang === 'hi' ? 'इस हफ्ते' : 'This Week'}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 h-12 rounded-xl font-medium text-body transition-all ${
              period === 'month'
                ? 'bg-primary text-white'
                : 'bg-card text-text-secondary'
            }`}
          >
            {lang === 'hi' ? 'इस महीने' : 'This Month'}
          </button>
        </div>

        {!hasData ? (
          <div className="card py-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-body-lg text-text-secondary mb-2">
              {lang === 'hi' ? 'कोई डेटा नहीं' : 'No data yet'}
            </p>
            <p className="text-body text-text-secondary">
              {lang === 'hi' 
                ? 'बिक्री और खर्च डालना शुरू करें'
                : 'Start adding sales and expenses'}
            </p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-positive/10 flex items-center justify-center">
                    <span className="text-body font-bold text-positive">₹</span>
                  </div>
                  <p className="text-small text-text-secondary">
                    {lang === 'hi' ? 'बिक्री' : 'Sales'}
                  </p>
                </div>
                <p className="text-[22px] font-bold text-positive leading-tight">
                  {formatRupee(metrics.sales)}
                </p>
                {period === 'week' && salesTrend !== 0 && (
                  <div className={`flex items-center gap-1 mt-2 text-small ${salesTrend > 0 ? 'text-positive' : 'text-problem'}`}>
                    {salesTrend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(salesTrend)}%</span>
                  </div>
                )}
              </div>

              <div className="card py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-problem/10 flex items-center justify-center">
                    <span className="text-body font-bold text-problem">₹</span>
                  </div>
                  <p className="text-small text-text-secondary">
                    {lang === 'hi' ? 'खर्च' : 'Expenses'}
                  </p>
                </div>
                <p className="text-[22px] font-bold text-problem leading-tight">
                  {formatRupee(metrics.expenses)}
                </p>
              </div>

              <div className="card py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${profit >= 0 ? 'bg-positive/10' : 'bg-problem/10'} flex items-center justify-center`}>
                    <TrendingUp size={18} className={profit >= 0 ? 'text-positive' : 'text-problem'} />
                  </div>
                  <p className="text-small text-text-secondary">
                    {lang === 'hi' ? 'मुनाफ़ा' : 'Profit'}
                  </p>
                </div>
                <p className={`text-[22px] font-bold leading-tight ${profit >= 0 ? 'text-positive' : 'text-problem'}`}>
                  {formatRupee(profit)}
                </p>
              </div>

              <div className="card py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <PieChart size={18} className="text-primary" />
                  </div>
                  <p className="text-small text-text-secondary">
                    {lang === 'hi' ? 'मुनाफ़ा %' : 'Profit %'}
                  </p>
                </div>
                <p className="text-[22px] font-bold text-primary leading-tight">
                  {profitPercent}%
                </p>
              </div>
            </div>

            {/* Top Expense Categories */}
            {topCategories.length > 0 && (
              <div className="card mb-4">
                <h3 className="text-body-lg font-semibold text-text mb-3">
                  {lang === 'hi' ? 'शीर्ष खर्च' : 'Top Expenses'}
                </h3>
                <div className="space-y-3">
                  {topCategories.map((cat, idx) => {
                    const percentage = metrics.expenses > 0 
                      ? Math.round((cat.amount / metrics.expenses) * 100)
                      : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="text-body text-text">
                            {t(`ec_${cat.category}` as any, lang)}
                          </p>
                          <p className="text-body font-bold text-text">
                            {formatRupee(cat.amount)}
                          </p>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-small text-text-secondary mt-1">
                          {percentage}% {lang === 'hi' ? 'कुल खर्च का' : 'of total'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Best Day */}
            {bestDay && period !== 'today' && (
              <div className="card mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-small text-text-secondary mb-1">
                      {lang === 'hi' ? 'सबसे अच्छा दिन' : 'Best Day'}
                    </p>
                    <p className="text-body-lg font-bold text-text">
                      {bestDay.day}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-small text-text-secondary mb-1">
                      {lang === 'hi' ? 'बिक्री' : 'Sales'}
                    </p>
                    <p className="text-body-lg font-bold text-positive">
                      {formatRupee(bestDay.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Breakdown */}
            {period === 'week' && weekData.length > 0 && (
              <div className="card">
                <h3 className="text-body-lg font-semibold text-text mb-3">
                  {lang === 'hi' ? 'दैनिक बिक्री' : 'Daily Sales'}
                </h3>
                <div className="space-y-2">
                  {weekData.map((day, idx) => (
                    <div key={idx} className="flex justify-between items-baseline py-2 border-b border-border last:border-0">
                      <p className="text-body text-text">{day.day}</p>
                      <p className="text-body font-bold text-text">
                        {formatRupee(day.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
