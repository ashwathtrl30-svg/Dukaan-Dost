import React, { useState, useRef, useEffect } from 'react';
import { useStore, formatRupee, getTodaySales, getTodayExpenses, getTotalUdhaar, generateId, getWeekSales } from '../store';
import { t } from '../i18n';
import { ChatMessage, ChatSession } from '../types';
import { Send, MoreVertical, Plus, ArrowLeft, Trash2, MessageCircle, Clock } from 'lucide-react';
import { findKnowledgeEntry } from '../knowledgeBase';

// Helper: get today's date string
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper: format number with Indian grouping
function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

// Helper: detect if question is about TODAY
function isTodayQuestion(q: string): boolean {
  return /today|aaj|आज|आजका|आज का|आजकी|आज की/.test(q);
}

// Helper: detect if question is about this week
function isWeekQuestion(q: string): boolean {
  return /week|hafte|हफ़्ते|हफ्ते|इस हफ़्ते|this week|last week|पिछले/.test(q);
}

// Helper: detect if question is about this month
function isMonthQuestion(q: string): boolean {
  return /month|mahine|महीने|महीने का|इस महीने|this month|last month|पिछले महीने/.test(q);
}

// Helper: detect sales-related questions (use word boundaries to avoid "wholesale" matching "sale")
function isSalesQuestion(q: string): boolean {
  return /\bsale\b|\bsales\b|\bbikr\b|बिक्री|बिका|\bbika\b|बेचा|\bbecha\b|\bselling\b|कितना बिका|\bhow much sold\b|\brevenue\b|\bturnover\b/.test(q);
}

// Helper: detect expense-related questions
function isExpenseQuestion(q: string): boolean {
  return /\bexpense\b|\bexpenses\b|\bkharch\b|खर्च|ख़र्च|खर्चा|\bkharcha\b|\bspending\b|कितना खर्च|\bhow much spent\b|\bcost\b|\bcosts\b/.test(q);
}

// Helper: detect profit questions
function isProfitQuestion(q: string): boolean {
  return /\bprofit\b|\bmunafa\b|मुनाफ़ा|मुनाफा|\bkama\b|कमाई|कमाया|\bearn\b|\bearning\b|\bnet\b|\bgain\b/.test(q);
}

// Helper: detect profit % questions
function isProfitPercentQuestion(q: string): boolean {
  return /\bpercent\b|%|प्रतिशत|प्रति सौ|\bmargin\b|कितना प्रतिशत|\bhow much percent\b|\bprofit %\b|\bprofit percent\b/.test(q);
}

// Helper: detect udhaar questions - FIXED: use word boundaries so "owe" doesn't match "lower"
function isUdhaarQuestion(q: string): boolean {
  return /\budhaar\b|उधार|\bcredit\b|\bowes\b|\bowed\b|\bowe me\b|\bowe you\b|किसने|\bkisne\b|\bdena\b|बाकी|\bbaki\b|\bpending\b|\boutstanding\b|\bdues\b|\budhaar\b/.test(q);
}

// Helper: detect "who owes" questions
function isWhoOwesQuestion(q: string): boolean {
  return /(\bwho\b|कौन|\bkisne\b|किसने|\bkab देंगे\b|\bkab denge\b|\bwhen pay\b|\bdue date\b)/.test(q) && isUdhaarQuestion(q);
}

// Helper: detect if question is seeking BUSINESS ADVICE (not data lookup)
function isAdviceQuestion(q: string): boolean {
  return /\bhow to\b|\bhow do\b|\bhow can\b|\bhow should\b|\bwhat should\b|\bwhat to\b|\bkaise\b|\bkya karu\b|\bkya karen\b|\bkaise karu\b|कैसे करें|क्या करूँ|क्या करूं|\bhow to handle\b|\bhow to deal\b|\bhow to manage\b|\bhow to attract\b|\bhow to compete\b|\bhow to train\b|\bhow to prepare\b|\bhow to reduce\b|\bhow to improve\b|\bhow to convince\b|\bhow to negotiate\b|\bhow to stop\b|\bhow to avoid\b|\bhow to start\b|\btips for\b|\badvice for\b|\bsuggest\b|\bsuggestion\b|\bshould i\b|\bwhat if\b|\bwhat is the best\b|\bbest way\b|\bstrategies\b|\bsteps to\b|\bways to\b|\bguide\b|\bhelp me\b|\bconvinced\b|\bpersuade\b|\bnegotiate\b|\brent\b|\blandlord\b|\bowner\b|\bsupplier\b|\bstaff\b|\bemployee\b|\bcustomer\b|\bcompetition\b|\bmarketing\b|\badvertise\b|\bdisplay\b|\barrange\b|\borganize\b|\bsave money\b|\bcut costs\b|\bincrease sales\b|\bbetter business\b|\bgrow business\b|\bsuccess\b|\bproblem\b|\bissue\b|\bdifficulty\b|\bchallenge\b|\bloss\b|\blosing\b|\bnot selling\b|\bslow\b|\bdecrease\b|\bdrop\b|\bfalling\b/.test(q);
}

// Intent classification - understand what user really wants
type Intent = 'data_query' | 'business_advice' | 'problem_solving' | 'planning' | 'comparison' | 'greeting' | 'unclear';

function classifyIntent(q: string): Intent {
  if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q.includes('नमस्ते') || q.includes('हैलो') || q.includes('hey') || q === 'hlo' || q === 'hii') {
    return 'greeting';
  }
  if (isAdviceQuestion(q)) {
    if (/\bproblem\b|\bissue\b|\bdifficulty\b|\bchallenge\b|\bloss\b|\blosing\b|\bnot selling\b|\bslow\b|\bdecrease\b|\bdrop\b|\bfalling\b|\bwhy\b|\bkya\b|क्यों|क्या/.test(q)) {
      return 'problem_solving';
    }
    if (/\bplan\b|\bprepare\b|\bstrategy\b|\bfestival\b|\bseason\b|\bnext\b|\bfuture\b|\btayari\b|तैयारी|योजना/.test(q)) {
      return 'planning';
    }
    if (/\bcompare\b|\bbetter\b|\bvs\b|\bversus\b|\bwhich\b|\bkonsa\b|कौन सा/.test(q)) {
      return 'comparison';
    }
    return 'business_advice';
  }
  if (isSalesQuestion(q) || isExpenseQuestion(q) || isProfitQuestion(q) || isUdhaarQuestion(q)) {
    return 'data_query';
  }
  return 'unclear';
}

// Build shop context for personalization
function buildShopContext(state: any): string {
  const profile = state.shopProfile;
  const shopType = profile.shopType;
  const shopName = profile.shopName || (shopType ? t(`st_${shopType}` as any, 'en') : 'shop');
  const city = profile.city || 'your area';
  const monthlySales = profile.monthlySales;
  const workers = profile.workers;
  
  let context = `Shop: ${shopName} (${shopType || 'retail'}) in ${city}`;
  if (monthlySales) context += `, Monthly sales: ${t(`ms_${monthlySales}` as any, 'en')}`;
  if (workers > 1) context += `, ${workers} workers`;
  
  return context;
}

// Send only minimal shop context to the free-tier LLM.
// Never send customer records, phone numbers, ledgers, or exact financial entries.
function buildAIShopContext(state: any): string {
  const profile = state.shopProfile || {};
  const details: string[] = [];

  if (profile.shopType) {
    details.push(`Shop type: ${t(`st_${profile.shopType}` as any, 'en')}`);
  }
  if (typeof profile.city === 'string' && profile.city.trim()) {
    details.push(`City: ${profile.city.trim().slice(0, 80)}`);
  }
  if (Number.isInteger(profile.workers) && profile.workers > 0) {
    details.push(`Workers: ${profile.workers}`);
  }

  return details.length ? details.join("\n") : "Shop type not provided.";
}

// Get current season/festival context
function getTimeContext(): string {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Indian festival calendar (approximate)
  if (month === 9 && day > 10) return 'Diwali season (Oct-Nov)';
  if (month === 2 || month === 3) return 'Holi season (Mar)';
  if (month === 5 || month === 6) return 'Monsoon season (Jun-Jul)';
  if (month === 10 || month === 11) return 'Winter season (Nov-Dec)';
  if (month === 3 || month === 4) return 'Summer season (Apr-May)';
  
  return 'Regular season';
}

// Main AI response generator - World-class advisor persona
function generateResponse(question: string, state: any, lang: string): string {
  const q = question.toLowerCase().trim();
  const intent = classifyIntent(q);
  const shopContext = buildShopContext(state);
  const timeContext = getTimeContext();
  
  const todaySales = getTodaySales(state.sales);
  const todayExpenses = getTodayExpenses(state.expenses);
  const todayProfit = todaySales - todayExpenses;
  const totalUdhaar = getTotalUdhaar(state.udhaar);
  const today = getTodayStr();
  const shopType = state.shopProfile.shopType;
  
  // ===== GREETINGS =====
  if (intent === 'greeting') {
    return lang === 'hi'
      ? `नमस्ते! 🙏 मैं आपकी दुकान का सलाहकार हूँ।\n\nआप मुझसे पूछ सकते हैं:\n• आज की बिक्री, खर्च, मुनाफ़ा\n• उधार कितना बाकी है\n• व्यापार की सलाह (ग्राहक, स्टॉक, स्टाफ, मार्केटिंग)\n• त्योहार की तैयारी\n\nबस अपना सवाल पूछें, मैं मदद करूँगा।`
      : `Namaste! 🙏 I'm your shop's business advisor.\n\nYou can ask me about:\n• Today's sales, expenses, profit\n• Pending udhaar\n• Business advice (customers, stock, staff, marketing)\n• Festival preparation\n\nJust ask your question and I'll help.`;
  }
  
  if (q.includes('thank') || q.includes('shukriya') || q.includes('धन्यवाद') || q.includes('शुक्रिया') || q.includes('thanks')) {
    return lang === 'hi' ? 'आपका स्वागत है! 😊 और कुछ पूछना हो तो बेझिझक पूछें।' : 'You\'re welcome! 😊 Feel free to ask anything else.';
  }
  
  // ===== BUSINESS ADVICE & PROBLEM SOLVING =====
  if (intent === 'business_advice' || intent === 'problem_solving' || intent === 'planning' || intent === 'comparison') {
    // First check knowledge base for specific advice
    const knowledgeEntry = findKnowledgeEntry(question);
    if (knowledgeEntry) {
      const baseResponse = lang === 'hi' ? knowledgeEntry.responseHi : knowledgeEntry.responseEn;
      
      // Personalize based on shop context
      let personalized = baseResponse;
      
      // Add shop-specific context if available
      if (shopType && shopType !== 'other') {
        const shopTypeName = t(`st_${shopType}` as any, lang as any);
        if (lang === 'hi') {
          personalized = `आपकी ${shopTypeName} दुकान के लिए:\n\n` + personalized;
        } else {
          personalized = `For your ${shopTypeName} shop:\n\n` + personalized;
        }
      }
      
      // Add time context for seasonal/festival questions
      if (intent === 'planning' && timeContext !== 'Regular season') {
        if (lang === 'hi') {
          personalized += `\n\n**समय:** ${timeContext} - तदनुसार तैयारी करें।`;
        } else {
          personalized += `\n\n**Timing:** ${timeContext} - Plan accordingly.`;
        }
      }
      
      return personalized;
    }
    
    // No exact knowledge base match - provide practical starting point
    if (intent === 'problem_solving') {
      if (lang === 'hi') {
        return `आइए इस समस्या को सुलझाते हैं।\n\n**पहला कदम:** कल से बिक्री और खर्च की एंट्री डालना शुरू करें। इससे मुझे असली डेटा मिलेगा और मैं सटीक सलाह दे पाऊँगा।\n\n**अभी के लिए:** \n• क्या यह समस्या लगातार हो रही है या कभी-कभी?\n• इससे आपकी बिक्री या मुनाफ़े पर कितना असर हो रहा है?\n\nये जानकारी देने पर मैं बेहतर सलाह दे सकता हूँ।`;
      }
      return `Let's solve this problem.\n\n**First step:** Start entering today's sales and expenses. This gives me real data to provide accurate advice.\n\n**For now:**\n• Is this a continuous problem or occasional?\n• How much is it affecting your sales or profit?\n\nWith this information, I can give better advice.`;
    }
    
    if (intent === 'planning') {
      if (lang === 'hi') {
        return `तैयारी के लिए तुरंत करें:\n\n1. **अभी:** पिछले त्योहार/सीज़न की बिक्री याद करें - क्या अच्छा बिका?\n2. **इस हफ़्ते:** उन सामानों का स्टॉक चेक करें\n3. **अगले हफ़्ते:** तेज़ी से बिकने वाले सामान ऑर्डर करें\n\n${timeContext !== 'Regular season' ? `**समय:** ${timeContext} - जल्दी शुरू करें।` : ''}\n\nक्या आप चाहते हैं कि मैं आपकी दुकान के लिए विशिष्ट सुझाव दूँ?`;
      }
      return `For planning, start now:\n\n1. **Today:** Recall last festival/season sales - what sold well?\n2. **This week:** Check stock of those items\n3. **Next week:** Order fast-moving products\n\n${timeContext !== 'Regular season' ? `**Timing:** ${timeContext} - Start early.` : ''}\n\nWant me to give specific suggestions for your shop?`;
    }
    
    if (intent === 'comparison') {
      if (lang === 'hi') {
        return `फ़ैसला लेने के लिए:\n\n**पहले ये सोचें:**\n• कौन सा विकल्प कम जोखिम वाला है?\n• किससे आपकी बिक्री ज़्यादा बढ़ेगी?\n• क्या यह आपके बजट में है?\n\n**सुझाव:** छोटे पैमाने पर शुरू करें, देखें क्या काम करता है, फिर बढ़ाएं।\n\nक्या आप मुझे बता सकते हैं कि आप किन विकल्पों में से चुन रहे हैं?`;
      }
      return `To make the decision:\n\n**Consider first:**\n• Which option has less risk?\n• Which will increase your sales more?\n• Is it within your budget?\n\n**Suggestion:** Start small, see what works, then scale up.\n\nCan you tell me which options you're choosing between?`;
    }
    
    // General business advice
    if (lang === 'hi') {
      return `आइए आपकी दुकान सुधारें।\n\n**तुरंत करें:**\n1. रोज़ बिक्री और खर्च की एंट्री डालें (5 मिनट)\n2. हफ़्ते में एक बार देखें - क्या बेहतर हो सकता है?\n3. एक छोटा बदलाव करें और देखें असर\n\n**मदद के लिए पूछें:**\n• "ग्राहक कैसे बढ़ाएं?"\n• "उधार कैसे कम करें?"\n• "स्टॉक कैसे मैनेज करें?"\n• "मुनाफ़ा कैसे बढ़ाएं?"\n\nआपकी दुकान के बारे में बताएं ताकि मैं बेहतर सलाह दे सकूं।`;
    }
    return `Let's improve your shop.\n\n**Start now:**\n1. Enter daily sales and expenses (5 minutes)\n2. Review weekly - what can improve?\n3. Make one small change and see the impact\n\n**Ask me for help with:**\n• "How to get more customers?"\n• "How to reduce udhaar?"\n• "How to manage stock?"\n• "How to increase profit?"\n\nTell me about your shop so I can give better advice.`;
  }
  
  // ===== DATA QUERIES - Answer with actual data =====
  if (intent === 'data_query') {
    // Today's sales
    if (isTodayQuestion(q) && isSalesQuestion(q)) {
      const todaySaleEntries = state.sales.filter((s: any) => s.date === today);
      if (todaySaleEntries.length === 0) {
        return lang === 'hi'
          ? 'आज की अभी तक कोई बिक्री नहीं डाली गई।\n\nबिक्री डालने के लिए होम स्क्रीन पर "बिक्री" बटन दबाएँ।'
          : 'No sales have been added for today yet.\n\nTap "Sale" on the home screen to add today\'s sales.';
      }
      const cashSales = todaySaleEntries.filter((s: any) => s.paymentType === 'cash').reduce((sum: number, s: any) => sum + s.amount, 0);
      const upiSales = todaySaleEntries.filter((s: any) => s.paymentType === 'upi').reduce((sum: number, s: any) => sum + s.amount, 0);
      
      if (lang === 'hi') {
        let response = `आज की कुल बिक्री: **₹${fmt(todaySales)}**`;
        if (cashSales > 0 || upiSales > 0) {
          response += `\n\n• नकद: ₹${fmt(cashSales)}`;
          response += `\n• UPI: ₹${fmt(upiSales)}`;
        }
        return response;
      }
      let response = `Today's total sales: **₹${fmt(todaySales)}**`;
      if (cashSales > 0 || upiSales > 0) {
        response += `\n\n• Cash: ₹${fmt(cashSales)}`;
        response += `\n• UPI: ₹${fmt(upiSales)}`;
      }
      return response;
    }
    
    // Today's expense
    if (isTodayQuestion(q) && isExpenseQuestion(q)) {
      const todayExpenseEntries = state.expenses.filter((e: any) => e.date === today);
      if (todayExpenseEntries.length === 0) {
        return lang === 'hi'
          ? 'आज का अभी तक कोई खर्च नहीं डाला गया।\n\nखर्च डालने के लिए होम स्क्रीन पर "खर्च" बटन दबाएँ।'
          : 'No expenses have been added for today yet.\n\nTap "Expense" on the home screen to add today\'s expenses.';
      }
      const byCategory: Record<string, number> = {};
      todayExpenseEntries.forEach((e: any) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
      
      if (lang === 'hi') {
        let response = `आज का कुल खर्च: **₹${fmt(todayExpenses)}**`;
        Object.entries(byCategory).forEach(([cat, amt]) => {
          response += `\n• ${t(`ec_${cat}` as any, 'hi')}: ₹${fmt(amt as number)}`;
        });
        return response;
      }
      let response = `Today's total expenses: **₹${fmt(todayExpenses)}**`;
      Object.entries(byCategory).forEach(([cat, amt]) => {
        response += `\n• ${t(`ec_${cat}` as any, 'en')}: ₹${fmt(amt as number)}`;
      });
      return response;
    }
    
    // Today's profit %
    if (isTodayQuestion(q) && isProfitPercentQuestion(q) && isProfitQuestion(q)) {
      if (todaySales === 0) {
        return lang === 'hi'
          ? 'आज की बिक्री का डेटा नहीं है। पहले बिक्री डालें, तब मैं मुनाफ़ा प्रतिशत बता पाऊँगा।'
          : 'No sales data for today yet. Add sales first, then I can calculate profit %.';
      }
      const profitPercent = Math.round((todayProfit / todaySales) * 100);
      if (lang === 'hi') {
        return `आज का मुनाफ़ा प्रतिशत: **${profitPercent}%**\n\n• बिक्री: ₹${fmt(todaySales)}\n• खर्च: ₹${fmt(todayExpenses)}\n• मुनाफ़ा: ₹${fmt(todayProfit)}`;
      }
      return `Today's profit %: **${profitPercent}%**\n\n• Sales: ₹${fmt(todaySales)}\n• Expenses: ₹${fmt(todayExpenses)}\n• Profit: ₹${fmt(todayProfit)}`;
    }
    
    // Today's profit
    if (isTodayQuestion(q) && isProfitQuestion(q)) {
      if (todaySales === 0 && todayExpenses === 0) {
        return lang === 'hi'
          ? 'आज की बिक्री या खर्च का डेटा नहीं है। पहले दोनों डालें, तब मैं मुनाफ़ा बता पाऊँगा।'
          : 'No sales or expense data for today yet. Add both first, then I can tell you your profit.';
      }
      if (todaySales === 0) {
        return lang === 'hi' ? 'आज की बिक्री नहीं डाली गई। पहले बिक्री डालें।' : 'No sales added for today. Please add sales first.';
      }
      if (todayExpenses === 0) {
        if (lang === 'hi') {
          return `आज की बिक्री: ₹${fmt(todaySales)}\n\nआज का खर्च नहीं डाला गया, इसलिए मुनाफ़ा सटीक नहीं बता सकता। खर्च डालें तो सही मुनाफ़ा मिलेगा।`;
        }
        return `Today's sales: ₹${fmt(todaySales)}\n\nNo expenses added for today, so I can't calculate accurate profit. Add expenses to see the real profit.`;
      }
      if (lang === 'hi') {
        return `आज का मुनाफ़ा: **₹${fmt(todayProfit)}**\n\n• बिक्री: ₹${fmt(todaySales)}\n• खर्च: ₹${fmt(todayExpenses)}`;
      }
      return `Today's profit: **₹${fmt(todayProfit)}**\n\n• Sales: ₹${fmt(todaySales)}\n• Expenses: ₹${fmt(todayExpenses)}`;
    }
    
    // Today's udhaar
    if (isTodayQuestion(q) && isUdhaarQuestion(q)) {
      const todayUdhaar = state.udhaar.filter((u: any) => u.date === today && !u.paid);
      if (todayUdhaar.length === 0) {
        return lang === 'hi' ? 'आज का कोई उधार नहीं डाला गया।' : 'No udhaar entries for today.';
      }
      const todayUdhaarTotal = todayUdhaar.reduce((sum: number, u: any) => sum + u.amount, 0);
      if (lang === 'hi') {
        let response = `आज का कुल उधार: **₹${fmt(todayUdhaarTotal)}** (${todayUdhaar.length} ग्राहक):`;
        todayUdhaar.forEach((u: any) => {
          response += `\n• ${u.customerName} — ₹${fmt(u.amount)}`;
        });
        return response;
      }
      let response = `Today's total udhaar: **₹${fmt(todayUdhaarTotal)}** (${todayUdhaar.length} ${todayUdhaar.length === 1 ? 'customer' : 'customers'}):`;
      todayUdhaar.forEach((u: any) => {
        response += `\n• ${u.customerName} — ₹${fmt(u.amount)}`;
      });
      return response;
    }
    
    // Who owes me (udhaar list)
    if (isWhoOwesQuestion(q) || (isUdhaarQuestion(q) && (q.includes('who') || q.includes('कौन') || q.includes('kisne') || q.includes('किसने')))) {
      const unpaid = state.udhaar.filter((u: any) => !u.paid);
      if (unpaid.length === 0) {
        return lang === 'hi' ? 'अभी कोई उधार बाकी नहीं है! बहुत बढ़िया। 🎉' : 'No pending udhaar right now! Great job. 🎉';
      }
      const sorted = [...unpaid].sort((a: any, b: any) => b.amount - a.amount);
      if (lang === 'hi') {
        let response = `कुल **₹${fmt(totalUdhaar)}** उधार बाकी है (${unpaid.length} ग्राहकों से):\n\n`;
        sorted.slice(0, 5).forEach((u: any) => {
          response += `• ${u.customerName} — ₹${fmt(u.amount)}\n`;
        });
        if (sorted.length > 5) response += `\n...और ${sorted.length - 5} और`;
        return response;
      }
      let response = `Total **₹${fmt(totalUdhaar)}** is pending (${unpaid.length} customers):\n\n`;
      sorted.slice(0, 5).forEach((u: any) => {
        response += `• ${u.customerName} — ₹${fmt(u.amount)}\n`;
      });
      if (sorted.length > 5) response += `\n...and ${sorted.length - 5} more`;
      return response;
    }
    
    // Total udhaar
    if (isUdhaarQuestion(q)) {
      if (state.udhaar.length === 0) {
        return lang === 'hi'
          ? 'अभी कोई उधार दर्ज नहीं है। उधार डालने के लिए होम स्क्रीन पर "उधार" बटन दबाएँ।'
          : 'No udhaar entries yet. Tap "Udhaar" on the home screen to start tracking.';
      }
      const unpaid = state.udhaar.filter((u: any) => !u.paid);
      if (lang === 'hi') {
        return `कुल उधार बाकी: **₹${fmt(totalUdhaar)}**\n\n• बाकी ग्राहक: ${unpaid.length}\n• कुल एंट्री: ${state.udhaar.length}`;
      }
      return `Total udhaar pending: **₹${fmt(totalUdhaar)}**\n\n• Pending customers: ${unpaid.length}\n• Total entries: ${state.udhaar.length}`;
    }
    
    // Week sales
    if (isWeekQuestion(q) && isSalesQuestion(q)) {
      const thisWeekSales = getWeekSales(state.sales, 0);
      if (thisWeekSales === 0) {
        return lang === 'hi' ? 'इस हफ़्ते की कोई बिक्री नहीं डाली गई।' : 'No sales added for this week yet.';
      }
      const lastWeekSales = getWeekSales(state.sales, 1);
      const diff = thisWeekSales - lastWeekSales;
      if (lang === 'hi') {
        let response = `इस हफ़्ते की कुल बिक्री: **₹${fmt(thisWeekSales)}**`;
        if (lastWeekSales > 0) {
          response += `\n\nपिछले हफ़्ते: ₹${fmt(lastWeekSales)}`;
          response += diff >= 0 ? `\n📈 इस हफ़्ते ₹${fmt(diff)} ज़्यादा` : `\n📉 इस हफ़्ते ₹${fmt(Math.abs(diff))} कम`;
        }
        return response;
      }
      let response = `This week's total sales: **₹${fmt(thisWeekSales)}**`;
      if (lastWeekSales > 0) {
        response += `\n\nLast week: ₹${fmt(lastWeekSales)}`;
        response += diff >= 0 ? `\n📈 ₹${fmt(diff)} more this week` : `\n📉 ₹${fmt(Math.abs(diff))} less this week`;
      }
      return response;
    }
    
    // Month sales
    if (isMonthQuestion(q) && isSalesQuestion(q)) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthSales = state.sales.filter((s: any) => s.date >= monthStart).reduce((sum: number, s: any) => sum + s.amount, 0);
      if (monthSales === 0) {
        return lang === 'hi' ? 'इस महीने की कोई बिक्री नहीं डाली गई।' : 'No sales added for this month yet.';
      }
      if (lang === 'hi') {
        return `इस महीने की कुल बिक्री: **₹${fmt(monthSales)}**`;
      }
      return `This month's total sales: **₹${fmt(monthSales)}**`;
    }
    
    // General profit question
    if (isProfitQuestion(q)) {
      if (state.sales.length === 0) {
        return lang === 'hi'
          ? 'अभी बिक्री का डेटा नहीं है। पहले कुछ दिन बिक्री डालें, फिर मैं मुनाफ़ा बता पाऊँगा।'
          : 'No sales data yet. Add sales for a few days, then I can tell you about profit.';
      }
      const totalSales = state.sales.reduce((sum: number, s: any) => sum + s.amount, 0);
      const totalExpenses = state.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalProfit = totalSales - totalExpenses;
      if (totalExpenses === 0) {
        return lang === 'hi'
          ? `कुल बिक्री: ₹${fmt(totalSales)}\n\nअभी खर्च का डेटा नहीं है, इसलिए मुनाफ़ा सटीक नहीं बता सकता। खर्च डालें तो सही मुनाफ़ा मिलेगा।`
          : `Total sales: ₹${fmt(totalSales)}\n\nNo expense data yet, so I can't calculate accurate profit. Add expenses to see the real profit.`;
      }
      const profitPercent = Math.round((totalProfit / totalSales) * 100);
      if (lang === 'hi') {
        return `कुल हिसाब:\n\n• कुल बिक्री: ₹${fmt(totalSales)}\n• कुल खर्च: ₹${fmt(totalExpenses)}\n• **कुल मुनाफ़ा: ₹${fmt(totalProfit)}**\n• मुनाफ़ा प्रतिशत: ${profitPercent}%`;
      }
      return `Overall summary:\n\n• Total sales: ₹${fmt(totalSales)}\n• Total expenses: ₹${fmt(totalExpenses)}\n• **Total profit: ₹${fmt(totalProfit)}**\n• Profit %: ${profitPercent}%`;
    }
    
    // General sales question
    if (isSalesQuestion(q)) {
      if (state.sales.length === 0) {
        return lang === 'hi'
          ? 'अभी कोई बिक्री का डेटा नहीं है। बिक्री डालने के लिए होम स्क्रीन पर "बिक्री" बटन दबाएँ।'
          : 'No sales data yet. Tap "Sale" on the home screen to start tracking.';
      }
      const totalSales = state.sales.reduce((sum: number, s: any) => sum + s.amount, 0);
      if (lang === 'hi') {
        return `कुल बिक्री: **₹${fmt(totalSales)}** (${state.sales.length} एंट्री)`;
      }
      return `Total sales: **₹${fmt(totalSales)}** (${state.sales.length} ${state.sales.length === 1 ? 'entry' : 'entries'})`;
    }
    
    // General expense question
    if (isExpenseQuestion(q)) {
      if (state.expenses.length === 0) {
        return lang === 'hi'
          ? 'अभी कोई खर्च का डेटा नहीं है। खर्च डालने के लिए होम स्क्रीन पर "खर्च" बटन दबाएँ।'
          : 'No expense data yet. Tap "Expense" on the home screen to start tracking.';
      }
      const totalExpenses = state.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const byCategory: Record<string, number> = {};
      state.expenses.forEach((e: any) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
      if (lang === 'hi') {
        let response = `कुल खर्च: **₹${fmt(totalExpenses)}**`;
        if (topCategory) {
          response += `\n\nसबसे बड़ा खर्च: ${t(`ec_${topCategory[0]}` as any, 'hi')} — ₹${fmt(topCategory[1])}`;
        }
        return response;
      }
      let response = `Total expenses: **₹${fmt(totalExpenses)}**`;
      if (topCategory) {
        response += `\n\nBiggest expense: ${t(`ec_${topCategory[0]}` as any, 'en')} — ₹${fmt(topCategory[1])}`;
      }
      return response;
    }
  }
  
  // ===== UNCLEAR INTENT - Provide helpful guidance =====
  if (lang === 'hi') {
    return `मैं आपकी मदद करना चाहता हूँ। आप मुझसे ये पूछ सकते हैं:\n\n**दुकान का डेटा:**\n• "आज की बिक्री कितनी?"\n• "मुनाफ़ा कितना हुआ?"\n• "किसने उधार लिया है?"\n\n**व्यापार सलाह:**\n• "ग्राहक मोलभाव करें तो क्या करूँ?"\n• "नए ग्राहक कैसे लाएं?"\n• "स्टॉक कैसे मैनेज करें?"\n• "बिजली का बिल कैसे कम करें?"\n\nअपना सवाल स्पष्ट करें तो मैं बेहतर मदद कर सकता हूँ।`;
  }
  return `I'm here to help. You can ask me:\n\n**Shop data:**\n• "What are today's sales?"\n• "How much profit did I make?"\n• "Who owes me money?"\n\n**Business advice:**\n• "How to handle bargaining customers?"\n• "How to attract more customers?"\n• "How to manage inventory?"\n• "How to reduce electricity bill?"\n\nPlease clarify your question so I can help you better.`;
}

// Helper: Format date for display
function formatDate(timestamp: number, lang: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return lang === 'hi' ? 'आज' : 'Today';
  } else if (diffDays === 1) {
    return lang === 'hi' ? 'कल' : 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long' });
  } else {
    return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

// ============ ASK SCREEN ============
export function AskScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get active session
  const activeSession = state.chatSessions.find(s => s.id === state.activeSessionId);
  const messages = activeSession?.messages || [];
  
  const suggestedQuestions = [
    lang === 'hi' ? 'आज की बिक्री कितनी हुई?' : 'What are today\'s sales?',
    lang === 'hi' ? 'आज का मुनाफ़ा कितना?' : 'What\'s my profit today?',
    lang === 'hi' ? 'किसने उधार लिया है?' : 'Who owes me money?',
    lang === 'hi' ? 'बिजली का बिल कैसे कम करें?' : 'How to reduce electricity bill?',
  ];
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isSending) return;

    // Add user message immediately.
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    setInput('');
    setIsSending(true);

    let response = '';
    try {
      // Keep factual shop-ledger calculations local. Use the LLM for advice,
      // planning, explanations, and questions the local rules cannot understand.
      const intent = classifyIntent(message.toLowerCase().trim());

      if (intent === 'data_query') {
        response = generateResponse(message, state, lang);
      } else {
        const apiResponse = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: message,
            language: lang === 'hi' ? 'Hindi' : 'English',
            shopContext: buildAIShopContext(state),
          }),
        });

        const result = await apiResponse.json().catch(() => ({}));
        if (!apiResponse.ok) {
          throw new Error(
            typeof result?.error === 'string'
              ? result.error
              : 'The AI advisor could not answer right now. Please try again.'
          );
        }

        response = typeof result?.answer === 'string' ? result.answer.trim() : '';
        if (!response) {
          throw new Error('The AI returned an empty answer. Please try again.');
        }
      }
    } catch (error) {
      response = error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : (lang === 'hi'
          ? 'अभी AI सलाह उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
          : 'The AI advisor is unavailable right now. Please try again shortly.');
    } finally {
      setIsSending(false);
    }

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
  };
  
  const handleNewChat = () => {
    dispatch({ type: 'CREATE_NEW_CHAT' });
    setShowHistory(false);
    setShowMenu(false);
  };
  
  const handleSelectSession = (sessionId: string) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: sessionId });
    setShowHistory(false);
  };
  
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'hi' ? 'यह बातचीत मिटा दें?' : 'Delete this conversation?')) {
      dispatch({ type: 'DELETE_CHAT', payload: sessionId });
    }
  };
  
  // Show history view
  if (showHistory) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-border">
          <button 
            onClick={() => setShowHistory(false)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={24} className="text-text" />
          </button>
          <h1 className="text-section-title text-text flex-1">
            {lang === 'hi' ? 'बातचीत इतिहास' : 'Chat History'}
          </h1>
        </div>
        
        <div className="flex-1 scroll-area px-5 py-4">
          {state.chatSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-body-lg text-text-secondary mb-2">
                {lang === 'hi' ? 'कोई बातचीत नहीं' : 'No conversations yet'}
              </p>
              <p className="text-body text-text-secondary">
                {lang === 'hi' ? 'नई बातचीत शुरू करें' : 'Start a new conversation'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`card w-full text-left flex items-center gap-4 p-4 transition-all active:scale-98 ${
                    session.id === state.activeSessionId ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-text truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={14} className="text-text-secondary" />
                      <p className="text-small text-text-secondary">
                        {formatDate(session.createdAt, lang)}
                      </p>
                      <span className="text-small text-text-secondary">•</span>
                      <p className="text-small text-text-secondary">
                        {session.messages.length} {lang === 'hi' ? 'संदेश' : 'messages'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-50"
                  >
                    <Trash2 size={18} className="text-problem" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-5 py-4 border-t border-border">
          <button onClick={handleNewChat} className="btn-primary">
            <Plus size={20} />
            {lang === 'hi' ? 'नई बातचीत' : 'New Chat'}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <h1 className="text-section-title text-text">{t('askTitle', lang)}</h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <MoreVertical size={24} className="text-text" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-14 bg-card rounded-xl shadow-lg border border-border z-50 min-w-[200px]">
                <button
                  onClick={() => {
                    setShowHistory(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-body text-text hover:bg-bg rounded-t-xl flex items-center gap-3"
                >
                  <Clock size={20} className="text-text-secondary" />
                  {lang === 'hi' ? 'बातचीत इतिहास' : 'Chat History'}
                </button>
                <button
                  onClick={() => {
                    handleNewChat();
                  }}
                  className="w-full px-4 py-3 text-left text-body text-text hover:bg-bg flex items-center gap-3"
                >
                  <Plus size={20} className="text-text-secondary" />
                  {lang === 'hi' ? 'नई बातचीत' : 'New Chat'}
                </button>
                {state.chatSessions.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(lang === 'hi' ? 'सारी बातचीत मिटा दें?' : 'Clear all chat history?')) {
                        dispatch({ type: 'CLEAR_CHAT' });
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-body text-problem hover:bg-red-50 rounded-b-xl flex items-center gap-3"
                  >
                    <Trash2 size={20} />
                    {lang === 'hi' ? 'सब मिटाएँ' : 'Clear All'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 scroll-area px-5 py-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🤝</div>
            <p className="text-body-lg text-text-secondary mb-2">
              {lang === 'hi' ? 'अपनी दुकान के बारे में कुछ भी पूछें' : 'Ask anything about your shop'}
            </p>
          </div>
        )}
        
        {/* Suggested questions */}
        {messages.length === 0 && (
          <div className="space-y-3 mb-4">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="card w-full text-left flex items-center gap-3 h-14 px-4 hover:bg-green-50 transition-colors"
              >
                <span className="text-primary text-xl flex-shrink-0">💬</span>
                <span className="text-text font-medium text-body truncate">{q}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Chat messages */}
        {messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`mb-4 animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                <p className="text-body">{msg.content}</p>
              </div>
            ) : (
              <div className="max-w-[90%]">
                <div className="card">
                  <p className="text-text whitespace-pre-line text-body leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Input area */}
      <div className="px-5 pb-4 pt-3 border-t border-border bg-bg">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('askPlaceholder', lang)}
            className="input-field flex-1 text-body"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
