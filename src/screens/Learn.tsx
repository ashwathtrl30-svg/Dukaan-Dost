import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { t } from '../i18n';
import { BookOpen, Play, CheckCircle, ChevronRight } from 'lucide-react';

interface LessonData {
  id: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  category: string;
  duration: number;
  emoji: string;
  contentEn: string;
  contentHi: string;
}

// Practical lessons for Indian shopkeepers aged 30-50+
// Focused on daily shop operations, not business theory
const allLessons: LessonData[] = [
  {
    id: 'daily-hisab',
    titleEn: 'Daily Hisab in 5 Minutes',
    titleHi: '5 मिनट में रोज़ का हिसाब',
    descEn: 'Simple routine to track your shop\'s money',
    descHi: 'दुकान के पैसे का हिसाब रखने का आसान तरीका',
    category: 'basics',
    duration: 2,
    emoji: '📊',
    contentEn: 'Every shopkeeper should know three numbers daily:\n\n**1. Total Sales**\n• Add up all cash + UPI received\n• Don\'t forget small sales\n• Write it down before closing\n\n**2. Total Expenses**\n• Stock purchased today\n• Any other payments made\n• Keep bills safely\n\n**3. Cash in Hand**\n• Count physical cash\n• Check UPI balance\n• Match with yesterday\'s + today\'s sales - expenses\n\n**Why this matters:**\nMany shopkeepers work hard but don\'t know if they\'re actually making profit. This 5-minute routine tells you the truth.\n\n**Simple rule:** If you can\'t explain where every rupee went, you have a problem.',
    contentHi: 'हर दुकानदार को रोज़ तीन नंबर पता होने चाहिए:\n\n**1. कुल बिक्री**\n• सारा नकद + UPI जोड़ा\n• छोटी बिक्री मत भूलो\n• दुकान बंद करने से पहले लिखो\n\n**2. कुल खर्च**\n• आज खरीदा गया सामान\n• कोई और भुगतान\n• बिल सुरक्षित रखो\n\n**3. हाथ में नकद**\n• फिज़िकल नकद गिनो\n• UPI बैलेंस चेक करो\n• कल का + आज की बिक्री - खर्च से मिलाओ\n\n**क्यों ज़रूरी:**\nबहुत से दुकानदार मेहनत करते हैं लेकिन नहीं पता actually मुनाफ़ा हो रहा है या नहीं। ये 5 मिनट का routine सच बताता है।\n\n**आसान नियम:** अगर हर रुपया कहाँ गया explain नहीं कर सकते, तो problem है।',
  },
  {
    id: 'udhaar-control',
    titleEn: 'Control Udhaar Before It Controls You',
    titleHi: 'उधार को काबू करो, वरना वो तुम्हें काबू करेगा',
    descEn: 'Set limits and follow up regularly',
    descHi: 'सीमा तय करो और नियमित याद दिलाओ',
    category: 'money',
    duration: 2,
    emoji: '⚠️',
    contentEn: 'Udhaar is part of Indian shopkeeping, but uncontrolled udhaar kills shops.\n\n**Set clear rules:**\n• Maximum udhaar per customer (e.g., ₹2,000)\n• Maximum time (e.g., 30 days)\n• Write it down immediately\n• Get phone number for reminders\n\n**Follow-up routine:**\n• Day 7: Friendly reminder via WhatsApp\n• Day 15: Phone call\n• Day 30: Stop new udhaar until old is cleared\n\n**Red flags:**\n• Customer always "forgetting" wallet\n• Making excuses repeatedly\n• Taking more than they pay back\n• Getting angry when reminded\n\n**Hard truth:** A customer who pays cash is worth 10 who take udhaar. Don\'t be afraid to say no.\n\n**Simple system:** Use DukaanDost\'s udhaar tracker. Set reminder dates. Send polite WhatsApp messages.',
    contentHi: 'उधार भारतीय दुकानदारी का हिस्सा है, लेकिन बेकाबू उधार दुकानें बंद कर देता है।\n\n**साफ़ नियम बनाओ:**\n• एक ग्राहक पर अधिकतम उधार (जैसे ₹2,000)\n• अधिकतम समय (जैसे 30 दिन)\n• तुरंत लिख लो\n• याद दिलाने के लिए फ़ोन नंबर लो\n\n**याद दिलाने का routine:**\n• दिन 7: WhatsApp से विनम्र याद\n• दिन 15: फ़ोन कॉल\n• दिन 30: पुराना चुकता होने तक नया उधार बंद\n\n**खतरे के संकेत:**\n• ग्राहक हमेशा "बटुआ भूल गया"\n• बार-बार बहाने बनाना\n• जितना देता है उससे ज़्यादा लेना\n• याद दिलाने पर गुस्सा होना\n\n**कड़वा सच:** नकद देने वाला ग्राहक उधार लेने वाले 10 ग्राहकों से बेहतर है। न कहने से मत डरो।\n\n**आसान system:** दुकानदोस्त का उधार tracker use करो। reminder date set करो। विनम्र WhatsApp message भेजो।',
  },
  {
    id: 'customer-loyalty',
    titleEn: 'Keep Customers Coming Back',
    titleHi: 'ग्राहकों को बार-बार लाओ',
    descEn: 'Regular customers are your real wealth',
    descHi: 'नियमित ग्राहक ही आपकी असली दौलत हैं',
    category: 'growth',
    duration: 2,
    emoji: '🏰',
    contentEn: 'In a shop, your regular customers are everything. They pay on time, buy consistently, and bring others.\n\n**How to keep them loyal:**\n\n**1. Remember them**\n• Learn their names\n• Remember their families\n• Know their preferences\n\n**2. Be honest always**\n• Never give expired items\n• Correct weight measurements\n• Tell if something is out of stock\n• Admit mistakes quickly\n\n**3. Small gestures matter**\n• Offer a chair while waiting\n• Keep water/tea in summer\n• Small discount for regulars\n• Remember birthdays/festivals\n\n**4. Solve problems fast**\n• If item is bad, replace immediately\n• Don\'t argue over small amounts\n• Listen to complaints patiently\n\n**Simple truth:** A customer who trusts you will buy even if you\'re slightly more expensive. One angry customer tells 10 people.',
    contentHi: 'दुकान में नियमित ग्राहक ही सब कुछ हैं। वो समय पर देते हैं, लगातार खरीदते हैं, और दूसरों को लाते हैं।\n\n**उन्हें वफ़ादार कैसे रखें:**\n\n**1. उन्हें याद रखो**\n• नाम सीखो\n• उनके परिवार को याद रखो\n• उनकी पसंद जानो\n\n**2. हमेशा ईमानदार रहो**\n• कभी एक्सपायर सामान मत दो\n• वज़न सही नापो\n• अगर स्टॉक नहीं है तो बता दो\n• ग़लती जल्दी मान लो\n\n**3. छोटी-छोटी बातें मायने रखती हैं**\n• इंतज़ार में कुर्सी दो\n• गर्मी में पानी/चाय रखो\n• नियमित ग्राहकों को छोटा डिस्काउंट\n• जन्मदिन/त्योहार याद रखो\n\n**4. समस्याएँ जल्दी सुलझाओ**\n• सामान ख़राब हो तो तुरंत बदलो\n• छोटी रकम पर बहस मत करो\n• शिकायतें धैर्य से सुनो\n\n**सरल सच:** जो ग्राहक आप पर भरोसा करता है, वो थोड़ा महंगा होने पर भी खरीदेगा। एक नाराज़ ग्राहक 10 लोगों को बताता है।',
  },
  {
    id: 'smart-stock',
    titleEn: 'Smart Stocking — Buy What Sells',
    titleHi: 'समझदारी से स्टॉक — जो बिके वो लाओ',
    descEn: 'Don\'t let cash sit dead on shelves',
    descHi: 'पैसा शेल्फ पर मत मरने दो',
    category: 'inventory',
    duration: 2,
    emoji: '📦',
    contentEn: 'Every shopkeeper knows the pain of unsold stock. Here\'s how to avoid it:\n\n**The 80/20 rule for shops:**\n• 20% of items give 80% of sales\n• Find your top sellers\n• Keep them always in stock\n• Don\'t overstock slow items\n\n**Weekly stock check:**\n1. List items that didn\'t sell this week\n2. Ask: "Do I really need this?"\n3. For slow items: reduce quantity next time\n4. For fast items: increase quantity\n\n**Festival stocking:**\n• Start 2 months before (not 2 weeks)\n• Order from trusted suppliers only\n• Keep 30% extra for fast items\n• Don\'t guess — use last year\'s data\n\n**Dead stock rules:**\n• If not sold in 30 days: discount it\n• If not sold in 60 days: return to supplier\n• If not sold in 90 days: accept loss, clear space\n\n**Simple truth:** Empty shelf is better than dead stock. Customers will come back if you have what they need.',
    contentHi: 'हर दुकानदार को न बिके स्टॉक का दर्द पता है। इसे कैसे टालें:\n\n**दुकान के लिए 80/20 नियम:**\n• 20% सामान 80% बिक्री देते हैं\n• अपने टॉप सेलर खोजो\n• हमेशा स्टॉक में रखो\n• धीमे सामान ज़्यादा मत लाओ\n\n**साप्ताहिक स्टॉक चेक:**\n1. इस हफ्ते जो नहीं बिका उसकी लिस्ट बनाओ\n2. पूछो: "क्या सच में ये चाहिए?"\n3. धीमे सामान: अगली बार कम लाओ\n4. तेज़ सामान: ज़्यादा लाओ\n\n**त्योहार स्टॉकिंग:**\n• 2 महीने पहले शुरू करो (2 हफ्ते नहीं)\n• सिर्फ़ भरोसेमंद सप्लायर से ऑर्डर करो\n• तेज़ सामान के लिए 30% ज़्यादा रखो\n• अंदाज़ा मत लगाओ — पिछले साल का डेटा use करो\n\n**डेड स्टॉक नियम:**\n• 30 दिन में न बिके: डिस्काउंट दो\n• 60 दिन में न बिके: सप्लायर को वापस करो\n• 90 दिन में न बिके: नुकसान मानो, जगह खाली करो\n\n**सरल सच:** खाली शेल्फ डेड स्टॉक से बेहतर है। ग्राहक वापस आएँगे अगर उनके चाहिए सामान है।',
  },
  {
    id: 'pricing-basics',
    titleEn: 'Pricing That Works',
    titleHi: 'ऐसा भाव जो काम करे',
    descEn: 'Price to cover costs and make profit',
    descHi: 'लागत कवर करें और मुनाफ़ा कमाएँ',
    category: 'pricing',
    duration: 2,
    emoji: '💪',
    contentEn: 'Many shopkeepers underprice because they fear losing customers. But wrong pricing kills shops.\n\n**Calculate your real cost:**\n• Item cost from supplier\n• Transport cost\n• Your time (even if you don\'t pay yourself)\n• Shop rent/electricity share\n\n**Add proper margin:**\n• Groceries: 10-15%\n• Cosmetics/Toiletries: 20-30%\n• Stationery: 25-40%\n• Fancy items: 40-60%\n\n**Check competitors:**\n• Visit nearby shops monthly\n• Match prices for common items\n• Price higher for convenience/service\n• Never start price war\n\n**When to give discount:**\n• Regular customers (small, occasional)\n• Bulk purchases\n• Near expiry items\n• Festival time (planned offers)\n\n**Never do this:**\n• Don\'t reduce price just because competitor did\n• Don\'t sell below cost to "get customers"\n• Don\'t forget to count your own time\n\n**Simple rule:** If you can\'t explain how you made profit today, your pricing is wrong.',
    contentHi: 'बहुत से दुकानदार ग्राहक खोने के डर से सस्ता बेचते हैं। लेकिन ग़लत प्राइसिंग दुकानें बंद कर देती है।\n\n**असली लागत निकालो:**\n• सप्लायर से सामान की कीमत\n• ढुलाई खर्च\n• आपका समय (भले ही खुद को तनख़्वाह न दो)\n• दुकान का किराया/बिजली हिस्सा\n\n**सही मार्जिन जोड़ो:**\n• किराना: 10-15%\n• कॉस्मेटिक्स/टॉयलेट्रीज़: 20-30%\n• स्टेशनरी: 25-40%\n• फैंसी सामान: 40-60%\n\n**प्रतिस्पर्धी चेक करो:**\n• हर महीने आस-पास की दुकानें देखो\n• आम सामान के भाव बराबर रखो\n• सुविधा/सेवा के लिए ज़्यादा लो\n• कभी प्राइस वार मत शुरू करो\n\n**डिस्काउंट कब दो:**\n• नियमित ग्राहकों को (छोटा, कभी-कभी)\n• थोक खरीद पर\n• एक्सपायरी के करीब सामान\n• त्योहार के समय (प्लान किए ऑफर)\n\n**कभी ये मत करो:**\n• सिर्फ़ इसलिए भाव मत घटाओ क्योंकि प्रतिस्पर्धी ने घटाया\n• "ग्राहक लाने के लिए" लागत से नीचे मत बेचो\n• अपना समय गिनना मत भूलो\n\n**सरल नियम:** अगर आज मुनाफ़ा कैसे हुआ explain नहीं कर सकते, तो प्राइसिंग ग़लत है।',
  },
];

// Get today's 5 lessons - same every day for consistency
function getDailyLessons(): LessonData[] {
  // Always show the first 5 lessons (most important for shopkeepers)
  return allLessons.slice(0, 5);
}

// ============ LEARN SCREEN ============
export function LearnScreen() {
  const { state } = useStore();
  const lang = state.language!;
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const dailyLessons = useMemo(() => getDailyLessons(), []);
  
  if (selectedLesson) {
    const lesson = allLessons.find((l: LessonData) => l.id === selectedLesson);
    if (!lesson) return null;
    
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => setSelectedLesson(null)} className="w-12 h-12 rounded-full flex items-center justify-center">
            <span className="text-body">←</span>
          </button>
          <h2 className="text-body-lg font-bold text-text flex-1 truncate">
            {lang === 'hi' ? lesson.titleHi : lesson.titleEn}
          </h2>
        </div>
        
        <div className="flex-1 scroll-area px-5 py-3">
          <div className="text-5xl text-center mb-4">{lesson.emoji}</div>
          
          <div className="card mb-4">
            <p className="text-text whitespace-pre-line leading-relaxed text-body">
              {lang === 'hi' ? lesson.contentHi : lesson.contentEn}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                if (!completedLessons.includes(lesson.id)) {
                  setCompletedLessons([...completedLessons, lesson.id]);
                }
                setSelectedLesson(null);
              }}
              className="btn-primary"
            >
              <CheckCircle size={20} /> {t('done', lang)}
            </button>
            <button className="btn-secondary">
              <Play size={20} /> {t('tryInShop', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const completedCount = completedLessons.length;
  const progressPercent = Math.round((completedCount / dailyLessons.length) * 100);
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-section-title text-text">{t('learnTitle', lang)}</h1>
      </div>
      
      <div className="flex-1 scroll-area px-5 pb-6">
        {/* Progress */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-small font-medium text-text-secondary">
              {completedCount}/{dailyLessons.length} {lang === 'hi' ? 'पाठ पूरे' : 'lessons done'}
            </span>
            <span className="text-small font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        
        {/* All lessons */}
        <p className="text-small font-semibold text-text-secondary mb-3 uppercase tracking-wide">
          {lang === 'hi' ? 'सभी पाठ' : "All Lessons"}
        </p>
        <div className="space-y-3">
          {dailyLessons.map((lesson: LessonData) => {
            const isCompleted = completedLessons.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson.id)}
                className="card w-full text-left flex items-center gap-3 h-20 px-4"
              >
                <span className="text-3xl flex-shrink-0">{lesson.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-text truncate">{lang === 'hi' ? lesson.titleHi : lesson.titleEn}</p>
                  <p className="text-small text-text-secondary truncate">{lang === 'hi' ? lesson.descHi : lesson.descEn}</p>
                  <p className="text-small text-text-secondary mt-1">{lesson.duration} {t('minutes', lang)}</p>
                </div>
                {isCompleted ? (
                  <CheckCircle size={24} className="text-positive flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-text-secondary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
