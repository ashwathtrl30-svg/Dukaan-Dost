import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { t } from '../i18n';
import { Play, CheckCircle, ChevronRight, RefreshCw, Store, ClipboardCheck } from 'lucide-react';

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
  scenarioTitleEn: string;
  scenarioTitleHi: string;
  scenarioEn: string;
  scenarioHi: string;
  actionTitleEn: string;
  actionTitleHi: string;
  actionEn: string;
  actionHi: string;
}

// Practical lessons for Indian shopkeepers aged 30-50+
// Focused on daily shop operations, not business theory
const allLessons: LessonData[] = [
  {
    "id": "daily-hisab",
    "titleEn": "The 5-Minute Daily Money Check",
    "titleHi": "5 मिनट में रोज़ का हिसाब",
    "descEn": "Close the day knowing where the money went.",
    "descHi": "दिन के अंत में पैसों का सही हिसाब जानें।",
    "category": "basics",
    "duration": 3,
    "emoji": "📊",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "At closing, the drawer has ₹700 less than expected. The owner first thinks someone made a mistake, but then finds two small cash sales and one supplier payment were never written down.",
    "scenarioHi": "दुकान बंद करते समय गल्ले में ₹700 कम दिखते हैं। मालिक पहले गलती समझते हैं, फिर पता चलता है कि दो छोटी नकद बिक्री और सप्लायर का एक भुगतान लिखना छूट गया था।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Before closing, add up cash received, UPI received, credit sales and expenses separately. Match each with the entries and bills. If there is a gap, note it and find the reason instead of guessing.",
    "actionHi": "दुकान बंद करने से पहले नकद, UPI, उधार बिक्री और खर्च अलग-अलग जोड़ें। उन्हें एंट्री और बिल से मिलाएँ। अंतर हो तो अंदाज़ा लगाने के बजाय वजह लिखें और पता करें।",
    "contentEn": "A good daily close takes about five minutes.\n\n1. Add every sale, including small ones.\n2. Keep cash, UPI and credit sales clear in your record.\n3. Record every payment made that day and keep the bill.\n4. Check the cash and UPI actually received separately from sales made on credit.\n\n**Why it matters**\nA shop can look busy and still lose money through missed entries, wrong change, small waste or unpaid credit. A short daily check helps you catch a small gap before it grows.",
    "contentHi": "दिन का सही हिसाब रखने में लगभग पाँच मिनट लगते हैं।\n\n1. छोटी बिक्री सहित हर बिक्री दर्ज करें।\n2. नकद, UPI और उधार बिक्री का हिसाब अलग रखें।\n3. उस दिन किया गया हर भुगतान लिखें और बिल संभालें।\n4. नकद और UPI में मिले पैसे को उधार बिक्री से अलग जाँचें।\n\n**यह क्यों ज़रूरी है**\nदुकान पर भीड़ होने के बाद भी छूटी एंट्री, गलत बचे पैसे, बर्बादी या रुका हुआ उधार नुकसान कर सकता है। रोज़ की छोटी जाँच से समस्या जल्दी पकड़ में आती है।"
  },
  {
    "id": "udhaar-control",
    "titleEn": "Set Clear Rules for Udhaar",
    "titleHi": "उधार के साफ़ नियम बनाएँ",
    "descEn": "Protect cash without losing good customers.",
    "descHi": "अच्छे ग्राहकों से रिश्ता रखते हुए नकद बचाएँ।",
    "category": "money",
    "duration": 3,
    "emoji": "🤝",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A regular customer owes ₹3,200 and asks for another ₹900 of goods. The owner wants to help, but two suppliers must be paid the next morning.",
    "scenarioHi": "एक पुराने ग्राहक पर ₹3,200 बाकी हैं और वे ₹900 का और सामान माँगते हैं। मालिक मदद करना चाहते हैं, लेकिन अगली सुबह दो सप्लायरों को भुगतान करना है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Set a clear credit limit and date with each customer. For an overdue balance, politely ask for a payment date or a small first payment. Do not promise new credit until you know how the old amount will be paid.",
    "actionHi": "हर ग्राहक के लिए उधार की साफ़ सीमा और तारीख़ तय करें। बकाया हो तो विनम्रता से भुगतान की तारीख़ या पहली छोटी किस्त तय करें। पुराना पैसा कैसे आएगा, यह जाने बिना नया उधार देने का वादा न करें।",
    "contentEn": "Udhaar can build trust, but it can also leave you short of money for stock, rent or wages.\n\n- Write the amount and date at the time of sale.\n- Agree when the customer will pay.\n- Review overdue balances every week.\n- Send a polite reminder with the exact amount.\n- Keep a limit that your shop can afford, even for people you know well.\n\n**Keep it fair**\nUse the same clear rules with everyone. This protects the business and avoids arguments later.",
    "contentHi": "उधार से भरोसा बन सकता है, लेकिन स्टॉक, किराया या वेतन देने के लिए नकद कम भी पड़ सकता है।\n\n- बिक्री के समय रकम और तारीख़ लिखें।\n- ग्राहक से भुगतान की तारीख़ तय करें।\n- हर हफ़्ते पुराने बकाये देखें।\n- सही रकम लिखकर विनम्र याद दिलाएँ।\n- करीबी ग्राहक के लिए भी उतनी ही सीमा रखें जितनी दुकान सह सके।\n\n**नियम सबके लिए साफ़ रखें**\nएक जैसे नियम कारोबार को सुरक्षित रखते हैं और बाद की बहस से बचाते हैं।"
  },
  {
    "id": "customer-loyalty",
    "titleEn": "Turn Good Service into Repeat Business",
    "titleHi": "अच्छी सेवा से ग्राहक दोबारा जोड़ें",
    "descEn": "Build trust that brings customers back.",
    "descHi": "ऐसा भरोसा बनाएँ कि ग्राहक लौटकर आएँ।",
    "category": "growth",
    "duration": 3,
    "emoji": "🛍️",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A customer finds that an item bought yesterday is damaged. The shopkeeper listens, checks the bill and replaces it fairly. The customer returns the next week—and brings a neighbour.",
    "scenarioHi": "एक ग्राहक को कल खरीदा सामान खराब मिलता है। दुकानदार उनकी बात सुनते हैं, बिल जाँचते हैं और सही तरीके से सामान बदल देते हैं। ग्राहक अगले हफ़्ते लौटते हैं और एक पड़ोसी को भी साथ लाते हैं।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Choose one small service to do consistently: keep fast-moving items easy to find, tell customers honestly when something is unavailable, and fix a genuine billing or product issue quickly. Notice which customers return.",
    "actionHi": "एक छोटी सेवा नियमित करें: तेज़ बिकने वाला सामान आसानी से मिलने दें, सामान न हो तो साफ़ बताएं, और बिल या सामान की सही शिकायत जल्दी सुलझाएँ। ध्यान दें कि कौन-से ग्राहक दोबारा आते हैं।",
    "contentEn": "Repeat customers reduce the pressure to find new buyers every day. They return when the shop is reliable, prices are clear and problems are handled fairly.\n\n- Keep the items regular customers ask for most.\n- Give the correct weight and a clear bill.\n- Tell people early if an item is not available.\n- Fix genuine mistakes without making the customer argue.\n- Avoid discounts that erase your profit just to win one sale.\n\n**The business value**\nA customer who trusts you is more likely to return and recommend the shop.",
    "contentHi": "पुराने ग्राहक बार-बार नए ग्राहक खोजने का दबाव कम करते हैं। वे तब लौटते हैं जब दुकान भरोसेमंद हो, भाव साफ़ हों और समस्या सही तरीके से सुलझे।\n\n- जिन चीज़ों की माँग सबसे ज़्यादा है, उन्हें उपलब्ध रखें।\n- सही वजन और साफ़ बिल दें।\n- सामान न हो तो पहले ही बता दें।\n- सही गलती को बहस किए बिना ठीक करें।\n- सिर्फ़ एक बिक्री पाने के लिए इतना डिस्काउंट न दें कि मुनाफ़ा ही खत्म हो जाए।\n\n**कारोबार में फ़ायदा**\nभरोसा करने वाला ग्राहक लौटने और दूसरों को दुकान बताने की अधिक संभावना रखता है।"
  },
  {
    "id": "smart-stock",
    "titleEn": "Buy Stock Based on What Sells",
    "titleHi": "बिक्री देखकर सामान खरीदें",
    "descEn": "Keep cash free and shelves useful.",
    "descHi": "पैसा फँसने से बचाएँ और सही सामान रखें।",
    "category": "inventory",
    "duration": 3,
    "emoji": "📦",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A shop has ₹6,000 worth of a slow-selling item on the shelf, but customers keep asking for a faster-selling product that is out of stock. The money is tied up in the wrong place.",
    "scenarioHi": "दुकान में धीमे बिकने वाले सामान के ₹6,000 शेल्फ़ पर पड़े हैं, जबकि ग्राहक तेज़ बिकने वाली दूसरी चीज़ माँगते हैं जो खत्म है। पैसा गलत जगह फँसा है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Before reordering, list the five items that sold most often and count what remains. Order fast sellers first. For slow stock, stop adding more until you have a clear plan to sell, return or reduce it.",
    "actionHi": "अगला ऑर्डर देने से पहले पाँच सबसे ज़्यादा बिकने वाली चीज़ें लिखें और बचा हुआ स्टॉक गिनें। पहले तेज़ बिकने वाला सामान मँगाएँ। धीमे स्टॉक में नया माल तब तक न जोड़ें जब तक उसे बेचने, लौटाने या कम करने की योजना न हो।",
    "contentEn": "Stock is money sitting on a shelf. The aim is not to fill every shelf; it is to have the right goods available when customers ask.\n\n- Check what sold over the last 7–14 days.\n- Count remaining stock before ordering.\n- Set a minimum level for items that sell quickly.\n- Buy small amounts of uncertain items until demand is clear.\n- Check expiry dates and return terms before a large order.\n\n**Keep the balance**\nToo little stock can lose sales; too much can block cash. Use actual sales records to find a sensible middle.",
    "contentHi": "शेल्फ़ पर रखा स्टॉक असल में आपका पैसा है। लक्ष्य हर जगह सामान भरना नहीं, बल्कि ग्राहक की ज़रूरत के समय सही सामान उपलब्ध रखना है।\n\n- पिछले 7–14 दिनों में क्या बिका, देखें।\n- ऑर्डर से पहले बचा हुआ स्टॉक गिनें।\n- तेज़ बिकने वाली चीज़ों के लिए न्यूनतम मात्रा तय करें।\n- जिन चीज़ों की माँग साफ़ नहीं है, उन्हें कम मात्रा में मँगाएँ।\n- बड़े ऑर्डर से पहले एक्सपायरी और वापसी की शर्तें जाँचें।\n\n**सही संतुलन रखें**\nबहुत कम स्टॉक से बिक्री छूट सकती है और बहुत ज़्यादा स्टॉक से नकद फँस सकता है। फैसला असली बिक्री के आधार पर करें।"
  },
  {
    "id": "pricing-basics",
    "titleEn": "Set a Price That Leaves Money",
    "titleHi": "ऐसा भाव रखें जिससे मुनाफ़ा बचे",
    "descEn": "Know the cost before changing the price.",
    "descHi": "भाव बदलने से पहले असली लागत जानें।",
    "category": "pricing",
    "duration": 3,
    "emoji": "🏷️",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A supplier raises the cost of a popular item by ₹4. The shop keeps selling at the old price for weeks. Sales look steady, but less money is left from every unit sold.",
    "scenarioHi": "सप्लायर लोकप्रिय सामान की लागत ₹4 बढ़ा देता है। दुकान कई हफ़्ते पुराने भाव पर बेचती रहती है। बिक्री ठीक दिखती है, लेकिन हर पीस पर कम पैसा बचता है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Pick three fast-selling items. Compare the latest supplier bill with your selling price, delivery cost and any usual discount. If the amount left is too small, consider a fair price change or a different supplier—not a sudden price rise on everything.",
    "actionHi": "तीन तेज़ बिकने वाली चीज़ें चुनें। नया सप्लायर बिल, बिक्री का भाव, ढुलाई और आम डिस्काउंट मिलाकर देखें। अगर बहुत कम पैसा बचता है, तो सही भाव या दूसरे सप्लायर पर विचार करें—हर चीज़ का भाव अचानक न बढ़ाएँ।",
    "contentEn": "A price should cover the cost of the item and leave enough to help pay shop expenses. A busy counter does not guarantee good earnings.\n\n- Start with the latest purchase cost.\n- Include transport or packing costs when they apply.\n- Check the usual discount given to customers.\n- Compare nearby prices for common goods.\n- Review prices when a supplier changes the rate.\n\n**Before you cut a price**\nCalculate how much money will remain after the discount. Do not copy a competitor without checking your own cost.",
    "contentHi": "भाव ऐसा होना चाहिए कि सामान की लागत निकलने के बाद दुकान के खर्च में मदद करने के लिए पैसा बचे। काउंटर पर भीड़ होना अच्छे मुनाफ़े की गारंटी नहीं है।\n\n- सबसे नया खरीद भाव देखें।\n- जहाँ लागू हो, ढुलाई या पैकिंग जोड़ें।\n- ग्राहक को दिए जाने वाले आम डिस्काउंट को गिनें।\n- आम सामान के लिए आसपास के भाव देखें।\n- सप्लायर की दर बदलने पर अपना भाव जाँचें।\n\n**भाव घटाने से पहले**\nडिस्काउंट के बाद कितना पैसा बचेगा, यह निकालें। अपनी लागत देखे बिना दूसरे दुकानदार की नकल न करें।"
  },
  {
    "id": "discount-check",
    "titleEn": "Check the Cost of Every Discount",
    "titleHi": "हर डिस्काउंट का असर जाँचें",
    "descEn": "A small offer can take away most of the profit.",
    "descHi": "छोटा डिस्काउंट भी मुनाफ़ा घटा सकता है।",
    "category": "pricing",
    "duration": 3,
    "emoji": "🧮",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "An item costs ₹85 and sells for ₹100. The shop gives ₹10 off to match a competitor. The customer saves ₹10, but the shop's amount left falls from ₹15 to just ₹5 before other costs.",
    "scenarioHi": "एक सामान ₹85 में खरीदा और ₹100 में बेचा जाता है। दूसरे दुकानदार से भाव मिलाने के लिए ₹10 की छूट दी जाती है। ग्राहक ₹10 बचाता है, लेकिन दूसरे खर्च से पहले दुकान का बचा पैसा ₹15 से घटकर सिर्फ़ ₹5 रह जाता है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Before offering a discount, write the buying cost, selling price and discount on paper. Check the amount left. Consider a bundle of related items or a minimum purchase instead of cutting the price on every unit.",
    "actionHi": "डिस्काउंट देने से पहले खरीद भाव, बिक्री भाव और छूट लिखें। देखें कि कितना पैसा बचेगा। हर पीस का भाव घटाने के बजाय जुड़ी हुई चीज़ों का कॉम्बो या तय खरीद पर ऑफ़र सोचें।",
    "contentEn": "Discounts can bring customers in, but they should have a reason and a limit.\n\nExample: buy for ₹85, sell for ₹100. The amount left is ₹15 before other shop costs. A ₹10 discount leaves only ₹5. That is a two-thirds drop in the amount left, even though the discount looks small.\n\n- Decide the lowest price before the customer asks.\n- Do not discount items already selling well unless there is a clear reason.\n- Test offers for a short time and check the result.\n- Stop an offer if it brings sales but leaves too little money.",
    "contentHi": "डिस्काउंट ग्राहक ला सकता है, लेकिन उसके पीछे वजह और सीमा होनी चाहिए।\n\nउदाहरण: खरीद ₹85, बिक्री ₹100। दूसरे खर्च से पहले ₹15 बचते हैं। ₹10 की छूट देने पर सिर्फ़ ₹5 बचेंगे। छूट छोटी दिखती है, लेकिन बचा पैसा लगभग दो-तिहाई कम हो जाता है।\n\n- ग्राहक के पूछने से पहले न्यूनतम भाव तय करें।\n- जो सामान पहले ही अच्छी तरह बिक रहा है, उस पर बिना वजह छूट न दें।\n- ऑफ़र थोड़े समय के लिए आज़माएँ और नतीजा जाँचें।\n- बिक्री बढ़े लेकिन पैसा न बचे, तो ऑफ़र रोक दें।"
  },
  {
    "id": "slow-day-plan",
    "titleEn": "Make Slow Days Work for You",
    "titleHi": "धीमे दिनों का सही इस्तेमाल करें",
    "descEn": "Test small changes instead of guessing.",
    "descHi": "अंदाज़े के बजाय छोटे बदलाव आज़माएँ।",
    "category": "growth",
    "duration": 3,
    "emoji": "📅",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "Recorded sales are strong on Saturday but much lower on Tuesday. The owner starts discounting every day, which cuts earnings even when sales were already good.",
    "scenarioHi": "दर्ज बिक्री शनिवार को अच्छी और मंगलवार को काफी कम है। मालिक हर दिन डिस्काउंट देना शुरू कर देते हैं, जिससे उन दिनों का मुनाफ़ा भी घटता है जब बिक्री पहले से अच्छी थी।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "First check whether all sales were entered and whether opening hours were the same. On the slower day, test one low-cost change: display a fast-moving item, remind regular customers of its availability, or offer a sensible bundle. Compare the same weekday for two weeks.",
    "actionHi": "पहले जाँचें कि सभी बिक्री दर्ज हुई और दुकान खुलने का समय समान था। धीमे दिन एक कम खर्च वाला बदलाव आज़माएँ: तेज़ बिकने वाला सामान सामने रखें, पुराने ग्राहकों को उपलब्धता बताएँ या सही दाम वाला कॉम्बो दें। दो हफ़्ते तक उसी दिन की बिक्री मिलाएँ।",
    "contentEn": "Sales can differ by day because of customer routines, nearby market days, weather or opening hours. One slow day does not prove the shop has a problem.\n\n- Compare the same weekday across several weeks.\n- Check whether the shop had the usual stock and opening hours.\n- Try one small change at a time.\n- Avoid a blanket discount before you know the reason for the drop.\n- Keep a note of what changed and what happened to sales.",
    "contentHi": "ग्राहकों की आदत, बाज़ार का दिन, मौसम या दुकान खुलने के समय से बिक्री में फर्क आ सकता है। एक धीमा दिन अपने आप में समस्या का सबूत नहीं है।\n\n- कई हफ़्तों में उसी दिन की बिक्री मिलाएँ।\n- देखें कि सामान उपलब्ध था और दुकान सामान्य समय पर खुली थी।\n- एक बार में एक छोटा बदलाव आज़माएँ।\n- गिरावट की वजह जाने बिना हर सामान पर छूट न दें।\n- क्या बदलाव किया और बिक्री पर क्या असर पड़ा, लिखें।"
  },
  {
    "id": "supplier-negotiation",
    "titleEn": "Negotiate with a Clear Number",
    "titleHi": "साफ़ हिसाब लेकर सप्लायर से बात करें",
    "descEn": "A lower rate is useful only if the deal fits your shop.",
    "descHi": "कम भाव तभी अच्छा है जब सौदा दुकान के काम आए।",
    "category": "money",
    "duration": 3,
    "emoji": "🤝",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "One supplier offers a lower price if the shop buys six weeks of stock at once. Another supplier charges slightly more but delivers smaller orders. The cheaper offer may tie up cash and fill the shelves with slow items.",
    "scenarioHi": "एक सप्लायर छह हफ़्ते का स्टॉक एक साथ लेने पर कम भाव देता है। दूसरा थोड़ा महँगा है, लेकिन कम मात्रा में सामान देता है। सस्ता सौदा भी पैसा फँसा सकता है और धीमा स्टॉक बढ़ा सकता है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Compare the final cost, minimum order, delivery fee, return terms and payment date. Negotiate the rate on the items you buy often, but do not accept extra stock you cannot sell soon.",
    "actionHi": "कुल लागत, न्यूनतम ऑर्डर, ढुलाई, वापसी की शर्त और भुगतान तारीख़ मिलाएँ। जिन चीज़ों की नियमित खरीद है, उन पर भाव की बात करें; ऐसा अतिरिक्त स्टॉक न लें जो जल्दी बिकने वाला न हो।",
    "contentEn": "The best supplier deal is not always the lowest price on the bill. A big order can strain cash, while delayed delivery can leave you out of stock.\n\n- Compare at least two quotes when possible.\n- Ask for the final rate including delivery and fees.\n- Check the payment date and return terms.\n- Use your recent sales to estimate how much you can sell before the next order.\n- Keep the relationship fair: pay as agreed and discuss problems early.",
    "contentHi": "सबसे अच्छा सप्लायर सौदा हमेशा बिल पर सबसे कम भाव नहीं होता। बड़ा ऑर्डर नकद फँसा सकता है और देरी से सामान खत्म हो सकता है।\n\n- हो सके तो दो सप्लायरों के भाव मिलाएँ।\n- ढुलाई और बाकी शुल्क सहित अंतिम भाव पूछें।\n- भुगतान तारीख़ और वापसी की शर्त जाँचें।\n- हाल की बिक्री देखकर तय करें कि अगले ऑर्डर से पहले कितना सामान बिकेगा।\n- रिश्ता साफ़ रखें: तय समय पर भुगतान करें और समस्या जल्दी बताएँ।"
  },
  {
    "id": "utility-costs",
    "titleEn": "Catch Rising Shop Bills Early",
    "titleHi": "दुकान के बढ़ते बिल समय पर पकड़ें",
    "descEn": "Find the cause before trying random cuts.",
    "descHi": "बिना वजह खर्च घटाने से पहले कारण जानें।",
    "category": "money",
    "duration": 3,
    "emoji": "💡",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "The electricity bill rises for three months. The owner turns off every light, making the shop harder to browse, but the bill barely changes because an old cooler is using too much power.",
    "scenarioHi": "बिजली का बिल लगातार तीन महीने बढ़ता है। मालिक सारी लाइट बंद करने लगते हैं, जिससे ग्राहक सामान नहीं देख पाते। बिल फिर भी कम नहीं होता, क्योंकि पुराना कूलर ज़्यादा बिजली ले रहा है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Compare the last three bills and note the amount and units used. Check long-running equipment, leaks, lights and service charges. Fix one clear cause first; keep the shop safe and easy for customers to use.",
    "actionHi": "पिछले तीन बिल मिलाकर रकम और यूनिट लिखें। लंबे समय तक चलने वाले उपकरण, रिसाव, लाइट और सेवा शुल्क जाँचें। पहले एक साफ़ वजह ठीक करें; दुकान को सुरक्षित और ग्राहक के लिए सुविधाजनक रखें।",
    "contentEn": "A rising bill should be checked, not guessed at. Cutting useful light or turning off needed equipment can hurt service without saving much.\n\n- Keep the last three bills together.\n- Compare both the amount and the units used.\n- Check old equipment, leaks, unused lights and extra charges.\n- Ask for a repair estimate before replacing equipment.\n- Recheck the next bill to see if the change worked.",
    "contentHi": "बढ़ते बिल की जाँच करनी चाहिए, अंदाज़ा नहीं लगाना चाहिए। ज़रूरी रोशनी या उपकरण बंद करने से सेवा खराब हो सकती है, जबकि बचत कम हो।\n\n- पिछले तीन बिल साथ रखें।\n- रकम और इस्तेमाल हुई यूनिट दोनों मिलाएँ।\n- पुराने उपकरण, रिसाव, बेकार जलती लाइट और अतिरिक्त शुल्क देखें।\n- उपकरण बदलने से पहले मरम्मत का खर्च पूछें।\n- अगले बिल में जाँचें कि बदलाव से फ़ायदा हुआ या नहीं।"
  },
  {
    "id": "stock-cash-cycle",
    "titleEn": "Do Not Let Cash Get Stuck in Stock",
    "titleHi": "स्टॉक में पैसा बेवजह न फँसने दें",
    "descEn": "Keep enough goods without tying up too much cash.",
    "descHi": "ज़रूरी माल रखें, लेकिन बहुत पैसा न बाँधें।",
    "category": "inventory",
    "duration": 3,
    "emoji": "💰",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A shop buys 50 pieces because the rate is lower in bulk. After a month, only 12 pieces have sold, but the electricity bill and next supplier payment are due.",
    "scenarioHi": "कम थोक भाव के कारण दुकान 50 पीस खरीद लेती है। महीने बाद सिर्फ़ 12 बिके हैं, लेकिन बिजली का बिल और अगला सप्लायर भुगतान देना है।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "For each slow item, write the quantity on hand, units sold this month and the money tied up in the remaining stock. Reduce the next order until the old stock moves, unless there is clear upcoming demand.",
    "actionHi": "हर धीमे सामान के लिए बची मात्रा, इस महीने बिकी मात्रा और बचे स्टॉक में फँसा पैसा लिखें। पुराना माल बिकने तक अगला ऑर्डर घटाएँ—जब तक आने वाली माँग साफ़ न हो।",
    "contentEn": "Bulk buying can reduce the price per piece, but it is only useful if the goods sell in time. Money tied up in slow stock cannot pay the next bill.\n\n- Count the remaining units.\n- Check how many sold over the last month.\n- Estimate how long the remaining stock may take to sell.\n- Compare the saving from bulk buying with the cost of holding extra stock.\n- Keep bulk deals for goods with steady demand and clear return terms.",
    "contentHi": "थोक में लेने से हर पीस का भाव घट सकता है, लेकिन फायदा तभी है जब सामान समय पर बिके। धीमे स्टॉक में फँसा पैसा अगला बिल नहीं भर सकता।\n\n- बची हुई मात्रा गिनें।\n- पिछले महीने कितनी इकाइयाँ बिकीं, देखें।\n- अंदाज़ा लगाएँ कि बचा सामान बिकने में कितना समय लगेगा।\n- थोक बचत को अतिरिक्त स्टॉक में फँसे पैसे से मिलाएँ।\n- थोक सौदा उन्हीं चीज़ों में करें जिनकी माँग नियमित हो और वापसी की शर्त साफ़ हो।"
  },
  {
    "id": "festival-planning",
    "titleEn": "Prepare for Festivals Without Overbuying",
    "titleHi": "त्योहार के लिए सही मात्रा में तैयारी करें",
    "descEn": "Use last season's records instead of guesses.",
    "descHi": "अंदाज़े के बजाय पिछले सीज़न का हिसाब देखें।",
    "category": "planning",
    "duration": 3,
    "emoji": "🪔",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "Before Diwali, a shop buys extra stock across every category. Lights and gift packs sell well, but several other items remain after the festival and need a discount.",
    "scenarioHi": "दिवाली से पहले दुकान हर श्रेणी में अतिरिक्त स्टॉक खरीद लेती है। लाइट और गिफ्ट पैक अच्छे बिकते हैं, लेकिन कई दूसरे सामान त्योहार के बाद बच जाते हैं और छूट पर निकालने पड़ते हैं।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Make a short list of last season's best sellers, slow sellers and items that ran out. Order in stages: start with proven items, then top up only when sales show real demand. Check supplier return terms before buying.",
    "actionHi": "पिछले सीज़न के तेज़ बिकने वाले, धीमे बिकने वाले और जल्दी खत्म हुए सामान की छोटी सूची बनाएँ। चरणों में ऑर्डर दें: पहले भरोसेमंद सामान, फिर असली माँग देखकर दोबारा खरीदें। पहले वापसी की शर्त जाँचें।",
    "contentEn": "Festival sales can help a shop, but excess stock after the rush can block cash for weeks.\n\n- Review the previous festival's sales and leftover stock.\n- Start with items customers already asked for.\n- Ask suppliers about delivery time and return options.\n- Place a first order early enough to refill if needed.\n- Check sales every few days and top up only proven items.\n\n**Plan for a safe ending too**\nDecide in advance what you will do with stock left after the festival. Do not rely on a last-minute discount to solve every problem.",
    "contentHi": "त्योहार की बिक्री दुकान को फ़ायदा दे सकती है, लेकिन बाद में बचा स्टॉक कई हफ़्तों तक पैसा बाँध सकता है।\n\n- पिछले त्योहार की बिक्री और बचा स्टॉक देखें।\n- उन चीज़ों से शुरू करें जिनकी माँग पहले से है।\n- सप्लायर से डिलीवरी और वापसी पूछें।\n- ज़रूरत पड़ने पर दोबारा माल मिल सके, इतनी जल्दी पहला ऑर्डर दें।\n- हर कुछ दिन में बिक्री देखकर सिर्फ़ साबित माँग वाले सामान की मात्रा बढ़ाएँ।\n\n**बचा हुआ स्टॉक भी सोचें**\nपहले से तय करें कि त्योहार के बाद बचा सामान कैसे बेचना है। हर समस्या को आख़िरी समय की छूट पर न छोड़ें।"
  },
  {
    "id": "shop-home-money",
    "titleEn": "Keep Shop Money Separate from Home Money",
    "titleHi": "दुकान और घर के पैसे अलग रखें",
    "descEn": "Know what the business truly earns.",
    "descHi": "जानें कि कारोबार असल में कितना कमा रहा है।",
    "category": "basics",
    "duration": 3,
    "emoji": "🧾",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "The owner takes cash from the drawer for a home purchase but does not write it down. At the end of the week, the shop appears to have a loss even though some of the money was used outside the business.",
    "scenarioHi": "मालिक घर का सामान लेने के लिए गल्ले से पैसे निकालते हैं, लेकिन लिखते नहीं। हफ़्ते के अंत में दुकान में घाटा दिखता है, जबकि कुछ पैसा कारोबार से बाहर इस्तेमाल हुआ था।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Write every amount taken from the shop for home use as a separate owner withdrawal, not as stock or shop expense. Decide a regular amount for home use where possible, and check the drawer against the record at closing.",
    "actionHi": "घर के लिए दुकान से निकली हर रकम अलग लिखें; उसे स्टॉक या दुकान का खर्च न मानें। हो सके तो घर के लिए नियमित रकम तय करें और दिन के अंत में गल्ले को रिकॉर्ड से मिलाएँ।",
    "contentEn": "When shop money and home money mix, it becomes hard to see whether the business is earning enough. It also makes cash shortages harder to explain.\n\n- Write down every withdrawal for home use.\n- Keep shop bills separate from household bills.\n- Decide what the shop can safely pay the owner after costs and supplier dues.\n- Review the business numbers weekly before taking extra money out.\n\n**The benefit**\nClear records make it easier to plan family spending without guessing how much the shop can afford.",
    "contentHi": "दुकान और घर के पैसे मिल जाएँ, तो यह समझना मुश्किल होता है कि कारोबार पर्याप्त कमा रहा है या नहीं। नकद की कमी की वजह ढूँढना भी कठिन हो जाता है।\n\n- घर के लिए निकली हर रकम लिखें।\n- दुकान और घर के बिल अलग रखें।\n- खर्च और सप्लायर का भुगतान देखकर तय करें कि मालिक कितना पैसा निकाल सकता है।\n- अतिरिक्त पैसा निकालने से पहले हर हफ़्ते कारोबार का हिसाब देखें।\n\n**फ़ायदा**\nसाफ़ रिकॉर्ड से परिवार का खर्च तय करना आसान होता है और दुकान की क्षमता का अंदाज़ा नहीं लगाना पड़ता।"
  },
  {
    "id": "prevent-waste",
    "titleEn": "Stop Small Waste from Becoming a Big Loss",
    "titleHi": "छोटी बर्बादी को बड़ा नुकसान न बनने दें",
    "descEn": "Check damage, expiry and missing items early.",
    "descHi": "खराबी, एक्सपायरी और कमी समय पर जाँचें।",
    "category": "inventory",
    "duration": 3,
    "emoji": "🔎",
    "scenarioTitleEn": "A common shop situation",
    "scenarioTitleHi": "दुकान की एक आम स्थिति",
    "scenarioEn": "A month-end check finds several expired packets behind newer stock. Each packet was cheap, but together the loss is noticeable—and customers could have been given poor-quality goods.",
    "scenarioHi": "महीने के अंत में नए स्टॉक के पीछे कई एक्सपायरी पैकेट मिलते हैं। हर पैकेट सस्ता था, लेकिन कुल नुकसान दिखने लगता है—और ग्राहक को खराब सामान मिलने का खतरा भी था।",
    "actionTitleEn": "Try this today",
    "actionTitleHi": "आज यह करें",
    "actionEn": "Check date-sensitive goods from oldest to newest. Put older stock at the front, keep damaged items separate and record what was lost. For items that often expire, order smaller amounts more often.",
    "actionHi": "तारीख़ वाले सामान को पुराने से नए क्रम में जाँचें। पुराना स्टॉक आगे रखें, खराब सामान अलग करें और नुकसान लिखें। जिन चीज़ों की एक्सपायरी अक्सर होती है, उन्हें कम मात्रा में लेकिन ज़्यादा बार मँगाएँ।",
    "contentEn": "A few damaged or expired items can quietly reduce profit. They can also harm customer trust.\n\n- Check the oldest stock first.\n- Keep damaged goods away from saleable stock.\n- Note repeat causes: expiry, leaks, breakage or heat.\n- Change storage or order size when the same loss repeats.\n- Check high-risk items briefly every week instead of waiting for month-end.",
    "contentHi": "कुछ खराब या एक्सपायरी सामान चुपचाप मुनाफ़ा घटा सकते हैं और ग्राहक का भरोसा भी कम कर सकते हैं।\n\n- सबसे पुराना स्टॉक पहले जाँचें।\n- खराब माल को बेचने योग्य स्टॉक से अलग रखें।\n- बार-बार होने वाली वजह लिखें: एक्सपायरी, रिसाव, टूटना या गर्मी।\n- वही नुकसान दोहराए तो रखने का तरीका या ऑर्डर की मात्रा बदलें।\n- महीने के अंत तक रुकने के बजाय जोखिम वाले सामान को हर हफ़्ते जाँचें।"
  }
];

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The daily set changes by calendar day. The refresh button also moves to another
// set immediately, so a shopkeeper is never stuck seeing the same five lessons.
function getDailyLessons(dateKey: string, refreshCount: number): LessonData[] {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const start = ((dayNumber + refreshCount * 5) % allLessons.length + allLessons.length) % allLessons.length;
  return Array.from({ length: Math.min(5, allLessons.length) }, (_, index) =>
    allLessons[(start + index) % allLessons.length],
  );
}

function LessonCopy({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      {content.split('\n').map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;
        const heading = line.match(/^\*\*(.+)\*\*$/);
        if (heading) {
          return <h4 key={index} className="text-body font-semibold text-text pt-1">{heading[1]}</h4>;
        }
        const bullet = line.match(/^(?:[-•])\s+(.+)$/);
        if (bullet) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="text-primary leading-relaxed">•</span>
              <p className="text-text leading-relaxed text-body flex-1">{bullet[1]}</p>
            </div>
          );
        }
        const numbered = line.match(/^(\d+\.)\s+(.+)$/);
        if (numbered) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="text-primary font-semibold text-small leading-relaxed">{numbered[1]}</span>
              <p className="text-text leading-relaxed text-body flex-1">{numbered[2]}</p>
            </div>
          );
        }
        return <p key={index} className="text-text leading-relaxed text-body">{line}</p>;
      })}
    </div>
  );
}

// ============ LEARN SCREEN ============
export function LearnScreen() {
  const { state } = useStore();
  const lang = state.language!;
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [plannedLessons, setPlannedLessons] = useState<string[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey());
  const dailyLessons = useMemo(() => getDailyLessons(todayKey, refreshCount), [todayKey, refreshCount]);

  useEffect(() => {
    const refreshDate = () => {
      const currentDate = getLocalDateKey();
      setTodayKey(previous => previous === currentDate ? previous : currentDate);
    };
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(refreshDate, Math.max(1000, nextMidnight.getTime() - now.getTime() + 250));
    window.addEventListener('focus', refreshDate);
    document.addEventListener('visibilitychange', refreshDate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refreshDate);
      document.removeEventListener('visibilitychange', refreshDate);
    };
  }, [todayKey]);
  
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
          
          <div className="card p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Store size={17} className="text-primary" />
              <h3 className="text-body font-semibold text-text">
                {lang === 'hi' ? lesson.scenarioTitleHi : lesson.scenarioTitleEn}
              </h3>
            </div>
            <p className="text-text leading-relaxed text-body">
              {lang === 'hi' ? lesson.scenarioHi : lesson.scenarioEn}
            </p>
          </div>

          <div className="card p-4 mb-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck size={17} className="text-primary" />
              <h3 className="text-body font-semibold text-text">
                {lang === 'hi' ? lesson.actionTitleHi : lesson.actionTitleEn}
              </h3>
            </div>
            <p className="text-text leading-relaxed text-body">
              {lang === 'hi' ? lesson.actionHi : lesson.actionEn}
            </p>
          </div>

          <div className="card p-4 mb-4">
            <h3 className="text-body font-semibold text-text mb-2">
              {lang === 'hi' ? 'काम की सीख' : 'The lesson'}
            </h3>
            <LessonCopy content={lang === 'hi' ? lesson.contentHi : lesson.contentEn} />
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
            <button
              type="button"
              onClick={() => {
                setPlannedLessons(previous => previous.includes(lesson.id) ? previous : [...previous, lesson.id]);
                setSelectedLesson(null);
              }}
              className="btn-secondary"
            >
              <Play size={20} /> {t('tryInShop', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const completedCount = dailyLessons.filter(lesson => completedLessons.includes(lesson.id)).length;
  const progressPercent = Math.round((completedCount / dailyLessons.length) * 100);
  
  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-section-title text-text">{t('learnTitle', lang)}</h1>
          <p className="text-small text-text-secondary mt-1">
            {lang === 'hi' ? 'हर दिन नई सीख, दुकान की असली स्थितियों से' : 'Fresh daily lessons built around real shop situations'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshCount(count => count + 1)}
          className="btn-secondary shrink-0 flex items-center gap-2 px-3"
          aria-label={lang === 'hi' ? 'नई सीख दिखाएँ' : 'Refresh lessons'}
        >
          <RefreshCw size={16} />
          <span className="text-small font-semibold">{lang === 'hi' ? 'नई सीख' : 'Refresh'}</span>
        </button>
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
        
        {/* Daily rotating lessons */}
        <p className="text-small font-semibold text-text-secondary mb-3 uppercase tracking-wide">
          {lang === 'hi' ? 'आज की सीख' : "Today's Lessons"}
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
                  <p className="text-small text-text-secondary mt-1">
                    {plannedLessons.includes(lesson.id)
                      ? (lang === 'hi' ? 'आज आज़माने के लिए चुना' : 'Planned to try')
                      : `${lesson.duration} ${t('minutes', lang)}`}
                  </p>
                </div>
                {isCompleted ? (
                  <CheckCircle size={24} className="text-positive flex-shrink-0" />
                ) : plannedLessons.includes(lesson.id) ? (
                  <ClipboardCheck size={21} className="text-primary flex-shrink-0" />
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
