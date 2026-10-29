import React, { useState, useRef, useEffect } from 'react';
import { useStore, formatRupee, getToday, getTodaySales, getTodayExpenses, getTotalUdhaar, generateId, getWeekSales, getWeekExpenses } from '../store';
import { t } from '../i18n';
import { ChatMessage, ChatSession } from '../types';
import { Send, MoreVertical, Plus, ArrowLeft, Trash2, MessageCircle, Clock, Volume2, Square } from 'lucide-react';
import { findKnowledgeEntry } from '../knowledgeBase';
import { VoiceMicButton } from '../components/VoiceMicButton';
import { detectVoiceLanguage, speakText } from '../voice/speech';
import { getFestivalDateLabel, getFestivalName, getFestivalShopAdvice, getUpcomingFestivals } from '../festivals';

// Helper: get today's date string
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper: format number with Indian grouping
function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

// Remove common LaTeX math wrappers so answers display as ordinary text.
// In particular, "$56$" should render as "56", not look like USD.
function normalizeAIAnswer(answer: string): string {
  return answer
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$(\s*[+-]?\d+(?:,\d{3})*(?:\.\d+)?\s*)\$/g, '$1')
    .replace(/\\\(([\s\S]+?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]+?)\\\]/g, '$1')
    .trim();
}

// Helper: detect if question is about TODAY
function isTodayQuestion(q: string): boolean {
  return /today|aaj|आज|आजका|आज का|आजकी|आज की/.test(q);
}

// Hindi "kal" is treated as yesterday for historical shop-ledger questions.
function isYesterdayQuestion(q: string): boolean {
  return /yesterday|yesterday's|last day|kal|कल|बीते कल|पिछले दिन/.test(q);
}

function getYesterdayStr(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split('T')[0];
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
  const shopType = profile.shopType || 'other';

  details.push(`Shop type: ${t(`st_${shopType}` as any, 'en')}`);
  if (typeof profile.shopName === 'string' && profile.shopName.trim()) {
    details.push(`Shop name: ${profile.shopName.trim().slice(0, 80)}`);
  }
  if (typeof profile.city === 'string' && profile.city.trim()) {
    details.push(`City/area: ${profile.city.trim().slice(0, 80)}`);
  }
  if (profile.ownership) {
    details.push(`Premises: ${profile.ownership === 'rent' ? 'rented' : 'owned'}`);
  }
  const durationLabels: Record<string, string> = {
    under1: 'less than 1 year', '1to5': '1–5 years', '5to10': '5–10 years', over10: 'more than 10 years',
  };
  if (profile.duration && durationLabels[profile.duration]) details.push(`Business experience: ${durationLabels[profile.duration]}`);
  if (profile.monthlySales) details.push(`Monthly sales range: ${t(`ms_${profile.monthlySales}` as any, 'en')}`);
  if (Number.isInteger(profile.workers) && profile.workers > 0) details.push(`Workers: ${profile.workers}`);

  const creditLabels: Record<string, string> = {
    never: 'does not usually sell on credit', sometimes: 'sometimes sells on credit', often: 'frequently sells on credit',
  };
  if (profile.udhaarLevel && creditLabels[profile.udhaarLevel]) details.push(`Credit/udhaar pattern: ${creditLabels[profile.udhaarLevel]}`);

  const accountingLabels: Record<string, string> = {
    memory: 'tracks accounts from memory', notebook: 'uses a notebook', app: 'uses an app', nothing: 'does not currently use a regular method',
  };
  if (profile.accounting && accountingLabels[profile.accounting]) details.push(`Current record-keeping: ${accountingLabels[profile.accounting]}`);

  const worryLabels: Record<string, string> = {
    low_profit: 'improving profit', too_much_stock: 'slow-moving or excess stock', customers_not_paying: 'collecting customer payments',
    rising_costs: 'rising costs', competition: 'competition', no_time: 'saving time', dont_know: 'general business guidance',
  };
  if (Array.isArray(profile.worries) && profile.worries.length) {
    details.push(`Main business concerns: ${profile.worries.map((w: string) => worryLabels[w]).filter(Boolean).join(', ')}`);
  }

  details.push(
    'Personalization rules: Answer for this exact shop type and its real operating model. Do not give kirana/grocery/food-stock advice to a salon, tailor, medical shop, or another unrelated business. For salons and tailors, focus on services, bookings, capacity, supplies and repeat customers; for food businesses, focus on menu or produce demand, freshness and waste; for a medical shop, focus on compliant inventory, expiry and customer service; for other retailers, focus on relevant products and sales history. Use the profile details above where relevant. Do not invent sales, inventory, or customer data; clearly separate suggestions from facts.'
  );

  return details.join("\n");
}


// Derive seasonal context from the same future-only festival calendar used by Tools.
function getTimeContext(): string {
  const nextFestival = getUpcomingFestivals(new Date(), 2)[0];
  if (nextFestival) {
    return `Upcoming Indian festival: ${getFestivalName(nextFestival, 'en')} on ${getFestivalDateLabel(nextFestival.date, 'en')}.`;
  }
  const month = new Date().getMonth();
  if (month === 5 || month === 6) return 'Monsoon season';
  if (month === 3 || month === 4) return 'Summer season';
  if (month === 10 || month === 11) return 'Winter season';
  return 'Regular season';
}


function getTrackedQuantitySummary(sales: any[], lang: string): string {
  const today = getToday();
  const startDate = new Date(today + 'T12:00:00');
  startDate.setDate(startDate.getDate() - 6);
  const start = startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0');
  const byItem = new Map<string, { name: string; quantity: number }>();
  sales.forEach((sale) => {
    if (typeof sale.itemName !== 'string' || !sale.itemName.trim() || sale.date < start || sale.date > today) return;
    const quantity = Number(sale.quantity);
    // Older records do not contain quantity; do not invent it for this summary.
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const name = sale.itemName.trim().replace(/\s+/g, ' ');
    const key = name.toLocaleLowerCase();
    const item = byItem.get(key) || { name, quantity: 0 };
    item.quantity += quantity;
    byItem.set(key, item);
  });
  const ranked = [...byItem.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 3);
  if (!ranked.length) return '';
  const total = ranked.reduce((sum, item) => sum + item.quantity, 0);
  const list = ranked.map(item => item.name + ': ' + (Number.isInteger(item.quantity) ? item.quantity : item.quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 }))).join(', ');
  return lang === 'hi'
    ? '\n\n**पिछले 7 दिनों की दर्ज मात्रा (शीर्ष सामान/सेवाएँ):** ' + list + '। इन शीर्ष चीज़ों की कुल दर्ज मात्रा ' + total + ' यूनिट है। केवल मात्रा दर्ज वाली एंट्री शामिल हैं।'
    : '\n\n**Tracked quantities, last 7 days (top items/services):** ' + list + '. Total for these top items is ' + total + ' units. Only entries with a recorded quantity are included.';
}

function getShopInventoryAdvice(shopType: string | null | undefined, lang: string): string {
  const hi = lang === 'hi';
  const advice: Record<string, { en: string; hi: string }> = {
    salon: {
      en: 'For your salon, track shampoo, conditioner, colour/treatment products and hygiene consumables used by your most-booked services. Check what is on hand, review product expiry and replenish based on bookings and recent use—not grocery or general retail stock.',
      hi: 'आपके सैलून में सबसे ज़्यादा बुक होने वाली सेवाओं में इस्तेमाल होने वाला शैम्पू, कंडीशनर, कलर/ट्रीटमेंट और सफ़ाई का सामान दर्ज करें। मौजूदा मात्रा और एक्सपायरी जाँचें, फिर बुकिंग व हाल के इस्तेमाल के आधार पर भरें—किराना या सामान्य रिटेल स्टॉक के आधार पर नहीं।',
    },
    tailor: {
      en: 'For your tailoring business, track thread, lining, zips, hooks, buttons and fabric linked to confirmed jobs. Compare supplies on hand with pending orders before buying more; avoid buying fabric for unconfirmed demand.',
      hi: 'आपके सिलाई कारोबार में धागा, अस्तर, ज़िप, हुक, बटन और पक्के ऑर्डर से जुड़ा कपड़ा दर्ज करें। खरीदने से पहले लंबित काम और उपलब्ध सामग्री मिलाएँ; बिना पक्के ऑर्डर के कपड़ा न खरीदें।',
    },
    medical: {
      en: 'For your medical shop, review compliant, fast-moving health essentials and basic first-aid items, monitor expiry and storage, and follow applicable pharmacy requirements. Replenish based on real demand rather than buying every category in bulk.',
      hi: 'आपकी मेडिकल दुकान में नियमों के अनुसार रखे जाने वाले तेज़ बिकने वाले स्वास्थ्य संबंधी ज़रूरी सामान और प्राथमिक उपचार की चीज़ें देखें। एक्सपायरी व स्टोरेज जाँचें और लागू फार्मेसी नियमों का पालन करें। हर श्रेणी का थोक स्टॉक न लें।',
    },
    bakery: {
      en: 'For your bakery, track ingredients, food-safe packaging and the cakes, cookies or snacks customers order most. Plan perishables against confirmed orders and recent sales to reduce waste.',
      hi: 'आपकी बेकरी में सामग्री, फूड-सेफ पैकिंग और लोकप्रिय केक, कुकीज़ या स्नैक्स की माँग दर्ज करें। बर्बादी घटाने के लिए खराब होने वाली सामग्री पक्के ऑर्डर और हाल की बिक्री देखकर लें।',
    },
    sweet: {
      en: 'For your sweets business, track popular varieties, gift-box sizes, ingredients and packaging. Make fresh batches in manageable quantities and use advance orders to guide preparation.',
      hi: 'आपकी मिठाई की दुकान में लोकप्रिय मिठाइयाँ, गिफ्ट बॉक्स के आकार, सामग्री और पैकिंग की माँग दर्ज करें। सीमित मात्रा में ताज़ा बैच बनाएँ और एडवांस ऑर्डर देखकर तैयारी करें।',
    },
    restaurant: {
      en: 'For your restaurant, review ingredient use and demand by dish, including confirmed orders. Keep perishables fresh, record waste and adjust prep quantities rather than ordering generic retail products.',
      hi: 'आपके रेस्टोरेंट में हर डिश की माँग और सामग्री का इस्तेमाल देखें, जिसमें पक्के ऑर्डर भी शामिल हों। ताज़ी सामग्री रखें, बर्बादी दर्ज करें और सामान्य रिटेल सामान के बजाय तैयारी की मात्रा माँग के हिसाब से बदलें।',
    },
    tea: {
      en: 'For your tea business, track tea, milk, sugar, cups and your most-requested snack pairings. Review peak-hour demand and replenish perishables in smaller batches.',
      hi: 'आपकी चाय की दुकान में चाय, दूध, चीनी, कप और लोकप्रिय स्नैक्स की माँग दर्ज करें। व्यस्त घंटों की माँग देखें और जल्दी खराब होने वाली चीज़ें कम मात्रा में भरें।',
    },
    vegetable: {
      en: 'For your produce business, track fresh items by name and compare what sold with what was left or spoiled. Replenish in small, frequent lots to protect freshness and cash.',
      hi: 'आपके फल-सब्ज़ी कारोबार में हर ताज़ी चीज़ का नाम दर्ज करें और बिक्री की तुलना बचे या खराब हुए माल से करें। ताज़गी और नकद बचाने के लिए कम मात्रा में बार-बार खरीदें।',
    },
    kirana: {
      en: 'For your kirana shop, rank named staples, snacks and household essentials by recent sales. Check shelf stock first, then replenish proven fast movers in manageable quantities.',
      hi: 'आपकी किराना दुकान में नाम वाले राशन, स्नैक्स और घरेलू ज़रूरतों की हाल की बिक्री देखें। पहले शेल्फ़ का स्टॉक गिनें, फिर तेज़ बिकने वाला सामान उचित मात्रा में भरें।',
    },
    mobile: {
      en: 'For your mobile shop, track accessory names and compatible phone models. Replenish common cables, chargers, cases or protectors based on recent demand and exact compatibility.',
      hi: 'आपकी मोबाइल दुकान में एक्सेसरी और उनसे मेल खाने वाले फोन मॉडल का नाम दर्ज करें। हाल की माँग और सही मॉडल के आधार पर केबल, चार्जर, कवर या स्क्रीन प्रोटेक्टर भरें।',
    },
    hardware: {
      en: 'For your hardware shop, track fast-moving repair items and compatible electrical accessories. Check current stock and relevant safety/quality requirements before replenishing.',
      hi: 'आपकी हार्डवेयर दुकान में तेज़ बिकने वाला मरम्मत का सामान और सही मेल खाने वाली इलेक्ट्रिकल एक्सेसरी दर्ज करें। खरीदने से पहले मौजूदा स्टॉक और सुरक्षा/गुणवत्ता जाँचें।',
    },
    other: {
      en: 'Track the items or services specific to your business by name. Compare recent sales with what is on hand or pending, then replenish only proven demand.',
      hi: 'अपने कारोबार के अनुसार सामान या सेवाओं का नाम दर्ज करें। हाल की बिक्री की तुलना उपलब्ध स्टॉक या लंबित काम से करें और साबित माँग के अनुसार ही खरीदें।',
    },
  };
  return (advice[shopType || 'other'] || advice.other)[hi ? 'hi' : 'en'];
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
  
  const mentionsFestival = /festival|diwali|dhanteras|govatsa|vasu baras|govardhan|bhai dooj|chhath|tulsi vivah|vivah panchami|gita jayanti|dattatreya|guru nanak|christmas|karwa chauth|karva chauth|karwa|karva|ahoi|makar sankranti|pongal|vasant panchami|shivratri|holi|gudi padwa|ram navami|raksha bandhan|janmashtami|ganesh chaturthi|onam|navratri|dussehra|त्योहार|दिवाली|धनतेरस|गोवत्स द्वादशी|वसु बारस|गोवर्धन|भाई दूज|छठ|तुलसी विवाह|विवाह पंचमी|गीता जयंती|दत्तात्रेय|गुरु नानक|क्रिसमस|करवा चौथ|अहोई|मकर संक्रांति|पोंगल|बसंत पंचमी|महाशिवरात्रि|होली|गुड़ी पड़वा|राम नवमी|रक्षा बंधन|जन्माष्टमी|गणेश चतुर्थी|ओणम|नवरात्रि|दशहरा/u.test(q);
  const wantsFestivalPlan = mentionsFestival && (
    intent === 'planning' ||
    /\b(?:what should|what to|which items|what items|buy|keep ready|prepare|stock|festival plan|planning|tips|advice)\b|क्या रखें|क्या खरीदें|क्या खरीदना|तैयारी|कौन-सा सामान/u.test(q)
  );
  if (wantsFestivalPlan) {
    const upcoming = getUpcomingFestivals(new Date(), 2);
    const nameAliases: Array<{ idPart: string; pattern: RegExp }> = [
      { idPart: 'karwa-chauth', pattern: /karwa|karva|करवा चौथ/u },
      { idPart: 'ahoi-ashtami', pattern: /ahoi|अहोई/u },
      { idPart: 'dhanteras', pattern: /dhanteras|धनतेरस/u },
      { idPart: 'govatsa-dwadashi', pattern: /govatsa|vasu baras|गोवत्स द्वादशी|वसु बारस/u },
      { idPart: 'diwali', pattern: /diwali|deepavali|दिवाली|दीपावली/u },
      { idPart: 'govardhan-puja', pattern: /govardhan|गोवर्धन/u },
      { idPart: 'bhai-dooj', pattern: /bhai dooj|bhaiya dooj|भाई दूज/u },
      { idPart: 'chhath-puja', pattern: /chhath|छठ/u },
      { idPart: 'tulsi-vivah', pattern: /tulsi vivah|तुलसी विवाह/u },
      { idPart: 'vivah-panchami', pattern: /vivah panchami|विवाह पंचमी/u },
      { idPart: 'gita-jayanti', pattern: /gita jayanti|गीता जयंती/u },
      { idPart: 'dattatreya-jayanti', pattern: /dattatreya|दत्तात्रेय/u },
      { idPart: 'guru-nanak-jayanti', pattern: /guru nanak|गुरु नानक|kartik purnima|कार्तिक पूर्णिमा/u },
      { idPart: 'christmas', pattern: /christmas|क्रिसमस/u },
      { idPart: 'makar-sankranti', pattern: /makar sankranti|pongal|मकर संक्रांति|पोंगल/u },
      { idPart: 'vasant-panchami', pattern: /vasant panchami|बसंत पंचमी/u },
      { idPart: 'maha-shivratri', pattern: /shivratri|शिवरात्रि/u },
      { idPart: 'holi', pattern: /holi|होली/u },
      { idPart: 'gudi-padwa', pattern: /gudi padwa|ugadi|गुड़ी पड़वा|उगादी/u },
      { idPart: 'ram-navami', pattern: /ram navami|राम नवमी/u },
      { idPart: 'akshaya-tritiya', pattern: /akshaya tritiya|अक्षय तृतीया/u },
      { idPart: 'raksha-bandhan', pattern: /raksha bandhan|रक्षा बंधन/u },
      { idPart: 'janmashtami', pattern: /janmashtami|जन्माष्टमी/u },
      { idPart: 'ganesh-chaturthi', pattern: /ganesh chaturthi|गणेश चतुर्थी/u },
      { idPart: 'onam', pattern: /onam|ओणम/u },
      { idPart: 'navratri', pattern: /navratri|नवरात्रि/u },
      { idPart: 'dussehra', pattern: /dussehra|दशहरा/u },
    ];
    const alias = nameAliases.find((entry) => entry.pattern.test(q));
    const matchingFestival = alias ? upcoming.find((entry) => entry.id.includes(alias.idPart)) : undefined;
    if (alias && !matchingFestival) {
      return lang === 'hi'
        ? 'यह त्योहार अगले 2 महीनों की सूची में नहीं है। त्योहार की तैयारी के लिए होम के बजाय टूल्स में Festival Planner देखें और वहाँ दिख रहे आगामी त्योहार चुनें।'
        : 'That festival is not in the next 2 months. Open Tools → Festival Planner to see upcoming festivals and choose one that is still ahead.';
    }
    const festival = matchingFestival || upcoming[0];
    if (festival) {
      const advice = getFestivalShopAdvice(festival.id, shopType, lang === 'hi' ? 'hi' : 'en');
      const name = getFestivalName(festival, lang === 'hi' ? 'hi' : 'en');
      const date = getFestivalDateLabel(festival.date, lang === 'hi' ? 'hi' : 'en');
      return lang === 'hi'
        ? `आपकी दुकान के प्रकार के हिसाब से ${name} (${date}) की तैयारी:\n\n**क्या तैयार रखें**\n${advice.keepReady}\n\n**क्या दोबारा मँगाएँ**\n${advice.restock}\n\n**काम की सलाह**\n${advice.insight}`
        : `For your ${shopType ? t(`st_${shopType}` as any, 'en') : 'shop'}, prepare for ${name} (${date}) like this:\n\n**Keep ready**\n${advice.keepReady}\n\n**What to replenish**\n${advice.restock}\n\n**Useful insight**\n${advice.insight}`;
    }
  }

  // ===== BUSINESS ADVICE & PROBLEM SOLVING =====
  if (intent === 'business_advice' || intent === 'problem_solving' || intent === 'planning' || intent === 'comparison') {
    // First check knowledge base for specific advice
    const knowledgeEntry = findKnowledgeEntry(question);
    if (knowledgeEntry) {
      if (knowledgeEntry.category === 'inventory') {
        return getShopInventoryAdvice(shopType, lang) + getTrackedQuantitySummary(state.sales, lang);
      }
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
      
      const businessSpecificTip: Record<string, { en: string; hi: string }> = {
        salon: {
          en: 'For a salon, focus on appointment fill, repeat visits, service quality, hygiene supplies and the services customers request most.',
          hi: 'सैलून में अपॉइंटमेंट, दोबारा आने वाले ग्राहक, सेवा की गुणवत्ता, सफ़ाई का सामान और लोकप्रिय सेवाओं पर ध्यान दें।',
        },
        tailor: {
          en: 'For a tailoring business, focus on confirmed orders, fitting slots, on-time delivery, repeat customers and commonly used tailoring supplies.',
          hi: 'सिलाई कारोबार में पक्के ऑर्डर, फिटिंग स्लॉट, समय पर डिलीवरी, पुराने ग्राहक और आम सिलाई के सामान पर ध्यान दें।',
        },
        medical: {
          en: 'For a medical shop, prioritise compliant stock handling, expiry checks, reliable service and the health essentials customers regularly request.',
          hi: 'मेडिकल दुकान में नियमों के अनुसार स्टॉक, एक्सपायरी जाँच, भरोसेमंद सेवा और नियमित माँग वाले स्वास्थ्य संबंधी सामान पर ध्यान दें।',
        },
        restaurant: {
          en: 'For a restaurant, focus on reliable dishes, order timing, food freshness, customer feedback and reducing avoidable food waste.',
          hi: 'रेस्टोरेंट में भरोसेमंद व्यंजन, ऑर्डर का समय, ताज़ा खाना, ग्राहक प्रतिक्रिया और अनावश्यक बर्बादी घटाने पर ध्यान दें।',
        },
      };
      if (businessSpecificTip[shopType || '']) {
        const tip = businessSpecificTip[shopType || ''];
        personalized += lang === 'hi'
          ? `\n\n**आपके कारोबार के लिए**\n${tip.hi}`
          : `\n\n**For your business**\n${tip.en}`;
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
    // Yesterday's entries are calculated from the exact ledger date, not an AI guess.
    if (isYesterdayQuestion(q)) {
      const yesterday = getYesterdayStr();
      const yesterdaySales = state.sales.filter((entry: any) => entry.date === yesterday);
      const yesterdayExpenses = state.expenses.filter((entry: any) => entry.date === yesterday);
      const yesterdayUdhaar = state.udhaar.filter((entry: any) => entry.date === yesterday);
      const salesTotal = yesterdaySales.reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const expenseTotal = yesterdayExpenses.reduce((sum: number, entry: any) => sum + entry.amount, 0);

      if (isSalesQuestion(q)) {
        return yesterdaySales.length
          ? (lang === 'hi'
            ? 'कल की कुल बिक्री: ₹' + fmt(salesTotal) + ' (' + yesterdaySales.length + ' एंट्री)'
            : "Yesterday's total sales: ₹" + fmt(salesTotal) + ' (' + yesterdaySales.length + ' ' + (yesterdaySales.length === 1 ? 'entry' : 'entries') + ')')
          : (lang === 'hi' ? 'कल की कोई बिक्री दर्ज नहीं है। मैं अनुमान नहीं लगाऊँगा।' : 'No sales entries were recorded yesterday, so I cannot report a sales total.');
      }

      if (isExpenseQuestion(q)) {
        return yesterdayExpenses.length
          ? (lang === 'hi'
            ? 'कल का कुल खर्च: ₹' + fmt(expenseTotal) + ' (' + yesterdayExpenses.length + ' एंट्री)'
            : "Yesterday's total expenses: ₹" + fmt(expenseTotal) + ' (' + yesterdayExpenses.length + ' ' + (yesterdayExpenses.length === 1 ? 'entry' : 'entries') + ')')
          : (lang === 'hi' ? 'कल का कोई खर्च दर्ज नहीं है। मैं अनुमान नहीं लगाऊँगा।' : 'No expense entries were recorded yesterday, so I cannot report an expense total.');
      }

      if (isProfitQuestion(q)) {
        if (!yesterdaySales.length || !yesterdayExpenses.length) {
          return lang === 'hi'
            ? 'कल का सही मुनाफ़ा निकालने के लिए बिक्री और खर्च—दोनों की एंट्री चाहिए। उपलब्ध डेटा अधूरा है, इसलिए मैं अनुमान नहीं लगाऊँगा।'
            : 'I need both sales and expense entries for yesterday to calculate profit reliably. The available data is incomplete, so I will not guess.';
        }
        return lang === 'hi'
          ? 'कल का दर्ज मुनाफ़ा: ₹' + fmt(salesTotal - expenseTotal) + ' (बिक्री ₹' + fmt(salesTotal) + ', खर्च ₹' + fmt(expenseTotal) + ')'
          : "Yesterday's recorded profit: ₹" + fmt(salesTotal - expenseTotal) + ' (sales ₹' + fmt(salesTotal) + ', expenses ₹' + fmt(expenseTotal) + ')';
      }

      if (isUdhaarQuestion(q)) {
        const total = yesterdayUdhaar.reduce((sum: number, entry: any) => sum + entry.amount, 0);
        return yesterdayUdhaar.length
          ? (lang === 'hi'
            ? 'कल दर्ज उधार: ₹' + fmt(total) + ' (' + yesterdayUdhaar.length + ' एंट्री)'
            : "Udhaar recorded yesterday: ₹" + fmt(total) + ' (' + yesterdayUdhaar.length + ' ' + (yesterdayUdhaar.length === 1 ? 'entry' : 'entries') + ')')
          : (lang === 'hi' ? 'कल कोई उधार एंट्री दर्ज नहीं है।' : 'No udhaar entries were recorded yesterday.');
      }
    }
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
    
    // Week sales: respect the exact period the user asked for.
    if (isWeekQuestion(q) && isSalesQuestion(q)) {
      const wantsLastWeek = /\b(?:last week|previous week|past week|pichle hafte|pichhle hafte|पिछले हफ्ते|पिछले हफ़्ते|पिछले सप्ताह|पिछले हफ्ते)\b|पिछले हफ़्ते|पिछले सप्ताह/.test(q);
      const requestedSales = getWeekSales(state.sales, wantsLastWeek ? 1 : 0);
      if (requestedSales === 0) {
        return lang === 'hi'
          ? (wantsLastWeek ? 'पिछले हफ़्ते की कोई बिक्री दर्ज नहीं है।' : 'इस हफ़्ते की कोई बिक्री दर्ज नहीं है।')
          : (wantsLastWeek ? 'No sales were recorded last week.' : 'No sales were recorded this week.');
      }
      const comparisonSales = getWeekSales(state.sales, wantsLastWeek ? 0 : 1);
      const periodLabel = wantsLastWeek
        ? (lang === 'hi' ? 'पिछले हफ़्ते' : 'Last week')
        : (lang === 'hi' ? 'इस हफ़्ते' : 'This week');
      let response = lang === 'hi'
        ? periodLabel + ' की कुल बिक्री: ₹' + fmt(requestedSales)
        : periodLabel + "'s total sales: ₹" + fmt(requestedSales);
      if (comparisonSales > 0) {
        const comparisonLabel = wantsLastWeek
          ? (lang === 'hi' ? 'इस हफ़्ते' : 'This week')
          : (lang === 'hi' ? 'पिछले हफ़्ते' : 'Last week');
        response += '\n\n' + comparisonLabel + ': ₹' + fmt(comparisonSales);
      }
      return response;
    }

    if (isWeekQuestion(q) && isExpenseQuestion(q)) {
      const wantsLastWeek = /\b(?:last week|previous week|past week|pichle hafte|pichhle hafte)\b|पिछले हफ़्ते|पिछले हफ्ते|पिछले सप्ताह/.test(q);
      const requestedExpenses = getWeekExpenses(state.expenses, wantsLastWeek ? 1 : 0);
      if (requestedExpenses === 0) {
        return lang === 'hi'
          ? (wantsLastWeek ? 'पिछले हफ़्ते का कोई खर्च दर्ज नहीं है।' : 'इस हफ़्ते का कोई खर्च दर्ज नहीं है।')
          : (wantsLastWeek ? 'No expenses were recorded last week.' : 'No expenses were recorded this week.');
      }
      return lang === 'hi'
        ? (wantsLastWeek ? 'पिछले हफ़्ते का कुल खर्च: ₹' : 'इस हफ़्ते का कुल खर्च: ₹') + fmt(requestedExpenses)
        : (wantsLastWeek ? "Last week's total expenses: ₹" : "This week's total expenses: ₹") + fmt(requestedExpenses);
    }

    // Calendar-month totals use exclusive date boundaries so last month cannot
    // accidentally include this month's entries.
    if (isMonthQuestion(q) && (isSalesQuestion(q) || isExpenseQuestion(q))) {
      const now = new Date();
      const wantsLastMonth = /\b(?:last month|previous month|past month|pichle mahine|pichhle mahine)\b|पिछले महीने|पिछले माह/.test(q);
      const monthOffset = wantsLastMonth ? -1 : 0;
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1)).toISOString().split('T')[0];
      const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset + 1, 1)).toISOString().split('T')[0];
      const periodSales = state.sales.filter((entry: any) => entry.date >= monthStart && entry.date < monthEnd);
      const periodExpenses = state.expenses.filter((entry: any) => entry.date >= monthStart && entry.date < monthEnd);
      const isSales = isSalesQuestion(q);
      const entries = isSales ? periodSales : periodExpenses;
      const amount = entries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const period = wantsLastMonth
        ? (lang === 'hi' ? 'पिछले महीने' : 'Last month')
        : (lang === 'hi' ? 'इस महीने' : 'This month');
      const typeLabel = isSales
        ? (lang === 'hi' ? 'बिक्री' : 'sales')
        : (lang === 'hi' ? 'खर्च' : 'expenses');
      if (!entries.length) {
        return lang === 'hi'
          ? period + ' की कोई ' + typeLabel + ' एंट्री दर्ज नहीं है।'
          : 'No ' + typeLabel + ' entries were recorded for ' + period.toLowerCase() + '.';
      }
      return lang === 'hi'
        ? period + ' की कुल ' + typeLabel + ': ₹' + fmt(amount)
        : period + "'s total " + typeLabel + ': ₹' + fmt(amount);
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
      const quantitySummary = getTrackedQuantitySummary(state.sales, lang);
      if (lang === 'hi') {
        return `कुल बिक्री: **₹${fmt(totalSales)}** (${state.sales.length} एंट्री)` + quantitySummary;
      }
      return `Total sales: **₹${fmt(totalSales)}** (${state.sales.length} ${state.sales.length === 1 ? 'entry' : 'entries'})` + quantitySummary;
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
  const [voiceNotice, setVoiceNotice] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [audioErrorMessageId, setAudioErrorMessageId] = useState<string | null>(null);
  const speechRequestIdRef = useRef(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get active session
  const activeSession = state.chatSessions.find(s => s.id === state.activeSessionId);
  const messages = activeSession?.messages || [];
  const savedSessions = state.chatSessions.filter(session => session.messages.length > 0);
  
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
  }, [messages, isSending]);
  
  const handleSend = async (text?: string, fromVoice = false) => {
    const message = (text || input.trim()).trim();
    if (!message || isSending) return;

    const responseLang = fromVoice ? detectVoiceLanguage(message, lang) : lang;

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
      // Shop-ledger figures must come from local entries, never an AI guess.
      const intent = classifyIntent(message.toLowerCase().trim());
      const mentionsLedgerData =
        /\b(?:sales?|sold|revenue|turnover|expenses?|expense|profit|udhaar|udhar|credit|bikri|bika|becha|kharch|kharcha|munafa)\b|बिक्री|खर्च|उधार|मुनाफ़ा|मुनाफा/u.test(message);
      const asksForAdvice = isAdviceQuestion(message.toLowerCase().trim());

      if (intent === 'data_query') {
        response = generateResponse(message, state, responseLang);
      } else if (fromVoice && mentionsLedgerData && !asksForAdvice) {
        response = responseLang === 'hi'
          ? 'इस सवाल का भरोसेमंद जवाब देने के लिए ज़रूरी दुकान डेटा नहीं मिला। कृपया सवाल को स्पष्ट करें या संबंधित एंट्री पहले जोड़ें।'
          : 'I do not have enough matching shop data to answer that reliably. Please clarify the question or add the relevant entries first.';
      } else {
        const apiResponse = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: message,
            language: responseLang === 'hi' ? 'Hindi' : 'English',
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

        response = typeof result?.answer === 'string' ? normalizeAIAnswer(result.answer.trim()) : '';
        if (!response) {
          throw new Error('The AI returned an empty answer. Please try again.');
        }
      }
    } catch (error) {
      response = error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : (responseLang === 'hi'
          ? 'अभी AI सलाह उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
          : 'The AI advisor is unavailable right now. Please try again shortly.');
    }

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      language: responseLang,
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
    setIsSending(false);

  };

  const handleReadAloud = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      speechRequestIdRef.current += 1;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    const requestId = ++speechRequestIdRef.current;
    setVoiceNotice('');
    setAudioErrorMessageId(null);
    setSpeakingMessageId(msg.id);

    const started = speakText(
      msg.content,
      msg.language || lang,
      () => {
        if (speechRequestIdRef.current === requestId) setSpeakingMessageId(null);
      },
      () => {
        if (speechRequestIdRef.current === requestId) {
          setSpeakingMessageId(null);
          setAudioErrorMessageId(msg.id);
        }
      }
    );

    if (!started && speechRequestIdRef.current === requestId) {
      setSpeakingMessageId(null);
      setAudioErrorMessageId(msg.id);
    }
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
          {savedSessions.length === 0 ? (
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
              {savedSessions.map((session) => (
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
                {savedSessions.length > 0 && (
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
                <button
                  type="button"
                  onClick={() => handleReadAloud(msg)}
                  aria-label={speakingMessageId === msg.id
                    ? (lang === 'hi' ? 'पढ़ना बंद करें' : 'Stop reading aloud')
                    : (lang === 'hi' ? 'जवाब ज़ोर से सुनें' : 'Read answer aloud')}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {speakingMessageId === msg.id ? <Square size={16} /> : <Volume2 size={16} />}
                  {speakingMessageId === msg.id
                    ? (lang === 'hi' ? 'बोलना बंद करें' : 'Stop reading')
                    : (lang === 'hi' ? 'ज़ोर से सुनें' : 'Read aloud')}
                </button>
                {audioErrorMessageId === msg.id && (
                  <p className="mt-1 text-xs text-text-secondary" role="status">
                    {lang === 'hi'
                      ? 'आवाज़ नहीं चला पाए। ब्राउज़र की ऑडियो सेटिंग जाँचें।'
                      : 'Audio playback failed. Check your browser audio settings.'}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="mb-4 animate-fade-in" role="status" aria-live="polite">
            <div className="card max-w-[90%]">
              <div className="flex items-center gap-3 text-text-secondary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                <p className="text-body">{lang === 'hi' ? 'सोच रहा हूँ…' : 'Thinking…'}</p>
              </div>
            </div>
          </div>
        )}
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
          <VoiceMicButton
            language={lang}
            shape="rounded"
            disabled={isSending}
            label={lang === 'hi' ? 'आवाज़ से सवाल पूछें' : 'Ask by voice'}
            onTranscript={(transcript) => {
              setInput(transcript);
              void handleSend(transcript, true);
            }}
            onStatus={setVoiceNotice}
          />
        </div>
        {voiceNotice && (
          <p className="mt-2 text-xs leading-snug text-text-secondary" role="status" aria-live="polite">
            {voiceNotice}
          </p>
        )}
      </div>
    </div>
  );
}
