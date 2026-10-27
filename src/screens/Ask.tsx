import React, { useState, useRef, useEffect } from 'react';
import { useStore, formatRupee, getTodaySales, getTodayExpenses, getTotalUdhaar, generateId, getWeekSales } from '../store';
import { t } from '../i18n';
import { ChatMessage } from '../types';
import { Send } from 'lucide-react';

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

// Helper: detect sales-related questions
function isSalesQuestion(q: string): boolean {
  return /sale|bikr|बिक्री|बिका|bika|बेचा|becha|selling|कितना बिका|how much sold|revenue/.test(q);
}

// Helper: detect expense-related questions
function isExpenseQuestion(q: string): boolean {
  return /expense|kharch|खर्च|ख़र्च|खर्चा|kharcha|spend|spending|कितना खर्च|how much spent/.test(q);
}

// Helper: detect profit questions
function isProfitQuestion(q: string): boolean {
  return /profit|munafa|मुनाफ़ा|मुनाफा|kama|कमाई|कमाया|earn|earning|net/.test(q);
}

// Helper: detect profit % questions
function isProfitPercentQuestion(q: string): boolean {
  return /percent|%|प्रतिशत|प्रति सौ|margin|कितना प्रतिशत|how much percent|profit %/.test(q);
}

// Helper: detect udhaar questions
function isUdhaarQuestion(q: string): boolean {
  return /udhaar|उधार|credit|owe|owed|किसने|kisne|देना|dena|बाकी|baki|pending/.test(q);
}

// Helper: detect "who owes" questions
function isWhoOwesQuestion(q: string): boolean {
  return /who|कौन|kisne|किसने|kab देंगे|kab denge|when pay|due/.test(q) && isUdhaarQuestion(q);
}

// Helper: detect "best day" questions
function isBestDayQuestion(q: string): boolean {
  return /best|अच्छा|badhiya|best day|सबसे अच्छा|top day/.test(q);
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
    // Group by category
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
  
  // ===== GENERAL PROFIT QUESTION (not today-specific) =====
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
    // Group by category
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
  
  // ===== GREETINGS =====
  if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q.includes('नमस्ते') || q.includes('हैलो') || q.includes('hey')) {
    return lang === 'hi'
      ? 'नमस्ते! 🙏 मैं दुकानदोस्त हूँ। आप अपनी दुकान के बारे में कुछ भी पूछ सकते हैं:\n\n• "आज की बिक्री कितनी?"\n• "मुनाफ़ा कितना हुआ?"\n• "किसने उधार लिया?"\n• "बिजली का बिल कैसे कम करें?"'
      : 'Namaste! 🙏 I\'m DukaanDost. You can ask me anything about your shop:\n\n• "What are today\'s sales?"\n• "How much profit did I make?"\n• "Who owes me money?"\n• "How to reduce electricity bill?"';
  }
  
  // ===== THANK YOU =====
  if (q.includes('thank') || q.includes('shukriya') || q.includes('धन्यवाद') || q.includes('शुक्रिया')) {
    return lang === 'hi'
      ? 'आपका स्वागत है! 😊 और कुछ पूछना हो तो बेझिझक पूछें।'
      : 'You\'re welcome! 😊 Feel free to ask anything else.';
  }
  
  // ===== DEFAULT: NOT ENOUGH DATA / UNSURE =====
  // Check if the question seems to be about the user's data but we can't answer
  const dataKeywords = /sales|expense|profit|udhaar|stock|bikri|kharch|munafa|udhaar|बिक्री|खर्च|मुनाफ़ा|उधार/;
  if (dataKeywords.test(q)) {
    return lang === 'hi'
      ? 'इस सवाल का जवाब देने के लिए पर्याप्त डेटा नहीं है।\n\nकृपया पहले बिक्री, खर्च और उधार की एंट्री डालें, फिर यह सवाल पूछें।'
      : 'I don\'t have enough data to answer this question.\n\nPlease add sales, expenses, and udhaar entries first, then ask again.';
  }
  
  // General fallback
  if (lang === 'hi') {
    return `मैं यह सवाल समझ गया। आपके ${shopType ? t(`st_${shopType}` as any, 'hi') : 'दुकान'} के बारे में आप मुझसे ये पूछ सकते हैं:\n\n• "आज की बिक्री/खर्च/मुनाफ़ा"\n• "कितना उधार बाकी है"\n• "इस हफ़्ते कैसा रहा"\n• "बिजली का बिल कैसे कम करें"\n\nक्या आप कुछ और ख़ास पूछना चाहते हैं?`;
  }
  return `I understand your question. For your ${shopType ? t(`st_${shopType}` as any, 'en') : 'shop'}, you can ask me things like:\n\n• "Today's sales/expense/profit"\n• "How much udhaar is pending"\n• "How was this week"\n• "How to reduce electricity bill"\n\nWould you like to ask something more specific?`;
}

// ============ ASK SCREEN ============
export function AskScreen() {
  const { state, dispatch } = useStore();
  const lang = state.language!;
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
  }, [state.chatHistory]);
  
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
  
  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-section-title text-text">{t('askTitle', lang)}</h1>
        {state.chatHistory.length > 0 && (
          <button
            onClick={() => {
              if (confirm(lang === 'hi' ? 'सारी बातचीत मिटा दें?' : 'Clear all chat history?')) {
                dispatch({ type: 'CLEAR_CHAT' });
              }
            }}
            className="text-small text-text-secondary px-3 py-2"
          >
            {lang === 'hi' ? 'मिटाएँ' : 'Clear'}
          </button>
        )}
      </div>
      
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 scroll-area px-5 py-2">
        {state.chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🤝</div>
            <p className="text-body text-text-secondary">
              {lang === 'hi' ? 'अपनी दुकान के बारे में कुछ भी पूछें' : 'Ask anything about your shop'}
            </p>
          </div>
        )}
        
        {/* Suggested questions */}
        {state.chatHistory.length === 0 && (
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
        {state.chatHistory.map((msg) => (
          <div key={msg.id} className={`mb-3 animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
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
      <div className="px-5 pb-4 pt-3 safe-bottom border-t border-border bg-bg">
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
