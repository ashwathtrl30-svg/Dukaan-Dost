import React, { useState } from 'react';
import { useStore, formatRupee, getTodaySales, getTodayExpenses, getLast7DaysData, getWeekSales, getTotalUdhaar, generateId, getToday } from '../store';
import { t } from '../i18n';
import { SaleEntry, ExpenseEntry, UdhaarEntry, PaymentType } from '../types';
import { Plus, ArrowLeft, X, Check, TrendingUp, TrendingDown, Edit2, MoreVertical, ClipboardList, CalendarDays } from 'lucide-react';

// ============ HOME SCREEN ============
type DisplayEntry =
  | (SaleEntry & { entryType: 'sale' })
  | (ExpenseEntry & { entryType: 'expense' })
  | (UdhaarEntry & { entryType: 'udhaar' });

export function HomeScreen() {
  const { state } = useStore();
  const lang = state.language!;
  const [entryType, setEntryType] = useState<string | null>(null);
  const [showEntriesMenu, setShowEntriesMenu] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [showUdhaarMenu, setShowUdhaarMenu] = useState(false);
  const [showUdhaarList, setShowUdhaarList] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const todaySales = getTodaySales(state.sales);
  const todayExpenses = getTodayExpenses(state.expenses);
  const todayProfit = todaySales - todayExpenses;
  const weekData = getLast7DaysData(state.sales);
  const thisWeek = getWeekSales(state.sales, 0);
  const lastWeek = getWeekSales(state.sales, 1);
  const weekDiff = thisWeek - lastWeek;
  const totalUdhaar = getTotalUdhaar(state.udhaar);
  const shopName = state.shopProfile.shopName || (state.shopProfile.shopType ? t(`st_${state.shopProfile.shopType}` as any, lang) : '');
  
  const today = new Date();
  const dateStr = today.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const getAdvice = () => {
    if (todaySales === 0) {
      return { text: lang === 'hi' ? 'आज की बिक्री डालें — आपका मुनाफ़ा दिखेगा।' : 'Add today\'s sales to see your profit.' };
    }
    if (todayProfit < 0) {
      return { text: lang === 'hi' ? `आज खर्च बिक्री से ज़्यादा है। क्या यह रोज़ होता है?` : 'Expenses are more than sales today. Does this happen often?' };
    }
    if (totalUdhaar > todaySales * 3) {
      return { text: lang === 'hi' ? `₹${totalUdhaar.toLocaleString('en-IN')} उधार बाकी है। आज किसी से माँगें?` : `₹${totalUdhaar.toLocaleString('en-IN')} is pending in udhaar. Ask someone today?` };
    }
    return { text: lang === 'hi' ? 'बढ़िया चल रहा है! आज का हिसाब रखें।' : 'Going well! Keep tracking today\'s numbers.' };
  };
  
  const advice = getAdvice();
  const maxDaySale = Math.max(...weekData.map(d => d.amount), 1);

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex-1 scroll-area">
        {/* Header */}
        <div className="px-5 pt-4 pb-2">
          <div className="mb-1">
            <p className="text-body-lg font-semibold text-text">
              {t('greeting', lang)}{state.userName ? ` ${state.userName}` : ''} ji 🙏
            </p>
            <p className="text-small text-text-secondary">{dateStr}</p>
          </div>
          {shopName && <p className="text-small text-primary font-medium mt-1">{shopName}</p>}
        </div>
        
        {/* Today Card */}
        <div className="px-5 py-3">
          <div className="card py-4">
            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wide mb-3">
              {t('today', lang)}
            </h3>
            {todaySales === 0 && state.sales.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-body text-text-secondary mb-3">{t('noDataYet', lang)}</p>
                <button onClick={() => setEntryType('sale')} className="btn-primary">
                  <Plus size={20} /> {t('addSale', lang)}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-body text-text-secondary">{t('salesToday', lang)}</p>
                  <p className="text-[28px] font-bold text-positive leading-tight">
                    {formatRupee(todaySales)}
                  </p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-body text-text-secondary">{t('expensesToday', lang)}</p>
                  <p className="text-[28px] font-bold text-problem leading-tight">
                    {formatRupee(todayExpenses)}
                  </p>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <p className="text-body font-semibold text-text">{t('profitToday', lang)}</p>
                  <p className={`text-[28px] font-bold leading-tight ${todayProfit >= 0 ? 'text-positive' : 'text-problem'}`}>
                    {formatRupee(todayProfit)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Today's Advice */}
        <div className="px-5 py-2">
          <div className="card bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-small font-semibold text-text mb-1">{t('todayAdvice', lang)}</p>
                <p className="text-body text-text">{advice.text}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Add */}
        <div className="px-5 py-3">
          <p className="text-small font-semibold text-text-secondary mb-2 uppercase tracking-wide">{t('quickAdd', lang)}</p>
          <div className="grid grid-cols-3 gap-3">
            <QuickAddButton emoji="💰" label={t('sale', lang)} color="bg-green-100" onClick={() => setEntryType('sale')} />
            <QuickAddButton emoji="📤" label={t('expense', lang)} color="bg-red-50" onClick={() => setEntryType('expense')} />
            <QuickAddButton emoji="📒" label={t('udhaar', lang)} color="bg-amber-50" onClick={() => setShowUdhaarMenu(true)} />
          </div>
        </div>
        
        {/* Weekly Chart */}
        <div className="px-5 py-2">
          <div className="card">
            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wide mb-3">
              {t('weeklyOverview', lang)}
            </h3>
            <div className="flex items-end justify-between gap-2 h-28 mb-3">
              {weekData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end h-20">
                    <div
                      className="w-full rounded-t-lg bg-primary transition-all"
                      style={{ height: `${Math.max((day.amount / maxDaySale) * 100, 4)}%`, opacity: i === 6 ? 1 : 0.6 }}
                    />
                  </div>
                  <span className="text-small text-text-secondary">{day.day}</span>
                </div>
              ))}
            </div>
            {thisWeek > 0 && (
              <p className="text-small text-text text-center mt-3">
                {weekDiff >= 0 ? (
                  <span className="text-positive flex items-center justify-center gap-1">
                    <TrendingUp size={16} /> {t('weekComparison', lang)} {formatRupee(weekDiff)}
                  </span>
                ) : (
                  <span className="text-warning flex items-center justify-center gap-1">
                    <TrendingDown size={16} /> {t('weekComparisonDown', lang)} {formatRupee(Math.abs(weekDiff))}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        
        {/* Streak badge */}
        {state.streak >= 3 && (
          <div className="px-5 py-2">
            <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
              <span className="text-3xl flex-shrink-0">🔥</span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-bold text-text">{state.streak} {lang === 'hi' ? 'दिन लगातार!' : 'days in a row!'}</p>
                <p className="text-small text-text-secondary">
                  {lang === 'hi' ? 'बहुत बढ़िया! हिसाब रखना जारी रखें।' : 'Great job! Keep tracking.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Udhaar summary */}
        {totalUdhaar > 0 && (
          <div className="px-5 py-2">
            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">📒</span>
                <div className="flex-1 min-w-0">
                  <p className="text-small text-text-secondary">{t('totalOwed', lang)}</p>
                  <p className="number-medium text-warning">{formatRupee(totalUdhaar)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick insight */}
        {state.sales.length >= 3 && (
          <div className="px-5 py-2">
            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">📊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-text mb-1">
                    {lang === 'hi' ? 'आपका हिसाब' : 'Your numbers'}
                  </p>
                  <p className="text-body text-text">
                    {lang === 'hi'
                      ? `आपने कुल ${state.sales.length} बिक्री डाली है। कुल बिक्री: ${formatRupee(state.sales.reduce((s, e) => s + e.amount, 0))}`
                      : `You've logged ${state.sales.length} sales. Total: ${formatRupee(state.sales.reduce((s, e) => s + e.amount, 0))}`}
                  </p>
                  <p className="text-small text-text-secondary mt-1">
                    {lang === 'hi' ? '(आपके डेटा से)' : '(from your data)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent entries */}
        <div className="px-5 py-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-small font-semibold text-text-secondary uppercase tracking-wide">
              {lang === 'hi' ? 'हाल की एंट्री' : 'Recent entries'}
            </p>
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEntriesMenu(!showEntriesMenu)}
                aria-label={lang === 'hi' ? 'एंट्री मेनू खोलें' : 'Open entries menu'}
                aria-expanded={showEntriesMenu}
                className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-card"
              >
                <MoreVertical size={22} />
              </button>
              {showEntriesMenu && (
                <>
                  <button
                    type="button"
                    aria-label={lang === 'hi' ? 'मेनू बंद करें' : 'Close menu'}
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setShowEntriesMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-40 min-w-[190px] rounded-xl border border-border bg-card py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEntriesMenu(false);
                        setShowAllEntries(true);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left text-body text-text hover:bg-bg"
                    >
                      <ClipboardList size={18} className="text-primary" />
                      {lang === 'hi' ? 'सभी एंट्री देखें' : 'See All Entries'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {(state.sales.length > 0 || state.expenses.length > 0) ? (
            <div className="space-y-2">
              {[...state.sales.slice(0, 3).map(s => ({ ...s, entryType: 'sale' as const })),
                ...state.expenses.slice(0, 2).map(e => ({ ...e, entryType: 'expense' as const }))]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
                .map((entry, i) => (
                  <div key={i} className="card flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl flex-shrink-0">
                      {entry.entryType === 'sale' ? '💰' : '📤'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text">
                        {entry.entryType === 'sale' ? t('sale', lang) : t(`ec_${(entry as any).category || 'other'}` as any, lang)}
                      </p>
                      <p className="text-small text-text-secondary">
                        {new Date(entry.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-body font-bold ${entry.entryType === 'sale' ? 'text-positive' : 'text-problem'}`}>
                        {entry.entryType === 'sale' ? '+' : '-'}{formatRupee(entry.amount)}
                      </span>
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                      >
                        <Edit2 size={16} className="text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-small text-text-secondary py-2">
              {lang === 'hi' ? 'अभी कोई बिक्री या खर्च दर्ज नहीं है।' : 'No sales or expense entries yet.'}
            </p>
          )}
        </div>
        
        <div className="h-24" />
      </div>
      
      {/* Entry Modal */}
      {entryType && <EntryModal type={entryType} onClose={() => setEntryType(null)} />}
      
      {/* Edit Entry Modal */}
      {editingEntry && <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
      
      {/* Udhaar Menu */}
      {showUdhaarMenu && (
        <UdhaarMenu 
          onClose={() => setShowUdhaarMenu(false)}
          onAdd={() => { setShowUdhaarMenu(false); setEntryType('udhaar'); }}
          onViewList={() => { setShowUdhaarMenu(false); setShowUdhaarList(true); }}
        />
      )}
      
      {/* Udhaar List */}
      {showUdhaarList && (
        <UdhaarList onClose={() => setShowUdhaarList(false)} />
      )}

      {/* All Entries */}
      {showAllEntries && (
        <AllEntriesModal onClose={() => setShowAllEntries(false)} />
      )}
    </div>
  );
}

function QuickAddButton({ emoji, label, color, onClick }: { emoji: string; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${color} rounded-2xl h-16 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-small font-semibold text-text">{label}</span>
    </button>
  );
}


// ============ ALL ENTRIES ============
function AllEntriesModal({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const lang = state.language || 'en';
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';

  const entries: DisplayEntry[] = [
    ...state.sales.map((entry) => ({ ...entry, entryType: 'sale' as const })),
    ...state.expenses.map((entry) => ({ ...entry, entryType: 'expense' as const })),
    ...state.udhaar.map((entry) => ({ ...entry, entryType: 'udhaar' as const })),
  ].sort((a, b) => {
    const aTime = a.createdAt || new Date(a.date).getTime();
    const bTime = b.createdAt || new Date(b.date).getTime();
    return bTime - aTime;
  });

  const formatFullDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = year && month && day
      ? new Date(year, month - 1, day)
      : new Date(date);
    return parsedDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEntryTitle = (entry: DisplayEntry) => {
    if (entry.entryType === 'sale') return t('sale', lang);
    if (entry.entryType === 'expense') {
      return t(`ec_${entry.category || 'other'}` as any, lang);
    }
    return lang === 'hi' ? 'उधार' : 'Udhaar';
  };

  const getEntrySubtitle = (entry: DisplayEntry) => {
    if (entry.entryType === 'udhaar') {
      return entry.customerName || (lang === 'hi' ? 'ग्राहक का नाम नहीं' : 'Customer name not provided');
    }
    if (entry.note?.trim()) return entry.note.trim();
    if (entry.entryType === 'sale') {
      return lang === 'hi' ? 'बिक्री' : 'Sale entry';
    }
    return lang === 'hi' ? 'खर्च' : 'Expense entry';
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-in">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'hi' ? 'होम पर वापस जाएँ' : 'Back to Home'}
          className="w-12 h-12 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-text-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-section-title text-text">
            {lang === 'hi' ? 'सभी एंट्री' : 'All Entries'}
          </h2>
          <p className="text-small text-text-secondary">
            {entries.length} {lang === 'hi' ? 'एंट्री' : (entries.length === 1 ? 'entry' : 'entries')}
          </p>
        </div>
      </div>

      <div className="flex-1 scroll-area px-5 py-4">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📒</div>
            <p className="text-body-lg text-text-secondary">
              {lang === 'hi' ? 'अभी कोई एंट्री नहीं है।' : 'No entries yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {entries.map((entry) => {
              const isSale = entry.entryType === 'sale';
              const isExpense = entry.entryType === 'expense';
              const title = getEntryTitle(entry);
              const subtitle = getEntrySubtitle(entry);

              return (
                <div key={entry.entryType + '-' + entry.id} className="card flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl flex-shrink-0">
                    {isSale ? '💰' : isExpense ? '📤' : '📒'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-text truncate">{title}</p>
                    <p className="text-small text-text-secondary truncate">{subtitle}</p>
                    <p className="text-small text-text-secondary mt-1 flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatFullDate(entry.date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-body font-bold ${isSale ? 'text-positive' : isExpense ? 'text-problem' : 'text-warning'}`}>
                      {isSale ? '+' : isExpense ? '-' : ''}{formatRupee(entry.amount)}
                    </span>
                    {entry.entryType === 'udhaar' && (
                      <span className={`text-small ${entry.paid ? 'text-positive' : 'text-warning'}`}>
                        {entry.paid
                          ? (lang === 'hi' ? 'चुकाया' : 'Paid')
                          : (lang === 'hi' ? 'बाकी' : 'Pending')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ UDHAAR MENU ============
function UdhaarMenu({ onClose, onAdd, onViewList }: { onClose: () => void; onAdd: () => void; onViewList: () => void }) {
  const { state } = useStore();
  const lang = state.language!;
  const unpaidCount = state.udhaar.filter(u => !u.paid).length;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end animate-fade-in">
      <div className="bg-bg rounded-t-3xl animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center">
            <X size={24} className="text-text-secondary" />
          </button>
          <h3 className="text-body-lg font-bold text-text flex-1 text-center">📒 {t('udhaar', lang)}</h3>
          <div className="w-12" />
        </div>
        
        <div className="p-5 space-y-3">
          <button
            onClick={onAdd}
            className="card w-full flex items-center gap-4 h-20 px-4 active:scale-98 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Plus size={24} className="text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-bold text-text">{t('addUdhaar', lang)}</p>
              <p className="text-small text-text-secondary">
                {lang === 'hi' ? 'नया उधार जोड़ें' : 'Add new udhaar entry'}
              </p>
            </div>
          </button>
          
          <button
            onClick={onViewList}
            className="card w-full flex items-center gap-4 h-20 px-4 active:scale-98 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-bold text-text">
                {lang === 'hi' ? 'उधार सूची देखें' : 'View Udhaar List'}
              </p>
              <p className="text-small text-text-secondary">
                {unpaidCount > 0 
                  ? (lang === 'hi' ? `${unpaidCount} उधार बाकी` : `${unpaidCount} pending`)
                  : (lang === 'hi' ? 'कोई उधार नहीं' : 'No udhaar entries')}
              </p>
            </div>
          </button>
        </div>
        
        <div className="h-4 safe-bottom" />
      </div>
    </div>
  );
}

// ============ UDHAAR LIST ============
function UdhaarList({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const unpaid = state.udhaar.filter(u => !u.paid);
  const totalOwed = unpaid.reduce((sum, u) => sum + u.amount, 0);
  
  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center">
          <ArrowLeft size={24} className="text-text-secondary" />
        </button>
        <h3 className="text-body-lg font-bold text-text flex-1 text-center">
          {lang === 'hi' ? 'उधार सूची' : 'Udhaar List'}
        </h3>
        <div className="w-12" />
      </div>
      
      <div className="px-5 py-4">
        <div className="card bg-amber-50 border-amber-200 text-center">
          <p className="text-small text-text-secondary mb-1">{t('totalOwed', lang)}</p>
          <p className="text-hero text-warning whitespace-nowrap">{formatRupee(totalOwed)}</p>
          <p className="text-small text-text-secondary mt-1">
            {unpaid.length} {lang === 'hi' ? 'ग्राहक बाकी' : 'customers pending'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 scroll-area px-5 pb-6">
        {unpaid.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎉</span>
            <p className="text-body-lg text-text-secondary">
              {lang === 'hi' ? 'कोई उधार बाकी नहीं!' : 'No pending udhaar!'}
            </p>
            <p className="text-body text-text-secondary mt-2">
              {lang === 'hi' ? 'बहुत बढ़िया!' : 'Great job!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {unpaid.map((entry) => (
              <div key={entry.id} className="card py-4">
                <div className="flex justify-between items-baseline mb-3">
                  <p className="text-body text-text-secondary">{t('customerName', lang)}</p>
                  <p className="text-[22px] font-bold text-text leading-tight">
                    {entry.customerName}
                  </p>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <p className="text-body text-text-secondary">{t('amount', lang)}</p>
                  <p className="text-[22px] font-bold text-problem leading-tight">
                    {formatRupee(entry.amount)}
                  </p>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <p className="text-small text-text-secondary">
                    {new Date(entry.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_UDHAAR_PAID', payload: entry.id })}
                    className="btn-secondary h-10 px-4 text-small"
                  >
                    ✓ {lang === 'hi' ? 'चुकाया' : 'Paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ENTRY MODAL ============
function EntryModal({ type, onClose }: { type: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [expenseCategory, setExpenseCategory] = useState('stock');
  const [customerName, setCustomerName] = useState('');
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastEntryId, setLastEntryId] = useState('');
  
  const isSale = type === 'sale';
  const isExpense = type === 'expense';
  const isUdhaar = type === 'udhaar';
  
  const expenseCategories = [
    { key: 'stock', emoji: '📦' },
    { key: 'rent', emoji: '🏠' },
    { key: 'electricity', emoji: '💡' },
    { key: 'salary', emoji: '💰' },
    { key: 'transport', emoji: '🚚' },
    { key: 'packaging', emoji: '📋' },
    { key: 'maintenance', emoji: '🔧' },
    { key: 'other', emoji: '📝' },
  ];
  
  const handleSave = () => {
    const numAmount = parseInt(amount) || 0;
    if (numAmount <= 0) return;
    
    const id = generateId();
    const today = getToday();
    
    if (isSale) {
      const entry: SaleEntry = {
        id, date: today, amount: numAmount, paymentType, createdAt: Date.now()
      };
      dispatch({ type: 'ADD_SALE', payload: entry });
    } else if (isExpense) {
      const entry: ExpenseEntry = {
        id, date: today, amount: numAmount, category: expenseCategory, createdAt: Date.now()
      };
      dispatch({ type: 'ADD_EXPENSE', payload: entry });
    } else if (isUdhaar) {
      const entry: UdhaarEntry = {
        id, customerName: customerName || (lang === 'hi' ? 'अज्ञात' : 'Unknown'),
        amount: numAmount, date: today, paid: false, createdAt: Date.now()
      };
      dispatch({ type: 'ADD_UDHAAR', payload: entry });
    }
    
    setLastEntryId(id);
    setUndoVisible(true);
    setTimeout(() => setUndoVisible(false), 5000);
    
    const today2 = getToday();
    if (state.lastEntryDate !== today2) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const newStreak = state.lastEntryDate === yesterdayStr ? state.streak + 1 : 1;
      dispatch({ type: 'UPDATE_STREAK', payload: { streak: newStreak, lastDate: today2 } });
    }
    
    setAmount('');
    setCustomerName('');
  };
  
  const handleUndo = () => {
    if (lastEntryId) {
      const entryType = isSale ? 'sale' : isExpense ? 'expense' : 'udhaar';
      dispatch({ type: 'DELETE_ENTRY', payload: { type: entryType as any, id: lastEntryId } });
      setUndoVisible(false);
    }
  };
  
  const handleNumberPad = (digit: string) => {
    if (digit === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (digit === 'clear') {
      setAmount('');
    } else {
      setAmount(prev => (prev + digit).slice(0, 7));
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end animate-fade-in">
      <div className="bg-bg rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center">
            <X size={24} className="text-text-secondary" />
          </button>
          <h3 className="text-body-lg font-bold text-text flex-1 text-center">
            {isSale ? `💰 ${t('sale', lang)}` : isExpense ? `📤 ${t('expense', lang)}` : `📒 ${t('udhaar', lang)}`}
          </h3>
          <div className="w-12" />
        </div>
        
        <div className="flex-1 scroll-area px-5 py-4">
          <div className="text-center mb-4">
            <p className="text-small text-text-secondary mb-2">{t('enterAmount', lang)}</p>
            <p className="text-hero text-text whitespace-nowrap overflow-hidden">
              ₹{amount ? parseInt(amount).toLocaleString('en-IN') : '0'}
            </p>
          </div>
          
          {isExpense && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {expenseCategories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setExpenseCategory(cat.key)}
                  className={`chip ${expenseCategory === cat.key ? 'chip-active' : ''}`}
                >
                  {cat.emoji} {t(`ec_${cat.key}` as any, lang)}
                </button>
              ))}
            </div>
          )}
          
          {isSale && (
            <div className="flex gap-2 mb-4 justify-center">
              {(['cash', 'upi'] as PaymentType[]).map(pt => (
                <button
                  key={pt}
                  onClick={() => setPaymentType(pt)}
                  className={`chip ${paymentType === pt ? 'chip-active' : ''}`}
                >
                  {pt === 'cash' ? '💵' : '📱'} {t(`payment${pt.charAt(0).toUpperCase() + pt.slice(1)}` as any, lang)}
                </button>
              ))}
            </div>
          )}
          
          {isUdhaar && (
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('customerName', lang)}
              className="input-field mb-4"
            />
          )}
          
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['1','2','3','4','5','6','7','8','9','clear','0','del'].map(key => (
              <button
                key={key}
                onClick={() => handleNumberPad(key)}
                className={`h-16 rounded-xl text-body-lg font-bold flex items-center justify-center transition-all active:scale-95 ${
                  key === 'clear' || key === 'del' ? 'bg-border text-text-secondary' : 'bg-card text-text shadow-sm'
                }`}
              >
                {key === 'del' ? '⌫' : key === 'clear' ? 'C' : key}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-5 py-4 safe-bottom">
          <button
            onClick={handleSave}
            disabled={!amount || parseInt(amount) <= 0}
            className="btn-primary text-body-lg"
          >
            <Check size={20} /> {t('save', lang)}
          </button>
        </div>
        
        {undoVisible && (
          <div className="absolute bottom-24 left-5 right-5 bg-text text-bg rounded-xl px-4 py-3 flex items-center justify-between animate-slide-up">
            <span className="text-body font-medium">{lang === 'hi' ? 'सेव हो गया!' : 'Saved!'}</span>
            <button onClick={handleUndo} className="text-accent text-body font-bold">
              {t('undo', lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ EDIT ENTRY MODAL ============
function EditEntryModal({ entry, onClose }: { entry: any; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [amount, setAmount] = useState(String(entry.amount));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isSale = entry.entryType === 'sale';
  const isExpense = entry.entryType === 'expense';
  
  const handleSave = () => {
    const numAmount = parseInt(amount) || 0;
    if (numAmount <= 0) return;
    
    // Delete old entry
    dispatch({ type: 'DELETE_ENTRY', payload: { type: entry.entryType, id: entry.id } });
    
    // Add new entry with updated amount
    const newEntry = {
      ...entry,
      amount: numAmount,
      createdAt: Date.now(),
    };
    
    if (isSale) {
      dispatch({ type: 'ADD_SALE', payload: newEntry });
    } else if (isExpense) {
      dispatch({ type: 'ADD_EXPENSE', payload: newEntry });
    }
    
    onClose();
  };
  
  const handleDelete = () => {
    dispatch({ type: 'DELETE_ENTRY', payload: { type: entry.entryType, id: entry.id } });
    onClose();
  };
  
  const handleNumberPad = (digit: string) => {
    if (digit === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (digit === 'clear') {
      setAmount('');
    } else {
      setAmount(prev => (prev + digit).slice(0, 7));
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end animate-fade-in">
      <div className="bg-bg rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center">
            <X size={24} className="text-text-secondary" />
          </button>
          <h3 className="text-body-lg font-bold text-text flex-1 text-center">
            {isSale ? `💰 ${t('sale', lang)}` : `📤 ${t('expense', lang)}`}
          </h3>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <span className="text-problem text-body">🗑️</span>
          </button>
        </div>
        
        <div className="flex-1 scroll-area px-5 py-4">
          <div className="text-center mb-4">
            <p className="text-small text-text-secondary mb-2">{t('enterAmount', lang)}</p>
            <p className="text-hero text-text whitespace-nowrap overflow-hidden">
              ₹{amount ? parseInt(amount).toLocaleString('en-IN') : '0'}
            </p>
          </div>
          
          {isExpense && (
            <div className="text-center mb-4">
              <p className="text-small text-text-secondary">
                {t(`ec_${entry.category || 'other'}` as any, lang)}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['1','2','3','4','5','6','7','8','9','clear','0','del'].map(key => (
              <button
                key={key}
                onClick={() => handleNumberPad(key)}
                className={`h-16 rounded-xl text-body-lg font-bold flex items-center justify-center transition-all active:scale-95 ${
                  key === 'clear' || key === 'del' ? 'bg-border text-text-secondary' : 'bg-card text-text shadow-sm'
                }`}
              >
                {key === 'del' ? '⌫' : key === 'clear' ? 'C' : key}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-5 py-4 safe-bottom space-y-3">
          <button
            onClick={handleSave}
            disabled={!amount || parseInt(amount) <= 0}
            className="btn-primary text-body-lg"
          >
            <Check size={20} /> {lang === 'hi' ? 'अपडेट करें' : 'Update'}
          </button>
        </div>
        
        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-5 animate-fade-in">
            <div className="bg-bg rounded-2xl p-6 max-w-sm w-full">
              <p className="text-body-lg font-bold text-text mb-2 text-center">
                {lang === 'hi' ? 'क्या आप इसे मिटाना चाहते हैं?' : 'Delete this entry?'}
              </p>
              <p className="text-body text-text-secondary mb-4 text-center">
                {formatRupee(entry.amount)}
              </p>
              <div className="space-y-3">
                <button onClick={handleDelete} className="btn-primary bg-problem">
                  {lang === 'hi' ? 'हाँ, मिटाएँ' : 'Yes, delete'}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
