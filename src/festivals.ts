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
  { id: 'dhanteras', date: '2026-11-06', nameEn: 'Dhanteras', nameHi: 'धनतेरस', emoji: '🪔' },
  { id: 'diwali', date: '2026-11-08', nameEn: 'Diwali (Lakshmi Puja)', nameHi: 'दिवाली (लक्ष्मी पूजा)', emoji: '🪔' },
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
  const endDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, now.getDate());
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

export function getFestivalShopAdvice(
  festivalId: string,
  shopType: ShopType | null | undefined,
  lang: 'en' | 'hi',
): FestivalShopAdvice {
  const advice = adviceForType(shopType, lang);
  const special = festivalId.includes('christmas')
    ? (lang === 'hi'
      ? 'क्रिसमस से पहले अपनी दुकान के प्रकार के अनुसार छुट्टी/गिफ्ट की माँग देखें; हर दुकान के लिए एक जैसी वस्तुएँ ज़रूरी नहीं होतीं।'
      : 'Before Christmas, use demand for your own shop type to plan holiday-related offers; the same products are not right for every business.')
    : festivalId.includes('dhanteras') || festivalId.includes('diwali')
      ? (lang === 'hi'
        ? 'दिवाली के आसपास माँग बढ़ सकती है, लेकिन बड़ी खरीद से पहले अपनी पिछली बिक्री, पक्के ऑर्डर और मौजूदा स्टॉक मिलाएँ।'
        : 'Demand can rise around Diwali, but check your sales history, confirmed orders and existing stock before making a large purchase.')
      : festivalId.includes('chhath')
        ? (lang === 'hi'
          ? 'छठ की माँग हर क्षेत्र में समान नहीं होती। अपने ग्राहकों की पूछताछ देखकर ही मात्रा तय करें।'
          : 'Chhath-related demand varies by region. Use local customer requests to decide quantities.')
        : (lang === 'hi'
          ? 'त्योहार स्थानीय स्तर पर अलग तरह से असर डाल सकता है। पहले ग्राहकों की माँग और अपने रिकॉर्ड देखें।'
          : 'Festival demand varies locally. Check customer requests and your own records before changing stock or staffing.');
  return {
    keepReady: advice.keepReady,
    restock: advice.restock,
    insight: special + ' ' + advice.insight,
  };
}

export function getFestivalName(festival: UpcomingFestival, lang: 'en' | 'hi'): string {
  return lang === 'hi' ? festival.nameHi : festival.nameEn;
}
