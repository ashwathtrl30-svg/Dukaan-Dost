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
  return /\bhow to\b|\bhow do\b|\bhow can\b|\bhow should\b|\bwhat should\b|\bwhat to\b|\bkaise\b|\bkya karu\b|\bkya karen\b|\bkaise karu\b|कैसे करें|क्या करूँ|क्या करूं|\bhow to handle\b|\bhow to deal\b|\bhow to manage\b|\bhow to attract\b|\bhow to compete\b|\bhow to train\b|\bhow to prepare\b|\bhow to reduce\b|\bhow to improve\b|\bhow to convince\b|\bhow to negotiate\b|\bhow to stop\b|\bhow to avoid\b|\bhow to start\b|\btips for\b|\badvice for\b|\bsuggest\b|\bsuggestion\b|\bshould i\b|\bwhat if\b|\bwhat is the best\b|\bbest way\b|\bstrategies\b|\bsteps to\b|\bways to\b|\bguide\b|\bhelp me\b|\bconvinced\b|\bpersuade\b|\bnegotiate\b|\brent\b|\blandlord\b|\bowner\b|\bsupplier\b|\bstaff\b|\bemployee\b|\bcustomer\b|\bcompetition\b|\bmarketing\b|\badvertise\b|\bdisplay\b|\barrange\b|\borganize\b|\bsave money\b|\bcut costs\b|\bincrease sales\b|\bbetter business\b|\bgrow business\b|\bsuccess\b/.test(q);
}

// Main AI response generator - uses actual data from state
function generateResponse(question: string, state: any, lang: string): string {
  const q = question.toLowerCase().trim();
  const todaySales = getTodaySales(state.sales);
  const todayExpenses = getTodayExpenses(state.expenses);
  const todayProfit = todaySales - todayExpenses;
  const totalUdhaar = getTotalUdhaar(state.udhaar);
  const today = getTodayStr();
  const shopType = state.shopProfile.shopType;
  
  // ===== PRIORITY 1: GREETINGS & THANK YOU (always check first) =====
  if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q.includes('नमस्ते') || q.includes('हैलो') || q.includes('hey') || q === 'hlo' || q === 'hii') {
    return lang === 'hi'
      ? 'नमस्ते! 🙏 मैं दुकानदोस्त हूँ। आप अपनी दुकान के बारे में कुछ भी पूछ सकते हैं:\n\n• "आज की बिक्री कितनी?"\n• "मुनाफ़ा कितना हुआ?"\n• "किसने उधार लिया?"\n• "ग्राहक मोलभाव करें तो क्या करूँ?"\n• "नए ग्राहक कैसे लाएं?"'
      : 'Namaste! 🙏 I\'m DukaanDost. You can ask me anything about your shop:\n\n• "What are today\'s sales?"\n• "How much profit did I make?"\n• "Who owes me money?"\n• "How to handle bargaining customers?"\n• "How to attract more customers?"';
  }
  
  if (q.includes('thank') || q.includes('shukriya') || q.includes('धन्यवाद') || q.includes('शुक्रिया') || q.includes('thanks')) {
    return lang === 'hi'
      ? 'आपका स्वागत है! 😊 और कुछ पूछना हो तो बेझिझक पूछें।'
      : 'You\'re welcome! 😊 Feel free to ask anything else.';
  }
  
  // ===== PRIORITY 2: ADVICE QUESTIONS → Knowledge Base FIRST =====
  // If the question is seeking business advice, check knowledge base BEFORE data queries
  if (isAdviceQuestion(q)) {
    const knowledgeEntry = findKnowledgeEntry(question);
    if (knowledgeEntry) {
      return lang === 'hi' ? knowledgeEntry.responseHi : knowledgeEntry.responseEn;
    }
    // If no exact match in knowledge base but it's clearly an advice question,
    // give a helpful generic response instead of showing data
    if (lang === 'hi') {
      return `यह एक अच्छा सवाल है! 🤔\n\nइस विषय पर मेरे पास अभी विशिष्ट सलाह नहीं है, लेकिन आप मुझसे ये पूछ सकते हैं:\n\n• "ग्राहक मोलभाव करें तो क्या करूँ?"\n• "नए ग्राहक कैसे लाएं?"\n• "स्टॉक कैसे मैनेज करें?"\n• "स्टाफ को कैसे प्रशिक्षित करें?"\n• "प्रतिस्पर्धा कैसे करें?"\n• "उधार कैसे वसूलें?"\n• "त्योहार की तैयारी कैसे करें?"\n\nया अपना सवाल थोड़ा और विस्तार से पूछें।`;
    }
    return `That's a good question! 🤔\n\nI don't have specific advice on this topic yet, but you can ask me:\n\n• "How to handle bargaining customers?"\n• "How to attract more customers?"\n• "How to manage inventory?"\n• "How to train staff?"\n• "How to compete with other shops?"\n• "How to collect udhaar?"\n• "How to prepare for festivals?"\n\nOr try rephrasing your question with more details.`;
  }
  
  // ===== TODAY'S SALES =====
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
      let response = `आज की कुल बिक्री: **₹${fmt(todaySales)}**\n\n(आपके ${todaySaleEntries.length} एंट्री के आधार पर)`;
      if (cashSales > 0 || upiSales > 0) {
        response += `\n\n• नकद: ₹${fmt(cashSales)}`;
        response += `\n• UPI: ₹${fmt(upiSales)}`;
      }
      return response;
    }
    let response = `Today's total sales: **₹${fmt(todaySales)}**\n\n(Based on your ${todaySaleEntries.length} ${todaySaleEntries.length === 1 ? 'entry' : 'entries'})`;
    if (cashSales > 0 || upiSales > 0) {
      response += `\n\n• Cash: ₹${fmt(cashSales)}`;
      response += `\n• UPI: ₹${fmt(upiSales)}`;
    }
    return response;
  }
  
  // ===== TODAY'S EXPENSE =====
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
      let response = `आज का कुल खर्च: **₹${fmt(todayExpenses)}**\n\n(आपके ${todayExpenseEntries.length} एंट्री के आधार पर)`;
      Object.entries(byCategory).forEach(([cat, amt]) => {
        response += `\n• ${t(`ec_${cat}` as any, 'hi')}: ₹${fmt(amt as number)}`;
      });
      return response;
    }
    let response = `Today's total expenses: **₹${fmt(todayExpenses)}**\n\n(Based on your ${todayExpenseEntries.length} ${todayExpenseEntries.length === 1 ? 'entry' : 'entries'})`;
    Object.entries(byCategory).forEach(([cat, amt]) => {
      response += `\n• ${t(`ec_${cat}` as any, 'en')}: ₹${fmt(amt as number)}`;
    });
    return response;
  }
  
  // ===== TODAY'S PROFIT % =====
  if (isTodayQuestion(q) && isProfitPercentQuestion(q) && isProfitQuestion(q)) {
    if (todaySales === 0) {
      return lang === 'hi'
        ? 'आज की बिक्री का डेटा नहीं है। पहले बिक्री डालें, तब मैं मुनाफ़ा प्रतिशत बता पाऊँगा।'
        : 'No sales data for today yet. Add sales first, then I can calculate profit %.';
    }
    const profitPercent = Math.round((todayProfit / todaySales) * 100);
    if (lang === 'hi') {
      return `आज का मुनाफ़ा प्रतिशत: **${profitPercent}%**\n\n• बिक्री: ₹${fmt(todaySales)}\n• खर्च: ₹${fmt(todayExpenses)}\n• मुनाफ़ा: ₹${fmt(todayProfit)}\n\n(आपके आज के डेटा के आधार पर)`;
    }
    return `Today's profit %: **${profitPercent}%**\n\n• Sales: ₹${fmt(todaySales)}\n• Expenses: ₹${fmt(todayExpenses)}\n• Profit: ₹${fmt(todayProfit)}\n\n(Based on your data for today)`;
  }
  
  // ===== TODAY'S PROFIT =====
  if (isTodayQuestion(q) && isProfitQuestion(q)) {
    if (todaySales === 0 && todayExpenses === 0) {
      return lang === 'hi'
        ? 'आज की बिक्री या खर्च का डेटा नहीं है। पहले दोनों डालें, तब मैं मुनाफ़ा बता पाऊँगा।'
        : 'No sales or expense data for today yet. Add both first, then I can tell you your profit.';
    }
    if (todaySales === 0) {
      return lang === 'hi'
        ? 'आज की बिक्री नहीं डाली गई। पहले बिक्री डालें।'
        : 'No sales added for today. Please add sales first.';
    }
    if (todayExpenses === 0) {
      if (lang === 'hi') {
        return `आज की बिक्री: ₹${fmt(todaySales)}\n\nआज का खर्च नहीं डाला गया, इसलिए मुनाफ़ा सटीक नहीं बता सकता। खर्च डालें तो सही मुनाफ़ा मिलेगा।`;
      }
      return `Today's sales: ₹${fmt(todaySales)}\n\nNo expenses added for today, so I can't calculate accurate profit. Add expenses to see the real profit.`;
    }
    if (lang === 'hi') {
      return `आज का मुनाफ़ा: **₹${fmt(todayProfit)}**\n\n• बिक्री: ₹${fmt(todaySales)}\n• खर्च: ₹${fmt(todayExpenses)}\n\n(आपके आज के डेटा के आधार पर)`;
    }
    return `Today's profit: **₹${fmt(todayProfit)}**\n\n• Sales: ₹${fmt(todaySales)}\n• Expenses: ₹${fmt(todayExpenses)}\n\n(Based on your data for today)`;
  }
  
  // ===== TODAY'S UDHAAR =====
  if (isTodayQuestion(q) && isUdhaarQuestion(q)) {
    const todayUdhaar = state.udhaar.filter((u: any) => u.date === today && !u.paid);
    if (todayUdhaar.length === 0) {
      return lang === 'hi'
        ? 'आज का कोई उधार नहीं डाला गया।'
        : 'No udhaar entries for today.';
    }
    const todayUdhaarTotal = todayUdhaar.reduce((sum: number, u: any) => sum + u.amount, 0);
    if (lang === 'hi') {
      let response = `आज का कुल उधार: **₹${fmt(todayUdhaarTotal)}**\n\n(${todayUdhaar.length} ग्राहक):`;
      todayUdhaar.forEach((u: any) => {
        response += `\n• ${u.customerName} — ₹${fmt(u.amount)}`;
      });
      return response;
    }
    let response = `Today's total udhaar: **₹${fmt(todayUdhaarTotal)}**\n\n(${todayUdhaar.length} ${todayUdhaar.length === 1 ? 'customer' : 'customers'}):`;
    todayUdhaar.forEach((u: any) => {
      response += `\n• ${u.customerName} — ₹${fmt(u.amount)}`;
    });
    return response;
  }
  
  // ===== WHO OWES ME (UDHAAR LIST) =====
  if (isWhoOwesQuestion(q) || (isUdhaarQuestion(q) && (q.includes('who') || q.includes('कौन') || q.includes('kisne') || q.includes('किसने')))) {
    const unpaid = state.udhaar.filter((u: any) => !u.paid);
    if (unpaid.length === 0) {
      return lang === 'hi'
        ? 'अभी कोई उधार बाकी नहीं है! बहुत बढ़िया। 🎉'
        : 'No pending udhaar right now! Great job. 🎉';
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
  
  // ===== TOTAL UDHAAR =====
  if (isUdhaarQuestion(q)) {
    if (state.udhaar.length === 0) {
      return lang === 'hi'
        ? 'अभी कोई उधार दर्ज नहीं है। उधार डालने के लिए होम स्क्रीन पर "उधार" बटन दबाएँ।'
        : 'No udhaar entries yet. Tap "Udhaar" on the home screen to start tracking.';
    }
    const unpaid = state.udhaar.filter((u: any) => !u.paid);
    if (lang === 'hi') {
      return `कुल उधार बाकी: **₹${fmt(totalUdhaar)}**\n\n• बाकी ग्राहक: ${unpaid.length}\n• कुल एंट्री: ${state.udhaar.length}\n\n(आपके डेटा के आधार पर)`;
    }
    return `Total udhaar pending: **₹${fmt(totalUdhaar)}**\n\n• Pending customers: ${unpaid.length}\n• Total entries: ${state.udhaar.length}\n\n(Based on your data)`;
  }
  
  // ===== WEEK SALES =====
  if (isWeekQuestion(q) && isSalesQuestion(q)) {
    const thisWeekSales = getWeekSales(state.sales, 0);
    if (thisWeekSales === 0) {
      return lang === 'hi'
        ? 'इस हफ़्ते की कोई बिक्री नहीं डाली गई।'
        : 'No sales added for this week yet.';
    }
    const lastWeekSales = getWeekSales(state.sales, 1);
    const diff = thisWeekSales - lastWeekSales;
    if (lang === 'hi') {
      let response = `इस हफ़्ते की कुल बिक्री: **₹${fmt(thisWeekSales)}**`;
      if (lastWeekSales > 0) {
        response += `\n\nपिछले हफ़्ते: ₹${fmt(lastWeekSales)}`;
        response += diff >= 0 
          ? `\n📈 इस हफ़्ते ₹${fmt(diff)} ज़्यादा`
          : `\n📉 इस हफ़्ते ₹${fmt(Math.abs(diff))} कम`;
      }
      return response;
    }
    let response = `This week's total sales: **₹${fmt(thisWeekSales)}**`;
    if (lastWeekSales > 0) {
      response += `\n\nLast week: ₹${fmt(lastWeekSales)}`;
      response += diff >= 0 
        ? `\n📈 ₹${fmt(diff)} more this week`
        : `\n📉 ₹${fmt(Math.abs(diff))} less this week`;
    }
    return response;
  }
  
  // ===== MONTH SALES =====
  if (isMonthQuestion(q) && isSalesQuestion(q)) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthSales = state.sales.filter((s: any) => s.date >= monthStart).reduce((sum: number, s: any) => sum + s.amount, 0);
    if (monthSales === 0) {
      return lang === 'hi'
        ? 'इस महीने की कोई बिक्री नहीं डाली गई।'
        : 'No sales added for this month yet.';
    }
    if (lang === 'hi') {
      return `इस महीने की कुल बिक्री: **₹${fmt(monthSales)}**\n\n(आपके डेटा के आधार पर)`;
    }
    return `This month's total sales: **₹${fmt(monthSales)}**\n\n(Based on your data)`;
  }
  
  // ===== GENERAL PROFIT QUESTION =====
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
      return `कुल हिसाब (आपके सभी डेटा के आधार पर):\n\n• कुल बिक्री: ₹${fmt(totalSales)}\n• कुल खर्च: ₹${fmt(totalExpenses)}\n• **कुल मुनाफ़ा: ₹${fmt(totalProfit)}**\n• मुनाफ़ा प्रतिशत: ${profitPercent}%`;
    }
    return `Overall summary (based on all your data):\n\n• Total sales: ₹${fmt(totalSales)}\n• Total expenses: ₹${fmt(totalExpenses)}\n• **Total profit: ₹${fmt(totalProfit)}**\n• Profit %: ${profitPercent}%`;
  }
  
  // ===== GENERAL SALES QUESTION =====
  if (isSalesQuestion(q)) {
    if (state.sales.length === 0) {
      return lang === 'hi'
        ? 'अभी कोई बिक्री का डेटा नहीं है। बिक्री डालने के लिए होम स्क्रीन पर "बिक्री" बटन दबाएँ।'
        : 'No sales data yet. Tap "Sale" on the home screen to start tracking.';
    }
    const totalSales = state.sales.reduce((sum: number, s: any) => sum + s.amount, 0);
    if (lang === 'hi') {
      return `कुल बिक्री (आपके ${state.sales.length} एंट्री के आधार पर): **₹${fmt(totalSales)}**`;
    }
    return `Total sales (based on your ${state.sales.length} ${state.sales.length === 1 ? 'entry' : 'entries'}): **₹${fmt(totalSales)}**`;
  }
  
  // ===== GENERAL EXPENSE QUESTION =====
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
      let response = `कुल खर्च (आपके ${state.expenses.length} एंट्री के आधार पर): **₹${fmt(totalExpenses)}**`;
      if (topCategory) {
        response += `\n\nसबसे बड़ा खर्च: ${t(`ec_${topCategory[0]}` as any, 'hi')} — ₹${fmt(topCategory[1])}`;
      }
      return response;
    }
    let response = `Total expenses (based on your ${state.expenses.length} ${state.expenses.length === 1 ? 'entry' : 'entries'}): **₹${fmt(totalExpenses)}**`;
    if (topCategory) {
      response += `\n\nBiggest expense: ${t(`ec_${topCategory[0]}` as any, 'en')} — ₹${fmt(topCategory[1])}`;
    }
    return response;
  }
  
  // ===== ELECTRICITY / COST QUESTIONS =====
  if (q.includes('electricity') || q.includes('बिजली') || q.includes('bill') || q.includes('बिल')) {
    if (lang === 'hi') {
      return 'बिजली का बिल कम करने के उपाय:\n\n1. LED बल्ब लगाएँ — 70% कम बिजली लगती है\n2. फ्रिज की कॉइल साफ़ रखें\n3. बिना ज़रूरत पंखे/लाइट बंद करें\n4. स्टार रेटिंग वाले उपकरण लें\n5. दुकान बंद करते समय सब स्विच ऑफ़ करें\n\nएक महीने में 15-20% बिल कम हो सकता है।';
    }
    return 'Ways to reduce electricity bill:\n\n1. Use LED bulbs — 70% less power\n2. Clean fridge coils regularly\n3. Switch off fans/lights when not needed\n4. Buy star-rated appliances\n5. Turn off all switches when closing shop\n\nYou could save 15-20% on your bill each month.';
  }
  
  // ===== FESTIVAL QUESTIONS =====
  if (q.includes('festival') || q.includes('त्योहार') || q.includes('diwali') || q.includes('होली')) {
    if (lang === 'hi') {
      return 'आने वाले त्योहारों के लिए तैयारी:\n\n• दिवाली: मिठाई, सूखे मेवे, सजावट का सामान, पटाखे\n• होली: गुलाल, रंग, मिठाई, ठंडाई सामग्री\n\nसुझाव: त्योहार से 2 हफ़्ते पहले स्टॉक शुरू करें। ज़्यादा मुनाफ़ा रखें क्योंकि माँग ज़्यादा होती है। 20-30% ज़्यादा स्टॉक रखें आम दिनों से।';
    }
    return 'Preparing for upcoming festivals:\n\n• Diwali: Sweets, dry fruits, decorations, crackers\n• Holi: Colours, sweets, thandai ingredients\n\nTip: Start stocking 2 weeks before the festival. Keep higher margins as demand is high. Stock 20-30% more than usual days.';
  }
  
  // ===== KNOWLEDGE BASE: GENERAL BUSINESS ADVICE =====
  // Check knowledge base for any remaining business advice questions
  const knowledgeEntry = findKnowledgeEntry(question);
  if (knowledgeEntry) {
    return lang === 'hi' ? knowledgeEntry.responseHi : knowledgeEntry.responseEn;
  }
  
  // ===== DEFAULT: NOT ENOUGH DATA / UNSURE =====
  const dataKeywords = /sales|expense|profit|udhaar|stock|bikri|kharch|munafa|udhaar|बिक्री|खर्च|मुनाफ़ा|उधार/;
  if (dataKeywords.test(q)) {
    return lang === 'hi'
      ? 'इस सवाल का जवाब देने के लिए पर्याप्त डेटा नहीं है।\n\nकृपया पहले बिक्री, खर्च और उधार की एंट्री डालें, फिर यह सवाल पूछें।'
      : 'I don\'t have enough data to answer this question.\n\nPlease add sales, expenses, and udhaar entries first, then ask again.';
  }
  
  // General fallback with helpful suggestions
  if (lang === 'hi') {
    return `मैं आपकी मदद करना चाहता हूँ। आप मुझसे ये पूछ सकते हैं:\n\n**आपकी दुकान का डेटा:**\n• "आज की बिक्री कितनी?"\n• "मुनाफ़ा कितना हुआ?"\n• "किसने उधार लिया है?"\n\n**व्यापार सलाह:**\n• "ग्राहक मोलभाव करें तो क्या करूँ?"\n• "नए ग्राहक कैसे लाएं?"\n• "स्टॉक कैसे मैनेज करें?"\n• "स्टाफ को कैसे प्रशिक्षित करें?"\n• "त्योहार की तैयारी कैसे करें?"\n\nआपका सवाल थोड़ा और स्पष्ट करें तो मैं बेहतर मदद कर सकता हूँ।`;
  }
  return `I'd like to help you. You can ask me:\n\n**Your shop data:**\n• "What are today's sales?"\n• "How much profit did I make?"\n• "Who owes me money?"\n\n**Business advice:**\n• "How to handle bargaining customers?"\n• "How to attract more customers?"\n• "How to manage inventory?"\n• "How to train staff?"\n• "How to prepare for festivals?"\n\nPlease rephrase your question more specifically so I can help you better.`;
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
  
  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message) return;
    
    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    setInput('');
    
    // Generate response after a short delay
    setTimeout(() => {
      const response = generateResponse(message, state, lang);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
    }, 800);
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
            disabled={!input.trim()}
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
