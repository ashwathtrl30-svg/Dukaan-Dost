import type { ShopType } from './types';

export interface UpcomingFestival {
  id: string;
  date: string;
  nameEn: string;
  nameHi: string;
  emoji: string;
}

export interface FestivalShopAdvice {
  keepReady: string;
  restock: string;
  insight: string;
}

// Dates are maintained as a dated calendar, then filtered against local today.
// Add each year's lunar-calendar dates during the yearly calendar refresh.
const FESTIVAL_CALENDAR: UpcomingFestival[] = [
  { id: 'karwa-chauth', date: '2026-10-29', nameEn: 'Karwa Chauth', nameHi: 'करवा चौथ', emoji: '🌙' },
  { id: 'ahoi-ashtami', date: '2026-11-01', nameEn: 'Ahoi Ashtami', nameHi: 'अहोई अष्टमी', emoji: '🙏' },
  { id: 'govatsa-dwadashi', date: '2026-11-05', nameEn: 'Govatsa Dwadashi / Vasu Baras', nameHi: 'गोवत्स द्वादशी / वसु बारस', emoji: '🐄' },
  { id: 'dhanteras', date: '2026-11-06', nameEn: 'Dhanteras', nameHi: 'धनतेरस', emoji: '🪔' },
  { id: 'diwali', date: '2026-11-08', nameEn: 'Diwali (Lakshmi Puja)', nameHi: 'दिवाली (लक्ष्मी पूजा)', emoji: '🪔' },
  { id: 'govardhan-puja-2026', date: '2026-11-10', nameEn: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा', emoji: '🙏' },
  { id: 'bhai-dooj', date: '2026-11-11', nameEn: 'Bhai Dooj', nameHi: 'भाई दूज', emoji: '🎁' },
  { id: 'chhath-puja', date: '2026-11-15', nameEn: 'Chhath Puja', nameHi: 'छठ पूजा', emoji: '🌅' },
  { id: 'tulsi-vivah', date: '2026-11-21', nameEn: 'Tulsi Vivah', nameHi: 'तुलसी विवाह', emoji: '🌿' },
  { id: 'guru-nanak-jayanti', date: '2026-11-24', nameEn: 'Guru Nanak Jayanti / Kartik Purnima / Dev Deepawali', nameHi: 'गुरु नानक जयंती / कार्तिक पूर्णिमा / देव दीपावली', emoji: '🙏' },
  { id: 'vivah-panchami', date: '2026-12-14', nameEn: 'Vivah Panchami', nameHi: 'विवाह पंचमी', emoji: '🙏' },
  { id: 'gita-jayanti', date: '2026-12-20', nameEn: 'Gita Jayanti', nameHi: 'गीता जयंती', emoji: '📖' },
  { id: 'christmas', date: '2026-12-25', nameEn: 'Christmas', nameHi: 'क्रिसमस', emoji: '🎄' },
  { id: 'makar-sankranti', date: '2027-01-15', nameEn: 'Makar Sankranti / Pongal', nameHi: 'मकर संक्रांति / पोंगल', emoji: '☀️' },
  { id: 'vasant-panchami', date: '2027-02-11', nameEn: 'Vasant Panchami', nameHi: 'बसंत पंचमी', emoji: '🌼' },
  { id: 'maha-shivratri', date: '2027-03-06', nameEn: 'Maha Shivratri', nameHi: 'महाशिवरात्रि', emoji: '🔱' },
  { id: 'holi', date: '2027-03-22', nameEn: 'Holi', nameHi: 'होली', emoji: '🎨' },
  { id: 'gudi-padwa', date: '2027-04-07', nameEn: 'Gudi Padwa / Ugadi', nameHi: 'गुड़ी पड़वा / उगादी', emoji: '🌿' },
  { id: 'ram-navami', date: '2027-04-15', nameEn: 'Ram Navami', nameHi: 'राम नवमी', emoji: '🙏' },
  { id: 'akshaya-tritiya', date: '2027-05-08', nameEn: 'Akshaya Tritiya', nameHi: 'अक्षय तृतीया', emoji: '✨' },
  { id: 'guru-purnima', date: '2027-07-18', nameEn: 'Guru Purnima', nameHi: 'गुरु पूर्णिमा', emoji: '🙏' },
  { id: 'raksha-bandhan', date: '2027-08-17', nameEn: 'Raksha Bandhan', nameHi: 'रक्षा बंधन', emoji: '🧵' },
  { id: 'janmashtami', date: '2027-08-25', nameEn: 'Janmashtami', nameHi: 'जन्माष्टमी', emoji: '🦚' },
  { id: 'ganesh-chaturthi', date: '2027-09-04', nameEn: 'Ganesh Chaturthi', nameHi: 'गणेश चतुर्थी', emoji: '🐘' },
  { id: 'onam', date: '2027-09-12', nameEn: 'Onam', nameHi: 'ओणम', emoji: '🌼' },
  { id: 'navratri', date: '2027-09-30', nameEn: 'Navratri begins', nameHi: 'नवरात्रि प्रारंभ', emoji: '🙏' },
  { id: 'dussehra', date: '2027-10-09', nameEn: 'Dussehra', nameHi: 'दशहरा', emoji: '🏹' },
  { id: 'karwa-chauth-2027', date: '2027-10-18', nameEn: 'Karwa Chauth', nameHi: 'करवा चौथ', emoji: '🌙' },
  { id: 'ahoi-ashtami-2027', date: '2027-10-22', nameEn: 'Ahoi Ashtami', nameHi: 'अहोई अष्टमी', emoji: '🙏' },
  { id: 'dhanteras-2027', date: '2027-10-27', nameEn: 'Dhanteras', nameHi: 'धनतेरस', emoji: '🪔' },
  { id: 'diwali-2027', date: '2027-10-29', nameEn: 'Diwali (Lakshmi Puja)', nameHi: 'दिवाली (लक्ष्मी पूजा)', emoji: '🪔' },
  { id: 'govardhan-puja-2027', date: '2027-10-30', nameEn: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा', emoji: '🙏' },
  { id: 'bhai-dooj-2027', date: '2027-10-31', nameEn: 'Bhai Dooj', nameHi: 'भाई दूज', emoji: '🎁' },
  { id: 'chhath-puja-2027', date: '2027-11-04', nameEn: 'Chhath Puja', nameHi: 'छठ पूजा', emoji: '🌅' },
  { id: 'tulsi-vivah-2027', date: '2027-11-11', nameEn: 'Tulsi Vivah', nameHi: 'तुलसी विवाह', emoji: '🌿' },
  { id: 'guru-nanak-jayanti-2027', date: '2027-11-14', nameEn: 'Guru Nanak Jayanti', nameHi: 'गुरु नानक जयंती', emoji: '🙏' },
  { id: 'christmas-2027', date: '2027-12-25', nameEn: 'Christmas', nameHi: 'क्रिसमस', emoji: '🎄' },
  { id: 'makar-sankranti-2028', date: '2028-01-15', nameEn: 'Makar Sankranti / Pongal', nameHi: 'मकर संक्रांति / पोंगल', emoji: '☀️' },
  { id: 'vasant-panchami-2028', date: '2028-01-31', nameEn: 'Vasant Panchami', nameHi: 'बसंत पंचमी', emoji: '🌼' },
  { id: 'maha-shivratri-2028', date: '2028-02-23', nameEn: 'Maha Shivratri', nameHi: 'महाशिवरात्रि', emoji: '🔱' },
  { id: 'holi-2028', date: '2028-03-11', nameEn: 'Holi', nameHi: 'होली', emoji: '🎨' },
  { id: 'gudi-padwa-2028', date: '2028-03-27', nameEn: 'Gudi Padwa / Ugadi', nameHi: 'गुड़ी पड़वा / उगादी', emoji: '🌿' },
  { id: 'ram-navami-2028', date: '2028-04-03', nameEn: 'Ram Navami', nameHi: 'राम नवमी', emoji: '🙏' },
  { id: 'akshaya-tritiya-2028', date: '2028-04-27', nameEn: 'Akshaya Tritiya', nameHi: 'अक्षय तृतीया', emoji: '✨' },
  { id: 'guru-purnima-2028', date: '2028-07-06', nameEn: 'Guru Purnima', nameHi: 'गुरु पूर्णिमा', emoji: '🙏' },
  { id: 'raksha-bandhan-2028', date: '2028-08-05', nameEn: 'Raksha Bandhan', nameHi: 'रक्षा बंधन', emoji: '🧵' },
  { id: 'janmashtami-2028', date: '2028-08-13', nameEn: 'Janmashtami', nameHi: 'जन्माष्टमी', emoji: '🦚' },
  { id: 'ganesh-chaturthi-2028', date: '2028-08-23', nameEn: 'Ganesh Chaturthi', nameHi: 'गणेश चतुर्थी', emoji: '🐘' },
  { id: 'onam-2028', date: '2028-09-01', nameEn: 'Onam', nameHi: 'ओणम', emoji: '🌼' },
  { id: 'navratri-2028', date: '2028-09-19', nameEn: 'Navratri begins', nameHi: 'नवरात्रि प्रारंभ', emoji: '🙏' },
  { id: 'dussehra-2028', date: '2028-09-27', nameEn: 'Dussehra', nameHi: 'दशहरा', emoji: '🏹' },
  { id: 'karwa-chauth-2028', date: '2028-10-07', nameEn: 'Karwa Chauth', nameHi: 'करवा चौथ', emoji: '🌙' },
  { id: 'ahoi-ashtami-2028', date: '2028-10-11', nameEn: 'Ahoi Ashtami', nameHi: 'अहोई अष्टमी', emoji: '🙏' },
  { id: 'dhanteras-2028', date: '2028-10-15', nameEn: 'Dhanteras', nameHi: 'धनतेरस', emoji: '🪔' },
  { id: 'diwali-2028', date: '2028-10-17', nameEn: 'Diwali (Lakshmi Puja)', nameHi: 'दिवाली (लक्ष्मी पूजा)', emoji: '🪔' },
  { id: 'govardhan-puja-2028', date: '2028-10-18', nameEn: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा', emoji: '🙏' },
  { id: 'bhai-dooj-2028', date: '2028-10-19', nameEn: 'Bhai Dooj', nameHi: 'भाई दूज', emoji: '🎁' },
  { id: 'chhath-puja-2028', date: '2028-10-23', nameEn: 'Chhath Puja', nameHi: 'छठ पूजा', emoji: '🌅' },
  { id: 'tulsi-vivah-2028', date: '2028-10-29', nameEn: 'Tulsi Vivah', nameHi: 'तुलसी विवाह', emoji: '🌿' },
  { id: 'guru-nanak-jayanti-2028', date: '2028-11-02', nameEn: 'Guru Nanak Jayanti / Kartik Purnima', nameHi: 'गुरु नानक जयंती / कार्तिक पूर्णिमा', emoji: '🙏' },
  { id: 'vivah-panchami-2028', date: '2028-11-21', nameEn: 'Vivah Panchami', nameHi: 'विवाह पंचमी', emoji: '🙏' },
  { id: 'gita-jayanti-2028', date: '2028-11-27', nameEn: 'Gita Jayanti', nameHi: 'गीता जयंती', emoji: '📖' },
  { id: 'dattatreya-jayanti-2028', date: '2028-12-01', nameEn: 'Dattatreya Jayanti', nameHi: 'दत्तात्रेय जयंती', emoji: '🙏' },
  { id: 'christmas-2028', date: '2028-12-25', nameEn: 'Christmas', nameHi: 'क्रिसमस', emoji: '🎄' },
];

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function getUpcomingFestivals(now: Date = new Date(), monthsAhead = 2): UpcomingFestival[] {
  const start = getLocalDateKey(now);
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
  const lastDayOfTargetMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const endDate = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(now.getDate(), lastDayOfTargetMonth),
  );
  const end = getLocalDateKey(endDate);
  return FESTIVAL_CALENDAR
    .filter((festival) => festival.date >= start && festival.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getFestivalDateLabel(date: string, lang: 'en' | 'hi'): string {
  const parsed = new Date(date + 'T12:00:00');
  return parsed.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function adviceForType(shopType: ShopType | null | undefined, lang: 'en' | 'hi'): FestivalShopAdvice {
  const all: Record<ShopType, FestivalShopAdvice> = {
    kirana: {
      keepReady: 'Keep fast-moving staples, snacks, cooking essentials, dry fruits and small gift packs that your local customers actually ask for.',
      restock: 'Review your last 2–4 weeks of sales. Replenish the items that already move quickly; place smaller repeat orders rather than buying unfamiliar festival stock in bulk.',
      insight: 'Track which named items sell during the festival week and compare them with a normal week. Local demand—not the festival alone—should decide the next order.',
    },
    medical: {
      keepReady: 'Keep regularly requested health essentials, basic first-aid supplies, hygiene items and other fast-moving products organised; check expiry dates and storage conditions.',
      restock: 'Use recent sales and customer requests to replenish proven items. Follow applicable pharmacy requirements, rotate stock by expiry, and avoid speculative bulk purchases.',
      insight: 'Festival footfall is not a reason to overstock medicines. Your recent demand, expiry dates and compliant storage are stronger buying signals.',
    },
    bakery: {
      keepReady: 'Prepare your best-selling cakes, cookies, baked snacks and festive assortments, with clear pre-order and pickup times.',
      restock: 'Estimate ingredients and food-safe boxes from confirmed orders plus recent sales. Buy perishable ingredients in manageable batches to limit waste.',
      insight: 'Gift boxes and pre-orders can lift the bill value, but confirm quantities early and track leftovers after the festival.',
    },
    sweet: {
      keepReady: 'Keep popular sweets, assorted gift boxes, dry-fruit assortments and clean food-grade packaging ready in sizes customers commonly buy.',
      restock: 'Base production and ingredient orders on recent sales and advance orders. Make smaller fresh batches where possible instead of guessing demand.',
      insight: 'Record which sweet or box size sells fastest and which remains unsold; use that split for the next festival rather than increasing every variety.',
    },
    tailor: {
      keepReady: 'Plan festive-wear stitching and alterations, blouse work, fitting slots and clear delivery dates; keep thread, lining, hooks, zips and other commonly used supplies ready.',
      restock: 'Replenish tailoring consumables and fabrics only against confirmed orders and the styles your customers request most. Leave buffer time for alterations.',
      insight: 'Your capacity and on-time delivery matter as much as materials. Record service names and order dates so you can identify profitable, repeatable work.',
    },
    salon: {
      keepReady: 'Offer festive haircuts, styling, grooming and appointment-based packages. Keep commonly used shampoo, conditioner, styling products and disposable supplies ready.',
      restock: 'Check bookings and the last few weeks of service demand before replenishing colour, treatment and hygiene consumables. Avoid buying products that your customers rarely request.',
      insight: 'Reserve appointment slots for peak days and record service names in Sales. Your booked services and consumable usage are better signals than retail-goods advice.',
    },
    hardware: {
      keepReady: 'Keep your usual fast-moving repair items, batteries, bulbs, switches and suitable festive lighting accessories that match local demand and safety standards.',
      restock: 'Review recent sales and remaining shelf stock before replenishing compatible, quality-certified products. Avoid bulk-buying seasonal items with uncertain demand.',
      insight: 'Check that lights and electrical accessories meet relevant safety and compatibility requirements; a low price is not worth a product complaint.',
    },
    mobile: {
      keepReady: 'Keep popular charging cables, compatible chargers, cases, screen protectors and other accessories for the phone models local customers use.',
      restock: 'Use recent named-item sales to choose compatible models and quantities. Replenish popular accessories first and keep warranty or return terms clear.',
      insight: 'Accessories often depend on exact model compatibility. Your item-name sales history helps identify demand without tying cash up in every variant.',
    },
    vegetable: {
      keepReady: 'Keep fresh, good-quality vegetables and fruits that your regular customers ask for around the festival, with clear display and frequent freshness checks.',
      restock: 'Buy in smaller, more frequent lots based on recent demand and the next day’s expected footfall. Check quality and reduce orders for items left over the previous day.',
      insight: 'Fresh produce can spoil quickly. Short order cycles and records of what sold versus what was discarded are more useful than a large festival stock-up.',
    },
    tea: {
      keepReady: 'Keep tea, milk, sugar, drinking water, cups and your popular snack pairings ready for busy periods.',
      restock: 'Estimate milk and snack quantities from recent peak-hour sales. Replenish perishables more frequently and avoid making more snacks than you can sell fresh.',
      insight: 'Check which time slots bring the extra customers. Slightly better preparation for those hours can be safer than extending stock all day.',
    },
    restaurant: {
      keepReady: 'Plan a manageable festive menu around your best-selling dishes, pre-orders, family portions and takeaway packaging.',
      restock: 'Buy ingredients against recent dish sales and confirmed bookings. Prepare perishables in smaller batches and plan staff and pickup times before advertising a special menu.',
      insight: 'Promote a small set of reliable festive options, then compare orders, waste and earnings after the event before repeating the menu.',
    },
    other: {
      keepReady: 'Use your shop’s regular best-selling items or services and the requests you hear most often; arrange them clearly for festival visitors.',
      restock: 'Check recent named sales, pending orders and what is already on hand. Refill proven demand first and avoid committing money to unfamiliar items without enquiries.',
      insight: 'Use this as a checklist, not a prediction. Local customer requests and your own records should decide what to prepare or buy.',
    },
  };
  const chosen = all[shopType || 'other'] || all.other;
  if (lang === 'en') return chosen;
  const hi: Record<ShopType, FestivalShopAdvice> = {
    kirana: {
      keepReady: 'तेज़ बिकने वाला राशन, नाश्ता, खाना बनाने की ज़रूरी चीज़ें, सूखे मेवे और छोटे गिफ्ट पैक रखें—वही जो आपके ग्राहक सच में माँगते हैं।',
      restock: 'पिछले 2–4 हफ़्तों की बिक्री देखें। पहले वही सामान भरें जो पहले से तेज़ बिकता है; अनजान त्योहार वाला स्टॉक थोक में न खरीदें।',
      insight: 'त्योहार वाले हफ़्ते में सामान के नाम के साथ बिक्री दर्ज करें और सामान्य हफ़्ते से तुलना करें। अगला ऑर्डर स्थानीय माँग देखकर तय करें।',
    },
    medical: {
      keepReady: 'नियमित माँग वाली स्वास्थ्य संबंधी ज़रूरी चीज़ें, प्राथमिक उपचार का सामान, स्वच्छता उत्पाद और तेज़ बिकने वाला स्टॉक व्यवस्थित रखें। एक्सपायरी और स्टोरेज जाँचें।',
      restock: 'हाल की बिक्री और ग्राहकों की माँग देखकर सामान भरें। फार्मेसी के लागू नियमों का पालन करें, एक्सपायरी के अनुसार स्टॉक घुमाएँ और अनुमान से थोक खरीद न करें।',
      insight: 'त्योहार की भीड़ दवाइयों का अतिरिक्त स्टॉक लेने का अकेला कारण नहीं है। हाल की माँग, एक्सपायरी और सही स्टोरेज देखकर खरीदें।',
    },
    bakery: {
      keepReady: 'अपने लोकप्रिय केक, कुकीज़, बेक्ड स्नैक्स और त्योहार के पैक तैयार रखें। ऑर्डर और पिकअप का समय साफ़ बताएँ।',
      restock: 'पक्के ऑर्डर और हाल की बिक्री के हिसाब से सामग्री और फूड-सेफ डिब्बे लें। खराब होने वाली सामग्री थोड़ी-थोड़ी मात्रा में खरीदें।',
      insight: 'गिफ्ट बॉक्स और पहले से मिले ऑर्डर मदद कर सकते हैं; मात्रा पहले पक्की करें और त्योहार के बाद बचा सामान दर्ज करें।',
    },
    sweet: {
      keepReady: 'लोकप्रिय मिठाइयाँ, अलग-अलग मिठाइयों के गिफ्ट बॉक्स, सूखे मेवे और साफ़ फूड-ग्रेड पैकिंग रखें।',
      restock: 'हाल की बिक्री और एडवांस ऑर्डर देखकर सामग्री मँगाएँ। माँग का अंदाज़ा न हो तो कम मात्रा में ताज़ी मिठाई बनाएँ।',
      insight: 'कौन-सी मिठाई या बॉक्स सबसे ज़्यादा बिकता है और क्या बचता है, यह लिखें; अगली बार उसी हिसाब से मात्रा तय करें।',
    },
    tailor: {
      keepReady: 'त्योहार के कपड़ों की सिलाई और अल्टरेशन, ब्लाउज़ व फिटिंग के स्लॉट और साफ़ डिलीवरी तारीख़ तय करें। धागा, अस्तर, हुक और ज़िप जैसे सामान रखें।',
      restock: 'सिलाई का सामान और कपड़ा पक्के ऑर्डर तथा ग्राहकों की माँग के हिसाब से लें। अल्टरेशन के लिए अतिरिक्त समय रखें।',
      insight: 'सामग्री जितनी ज़रूरी है, समय पर डिलीवरी और काम संभालने की क्षमता भी उतनी ही ज़रूरी है। सेवा और ऑर्डर की तारीख़ दर्ज करें।',
    },
    salon: {
      keepReady: 'त्योहार के हेयरकट, हेयर स्टाइलिंग और ग्रूमिंग के लिए अपॉइंटमेंट पैकेज रखें। शैम्पू, कंडीशनर, स्टाइलिंग प्रोडक्ट और डिस्पोज़ेबल सामान तैयार रखें।',
      restock: 'बुकिंग और हाल की सर्विस माँग देखकर कलर, ट्रीटमेंट और सफ़ाई का सामान भरें। जो चीज़ें कम माँगी जाती हैं, उन्हें ज़्यादा न खरीदें।',
      insight: 'व्यस्त दिनों के लिए अपॉइंटमेंट स्लॉट रखें और बिक्री में सर्विस का नाम लिखें। बुकिंग और इस्तेमाल होने वाला सामान खरीद का बेहतर आधार हैं।',
    },
    hardware: {
      keepReady: 'आम तौर पर तेज़ बिकने वाला मरम्मत का सामान, बैटरी, बल्ब, स्विच और स्थानीय माँग के अनुरूप सुरक्षित फेस्टिव लाइटिंग एक्सेसरी रखें।',
      restock: 'बाकी स्टॉक और हाल की बिक्री देखकर सही मेल खाने वाला, गुणवत्ता मानकों पर खरा सामान भरें। अनिश्चित माँग पर थोक खरीद न करें।',
      insight: 'लाइट और इलेक्ट्रिकल एक्सेसरी की सुरक्षा और अनुकूलता जाँचें। सिर्फ़ कम कीमत देखकर सामान न चुनें।',
    },
    mobile: {
      keepReady: 'लोकप्रिय फोन मॉडल के चार्जिंग केबल, सही चार्जर, कवर, स्क्रीन प्रोटेक्टर और अन्य एक्सेसरी रखें।',
      restock: 'सामान के नाम से दर्ज हाल की बिक्री देखकर सही मॉडल की मात्रा चुनें। लोकप्रिय एक्सेसरी पहले भरें और वारंटी/वापसी की शर्तें साफ़ रखें।',
      insight: 'एक्सेसरी फोन मॉडल के अनुसार होती हैं। बिक्री का रिकॉर्ड बताएगा कि किस मॉडल की माँग है, ताकि पैसा हर वैरिएंट में न फँसे।',
    },
    vegetable: {
      keepReady: 'त्योहार के आसपास ग्राहकों द्वारा माँगी जाने वाली ताज़ी सब्ज़ियाँ और फल रखें। गुणवत्ता और ताज़गी बार-बार जाँचें।',
      restock: 'हाल की माँग और अगले दिन की भीड़ देखकर कम मात्रा में बार-बार खरीदें। पिछले दिन बची चीज़ें देखकर ऑर्डर घटाएँ।',
      insight: 'ताज़ा माल जल्दी खराब हो सकता है। हर दिन बिक्री और फेंके गए माल का रिकॉर्ड बड़े स्टॉक से ज़्यादा उपयोगी है।',
    },
    tea: {
      keepReady: 'भीड़ वाले समय के लिए चाय, दूध, चीनी, पानी, कप और लोकप्रिय स्नैक्स तैयार रखें।',
      restock: 'हाल की पीक-आवर बिक्री देखकर दूध और स्नैक्स की मात्रा तय करें। खराब होने वाली चीज़ें थोड़ी-थोड़ी मात्रा में भरें।',
      insight: 'देखें किस समय अतिरिक्त ग्राहक आते हैं। उन्हीं घंटों की तैयारी बेहतर करना पूरे दिन ज़्यादा स्टॉक रखने से सुरक्षित हो सकता है।',
    },
    restaurant: {
      keepReady: 'लोकप्रिय व्यंजन, त्योहार का सीमित मेनू, एडवांस ऑर्डर, फैमिली पोर्शन और टेकअवे पैकिंग की योजना बनाएँ।',
      restock: 'हाल की डिश बिक्री और पक्की बुकिंग देखकर सामग्री लें। खराब होने वाली चीज़ें कम मात्रा में बनाएँ और स्टाफ तथा पिकअप समय तय करें।',
      insight: 'कुछ भरोसेमंद त्योहार वाले विकल्प चुनें। बाद में ऑर्डर, बर्बादी और कमाई देखकर तय करें कि अगली बार क्या दोहराना है।',
    },
    other: {
      keepReady: 'अपने कारोबार के लोकप्रिय सामान या सेवाएँ और ग्राहकों की आम माँग स्पष्ट रूप से तैयार रखें।',
      restock: 'हाल की दर्ज बिक्री, लंबित ऑर्डर और मौजूद स्टॉक देखें। पहले साबित माँग वाला सामान भरें और बिना पूछताछ के अनजान चीज़ों पर पैसा न लगाएँ।',
      insight: 'इसे तैयारी की सूची मानें, माँग की गारंटी नहीं। स्थानीय ग्राहक और आपके अपने रिकॉर्ड ही खरीद तय करें।',
    },
  };
  return hi[shopType || 'other'] || hi.other;
}


type FestivalShopFocus = 'goods' | 'food' | 'salon' | 'tailor' | 'hardware' | 'mobile' | 'medical';

interface FestivalSpecificPlan {
  matches: string[];
  goodsEn: string;
  goodsHi: string;
  foodEn: string;
  foodHi: string;
  serviceEn: string;
  serviceHi: string;
  restockEn: string;
  restockHi: string;
  insightEn: string;
  insightHi: string;
}

// Each festival has its own demand cues. Shop type chooses the relevant list;
// advice is a planning aid, never a guarantee of local sales.
const FESTIVAL_SPECIFIC_PLANS: FestivalSpecificPlan[] = [
  { matches: ['karwa-chauth'], goodsEn: 'karwa pots, puja thalis, sieves, diyas, sargi snacks, dry fruits and fruit', goodsHi: 'करवा, पूजा थाली, छलनी, दीये, सरगी स्नैक्स, सूखे मेवे और फल', foodEn: 'sargi packs, dry fruits, fruit, fasting snacks and small sweets for breaking the fast', foodHi: 'सरगी पैक, सूखे मेवे, फल, व्रत स्नैक्स और व्रत खोलने की छोटी मिठाई', serviceEn: 'pre-book mehendi and evening grooming slots; for tailoring, prioritise blouse/saree finishing and urgent alterations', serviceHi: 'मेहंदी और शाम की ग्रूमिंग पहले बुक करें; सिलाई में ब्लाउज़/साड़ी फिनिशिंग और जल्दी फिटिंग देखें', restockEn: 'Sargi and evening purchases happen at different times; replenish small packs before local rush and avoid excess perishables.', restockHi: 'सरगी और शाम की खरीद का समय अलग हो सकता है; छोटे पैक पहले भरें और जल्दी खराब होने वाली चीज़ें ज़्यादा न खरीदें।', insightEn: 'Karwa Chauth demand follows fasting, sargi and moonrise routines; customs and observance times vary by locality.', insightHi: 'करवा चौथ की माँग व्रत, सरगी और चाँद निकलने के समय से जुड़ी है; रीति और समय इलाके के अनुसार बदलते हैं।' },
  { matches: ['ahoi-ashtami'], goodsEn: 'Ahoi puja pictures or kits, kalash items, diyas, fruit, sweets and vrat ingredients', goodsHi: 'अहोई पूजा चित्र/किट, कलश सामग्री, दीये, फल, मिठाई और व्रत सामग्री', foodEn: 'fruit portions, vrat snacks, small mithai packs and evening-puja offerings', foodHi: 'फलों के पैक, व्रत स्नैक्स, छोटी मिठाई और शाम की पूजा का भोग', serviceEn: 'keep normal appointment capacity and fulfil only requested family-event grooming or alterations', serviceHi: 'सामान्य अपॉइंटमेंट क्षमता रखें और माँग के अनुसार ग्रूमिंग या कपड़ों की फिटिंग करें', restockEn: 'Prioritise small puja and offering packs customers ask for; do not assume every neighbourhood observes it.', restockHi: 'ग्राहकों की माँग वाले छोटे पूजा और भोग पैक भरें; हर इलाके में यह पर्व मनाया जाता है ऐसा न मानें।', insightEn: 'Purchases are mostly puja and offering related; demand may be modest outside communities that observe Ahoi Ashtami.', insightHi: 'खरीद मुख्यतः पूजा और भोग से जुड़ी है; जहाँ अहोई अष्टमी नहीं मनाई जाती वहाँ माँग कम हो सकती है।' },
  { matches: ['govatsa-dwadashi'], goodsEn: 'puja items, diyas, flowers, jaggery, pulses and locally requested vrat or offering ingredients', goodsHi: 'पूजा सामग्री, दीये, फूल, गुड़, दालें और स्थानीय माँग वाली व्रत सामग्री', foodEn: 'jaggery snacks, fresh produce, simple vrat foods and small offering packs', foodHi: 'गुड़ के स्नैक्स, ताज़ी उपज, व्रत का भोजन और छोटे भोग पैक', serviceEn: 'keep regular appointments and confirmed alteration work; avoid assuming a broad shopping rush', serviceHi: 'नियमित अपॉइंटमेंट और पक्की फिटिंग रखें; बड़ी खरीदारी की भीड़ न मानें', restockEn: 'Confirm the local puja custom first, then replenish only the relevant items in small batches.', restockHi: 'पहले स्थानीय पूजा-प्रथा की पुष्टि करें, फिर संबंधित सामान छोटे बैच में भरें।', insightEn: 'Govatsa Dwadashi traditions vary by region; local enquiries are a better signal than national demand assumptions.', insightHi: 'गोवत्स द्वादशी की परंपराएँ क्षेत्र के अनुसार बदलती हैं; स्थानीय पूछताछ पूरे देश की माँग मानने से बेहतर संकेत है।' },
  { matches: ['dhanteras'], goodsEn: 'metal utensils, small gift items, diyas, puja supplies, cleaning essentials and dry-fruit gift packs', goodsHi: 'धातु के बर्तन, छोटे गिफ्ट, दीये, पूजा सामग्री, सफ़ाई की चीज़ें और सूखे मेवे के गिफ्ट पैक', foodEn: 'premium sweets, dry-fruit boxes and pre-Diwali gift packs', foodHi: 'प्रीमियम मिठाई, सूखे मेवे के डिब्बे और दिवाली-पूर्व गिफ्ट पैक', serviceEn: 'confirm pre-Diwali grooming bookings and festive outfit alterations with clear delivery times', serviceHi: 'दिवाली-पूर्व ग्रूमिंग और त्योहार कपड़ों की फिटिंग की बुकिंग व डिलीवरी समय पक्का करें', restockEn: 'Dhanteras is purchase-led; replenish proven price points, keep premium orders conservative and avoid tying up cash in untested stock.', restockHi: 'धनतेरस खरीदारी पर केंद्रित है; बिकने वाले दामों के सामान भरें, महँगे ऑर्डर सीमित रखें और अनजाने स्टॉक में नकदी न फँसाएँ।', insightEn: 'Some customers shop for metal goods or home purchases, but budget and category differ widely; avoid speculative stock.', insightHi: 'कुछ ग्राहक धातु या घर का सामान खरीदते हैं, लेकिन बजट और श्रेणी अलग होती है; अनुमान से स्टॉक न बढ़ाएँ।' },
  { matches: ['diwali'], goodsEn: 'diyas, rangoli colours, puja essentials, chocolates, sweets, dry fruits, gift packs, torans and decorative lights', goodsHi: 'दीये, रंगोली रंग, पूजा सामग्री, चॉकलेट-मिठाई, सूखे मेवे, गिफ्ट पैक, तोरण और सजावटी लाइट', foodEn: 'mithai assortments, chocolates, dry-fruit boxes, festive cookies and gift hampers with food-safe packaging', foodHi: 'मिठाई के मिश्रित पैक, चॉकलेट, सूखे मेवे, त्योहार कुकीज़ और फूड-सेफ पैकिंग वाले गिफ्ट हैम्पर', serviceEn: 'book festive grooming and makeup slots; for tailoring, focus on blouse finishing, fall/pico and confirmed delivery orders', serviceHi: 'त्योहार ग्रूमिंग/मेकअप बुक करें; सिलाई में ब्लाउज़, फॉल-पिको और पक्की डिलीवरी पर ध्यान दें', restockEn: 'Set separate limits for perishables, gift packs and decor; replenish by recent sell-through and confirmed orders, not excitement.', restockHi: 'जल्दी खराब होने वाली चीज़ों, गिफ्ट पैक और सजावट की अलग सीमा रखें; हाल की बिक्री और पक्के ऑर्डर से खरीद तय करें।', insightEn: 'Diwali demand spans food, worship and home decoration; each shop should stock only categories that match its customers and catalogue.', insightHi: 'दिवाली में खाने-पीने, पूजा और घर की सजावट की खरीद होती है; हर दुकान अपने ग्राहकों और मौजूदा रेंज से मेल वाला सामान ही रखे।' },
  { matches: ['govardhan-puja', 'govardhan'], goodsEn: 'puja supplies, flowers, diyas, grains, ghee, curd and ingredients requested for annakut offerings', goodsHi: 'पूजा सामग्री, फूल, दीये, अनाज, घी, दही और अन्नकूट के लिए माँगी गई सामग्री', foodEn: 'fresh dairy ingredients, grain-based dishes, sweets and small fresh batches for family meals', foodHi: 'ताज़ी डेयरी सामग्री, अनाज के व्यंजन, मिठाई और परिवार के भोजन के छोटे ताज़ा बैच', serviceEn: 'confirm post-Diwali service appointments and any family-event garment work before promising delivery', serviceHi: 'दिवाली के बाद के अपॉइंटमेंट और पारिवारिक कपड़ों के काम की डिलीवरी पहले पक्की करें', restockEn: 'Check leftovers from Diwali before ordering again; use small fresh batches for short-lived offering demand.', restockHi: 'फिर ऑर्डर देने से पहले दिवाली का बचा स्टॉक देखें; थोड़े समय की भोग माँग के लिए छोटे ताज़ा बैच रखें।', insightEn: 'Annakut and family-food demand can be local and short-lived; a small fresh batch is safer than leftover stock.', insightHi: 'अन्नकूट और पारिवारिक भोजन की माँग स्थानीय और थोड़े समय की हो सकती है; छोटा ताज़ा बैच बेहतर है।' },
  { matches: ['bhai-dooj'], goodsEn: 'small gift packs, tilak and puja items, sweets, chocolate, dry fruits, envelopes and gift wrap', goodsHi: 'छोटे गिफ्ट पैक, तिलक/पूजा सामग्री, मिठाई, चॉकलेट, सूखे मेवे, लिफ़ाफ़े और गिफ्ट रैप', foodEn: 'small sweet boxes, chocolates, dry-fruit gifts and ready-to-carry family-visit packs', foodHi: 'छोटी मिठाई पेटी, चॉकलेट, सूखे मेवे के गिफ्ट और परिवार से मिलने के पैक', serviceEn: 'offer family-occasion grooming and quick alteration slots, but protect time for confirmed bookings', serviceHi: 'पारिवारिक अवसर की ग्रूमिंग और जल्दी फिटिंग रखें, पर पक्की बुकिंग का समय सुरक्षित रखें', restockEn: 'Offer low, mid and higher gift price points; refill sizes that moved during Diwali rather than assuming everything will repeat.', restockHi: 'कम, मध्यम और ऊँचे दाम के गिफ्ट रखें; दिवाली में जो आकार बिके वही भरें, हर चीज़ की माँग दोहराएगी ऐसा न मानें।', insightEn: 'Bhai Dooj is gift-and-family-visit oriented; small packs and easy carrying may matter more than broad inventory.', insightHi: 'भाई दूज में गिफ्ट और परिवार से मिलना अहम है; बड़े स्टॉक से ज़्यादा छोटे और आसानी से ले जाने वाले पैक काम आ सकते हैं।' },
  { matches: ['chhath-puja'], goodsEn: 'baskets, coconuts, bananas and other fruit, sugarcane where customary, diyas and thekua ingredients', goodsHi: 'टोकरी, नारियल, केला और अन्य फल, स्थानीय प्रथा के अनुसार गन्ना, दीये और ठेकुआ सामग्री', foodEn: 'thekua ingredients, flour, jaggery, ghee, coconuts, bananas and fresh produce for offerings', foodHi: 'ठेकुआ सामग्री, आटा, गुड़, घी, नारियल, केला और भोग के लिए ताज़ी उपज', serviceEn: 'confirm appointments and collection times early because some customers may travel or observe long rituals', serviceHi: 'अपॉइंटमेंट और पिकअप समय पहले पक्का करें, क्योंकि कुछ ग्राहक यात्रा या लंबे अनुष्ठान में हो सकते हैं', restockEn: 'Chhath is especially regional; check local enquiries first and replenish fresh produce in short cycles.', restockHi: 'छठ की माँग खास तौर पर क्षेत्रीय है; पहले स्थानीय पूछताछ देखें और ताज़ी उपज कम अंतराल में भरें।', insightEn: 'Thekua, fruit offerings and baskets are relevant where Chhath is observed; local community demand matters most.', insightHi: 'जहाँ छठ मनाया जाता है वहाँ ठेकुआ, फल और टोकरी की माँग हो सकती है; स्थानीय समुदाय की माँग सबसे अहम है।' },
  { matches: ['tulsi-vivah'], goodsEn: 'tulsi pots or plants, flowers, garlands, puja kits, diyas, sweets and regionally customary offerings', goodsHi: 'तुलसी के गमले/पौधे, फूल, माला, पूजा किट, दीये, मिठाई और स्थानीय प्रथा का भोग', foodEn: 'small sweets, fruit, flowers and simple offering ingredients requested for Tulsi puja', foodHi: 'छोटी मिठाई, फल, फूल और तुलसी पूजा में माँगी जाने वाली भोग सामग्री', serviceEn: 'keep normal grooming slots and confirmed alterations; do not assume bridal-level demand without bookings', serviceHi: 'सामान्य ग्रूमिंग स्लॉट और पक्की फिटिंग रखें; बुकिंग बिना ब्राइडल माँग न मानें', restockEn: 'Buy living plants and flowers close to expected demand, and confirm regional customs before seasonal orders.', restockHi: 'जीवित पौधे और फूल माँग के करीब खरीदें और मौसमी ऑर्डर से पहले स्थानीय प्रथा की पुष्टि करें।', insightEn: 'Tulsi Vivah demand is devotional and regional; freshness and local observance matter more than broad discounts.', insightHi: 'तुलसी विवाह की माँग धार्मिक और क्षेत्रीय है; ताज़गी और स्थानीय आयोजन बड़े डिस्काउंट से ज़्यादा अहम हैं।' },
  { matches: ['guru-nanak-jayanti'], goodsEn: 'flour, lentils, rice, oil, ghee, water and practical serving supplies for community meals; flowers or diyas if requested', goodsHi: 'सामुदायिक भोजन के लिए आटा, दाल, चावल, तेल, घी, पानी और परोसने की सामग्री; माँग पर फूल/दीये', foodEn: 'langar-friendly staples, flour, lentils, rice, oil, ghee, vegetables and serving/packing supplies', foodHi: 'लंगर के लिए आटा, दाल, चावल, तेल, घी, सब्ज़ियाँ और परोसने/पैकिंग की सामग्री', serviceEn: 'check local opening hours and confirmed customer timings around processions or community events', serviceHi: 'जुलूस या सामुदायिक कार्यक्रम के आसपास खुलने का समय और ग्राहकों के स्लॉट पक्का करें', restockEn: 'For community meals, take group pre-orders where possible; avoid large quantity estimates without a confirmed event.', restockHi: 'सामुदायिक भोजन के लिए संभव हो तो समूह-ऑर्डर लें; पक्का कार्यक्रम न हो तो बड़ी मात्रा का अनुमान न लगाएँ।', insightEn: 'Langar, community gatherings and local travel can affect demand unevenly; confirmed group orders and opening hours are key signals.', insightHi: 'लंगर, सामुदायिक आयोजन और यात्रा माँग बदलते हैं; पक्के समूह-ऑर्डर और खुलने का समय अहम संकेत हैं।' },
  { matches: ['vivah-panchami'], goodsEn: 'flowers, garlands, puja supplies, sweets, decorative cloth and locally requested wedding-ceremony essentials', goodsHi: 'फूल, माला, पूजा सामग्री, मिठाई, सजावटी कपड़ा और स्थानीय माँग की विवाह सामग्री', foodEn: 'sweets, fresh ingredients, small gift packs and catered food only for confirmed ceremonies', foodHi: 'मिठाई, ताज़ी सामग्री, छोटे गिफ्ट पैक और केवल पक्के समारोह का कैटरिंग भोजन', serviceEn: 'confirm occasion makeup/hair bookings and wedding-wear fitting, blouse finishing or urgent alterations', serviceHi: 'अवसर मेकअप/हेयर बुकिंग और शादी के कपड़ों की फिटिंग, ब्लाउज़ फिनिशिंग या जल्दी बदलाव पक्का करें', restockEn: 'Take pre-orders and confirm delivery or service dates before committing cash to ceremony-related stock.', restockHi: 'समारोह के सामान पर पैसा लगाने से पहले ऑर्डर और डिलीवरी/सेवा की तारीख़ पक्की करें।', insightEn: 'Vivah Panchami is not observed equally everywhere; ceremony-related demand appears where local customers celebrate it.', insightHi: 'विवाह पंचमी हर जगह समान रूप से नहीं मनाई जाती; समारोह की माँग वहीं होगी जहाँ स्थानीय ग्राहक इसे मनाते हैं।' },
  { matches: ['gita-jayanti'], goodsEn: 'religious books, bookmarks, puja supplies, flowers, fruit and modest devotional gifts requested locally', goodsHi: 'धार्मिक पुस्तकें, बुकमार्क, पूजा सामग्री, फूल, फल और स्थानीय माँग के छोटे धार्मिक गिफ्ट', foodEn: 'fruit offerings, simple sweets and snack packs for local religious gatherings', foodHi: 'फल का भोग, साधारण मिठाई और स्थानीय धार्मिक आयोजन के स्नैक पैक', serviceEn: 'maintain normal appointments and confirmed alterations rather than assuming a large occasion-services rush', serviceHi: 'बड़ी अवसर-सेवा की भीड़ मानने के बजाय नियमित अपॉइंटमेंट और पक्की फिटिंग रखें', restockEn: 'Keep quantities modest unless a local temple, school or community group has placed a clear order.', restockHi: 'जब तक मंदिर, स्कूल या समुदाय से स्पष्ट ऑर्डर न हो, मात्रा सीमित रखें।', insightEn: 'Gita Jayanti interest is devotional; books and offerings may matter more than decorations or gift-heavy inventory.', insightHi: 'गीता जयंती धार्मिक रुचि से जुड़ी है; सजावट या बहुत गिफ्ट स्टॉक से ज़्यादा पुस्तकें और भोग उपयोगी हो सकते हैं।' },
  { matches: ['dattatreya-jayanti'], goodsEn: 'flowers, fruit, puja kits, incense and small devotional items requested by local customers', goodsHi: 'फूल, फल, पूजा किट, अगरबत्ती और स्थानीय माँग वाले छोटे धार्मिक सामान', foodEn: 'fresh fruit offerings, small sweets and simple ingredients for devotional meals', foodHi: 'ताज़े फल का भोग, छोटी मिठाई और धार्मिक भोजन की साधारण सामग्री', serviceEn: 'keep routine appointments and confirmed alteration or collection jobs, with no speculative extra capacity', serviceHi: 'नियमित अपॉइंटमेंट और पक्की फिटिंग/पिकअप रखें; अनुमान से अतिरिक्त क्षमता न लें', restockEn: 'Refresh flowers and fresh offerings close to the day; keep devotional items in proportion to local enquiries.', restockHi: 'फूल और ताज़ा भोग सामग्री दिन के करीब भरें; धार्मिक सामान की मात्रा स्थानीय पूछताछ से तय करें।', insightEn: 'Dattatreya Jayanti demand centres on local worship and offerings, so nearby observance is the deciding factor.', insightHi: 'दत्तात्रेय जयंती की माँग स्थानीय पूजा और भोग पर निर्भर है; आसपास यह पर्व मनाया जाना सबसे अहम संकेत है।' },
  { matches: ['christmas'], goodsEn: 'chocolates, cakes, gift wrap, greeting cards, lights, small decorations and party supplies', goodsHi: 'चॉकलेट, केक, गिफ्ट रैप, ग्रीटिंग कार्ड, लाइट, छोटी सजावट और पार्टी सामग्री', foodEn: 'cakes, cookies, pastries, chocolates, hampers, festive snacks and food-safe gift packaging', foodHi: 'केक, कुकीज़, पेस्ट्री, चॉकलेट, हैम्पर, त्योहार स्नैक्स और फूड-सेफ पैकिंग', serviceEn: 'book party grooming and hair styling slots; for tailoring, plan party outfit alterations and confirmed delivery', serviceHi: 'पार्टी ग्रूमिंग/हेयर स्टाइलिंग बुक करें; सिलाई में पार्टी कपड़ों की फिटिंग और पक्की डिलीवरी देखें', restockEn: 'Use pre-orders and pickup slots for cakes and gifts; buy perishables close to confirmed demand and keep packaging ready.', restockHi: 'केक और गिफ्ट के लिए पहले ऑर्डर व पिकअप समय तय करें; जल्दी खराब होने वाली चीज़ें पक्की माँग के अनुसार खरीदें।', insightEn: 'Christmas demand leans toward gifts, sweets, parties and decorations; expand only the lines that match your usual customers.', insightHi: 'क्रिसमस में गिफ्ट, मिठाई, पार्टी और सजावट की माँग हो सकती है; केवल वही सामान बढ़ाएँ जो आपके ग्राहकों से मेल खाता है।' },
  { matches: ['makar-sankranti'], goodsEn: 'sesame, jaggery, peanuts, chikki, kite paper and string; rice and milk for Pongal where customary', goodsHi: 'तिल, गुड़, मूँगफली, चिक्की, पतंग का कागज़ और डोर; स्थानीय प्रथा के अनुसार पोंगल का चावल-दूध', foodEn: 'til-gud sweets, chikki, peanuts, jaggery treats, rice-based Pongal ingredients and seasonal produce', foodHi: 'तिल-गुड़ मिठाई, चिक्की, मूँगफली, गुड़ के पकवान, पोंगल का चावल और मौसमी उपज', serviceEn: 'confirm region-specific festive appointments and clothing jobs; local celebrations vary widely', serviceHi: 'क्षेत्रीय त्योहार की बुकिंग और कपड़ों का काम पक्का करें; स्थानीय उत्सव बहुत अलग हो सकते हैं', restockEn: 'In kite markets compare last season’s sales; in food markets protect freshness and replenish smaller batches.', restockHi: 'पतंग वाले बाज़ार में पिछले सीज़न की बिक्री देखें; खाद्य सामान में ताज़गी रखें और छोटे बैच भरें।', insightEn: 'Sankranti/Pongal buying differs by region: kites in some places, til-gud or rice-and-milk ingredients in others.', insightHi: 'संक्रांति/पोंगल की खरीद क्षेत्र के अनुसार बदलती है: कहीं पतंग, कहीं तिल-गुड़ या चावल-दूध की सामग्री।' },
  { matches: ['vasant-panchami'], goodsEn: 'yellow flowers, yellow sweets, puja items, notebooks, pens and learning-related gifts', goodsHi: 'पीले फूल, पीली मिठाई, पूजा सामग्री, कॉपी, पेन और पढ़ाई से जुड़े गिफ्ट', foodEn: 'yellow sweets, seasonal dessert ingredients, fruit offerings and snacks for local puja gatherings', foodHi: 'पीली मिठाई, मौसमी मिठाई सामग्री, फल का भोग और पूजा आयोजन के स्नैक्स', serviceEn: 'keep normal appointment and alteration capacity; take only locally requested yellow or festive outfit work', serviceHi: 'सामान्य अपॉइंटमेंट और फिटिंग क्षमता रखें; पीले/त्योहार कपड़ों का काम स्थानीय माँग पर लें', restockEn: 'Limit seasonal-colour products to what sells locally; stationery or books may matter more than decor in some areas.', restockHi: 'मौसमी रंग के सामान की मात्रा स्थानीय बिक्री से तय करें; कुछ इलाकों में सजावट से ज़्यादा स्टेशनरी/किताबें प्रासंगिक होंगी।', insightEn: 'Vasant Panchami blends Saraswati worship with regional customs; nearby customer mix determines which products fit.', insightHi: 'बसंत पंचमी में सरस्वती पूजा और क्षेत्रीय रिवाज़ जुड़ते हैं; सही सामान आसपास के ग्राहकों पर निर्भर है।' },
  { matches: ['maha-shivratri'], goodsEn: 'bilva leaves, flowers, milk, fruit, diyas, incense, puja kits and locally requested fasting ingredients', goodsHi: 'बेलपत्र, फूल, दूध, फल, दीये, अगरबत्ती, पूजा किट और स्थानीय माँग की व्रत सामग्री', foodEn: 'fresh fruit, milk-based offerings, vrat ingredients and simple fasting snacks', foodHi: 'ताज़े फल, दूध वाले भोग, व्रत सामग्री और साधारण व्रत स्नैक्स', serviceEn: 'confirm bookings around temple visits; keep confirmed service slots and urgent alterations realistic', serviceHi: 'मंदिर जाने के समय के आसपास बुकिंग पक्की करें; सेवा स्लॉट और जल्दी फिटिंग का समय वास्तविक रखें', restockEn: 'Flowers, fruit and dairy turn over quickly; replenish close to demand and avoid excess perishables after the ritual window.', restockHi: 'फूल, फल और डेयरी चीज़ें जल्दी बदलती हैं; माँग के करीब भरें और पूजा के बाद बचा खराब होने वाला स्टॉक न रखें।', insightEn: 'Maha Shivratri buying often centres on worship and fasting; local temple footfall and observance timing affect the rush.', insightHi: 'महाशिवरात्रि की खरीद अक्सर पूजा और व्रत पर केंद्रित होती है; मंदिर में भीड़ और पूजा का समय माँग बदलते हैं।' },
  { matches: ['holi'], goodsEn: 'skin-safer colours, gulal, pichkaris, water-play items, gujiya ingredients, snacks and cleanup supplies', goodsHi: 'त्वचा के लिए सुरक्षित रंग, गुलाल, पिचकारी, पानी के खेल का सामान, गुजिया सामग्री, स्नैक्स और सफ़ाई की चीज़ें', foodEn: 'gujiya, sweets, thandai ingredients, snacks and food-safe packs for family gatherings', foodHi: 'गुजिया, मिठाई, ठंडाई सामग्री, स्नैक्स और पारिवारिक मिलन के फूड-सेफ पैक', serviceEn: 'book post-Holi hair/skin clean-up and pre-festival grooming; schedule confirmed outfit repairs only', serviceHi: 'होली के बाद हेयर/स्किन क्लीन-अप और पहले की ग्रूमिंग बुक करें; कपड़ों की मरम्मत का पक्का समय लें', restockEn: 'Buy colours from known suppliers and use prior local sales; plan cleanup or post-festival service capacity too.', restockHi: 'रंग भरोसेमंद सप्लायर से लें और पिछली स्थानीय बिक्री देखें; सफ़ाई या बाद की सेवा की क्षमता भी रखें।', insightEn: 'Holi combines colours, sweets and gatherings; safe products and post-event cleanup may matter as much as the festival-day rush.', insightHi: 'होली में रंग, मिठाई और मेल-मिलाप जुड़ते हैं; सुरक्षित सामान और बाद की सफ़ाई की ज़रूरत भी अहम हो सकती है।' },
  { matches: ['gudi-padwa'], goodsEn: 'gudi accessories, mango-leaf torans, flowers, neem, jaggery, sweets and new-year puja supplies', goodsHi: 'गुड़ी की सामग्री, आम के पत्तों के तोरण, फूल, नीम, गुड़, मिठाई और नए साल की पूजा सामग्री', foodEn: 'puran poli or regional sweets, jaggery, neem, fresh produce and festive food packs', foodHi: 'पूरनपोली या क्षेत्रीय मिठाई, गुड़, नीम, ताज़ी उपज और त्योहार के खाद्य पैक', serviceEn: 'book new-year grooming and festive outfit finishing ahead of family visits', serviceHi: 'पारिवारिक मिलन से पहले नए साल की ग्रूमिंग और त्योहार कपड़ों की फिनिशिंग बुक करें', restockEn: 'New-year rituals vary by region; pre-pack locally familiar items and buy perishables in small batches.', restockHi: 'नए साल की पूजा क्षेत्र के अनुसार बदलती है; स्थानीय पहचान वाले पैक बनाएँ और ताज़ा चीज़ें छोटे बैच में लें।', insightEn: 'Gudi Padwa/Ugadi mark the new year in different regional traditions; neighbourhood-specific foods and puja items matter.', insightHi: 'गुड़ी पड़वा/उगादी अलग क्षेत्रीय परंपराओं में नया साल हैं; इलाके के विशेष भोजन और पूजा सामग्री अहम हैं।' },
  { matches: ['ram-navami'], goodsEn: 'flowers, fruit, puja kits, incense, small flags, sweets and local prasad ingredients', goodsHi: 'फूल, फल, पूजा किट, अगरबत्ती, छोटे झंडे, मिठाई और स्थानीय प्रसाद सामग्री', foodEn: 'fruit, simple sweets, vrat ingredients and small prasad packs for temple/family demand', foodHi: 'फल, साधारण मिठाई, व्रत सामग्री और मंदिर/परिवार की माँग के छोटे प्रसाद पैक', serviceEn: 'confirm appointments around temple and family schedules; prioritise agreed times and delivery promises', serviceHi: 'मंदिर और परिवार के कार्यक्रम के हिसाब से अपॉइंटमेंट पक्का करें; तय समय और डिलीवरी निभाएँ', restockEn: 'Prepare small fresh offering packs and check temple requests before making large batches.', restockHi: 'छोटे ताज़ा प्रसाद पैक बनाएँ और बड़ा बैच बनाने से पहले मंदिर की माँग देखें।', insightEn: 'Ram Navami purchasing often follows worship and prasad routines rather than broad discount shopping.', insightHi: 'राम नवमी की खरीद पूजा और प्रसाद से जुड़ी होती है, बड़ी डिस्काउंट खरीदारी से नहीं।' },
  { matches: ['akshaya-tritiya'], goodsEn: 'giftable metal items or coins where already sold, sweets, puja supplies and wedding-gift essentials', goodsHi: 'जहाँ पहले से बिकते हों वहाँ गिफ्ट योग्य धातु की चीज़ें/सिक्के, मिठाई, पूजा सामग्री और विवाह गिफ्ट', foodEn: 'premium sweets, dry-fruit gifts and food hampers only where past sales support them', foodHi: 'प्रीमियम मिठाई, सूखे मेवे के गिफ्ट और फूड हैम्पर केवल जहाँ पिछली बिक्री इसका समर्थन करे', serviceEn: 'confirm wedding/occasion bookings, outfit fittings and delivery dates before reserving time or materials', serviceHi: 'समय या सामग्री रोकने से पहले शादी/अवसर की बुकिंग, कपड़ों की फिटिंग और डिलीवरी की तारीख़ पक्की करें', restockEn: 'Higher-ticket purchases tie up cash; keep premium orders conservative and use confirmed orders or reliable sales history.', restockHi: 'महँगी खरीद में नकदी फँसती है; प्रीमियम ऑर्डर सीमित रखें और पक्के ऑर्डर/भरोसेमंद बिक्री पर खरीदें।', insightEn: 'Akshaya Tritiya is associated with auspicious purchases in many communities, but budgets and product choices vary widely.', insightHi: 'अक्षय तृतीया पर कई समुदाय शुभ खरीद करते हैं, लेकिन बजट और उत्पाद की पसंद बहुत बदलती है।' },
  { matches: ['guru-purnima'], goodsEn: 'books, notebooks, bookmarks, flowers, cards, modest gifts, sweets and puja essentials requested locally', goodsHi: 'किताबें, कॉपी, बुकमार्क, फूल, कार्ड, छोटे गिफ्ट, मिठाई और स्थानीय माँग की पूजा सामग्री', foodEn: 'small sweets, fruit offerings and snack packs for local temple, school or community events', foodHi: 'स्थानीय मंदिर, स्कूल या समुदाय के आयोजन के लिए छोटी मिठाई, फल का भोग और स्नैक पैक', serviceEn: 'maintain regular appointments and confirmed alteration jobs; do not assume a broad festive rush', serviceHi: 'नियमित अपॉइंटमेंट और पक्की फिटिंग रखें; बड़ी त्योहार भीड़ न मानें', restockEn: 'Compare school or community enquiries; keep flowers and sweets tied to confirmed local events.', restockHi: 'स्कूल/समुदाय की पूछताछ देखें; फूल और मिठाई की मात्रा पक्के स्थानीय आयोजन के अनुसार रखें।', insightEn: 'Guru Purnima can support education and devotional purchases but does not create equal demand across shop categories.', insightHi: 'गुरु पूर्णिमा पर पढ़ाई और धार्मिक खरीद हो सकती है, लेकिन हर दुकान की श्रेणी में समान माँग नहीं बनती।' },
  { matches: ['raksha-bandhan'], goodsEn: 'rakhis, rakhi gift packs, sweets, chocolates, envelopes, gift wrap and small accessories', goodsHi: 'राखी, राखी गिफ्ट पैक, मिठाई, चॉकलेट, लिफ़ाफ़े, गिफ्ट रैप और छोटी एक्सेसरी', foodEn: 'sweets, chocolates, dry-fruit packs, small cakes and easy-to-carry sibling gift boxes', foodHi: 'मिठाई, चॉकलेट, सूखे मेवे के पैक, छोटे केक और भाई-बहन के गिफ्ट बॉक्स', serviceEn: 'book grooming and family-event styling; for tailoring, focus on last-minute outfit fixes and promised deliveries', serviceHi: 'ग्रूमिंग और पारिवारिक स्टाइलिंग बुक करें; सिलाई में आख़िरी फिटिंग और वादा की गई डिलीवरी देखें', restockEn: 'Affordable gifts and neat packaging matter; replenish popular price points and sell-through sizes rather than deep stock.', restockHi: 'किफ़ायती गिफ्ट और अच्छी पैकिंग अहम हैं; लोकप्रिय दाम और बिकने वाले आकार भरें, बहुत ज़्यादा स्टॉक नहीं।', insightEn: 'Raksha Bandhan is gift-and-confectionery led; small packs and convenience often beat expensive speculative inventory.', insightHi: 'रक्षा बंधन में गिफ्ट और मिठाई अहम हैं; छोटे पैक और सुविधा, अनुमान से महँगे स्टॉक से बेहतर हो सकते हैं।' },
  { matches: ['janmashtami'], goodsEn: 'makhan-mishri, milk and curd, fruit, flutes, peacock-feather décor, Krishna puja kits and sweets', goodsHi: 'माखन-मिश्री, दूध-दही, फल, बाँसुरी, मोरपंख सजावट, कृष्ण पूजा किट और मिठाई', foodEn: 'milk, curd, butter, fruit, vrat ingredients, makhan-mishri and small fresh sweets', foodHi: 'दूध, दही, मक्खन, फल, व्रत सामग्री, माखन-मिश्री और छोटी ताज़ी मिठाई', serviceEn: 'confirm appointment times around evening or midnight observances; accept only realistic outfit alterations', serviceHi: 'शाम/आधी रात की पूजा के अनुसार अपॉइंटमेंट समय पक्का करें; कपड़ों की वही फिटिंग लें जो समय पर हो सके', restockEn: 'Milk, curd and fresh sweets are perishable; buy close to local celebrations and limit leftover stock.', restockHi: 'दूध, दही और ताज़ी मिठाई जल्दी खराब होती है; स्थानीय आयोजन के करीब खरीदें और बचा स्टॉक सीमित रखें।', insightEn: 'Janmashtami demand may centre on devotional décor, dairy and fasting foods; the timing differs between daytime and midnight observances.', insightHi: 'जन्माष्टमी की माँग धार्मिक सजावट, डेयरी और व्रत सामग्री पर हो सकती है; दिन और आधी रात की पूजा का समय अलग होता है।' },
  { matches: ['ganesh-chaturthi'], goodsEn: 'eco-conscious Ganesh puja kits, durva, flowers, modak ingredients, incense, diyas, torans and decorations', goodsHi: 'पर्यावरण-अनुकूल गणेश पूजा किट, दूर्वा, फूल, मोदक सामग्री, अगरबत्ती, दीये, तोरण और सजावट', foodEn: 'modaks, coconut, jaggery, rice flour, fruit, sweets and reusable or food-safe serving supplies', foodHi: 'मोदक, नारियल, गुड़, चावल का आटा, फल, मिठाई और दोबारा उपयोग/फूड-सेफ सर्विंग सामग्री', serviceEn: 'plan appointments around installation and visarjan schedules; for tailoring, set realistic festive collection dates', serviceHi: 'स्थापना/विसर्जन के कार्यक्रम के अनुसार अपॉइंटमेंट रखें; सिलाई में वास्तविक डिलीवरी तारीख़ दें', restockEn: 'Demand comes in waves from installation to immersion; split orders across days and avoid excess perishable offerings.', restockHi: 'स्थापना से विसर्जन तक माँग कई चरणों में आती है; ऑर्डर दिन के हिसाब से बाँटें और ताज़ा भोग ज़्यादा न रखें।', insightEn: 'Modaks, puja supplies and decorations dominate relevant categories; immersion schedules and eco-conscious choices influence demand.', insightHi: 'संबंधित दुकानों में मोदक, पूजा सामग्री और सजावट अहम हैं; विसर्जन का समय और पर्यावरण-अनुकूल विकल्प माँग बदलते हैं।' },
  { matches: ['onam'], goodsEn: 'banana leaves, rice, coconut, seasonal vegetables, flowers, banana chips, payasam ingredients and traditional attire where sold', goodsHi: 'केले के पत्ते, चावल, नारियल, मौसमी सब्ज़ियाँ, फूल, केले के चिप्स, पायसम सामग्री और जहाँ बिके पारंपरिक कपड़े', foodEn: 'rice, coconut, vegetables, banana leaves, banana chips, payasam ingredients and confirmed sadya orders', foodHi: 'चावल, नारियल, सब्ज़ियाँ, केले के पत्ते, केले के चिप्स, पायसम सामग्री और पक्के सद्या ऑर्डर', serviceEn: 'book grooming and traditional-outfit fitting ahead of family gatherings; confirm collection times', serviceHi: 'पारिवारिक मिलन से पहले ग्रूमिंग और पारंपरिक कपड़ों की फिटिंग बुक करें; पिकअप समय पक्का करें', restockEn: 'Take meal headcounts in advance; buy fresh produce and banana leaves in short cycles to reduce waste.', restockHi: 'भोजन के लिए पहले लोगों की संख्या लें; ताज़ी सब्ज़ियाँ और केले के पत्ते कम अंतराल में खरीदें।', insightEn: 'Onam buying is regional and food-centred; confirmed meal counts beat estimates based only on the date.', insightHi: 'ओणम की खरीद क्षेत्रीय और खाने पर केंद्रित है; लोगों की पक्की संख्या तारीख़ के अनुमान से बेहतर है।' },
  { matches: ['navratri'], goodsEn: 'fasting flour and snacks, rock salt, dry fruits, puja flowers, garba/dandiya accessories and local festive wear', goodsHi: 'व्रत का आटा-स्नैक्स, सेंधा नमक, सूखे मेवे, पूजा फूल, गरबा/डांडिया एक्सेसरी और स्थानीय त्योहार कपड़े', foodEn: 'fasting ingredients, rock salt, fruit, dry fruits, snacks and local ready-to-eat options', foodHi: 'व्रत सामग्री, सेंधा नमक, फल, सूखे मेवे, स्नैक्स और स्थानीय तैयार खाने के विकल्प', serviceEn: 'reserve evening makeup/hair slots for garba where popular; for tailoring, confirm regional outfit fittings', serviceHi: 'जहाँ गरबा लोकप्रिय है वहाँ शाम के मेकअप/हेयर स्लॉट रखें; सिलाई में क्षेत्रीय कपड़ों की फिटिंग पक्की करें', restockEn: 'Navratri lasts several days; replenish daily from sell-through and local customs rather than one oversized order.', restockHi: 'नवरात्रि कई दिन चलती है; एक बड़ा ऑर्डर देने के बजाय रोज़ की बिक्री और स्थानीय प्रथा से भरें।', insightEn: 'Fasting foods, garba wear and evening grooming matter only in some communities; local observance and schedules drive demand.', insightHi: 'व्रत सामग्री, गरबा कपड़े और शाम की ग्रूमिंग कुछ समुदायों में प्रासंगिक हैं; स्थानीय आयोजन माँग तय करते हैं।' },
  { matches: ['dussehra'], goodsEn: 'marigold flowers, garlands, torans, puja items, sweets and proven seasonal household items', goodsHi: 'गेंदा फूल, माला, तोरण, पूजा सामग्री, मिठाई और पहले से लोकप्रिय मौसमी घरेलू चीज़ें', foodEn: 'sweets, snacks, fresh fruit and small meal or gift packs for family visits', foodHi: 'मिठाई, स्नैक्स, ताज़े फल और परिवार से मिलने के छोटे भोजन/गिफ्ट पैक', serviceEn: 'confirm family-event grooming slots and last-minute outfit fixes with realistic delivery times', serviceHi: 'पारिवारिक ग्रूमिंग और कपड़ों की आख़िरी फिटिंग का समय वास्तविक रखकर पक्का करें', restockEn: 'The rush is close to the day; prioritise quick replenishment and avoid leftover flowers, sweets or temporary décor.', restockHi: 'भीड़ पर्व के दिन के करीब होती है; जल्दी भरने वाला सामान रखें और फूल, मिठाई या अस्थायी सजावट न बचाएँ।', insightEn: 'Dussehra demand often centres on puja, flowers, sweets and family outings; local customs decide which items move.', insightHi: 'दशहरा की माँग पूजा, फूल, मिठाई और परिवार के बाहर जाने से जुड़ी हो सकती है; बिक्री स्थानीय रिवाज़ तय करते हैं।' },
];

const DEFAULT_FESTIVAL_PLAN = {
  goodsEn: 'your shop’s established best-sellers and locally requested seasonal items',
  goodsHi: 'दुकान में पहले से बिकने वाला सामान और स्थानीय माँग की मौसमी चीज़ें',
  foodEn: 'your best-selling fresh foods and small packs customers request',
  foodHi: 'पहले से बिकने वाला ताज़ा भोजन और ग्राहकों की माँग वाले छोटे पैक',
  serviceEn: 'confirmed appointments, service consumables and promised collection times',
  serviceHi: 'पक्के अपॉइंटमेंट, सेवा सामग्री और तय पिकअप समय',
  restockEn: 'Review recent item-level sales, confirmed orders and physical stock. Refill proven sellers in small batches, not unfamiliar products just because a festival is near.',
  restockHi: 'हाल की सामान-वार बिक्री, पक्के ऑर्डर और मौजूदा स्टॉक गिनें। साबित बिकने वाला सामान छोटे बैच में भरें, त्योहार के कारण अनजान सामान नहीं।',
  insightEn: 'Local observance, customer requests and actual sales are more reliable than assuming every festival creates the same demand.',
  insightHi: 'स्थानीय आयोजन, ग्राहक की पूछताछ और वास्तविक बिक्री, हर त्योहार की एक जैसी माँग मानने से बेहतर संकेत हैं.',
};

function getFestivalShopFocus(shopType: ShopType | null | undefined): FestivalShopFocus {
  if (shopType === 'salon') return 'salon';
  if (shopType === 'tailor') return 'tailor';
  if (shopType === 'medical') return 'medical';
  if (shopType === 'hardware') return 'hardware';
  if (shopType === 'mobile') return 'mobile';
  if (shopType === 'bakery' || shopType === 'sweet' || shopType === 'tea' || shopType === 'restaurant' || shopType === 'vegetable') return 'food';
  return 'goods';
}


function getHardwareFestivalProducts(id: string, lang: 'en' | 'hi'): string {
  const has = (...matches: string[]) => matches.some(match => id.includes(match));
  if (has('diwali', 'dhanteras', 'christmas')) {
    return lang === 'hi'
      ? 'LED/सजावटी लाइट, सुरक्षित कनेक्टर, एक्सटेंशन बोर्ड, दीये और तोरण—केवल मौजूदा रेंज के तेज़ बिकने वाले आइटम'
      : 'LED/decorative lights, safe connectors, extension boards, diyas and torans—but only proven items already in your range';
  }
  if (has('ganesh-chaturthi', 'janmashtami', 'navratri', 'dussehra', 'gudi-padwa', 'tulsi-vivah', 'ram-navami', 'maha-shivratri', 'govardhan', 'guru-nanak', 'dattatreya', 'gita-jayanti', 'vivah-panchami', 'guru-purnima')) {
    return lang === 'hi'
      ? 'छोटे पूजा लैंप, दीये, तोरण के हुक और सजावटी फिटिंग—सिर्फ वही जो आपकी हार्डवेयर दुकान में पहले से बिकते हैं'
      : 'small puja lamps, diyas, toran hooks and decorative fittings—only lines already sold by your hardware shop';
  }
  if (has('holi')) {
    return lang === 'hi'
      ? 'सफ़ाई की सामग्री और पानी के खेल का सामान केवल यदि पहले से बिकता हो; पानी के पास बिजली के सामान की सुरक्षा पर ध्यान दें'
      : 'cleanup supplies and water-play items only if already sold; take extra care with electrical products around water';
  }
  if (has('makar-sankranti')) {
    return lang === 'hi'
      ? 'पतंग की डोर या संबंधित सामान केवल यदि आपके ग्राहक पहले से माँगते हों; अन्यथा नियमित तेज़ बिकने वाला हार्डवेयर'
      : 'kite string or related accessories only if your customers already request them; otherwise stick to regular hardware best-sellers';
  }
  if (has('akshaya-tritiya', 'bhai-dooj', 'raksha-bandhan')) {
    return lang === 'hi'
      ? 'गिफ्ट योग्य घरेलू उपयोग की चीज़ें और छोटे उपयोगी सामान; महँगा या नया उत्पाद अनुमान से न जोड़ें'
      : 'giftable home-use items and small practical products; do not add expensive or unfamiliar lines speculatively';
  }
  return lang === 'hi'
    ? 'नियमित तेज़ बिकने वाला हार्डवेयर और मौजूदा पूजा/घरेलू सामान; नए त्योहार स्टॉक से पहले ग्राहक की माँग जाँचें'
    : 'regular hardware best-sellers and existing puja/household items; check customer requests before adding festival stock';
}

function getMobileFestivalProducts(id: string, lang: 'en' | 'hi'): string {
  const giftFestivals = ['dhanteras', 'diwali', 'christmas', 'bhai-dooj', 'raksha-bandhan', 'akshaya-tritiya'];
  if (giftFestivals.some(match => id.includes(match))) {
    return lang === 'hi'
      ? 'गिफ्ट योग्य फोन कवर, चार्जर, केबल, ईयरबड और पावर एक्सेसरी; महँगे डिवाइस पक्के ऑर्डर या भरोसेमंद बिक्री पर ही लें'
      : 'giftable phone covers, chargers, cables, earbuds and power accessories; buy costly devices only against confirmed orders or reliable sales';
  }
  if (id.includes('holi')) {
    return lang === 'hi'
      ? 'प्रोटेक्टिव कवर, स्क्रीन गार्ड और सामान्य एक्सेसरी; पानी से सुरक्षा के बारे में स्पष्ट जानकारी दें और नया स्टॉक अनुमान से न भरें'
      : 'protective cases, screen guards and regular accessories; give clear water-protection information and avoid speculative stock';
  }
  return lang === 'hi'
    ? 'नियमित बिकने वाले कवर, चार्जर, केबल और एक्सेसरी; केवल त्योहार की तारीख़ देखकर महँगे फोन न खरीदें'
    : 'regularly selling covers, chargers, cables and accessories; do not buy expensive phones just because a festival is approaching';
}


function getFestivalServiceProducts(
  id: string,
  shopType: ShopType | null | undefined,
  lang: 'en' | 'hi',
  fallbackEn: string,
  fallbackHi: string,
): string {
  const salon = shopType === 'salon';
  const choose = (en: string, hi: string) => lang === 'hi' ? hi : en;
  if (salon) {
    if (id.includes('karwa-chauth')) return choose('pre-book mehendi, manicure and evening styling appointments; prepare the usual beauty consumables', 'मेहंदी, मैनीक्योर और शाम की स्टाइलिंग पहले बुक करें; सामान्य ब्यूटी सामग्री तैयार रखें');
    if (id.includes('navratri')) return choose('reserve evening makeup and hair-styling slots for garba nights where locally popular', 'जहाँ गरबा लोकप्रिय है वहाँ शाम के मेकअप और हेयर स्टाइलिंग स्लॉट रखें');
    if (id.includes('holi')) return choose('offer pre-Holi grooming and scheduled post-Holi hair/skin clean-up services', 'होली से पहले ग्रूमिंग और बाद में तय हेयर/स्किन क्लीन-अप सेवाएँ रखें');
    if (id.includes('vivah-panchami') || id.includes('akshaya-tritiya')) return choose('confirm occasion and wedding makeup/hair bookings with realistic service durations', 'अवसर और शादी के मेकअप/हेयर की बुकिंग पक्की करें और सेवा का वास्तविक समय तय करें');
    if (id.includes('diwali') || id.includes('dhanteras')) return choose('book pre-Diwali hair styling, makeup and grooming; protect booked time slots', 'दिवाली से पहले हेयर स्टाइलिंग, मेकअप और ग्रूमिंग बुक करें; पक्के स्लॉट सुरक्षित रखें');
    if (id.includes('christmas')) return choose('confirm party grooming, hair styling and nail appointments ahead of peak evening slots', 'व्यस्त शाम से पहले पार्टी ग्रूमिंग, हेयर स्टाइलिंग और नेल अपॉइंटमेंट पक्के करें');
    if (id.includes('raksha-bandhan') || id.includes('bhai-dooj')) return choose('offer family-visit grooming and quick styling appointments, timed around customer plans', 'ग्राहकों के कार्यक्रम के अनुसार परिवार से मिलने की ग्रूमिंग और जल्दी स्टाइलिंग के स्लॉट रखें');
    if (id.includes('ganesh-chaturthi')) return choose('schedule grooming around local Ganesh installation and immersion timings', 'स्थानीय गणेश स्थापना और विसर्जन के समय के अनुसार ग्रूमिंग स्लॉट रखें');
    if (id.includes('onam')) return choose('book grooming and occasion styling ahead of family gatherings', 'पारिवारिक मिलन से पहले ग्रूमिंग और अवसर स्टाइलिंग बुक करें');
    if (id.includes('gudi-padwa')) return choose('offer new-year grooming slots based on confirmed local family-event bookings', 'पक्की स्थानीय पारिवारिक बुकिंग के अनुसार नए साल की ग्रूमिंग के स्लॉट रखें');
    if (id.includes('janmashtami') || id.includes('maha-shivratri') || id.includes('ram-navami')) return choose('confirm appointment times around local temple visits and observance schedules', 'स्थानीय मंदिर जाने और पूजा के समय के अनुसार अपॉइंटमेंट पक्के करें');
    if (id.includes('chhath-puja')) return choose('confirm bookings early because customers may travel or observe long rituals', 'बुकिंग पहले पक्की करें क्योंकि ग्राहक यात्रा या लंबे अनुष्ठान में हो सकते हैं');
    return choose('keep normal appointments and the consumables used by booked services ready; do not assume a festival rush without enquiries', 'नियमित अपॉइंटमेंट और बुक सेवाओं की सामग्री तैयार रखें; पूछताछ बिना त्योहार की भीड़ न मानें');
  }
  if (id.includes('karwa-chauth')) return choose('prioritise blouse/saree finishing, falls and urgent alterations for confirmed festive outfits', 'पक्के त्योहार कपड़ों के लिए ब्लाउज़/साड़ी फिनिशिंग, फॉल और जल्दी फिटिंग को प्राथमिकता दें');
  if (id.includes('navratri')) return choose('take regional garba or festive-wear fittings only where customers wear them, and confirm collection slots', 'जहाँ गरबा/त्योहार कपड़े पहने जाते हों वहाँ ही फिटिंग लें और पिकअप स्लॉट पक्का करें');
  if (id.includes('holi')) return choose('plan simple casual-wear repairs and alterations already requested; avoid speculative garment stock', 'पहले से माँगी गई कैज़ुअल कपड़ों की मरम्मत/फिटिंग करें; अनुमान से कपड़ों का स्टॉक न लें');
  if (id.includes('vivah-panchami') || id.includes('akshaya-tritiya')) return choose('confirm wedding or occasion-wear fittings, measurements and delivery dates before accepting more work', 'शादी/अवसर के कपड़ों की फिटिंग, नाप और डिलीवरी तारीख़ पक्की करके ही नया काम लें');
  if (id.includes('diwali') || id.includes('dhanteras') || id.includes('bhai-dooj')) return choose('prioritise festive outfit alterations, blouse finishing and delivery dates already promised', 'पहले से वादा किए त्योहार कपड़ों की फिटिंग, ब्लाउज़ फिनिशिंग और डिलीवरी तारीख़ को प्राथमिकता दें');
  if (id.includes('raksha-bandhan')) return choose('keep capacity for quick outfit fixes and confirmed family-occasion alterations', 'जल्दी कपड़ों के बदलाव और पक्की पारिवारिक फिटिंग के लिए समय रखें');
  if (id.includes('christmas')) return choose('schedule party-wear alterations and confirm pickup times before the event date', 'कार्यक्रम से पहले पार्टी कपड़ों की फिटिंग और पिकअप समय तय करें');
  if (id.includes('onam')) return choose('confirm traditional-attire fitting and collection dates ahead of family gatherings', 'पारिवारिक मिलन से पहले पारंपरिक कपड़ों की फिटिंग और पिकअप तारीख़ पक्की करें');
  if (id.includes('gudi-padwa')) return choose('confirm new-year festive outfit finishing and alteration pickup dates', 'नए साल के त्योहार कपड़ों की फिनिशिंग और फिटिंग पिकअप तारीख़ पक्की करें');
  if (id.includes('janmashtami')) return choose('take children’s festive-costume work only if it is part of your normal service, with confirmed measurements', 'बच्चों के त्योहार कॉस्ट्यूम का काम केवल तभी लें जब यह आपकी सामान्य सेवा हो, नाप पक्का करके');
  if (id.includes('ganesh-chaturthi')) return choose('confirm traditional outfit alterations and delivery dates around installation/immersion days', 'स्थापना/विसर्जन के आसपास पारंपरिक कपड़ों की फिटिंग और डिलीवरी पक्की करें');
  if (id.includes('chhath-puja')) return choose('agree on collection dates before ritual days and avoid promising unachievable urgent work', 'पूजा के दिनों से पहले पिकअप तारीख़ तय करें और ऐसा जल्दी काम न लें जिसे समय पर पूरा न कर सकें');
  if (id.includes('vasant-panchami')) return choose('take yellow or school/family-event outfit alterations only when customers ask', 'पीले कपड़ों या स्कूल/परिवार आयोजन की फिटिंग केवल ग्राहक की माँग पर लें');
  return choose('keep confirmed alterations, fitting appointments and customer-approved garments organised; avoid unconfirmed seasonal work', 'पक्की फिटिंग, अपॉइंटमेंट और ग्राहक के तय कपड़े व्यवस्थित रखें; बिना पक्के ऑर्डर मौसमी काम न लें');
}

export function getFestivalShopAdvice(
  festivalId: string,
  shopType: ShopType | null | undefined,
  lang: 'en' | 'hi',
): FestivalShopAdvice {
  const id = festivalId.toLocaleLowerCase();
  const plan = FESTIVAL_SPECIFIC_PLANS.find(item => item.matches.some(match => id.includes(match))) || DEFAULT_FESTIVAL_PLAN;
  const focus = getFestivalShopFocus(shopType);
  const base = adviceForType(shopType, lang);
  const isService = shopType === 'salon' || shopType === 'tailor';
  const products = isService
    ? getFestivalServiceProducts(id, shopType, lang, plan.serviceEn, plan.serviceHi)
    : focus === 'food'
      ? (lang === 'hi' ? plan.foodHi : plan.foodEn)
      : focus === 'medical'
        ? (lang === 'hi'
          ? 'नियमित ज़रूरी दवाएँ, फर्स्ट-एड और हाइजीन सामग्री; एक्सपायरी और स्टोरेज जाँचें'
          : 'regular essential medicines, first-aid and hygiene supplies, with expiry and storage checks')
        : focus === 'hardware'
          ? getHardwareFestivalProducts(id, lang)
          : focus === 'mobile'
            ? getMobileFestivalProducts(id, lang)
            : (lang === 'hi' ? plan.goodsHi : plan.goodsEn);
  const productLabel = lang === 'hi' ? 'तैयार रखें' : 'Keep ready';
  const keepReady = productLabel + ': ' + products + '. ' + base.keepReady;
  const restock = (lang === 'hi' ? plan.restockHi : plan.restockEn) + ' ' + base.restock;
  const insight = (lang === 'hi' ? plan.insightHi : plan.insightEn) + ' ' + base.insight;
  return { keepReady, restock, insight };
}

export function getFestivalName(festival: UpcomingFestival, lang: 'en' | 'hi'): string {
  return lang === 'hi' ? festival.nameHi : festival.nameEn;
}
