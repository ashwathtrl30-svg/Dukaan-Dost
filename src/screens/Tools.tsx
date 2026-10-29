import React, { useEffect, useState } from 'react';
import { useStore, formatRupee } from '../store';
import { t } from '../i18n';
import { Calculator, Tag, Target, BookOpen, Calendar, Package, Gift, Smartphone, Landmark, PiggyBank, Users, DollarSign } from 'lucide-react';
import { getFestivalDateLabel, getFestivalName, getFestivalShopAdvice, getLocalDateKey, getUpcomingFestivals } from '../festivals';

type ToolId = 'profit' | 'price' | 'breakeven' | 'udhaar' | 'cost' | 'stock' | 'festival' | 'digital' | 'loan' | 'savings' | 'split' | 'bargain';

const toolList: { id: ToolId; icon: any; emoji: string }[] = [
  { id: 'profit', icon: Calculator, emoji: '📈' },
  { id: 'price', icon: Tag, emoji: '🏷️' },
  { id: 'breakeven', icon: Target, emoji: '⚖️' },
  { id: 'udhaar', icon: BookOpen, emoji: '📒' },
  { id: 'cost', icon: Calendar, emoji: '🗓️' },
  { id: 'stock', icon: Package, emoji: '📦' },
  { id: 'festival', icon: Gift, emoji: '🎉' },
  { id: 'digital', icon: Smartphone, emoji: '📱' },
  { id: 'loan', icon: Landmark, emoji: '🏦' },
  { id: 'savings', icon: PiggyBank, emoji: '🎯' },
  { id: 'split', icon: Users, emoji: '✂️' },
  { id: 'bargain', icon: DollarSign, emoji: '🤝' },
];

// ============ TOOLS SCREEN ============
export function ToolsScreen() {
  const { state } = useStore();
  const lang = state.language!;
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  
  if (activeTool) {
    return <ToolDetail toolId={activeTool} onBack={() => setActiveTool(null)} />;
  }
  
  // Prioritize tools based on shop profile
  const getPriority = (id: ToolId): number => {
    const profile = state.shopProfile;
    if (id === 'udhaar' && (profile.udhaarLevel === 'often' || profile.udhaarLevel === 'sometimes')) return 0;
    if (id === 'profit') return 1;
    if (id === 'price') return 2;
    if (id === 'cost') return 3;
    if (id === 'breakeven') return 4;
    if (id === 'festival') return 5;
    return 6;
  };
  
  const sorted = [...toolList].sort((a, b) => getPriority(a.id) - getPriority(b.id));
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{t('toolsTitle', lang)}</h1>
      </div>
      
      <div className="flex-1 scroll-area px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {sorted.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="card flex flex-col items-center justify-center h-28 text-center transition-all active:scale-95"
            >
              <span className="text-3xl mb-2">{tool.emoji}</span>
              <span className="text-small font-semibold text-text leading-tight text-center px-1">
                {t(`tool_${tool.id === 'profit' ? 'profitCalc' : tool.id === 'price' ? 'priceSetter' : tool.id === 'breakeven' ? 'breakeven' : tool.id === 'udhaar' ? 'udhaarTracker' : tool.id === 'cost' ? 'costPlanner' : tool.id === 'stock' ? 'stockReorder' : tool.id === 'festival' ? 'festival' : tool.id === 'digital' ? 'digitalPay' : tool.id === 'loan' ? 'loanCheck' : tool.id === 'savings' ? 'savings' : tool.id === 'split' ? 'billSplit' : 'bargain'}` as any, lang)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TOOL DETAIL ============
function ToolDetail({ toolId, onBack }: { toolId: ToolId; onBack: () => void }) {
  const { state } = useStore();
  const lang = state.language!;
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="w-12 h-12 rounded-full flex items-center justify-center">
          <span className="text-body">←</span>
        </button>
        <h2 className="text-body-lg font-bold text-text flex-1">
          {t(`tool_${toolId === 'profit' ? 'profitCalc' : toolId === 'price' ? 'priceSetter' : toolId === 'breakeven' ? 'breakeven' : toolId === 'udhaar' ? 'udhaarTracker' : toolId === 'cost' ? 'costPlanner' : toolId === 'stock' ? 'stockReorder' : toolId === 'festival' ? 'festival' : toolId === 'digital' ? 'digitalPay' : toolId === 'loan' ? 'loanCheck' : toolId === 'savings' ? 'savings' : toolId === 'split' ? 'billSplit' : 'bargain'}` as any, lang)}
        </h2>
      </div>
      
      <div className="flex-1 scroll-area px-5 py-3">
        {toolId === 'profit' && <ProfitCalcTool />}
        {toolId === 'price' && <PriceSetterTool />}
        {toolId === 'breakeven' && <BreakevenTool />}
        {toolId === 'udhaar' && <UdhaarTrackerTool />}
        {toolId === 'cost' && <CostPlannerTool />}
        {toolId === 'stock' && <StockReorderTool />}
        {toolId === 'festival' && <FestivalTool />}
        {toolId === 'digital' && <DigitalPayTool />}
        {toolId === 'loan' && <LoanCheckTool />}
        {toolId === 'savings' && <SavingsTool />}
        {toolId === 'split' && <BillSplitTool />}
        {toolId === 'bargain' && <BargainTool />}
      </div>
    </div>
  );
}

// ============ PROFIT CALCULATOR ============
function ProfitCalcTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [cost, setCost] = useState('');
  const [selling, setSelling] = useState('');
  const [qty, setQty] = useState('1');
  
  const costNum = parseInt(cost) || 0;
  const sellingNum = parseInt(selling) || 0;
  const qtyNum = parseInt(qty) || 1;
  const profitPerItem = sellingNum - costNum;
  const totalProfit = profitPerItem * qtyNum;
  const marginPercent = costNum > 0 ? Math.round((profitPerItem / costNum) * 100) : 0;
  const profitPer100 = costNum > 0 ? Math.round((profitPerItem / costNum) * 100) : 0;
  
  return (
    <div className="animate-fade-in">
      <div className="space-y-4 mb-4">
        <div>
          <label className="text-small font-medium text-text-secondary mb-2 block">
            {lang === 'hi' ? 'खरीद कीमत (लागत)' : 'Cost Price'}
          </label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-small font-medium text-text-secondary mb-2 block">
            {lang === 'hi' ? 'बेचने की कीमत' : 'Selling Price'}
          </label>
          <input type="number" value={selling} onChange={e => setSelling(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-small font-medium text-text-secondary mb-2 block">
            {lang === 'hi' ? 'कितने सामान' : 'Quantity'}
          </label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="input-field" placeholder="1" />
        </div>
      </div>
      
      {costNum > 0 && sellingNum > 0 && (
        <div className="card bg-green-50 border-green-200 animate-fade-in">
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-small text-text-secondary">{lang === 'hi' ? 'एक पीस का मुनाफ़ा' : 'Profit per item'}</span>
              <span className="text-body font-bold text-positive">{formatRupee(profitPerItem)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-small text-text-secondary">{lang === 'hi' ? 'कुल मुनाफ़ा' : 'Total profit'}</span>
              <span className="text-body font-bold text-positive">{formatRupee(totalProfit)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-small text-text-secondary">{lang === 'hi' ? 'हर ₹100 पर कमाई' : 'Profit per ₹100'}</span>
              <span className="text-body font-bold text-primary">₹{profitPer100}</span>
            </div>
          </div>
          <p className="text-small text-text-secondary mt-3">
            {lang === 'hi'
              ? `मतलब: हर ₹100 के सामान पर आप ₹${profitPer100} कमाते हैं।`
              : `Meaning: For every ₹100 of stock, you earn ₹${profitPer100}.`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ PRICE SETTER ============
function PriceSetterTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('20');
  
  const costNum = parseInt(cost) || 0;
  const marginNum = parseInt(margin) || 0;
  const sellingPrice = Math.round(costNum * (1 + marginNum / 100));
  const profit = sellingPrice - costNum;
  
  return (
    <div className="animate-fade-in">
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            {lang === 'hi' ? 'खरीद कीमत' : 'Cost Price'}
          </label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            {lang === 'hi' ? 'कितना प्रतिशत मुनाफ़ा चाहिए?' : 'What % profit do you want?'}
          </label>
          <div className="flex items-center gap-3">
            <input type="range" min="5" max="100" value={margin} onChange={e => setMargin(e.target.value)} className="flex-1 h-2 bg-border rounded-full appearance-none" />
            <span className="number-medium text-primary w-16 text-center">{margin}%</span>
          </div>
        </div>
      </div>
      
      {costNum > 0 && (
        <div className="card bg-green-50 border-green-200 animate-fade-in text-center">
          <p className="text-sm text-text-secondary mb-2">{lang === 'hi' ? 'आपको बेचना चाहिए' : 'You should sell at'}</p>
          <p className="number-big text-primary">{formatRupee(sellingPrice)}</p>
          <p className="text-sm text-text-secondary mt-2">
            {lang === 'hi' ? `मुनाफ़ा होगा ${formatRupee(profit)}` : `Your profit will be ${formatRupee(profit)}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ BREAK-EVEN ============
function BreakevenTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [fixedCosts, setFixedCosts] = useState('');
  const [marginPercent, setMarginPercent] = useState('20');
  
  const fixedNum = parseInt(fixedCosts) || 0;
  const marginNum = parseInt(marginPercent) || 0;
  const dailyBreakeven = marginNum > 0 ? Math.round((fixedNum / 30) / (marginNum / 100)) : 0;
  const monthlyBreakeven = marginNum > 0 ? Math.round(fixedNum / (marginNum / 100)) : 0;
  
  return (
    <div className="animate-fade-in">
      <p className="text-text-secondary mb-4">
        {lang === 'hi' ? 'कितना बेचना ज़रूरी है ताकि नुकसान न हो?' : 'How much must you sell to not lose money?'}
      </p>
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            {lang === 'hi' ? 'महीने के पक्के खर्चे (किराया, तनख़्वाह, बिजली)' : 'Monthly fixed costs (rent, salary, electricity)'}
          </label>
          <input type="number" value={fixedCosts} onChange={e => setFixedCosts(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            {lang === 'hi' ? 'औसत मुनाफ़ा प्रतिशत' : 'Average profit %'}
          </label>
          <input type="number" value={marginPercent} onChange={e => setMarginPercent(e.target.value)} className="input-field" placeholder="20" />
        </div>
      </div>
      
      {fixedNum > 0 && marginNum > 0 && (
        <div className="card bg-amber-50 border-amber-200 animate-fade-in text-center">
          <p className="text-sm text-text-secondary mb-2">{lang === 'hi' ? 'रोज़ कम से कम बेचना होगा' : 'Minimum daily sales needed'}</p>
          <p className="number-big text-warning">{formatRupee(dailyBreakeven)}<span className="text-sm text-text-secondary">{t('perDay', lang)}</span></p>
          <p className="text-sm text-text-secondary mt-3">
            {lang === 'hi' ? `महीने का: ${formatRupee(monthlyBreakeven)}` : `Monthly: ${formatRupee(monthlyBreakeven)}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ UDHAAR TRACKER ============
function UdhaarTrackerTool() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const unpaid = state.udhaar.filter(u => !u.paid);
  const totalOwed = unpaid.reduce((sum, u) => sum + u.amount, 0);
  
  return (
    <div className="animate-fade-in">
      <div className="card bg-green-50 border-green-200 mb-4 text-center">
        <p className="text-sm text-text-secondary">{t('totalOwed', lang)}</p>
        <p className="number-big text-positive">{formatRupee(totalOwed)}</p>
        <p className="text-sm text-text-secondary">{unpaid.length} {lang === 'hi' ? 'ग्राहक बाकी' : 'customers pending'}</p>
      </div>
      
      {unpaid.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-5xl mb-4 block">🎉</span>
          <p className="text-text-secondary">
            {lang === 'hi' ? 'कोई उधार बाकी नहीं! बहुत बढ़िया।' : 'No pending udhaar! Great job.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {unpaid.map(entry => (
            <div key={entry.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-text">{entry.customerName}</p>
                <p className="text-sm text-text-secondary">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="number-medium text-problem">{formatRupee(entry.amount)}</span>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_UDHAAR_PAID', payload: entry.id })}
                  className="w-10 h-10 rounded-full bg-positive/10 flex items-center justify-center"
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ COST PLANNER ============
function CostPlannerTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [rent, setRent] = useState('');
  const [salary, setSalary] = useState('');
  const [electricity, setElectricity] = useState('');
  const [stock, setStock] = useState('');
  const [other, setOther] = useState('');
  
  const total = (parseInt(rent)||0) + (parseInt(salary)||0) + (parseInt(electricity)||0) + (parseInt(stock)||0) + (parseInt(other)||0);
  
  return (
    <div className="animate-fade-in">
      <div className="space-y-3 mb-6">
        {[
          { label: lang === 'hi' ? 'किराया' : 'Rent', value: rent, set: setRent, emoji: '🏠' },
          { label: lang === 'hi' ? 'तनख़्वाह' : 'Salary', value: salary, set: setSalary, emoji: '💰' },
          { label: lang === 'hi' ? 'बिजली' : 'Electricity', value: electricity, set: setElectricity, emoji: '💡' },
          { label: lang === 'hi' ? 'सामान' : 'Stock', value: stock, set: setStock, emoji: '📦' },
          { label: lang === 'hi' ? 'अन्य' : 'Other', value: other, set: setOther, emoji: '📝' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-2xl w-10">{item.emoji}</span>
            <input
              type="number"
              value={item.value}
              onChange={e => item.set(e.target.value)}
              placeholder={item.label}
              className="input-field flex-1"
            />
          </div>
        ))}
      </div>
      
      {total > 0 && (
        <div className="card bg-amber-50 border-amber-200 text-center animate-fade-in">
          <p className="text-sm text-text-secondary">{lang === 'hi' ? 'कुल महीने का खर्च' : 'Total monthly cost'}</p>
          <p className="number-big text-warning">{formatRupee(total)}</p>
          <p className="text-sm text-text-secondary mt-2">
            {lang === 'hi' ? `रोज़ का: ${formatRupee(Math.round(total/30))}` : `Per day: ${formatRupee(Math.round(total/30))}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ STOCK REORDER ============
function StockReorderTool() {
  const { state } = useStore();
  const lang = state.language!;
  const shopType = state.shopProfile.shopType;
  const serviceBusiness = shopType === 'salon' || shopType === 'tailor';
  const todayKey = getLocalDateKey();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  const startKey = getLocalDateKey(startDate);

  const namedSales = state.sales.filter((sale) =>
    typeof sale.itemName === 'string' &&
    sale.itemName.trim().length > 0 &&
    sale.date >= startKey &&
    sale.date <= todayKey,
  );
  const totals = new Map<string, { name: string; amount: number; entries: number; lastSold: string }>();
  namedSales.forEach((sale) => {
    const name = sale.itemName!.trim().replace(/\s+/g, ' ');
    const key = name.toLocaleLowerCase();
    const current = totals.get(key) || { name, amount: 0, entries: 0, lastSold: sale.date };
    current.amount += Number(sale.amount) || 0;
    current.entries += 1;
    if (sale.date > current.lastSold) current.lastSold = sale.date;
    totals.set(key, current);
  });
  const ranked = [...totals.values()].sort((a, b) => b.amount - a.amount).slice(0, 6);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="card">
        <p className="text-small text-text-secondary mb-1">{lang === 'hi' ? 'पिछले 7 दिन' : 'Last 7 days'}</p>
        <h3 className="text-body-lg font-bold text-text">
          {serviceBusiness
            ? (lang === 'hi' ? 'सबसे ज़्यादा बिकने वाली सेवाएँ' : 'Your most-recorded services')
            : (lang === 'hi' ? 'सबसे ज़्यादा दर्ज बिक्री वाले सामान' : 'Your top recorded items')}
        </h3>
        <p className="text-small text-text-secondary mt-2">
          {serviceBusiness
            ? (lang === 'hi'
              ? 'सर्विस का नाम लिखकर बिक्री दर्ज करें। यह सूची बताती है कि किन सेवाओं से सबसे ज़्यादा दर्ज बिक्री आई।'
              : 'Name each service when recording a sale. This list shows which services have the highest recorded sales value.')
            : (lang === 'hi'
              ? 'हर बिक्री में सामान का नाम लिखें। यह सूची दर्ज बिक्री के आधार पर दिखाती है कि किन सामानों से सबसे ज़्यादा बिक्री आई।'
              : 'Name each item when recording a sale. This list ranks items by recorded sales value, not by units sold or shelf stock.')}
        </p>
      </div>

      {ranked.length > 0 ? (
        <div className="space-y-2">
          {ranked.map((item, index) => (
            <div key={item.name.toLocaleLowerCase()} className="card flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text break-words">{item.name}</p>
                <p className="text-small text-text-secondary">
                  {item.entries} {lang === 'hi' ? 'बिक्री एंट्री' : (item.entries === 1 ? 'sale entry' : 'sales entries')}
                </p>
              </div>
              <p className="font-bold text-positive whitespace-nowrap">{formatRupee(item.amount)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-7">
          <span className="text-5xl block mb-3">{serviceBusiness ? '✂️' : '📦'}</span>
          <p className="font-semibold text-text mb-2">
            {lang === 'hi' ? 'अभी नाम वाली बिक्री उपलब्ध नहीं' : 'No named sales in the last 7 days'}
          </p>
          <p className="text-text-secondary text-small">
            {lang === 'hi'
              ? 'होम पर बिक्री जोड़ते समय सामान या सेवा का नाम और रकम दर्ज करें।'
              : 'When adding a sale on Home, enter the item or service name and amount.'}
          </p>
        </div>
      )}

      <div className="card border border-primary/20">
        <p className="font-semibold text-text mb-2">
          {serviceBusiness
            ? (lang === 'hi' ? 'अगला कदम' : 'What to do next')
            : (lang === 'hi' ? 'क्या दोबारा मँगाएँ?' : 'What should you reorder?')}
        </p>
        <p className="text-text-secondary text-small leading-relaxed">
          {serviceBusiness
            ? (lang === 'hi'
              ? 'ऊपर दी गई सेवाओं की माँग देखकर अपॉइंटमेंट स्लॉट और ज़रूरी कंज़्यूमेबल्स की योजना बनाएँ। रिकॉर्ड अपने-आप यह नहीं बताता कि कितना सामान बचा है।'
              : 'Use these service trends to plan appointment capacity and the consumables each service needs. Sales records do not show how much supply is left.')
            : (lang === 'hi'
              ? 'ऊपर के तेज़ बिकने वाले सामान का मौजूदा स्टॉक गिनें। जो कम बचा है, उसी की मात्रा तय करें। बिक्री का मूल्य माँग का संकेत है—यह अपने-आप मौजूदा स्टॉक या पीस की संख्या नहीं बताता।'
              : 'Count current stock for the items at the top, then decide what needs replenishing. Recorded sales value is a demand signal; it does not tell us units sold or how much stock remains.')}
        </p>
      </div>
    </div>
  );
}

// ============ FESTIVAL PLANNER ============
function FestivalTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const refreshDay = () => setTodayKey(getLocalDateKey());
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(
      refreshDay,
      Math.max(1000, nextMidnight.getTime() - now.getTime() + 250),
    );
    window.addEventListener('focus', refreshDay);
    document.addEventListener('visibilitychange', refreshDay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refreshDay);
      document.removeEventListener('visibilitychange', refreshDay);
    };
  }, [todayKey]);

  const referenceDate = new Date(todayKey + 'T12:00:00');
  const festivals = getUpcomingFestivals(referenceDate, 2);
  const shopType = state.shopProfile.shopType;

  if (festivals.length === 0) {
    return (
      <div className="card text-center py-8">
        <span className="text-5xl block mb-3">🗓️</span>
        <p className="font-semibold text-text mb-2">
          {lang === 'hi' ? 'अगले 2 महीनों में कोई बड़ा त्योहार सूचीबद्ध नहीं है' : 'No major festivals are listed in the next 2 months'}
        </p>
        <p className="text-text-secondary text-small">
          {lang === 'hi'
            ? 'स्थानीय आयोजनों, ग्राहकों की पूछताछ और अपनी बिक्री के रिकॉर्ड देखकर योजना बनाएँ।'
            : 'Plan around local events, customer requests and your own sales records.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-small text-text-secondary">
        {lang === 'hi'
          ? 'अगले 2 महीनों के त्योहार। तैयारी आपके कारोबार के प्रकार के हिसाब से है; खरीदने से पहले अपना स्टॉक और स्थानीय माँग जाँचें। कुछ त्योहारों की तारीख़ क्षेत्र के अनुसार बदल सकती है, इसलिए ऑर्डर से पहले स्थानीय तारीख़ की पुष्टि करें।'
          : 'Upcoming festivals in the next 2 months. Advice is tailored to your shop type; check current stock and local demand before buying. Some observances can vary by region, so confirm the local date before placing festival orders.'}
      </p>
      {festivals.map((festival) => {
        const date = new Date(festival.date + 'T12:00:00');
        const daysUntil = Math.max(0, Math.round((date.getTime() - referenceDate.getTime()) / 86400000));
        const advice = getFestivalShopAdvice(festival.id, shopType, lang);
        return (
          <div key={festival.id} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none flex-shrink-0">{festival.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-body-lg font-bold text-text">{getFestivalName(festival, lang)}</h3>
                <p className="text-small text-text-secondary mt-1">
                  {getFestivalDateLabel(festival.date, lang)}
                  {' · '}
                  {daysUntil === 0
                    ? (lang === 'hi' ? 'आज' : 'Today')
                    : lang === 'hi' ? daysUntil + ' दिन बाकी' : 'In ' + daysUntil + (daysUntil === 1 ? ' day' : ' days')}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border space-y-3">
              <div>
                <p className="text-small font-semibold text-text mb-1">
                  {lang === 'hi' ? 'दुकान के लिए क्या तैयार रखें' : 'What to keep ready'}
                </p>
                <p className="text-small text-text-secondary leading-relaxed">{advice.keepReady}</p>
              </div>
              <div>
                <p className="text-small font-semibold text-text mb-1">
                  {lang === 'hi' ? 'क्या ज़्यादा मँगाएँ' : 'What to replenish'}
                </p>
                <p className="text-small text-text-secondary leading-relaxed">{advice.restock}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3">
                <p className="text-small font-semibold text-text mb-1">
                  {lang === 'hi' ? 'काम की जानकारी' : 'Useful insight'}
                </p>
                <p className="text-small text-text-secondary leading-relaxed">{advice.insight}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ DIGITAL PAYMENTS ============
function DigitalPayTool() {
  const { state } = useStore();
  const lang = state.language!;
  
  return (
    <div className="animate-fade-in">
      <div className="card mb-4">
        <p className="font-semibold text-text mb-3">{lang === 'hi' ? 'UPI क्या है?' : 'What is UPI?'}</p>
        <p className="text-text-secondary text-sm">
          {lang === 'hi'
            ? 'UPI से ग्राहक सीधे आपके बैंक में पैसे भेज सकता है। QR कोड दिखाकर तुरंत पेमेंट मिलता है। कोई चार्ज नहीं।'
            : 'UPI lets customers send money directly to your bank. Show a QR code and get paid instantly. No charges.'}
        </p>
      </div>
      <div className="card mb-4">
        <p className="font-semibold text-text mb-3">{lang === 'hi' ? 'कैसे शुरू करें?' : 'How to start?'}</p>
        <ol className="text-text-secondary text-sm space-y-2 list-decimal list-inside">
          <li>{lang === 'hi' ? 'PhonePe / Google Pay / Paytm डाउनलोड करें' : 'Download PhonePe / Google Pay / Paytm'}</li>
          <li>{lang === 'hi' ? 'अपना नंबर रजिस्टर करें' : 'Register your number'}</li>
          <li>{lang === 'hi' ? 'QR कोड प्रिंट करके दुकान पर लगाएँ' : 'Print QR code and put it in shop'}</li>
        </ol>
      </div>
      <div className="card bg-green-50 border-green-200">
        <p className="font-semibold text-text mb-2">{lang === 'hi' ? 'फ़ायदे:' : 'Benefits:'}</p>
        <ul className="text-text-secondary text-sm space-y-1">
          <li>✅ {lang === 'hi' ? 'नकद रखने की चिंता नहीं' : 'No worry about keeping cash'}</li>
          <li>✅ {lang === 'hi' ? 'हिसाब अपने आप बनता है' : 'Automatic record of payments'}</li>
          <li>✅ {lang === 'hi' ? 'ज़्यादा ग्राहक आते हैं' : 'More customers come'}</li>
        </ul>
      </div>
    </div>
  );
}

// ============ LOAN CHECKER ============
function LoanCheckTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [amount, setAmount] = useState('');
  const [rate1, setRate1] = useState('');
  const [rate2, setRate2] = useState('');
  
  const amtNum = parseInt(amount) || 0;
  const r1 = parseFloat(rate1) || 0;
  const r2 = parseFloat(rate2) || 0;
  const interest1 = Math.round(amtNum * r1 * 1 / 100);
  const interest2 = Math.round(amtNum * r2 * 1 / 100);
  
  return (
    <div className="animate-fade-in">
      <p className="text-text-secondary mb-4 text-sm">
        {lang === 'hi' ? 'दो लोन ऑफर की तुलना करें। कौन सस्ता है?' : 'Compare two loan offers. Which is cheaper?'}
      </p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'लोन रकम' : 'Loan amount'}</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-text-secondary">{lang === 'hi' ? 'ऑफर 1: ब्याज %' : 'Offer 1: Interest %'}</label>
            <input type="number" value={rate1} onChange={e => setRate1(e.target.value)} className="input-field" placeholder="12" />
          </div>
          <div>
            <label className="text-sm text-text-secondary">{lang === 'hi' ? 'ऑफर 2: ब्याज %' : 'Offer 2: Interest %'}</label>
            <input type="number" value={rate2} onChange={e => setRate2(e.target.value)} className="input-field" placeholder="15" />
          </div>
        </div>
      </div>
      
      {amtNum > 0 && (r1 > 0 || r2 > 0) && (
        <div className="card bg-green-50 border-green-200 animate-fade-in">
          {r1 > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-text-secondary">{lang === 'hi' ? 'ऑफर 1: सालाना ब्याज' : 'Offer 1: Yearly interest'}</span>
              <span className="font-bold">{formatRupee(interest1)}</span>
            </div>
          )}
          {r2 > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-text-secondary">{lang === 'hi' ? 'ऑफर 2: सालाना ब्याज' : 'Offer 2: Yearly interest'}</span>
              <span className="font-bold">{formatRupee(interest2)}</span>
            </div>
          )}
          {r1 > 0 && r2 > 0 && (
            <p className="text-sm text-primary mt-2 font-medium">
              {interest1 < interest2
                ? (lang === 'hi' ? `ऑफर 1 सस्ता है — ${formatRupee(interest2 - interest1)} बचाएँगे` : `Offer 1 is cheaper — save ${formatRupee(interest2 - interest1)}`)
                : (lang === 'hi' ? `ऑफर 2 सस्ता है — ${formatRupee(interest1 - interest2)} बचाएँगे` : `Offer 2 is cheaper — save ${formatRupee(interest1 - interest2)}`)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============ SAVINGS GOAL ============
function SavingsTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [goal, setGoal] = useState('');
  const [months, setMonths] = useState('');
  
  const goalNum = parseInt(goal) || 0;
  const monthsNum = parseInt(months) || 1;
  const monthlyNeeded = Math.round(goalNum / monthsNum);
  const dailyNeeded = Math.round(monthlyNeeded / 30);
  
  return (
    <div className="animate-fade-in">
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'कितना बचाना है?' : 'How much to save?'}</label>
          <input type="number" value={goal} onChange={e => setGoal(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'कितने महीने में?' : 'In how many months?'}</label>
          <input type="number" value={months} onChange={e => setMonths(e.target.value)} className="input-field" placeholder="6" />
        </div>
      </div>
      
      {goalNum > 0 && monthsNum > 0 && (
        <div className="card bg-green-50 border-green-200 text-center animate-fade-in">
          <p className="text-sm text-text-secondary mb-2">{lang === 'hi' ? 'हर महीने बचाना होगा' : 'Save every month'}</p>
          <p className="number-big text-primary">{formatRupee(monthlyNeeded)}</p>
          <p className="text-sm text-text-secondary mt-2">
            {lang === 'hi' ? `रोज़ का: ${formatRupee(dailyNeeded)}` : `Per day: ${formatRupee(dailyNeeded)}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ BILL SPLITTER ============
function BillSplitTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState('2');
  
  const totalNum = parseInt(total) || 0;
  const peopleNum = parseInt(people) || 1;
  const perPerson = Math.round(totalNum / peopleNum);
  
  return (
    <div className="animate-fade-in">
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'कुल बिल' : 'Total bill'}</label>
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'कितने लोगों में बाँटना?' : 'Split between how many?'}</label>
          <input type="number" value={people} onChange={e => setPeople(e.target.value)} className="input-field" placeholder="2" />
        </div>
      </div>
      
      {totalNum > 0 && peopleNum > 0 && (
        <div className="card bg-green-50 border-green-200 text-center animate-fade-in">
          <p className="text-sm text-text-secondary mb-2">{lang === 'hi' ? 'हर एक का हिस्सा' : 'Each person pays'}</p>
          <p className="number-big text-primary">{formatRupee(perPerson)}</p>
        </div>
      )}
    </div>
  );
}

// ============ BARGAIN HELPER ============
function BargainTool() {
  const { state } = useStore();
  const lang = state.language!;
  const [cost, setCost] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  
  const costNum = parseInt(cost) || 0;
  const minProfitNum = parseInt(minProfit) || 0;
  const offeredNum = parseInt(offeredPrice) || 0;
  const minAcceptable = costNum + minProfitNum;
  const canAccept = offeredNum >= minAcceptable;
  
  return (
    <div className="animate-fade-in">
      <p className="text-text-secondary mb-4 text-sm">
        {lang === 'hi' ? 'सबसे कम कीमत बताएँ जिस पर बेच सकते हैं।' : 'Find the lowest price you can accept.'}
      </p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'आपकी खरीद कीमत' : 'Your cost price'}</label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'कम से कम कितना मुनाफ़ा चाहिए' : 'Minimum profit needed'}</label>
          <input type="number" value={minProfit} onChange={e => setMinProfit(e.target.value)} className="input-field" placeholder="₹" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">{lang === 'hi' ? 'ग्राहक कितने में माँग रहा है' : 'Customer is offering'}</label>
          <input type="number" value={offeredPrice} onChange={e => setOfferedPrice(e.target.value)} className="input-field" placeholder="₹" />
        </div>
      </div>
      
      {costNum > 0 && minProfitNum > 0 && (
        <div className={`card text-center animate-fade-in ${canAccept ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-text-secondary mb-2">
            {lang === 'hi' ? 'आपकी सबसे कम कीमत' : 'Your lowest price'}
          </p>
          <p className="number-big text-primary">{formatRupee(minAcceptable)}</p>
          {offeredNum > 0 && (
            <p className={`mt-3 font-semibold ${canAccept ? 'text-positive' : 'text-problem'}`}>
              {canAccept
                ? (lang === 'hi' ? '✓ हाँ, यह कीमत चलेगी' : '✓ Yes, you can accept this')
                : (lang === 'hi' ? `✗ नहीं, कम से कम ${formatRupee(minAcceptable)} माँगें` : `✗ No, ask for at least ${formatRupee(minAcceptable)}`)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
