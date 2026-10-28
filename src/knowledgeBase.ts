// World-class business advisor knowledge base for Indian shopkeepers
// Organized by category with practical, actionable advice

export interface KnowledgeEntry {
  keywords: string[];
  responseEn: string;
  responseHi: string;
  category: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // ===== 1. CUSTOMER BARGAINING AND PRICE OBJECTIONS =====
  {
    keywords: ['bargain', 'discount', 'cheap', 'last price', 'मोलभाव', 'डिस्काउंट', 'सस्ता'],
    category: 'bargaining',
    responseEn: `**Handling Bargaining Professionally:**

**When customers bargain too much:**
• Stay calm and smile - don't take it personally
• Explain your value: "This price includes [quality/service/warranty]"
• Offer alternatives: "I can show you a similar product at a different price point"
• Be firm but polite: "This is my best price for this quality"

**When they say "last price":**
• Don't immediately say yes - it shows your first price was inflated
• Say: "Let me check if I can do something for you" (pause, then offer small concession)
• Or: "For this quality, this is already my lowest price"
• If you must reduce: "I can do [small amount] off, but only today"

**When they claim cheaper elsewhere:**
• Ask: "Can you show me where?" (usually they can't)
• Explain differences: "Our price includes [warranty/service/genuine product]"
• Say: "We focus on quality and service, not just lowest price"
• Offer to match if you can verify (but protect your margins)

**For regular customers:**
• Give small, occasional discounts (5-10% max)
• Better: offer value-adds like free delivery, priority service, or small gifts
• Make them feel special without always reducing price

**Key mistakes to avoid:**
❌ Reducing price immediately when asked
❌ Getting angry or defensive
❌ Giving different prices to different customers visibly
❌ Discounting below your cost just to make a sale

**Remember:** Customers who always bargain will never be loyal. Focus on customers who value quality and service.`,
    responseHi: `**मोलभाव को पेशेवर तरीके से हैंडल करना:**

**जब ग्राहक बहुत ज़्यादा मोलभाव करें:**
• शांत रहें और मुस्कुराएं - व्यक्तिगत रूप से न लें
• अपनी वैल्यू समझाएं: "इस कीमत में [क्वालिटी/सेवा/वारंटी] शामिल है"
• विकल्प दें: "मैं आपको अलग कीमत पर ऐसा ही सामान दिखा सकता हूँ"
• दृढ़ लेकिन विनम्र रहें: "इस क्वालिटी के लिए यह मेरी सबसे अच्छी कीमत है"

**जब "आखिरी कीमत" कहें:**
• तुरंत हाँ न कहें - इससे पता चलता है आपकी पहली कीमत बढ़ा-चढ़ाकर थी
• कहें: "मैं देखता हूँ आपके लिए कुछ कर सकता हूँ" (रुकें, फिर छोटी छूट दें)
• या: "इस क्वालिटी के लिए यह पहले ही मेरी सबसे कम कीमत है"
• अगर कम करनी ही हो: "मैं [छोटी रकम] कम कर सकता हूँ, लेकिन सिर्फ आज"

**जब कहें दूसरी दुकान में सस्ता है:**
• पूछें: "कहाँ दिखा सकते हैं?" (आमतौर पर नहीं दिखा पाते)
• अंतर समझाएं: "हमारी कीमत में [वारंटी/सेवा/असली सामान] शामिल है"
• कहें: "हम सिर्फ सबसे कम कीमत पर नहीं, क्वालिटी और सेवा पर ध्यान देते हैं"
• मैच करने की पेशकश करें अगर वेरिफाई कर सकें (लेकिन मार्जिन बचाएं)

**नियमित ग्राहकों के लिए:**
• छोटी, कभी-कभार छूट दें (अधिकतम 5-10%)
• बेहतर: वैल्यू-ऐड्स दें जैसे मुफ्त डिलीवरी, प्राथमिकता सेवा, या छोटे उपहार
• उन्हें खास महसूस कराएं बिना हमेशा कीमत कम किए

**गलतियां जो टालनी हैं:**
❌ पूछते ही कीमत कम कर देना
❌ गुस्सा होना या बहस करना
❌ अलग-अलग ग्राहकों को सामने अलग कीमत देना
❌ सिर्फ सेल करने के लिए लागत से नीचे बेचना

**याद रखें:** जो ग्राहक हमेशा मोलभाव करता है वो कभी वफादार नहीं होगा। उन ग्राहकों पर ध्यान दें जो क्वालिटी और सेवा की कद्र करते हैं।`
  },

  {
    keywords: ['wholesale price', 'bulk discount', 'थोक', 'ज़्यादा सामान'],
    category: 'bargaining',
    responseEn: `**Handling Wholesale Price Requests:**

**When someone wants wholesale price for one item:**
• Explain: "Wholesale price is for bulk orders of [X quantity]"
• Offer: "If you buy [X quantity], I can give you wholesale rate"
• Say: "For single piece, this is my retail price which includes [service/warranty]"
• Alternative: "I can give you a small discount if you buy [2-3 pieces]"

**For bulk buyers:**
• Set clear minimum quantities for wholesale rates
• Calculate your break-even: ensure profit even at wholesale price
• Offer tiered pricing: "10 pieces = 5% off, 50 pieces = 10% off"
• Get payment upfront or clear terms for credit

**Key points:**
• Never give wholesale price for retail quantity - you'll lose money
• Wholesale customers expect lower margins but buy in volume
• Have written price lists for different quantities
• Don't let retail customers see wholesale prices

**What to say:**
"I understand you want the best price. For [X quantity], I can offer [Y rate]. For single piece, my price is [Z] which includes [value-adds]."`,
    responseHi: `**थोक कीमत की माँग को हैंडल करना:**

**जब कोई एक सामान के लिए थोक कीमत चाहे:**
• समझाएं: "थोक कीमत [X मात्रा] के बल्क ऑर्डर के लिए है"
• पेशकश करें: "अगर आप [X मात्रा] खरीदते हैं, मैं आपको थोक रेट दे सकता हूँ"
• कहें: "एक पीस के लिए, यह मेरी खुदरा कीमत है जिसमें [सेवा/वारंटी] शामिल है"
• विकल्प: "अगर आप [2-3 पीस] खरीदते हैं तो मैं छोटी छूट दे सकता हूँ"

**बल्क खरीददारों के लिए:**
• थोक दरों के लिए स्पष्ट न्यूनतम मात्रा तय करें
• अपना ब्रेक-ईवन कैलकुलेट करें: थोक कीमत पर भी मुनाफ़ा सुनिश्चित करें
• टियर्ड प्राइसिंग ऑफर करें: "10 पीस = 5% छूट, 50 पीस = 10% छूट"
• advance पेमेंट लें या क्रेडिट के लिए स्पष्ट शर्तें

**मुख्य बिंदु:**
• खुदरा मात्रा के लिए कभी थोक कीमत न दें - नुकसान होगा
• थोक ग्राहक कम मार्जिन की उम्मीद करते हैं लेकिन मात्रा में खरीदते हैं
• अलग-अलग मात्रा के लिए लिखित कीमत सूची रखें
• खुदरा ग्राहकों को थोक कीमतें न दिखाएं

**क्या कहें:**
"मैं समझता हूँ आप सबसे अच्छी कीमत चाहते हैं। [X मात्रा] के लिए, मैं [Y रेट] ऑफर कर सकता हूँ। एक पीस के लिए, मेरी कीमत [Z] है जिसमें [वैल्यू-ऐड्स] शामिल हैं।"`
  },

  {
    keywords: ['online price', 'amazon', 'flipkart', 'ऑनलाइन', 'अमेज़न'],
    category: 'bargaining',
    responseEn: `**Handling Online Price Comparisons:**

**When customers mention online prices:**
• Acknowledge: "Yes, online prices can be lower sometimes"
• Explain your value: "But here you get [instant availability/no delivery wait/can check quality/personal service]"
• Point out hidden costs: "Online has delivery charges, return hassles, waiting time"
• Offer price match if reasonable: "Show me the exact product and I'll try to match"

**Your advantages over online:**
• Immediate availability - no waiting
• Can see, touch, test the product
• Personal service and advice
• Easy returns/exchanges
• No delivery charges
• Build relationship with local shop

**What to say:**
"I understand online can seem cheaper. But here you get the product immediately, can check quality personally, and I'm always available if you need help or have any issue. Online you wait days and if there's a problem, it's complicated to return."

**When you can't match online price:**
• Be honest: "I can't match that price and still provide the service I do"
• Focus on value: "My price includes [warranty/service/support]"
• Offer alternatives: "I can show you a similar product at a lower price point"

**Key strategy:**
Don't compete on price alone - compete on service, convenience, and trust.`,
    responseHi: `**ऑनलाइन कीमत की तुलना को हैंडल करना:**

**जब ग्राहक ऑनलाइन कीमतें बताएं:**
• स्वीकार करें: "हाँ, ऑनलाइन कीमतें कभी-कभी कम हो सकती हैं"
• अपनी वैल्यू समझाएं: "लेकिन यहाँ आपको [तुरंत उपलब्धता/डिलीवरी का इंतज़ार नहीं/क्वालिटी चेक कर सकते हैं/व्यक्तिगत सेवा] मिलती है"
• छिपे खर्चे बताएं: "ऑनलाइन में डिलीवरी चार्ज, रिटर्न की झंझट, इंतज़ार का समय है"
• अगर उचित हो तो मैच ऑफर करें: "मुझे exact प्रोडक्ट दिखाइए, मैं मैच करने की कोशिश करूँगा"

**ऑनलाइन पर आपकी बढ़त:**
• तुरंत उपलब्धता - इंतज़ार नहीं
• सामान देख, छू, टेस्ट कर सकते हैं
• व्यक्तिगत सेवा और सलाह
• आसान रिटर्न/एक्सचेंज
• डिलीवरी चार्ज नहीं
• स्थानीय दुकान के साथ रिश्ता बनता है

**क्या कहें:**
"मैं समझता हूँ ऑनलाइन सस्ता लग सकता है। लेकिन यहाँ आपको सामान तुरंत मिलता है, क्वालिटी व्यक्तिगत रूप से चेक कर सकते हैं, और अगर मदद चाहिए या कोई समस्या हो तो मैं हमेशा उपलब्ध हूँ। ऑनलाइन में दिन इंतज़ार करना पड़ता है और अगर समस्या हो तो रिटर्न करना जटिल होता है।"

**जब ऑनलाइन कीमत मैच न कर सकें:**
• ईमानदार रहें: "मैं वह कीमत मैच नहीं कर सकता और फिर भी वह सेवा दे सकता हूँ जो मैं देता हूँ"
• वैल्यू पर ध्यान दें: "मेरी कीमत में [वारंटी/सेवा/सपोर्ट] शामिल है"
• विकल्प दें: "मैं आपको कम कीमत पर ऐसा ही सामान दिखा सकता हूँ"

**मुख्य रणनीति:**
सिर्फ कीमत पर प्रतिस्पर्धा न करें - सेवा, सुविधा और भरोसे पर प्रतिस्पर्धा करें।`
  },

  // ===== 2. DIFFICULT CUSTOMERS AND COMPLAINTS =====
  {
    keywords: ['rude customer', 'angry', 'shouting', 'complaint', 'नाराज़', 'गुस्सा', 'शिकायत'],
    category: 'complaints',
    responseEn: `**Handling Difficult and Angry Customers:**

**When a customer is rude or shouting:**
1. **Stay calm** - Don't raise your voice or get defensive
2. **Listen fully** - Let them finish without interrupting
3. **Show empathy** - "I understand you're upset, let me help"
4. **Apologize for the situation** - "I'm sorry you're having this experience"
5. **Focus on solution** - "Here's what I can do for you..."

**For product complaints:**
• Take it seriously even if you think they're wrong
• Examine the product with them present
• If it's a genuine defect: replace/refund immediately
• If it's not a defect: explain patiently, offer alternatives
• Never say "You're wrong" - say "Let me explain how this works"

**When you can't solve immediately:**
• Say: "I understand your concern. Let me find the best solution for you"
• Give a timeline: "I'll get back to you by [specific time]"
• Follow up as promised - this builds trust
- If you can't solve: "I'll escalate this to [supplier/manager] and update you"

**For unreasonable demands:**
• Stay firm but polite: "I understand you want [X], but I can only offer [Y]"
• Explain your limitations: "Our policy is [X] because [reason]"
• Offer alternatives: "I can't do [X], but I can do [Y] for you"
- Know when to say no: "I'm sorry, I can't accommodate that request"

**Key phrases to use:**
✓ "I understand how you feel"
✓ "Let me see what I can do"
✓ "I apologize for the inconvenience"
✓ "Here's what I can offer you"
✓ "Thank you for bringing this to my attention"

**Key phrases to avoid:**
❌ "Calm down" (makes them angrier)
❌ "That's not my problem"
❌ "You should have..."
❌ "There's nothing I can do"
❌ "That's our policy" (without explanation)

**After the situation:**
• Stay professional - don't take it personally
• Learn from it - could this have been prevented?
• Don't discuss the customer negatively with others
• Move on - don't let it affect other customers`,
    responseHi: `**मुश्किल और नाराज़ ग्राहकों को हैंडल करना:**

**जब ग्राहक बदतमीज़ी करे या चिल्लाए:**
1. **शांत रहें** - आवाज़ न बढ़ाएं या बचाव न करें
2. **पूरी बात सुनें** - बीच में टोके बिना पूरी बात कहने दें
3. **सहानुभूति दिखाएं** - "मैं समझता हूँ आप नाराज़ हैं, मैं मदद करता हूँ"
4. **स्थिति के लिए माफ़ी माँगें** - "मुझे खेद है आपको यह अनुभव हो रहा है"
5. **समाधान पर ध्यान दें** - "मैं आपके लिए यह कर सकता हूँ..."

**सामान की शिकायतों के लिए:**
• गंभीरता से लें भले ही आपको लगे वो गलत हैं
• उनके सामने सामान की जाँच करें
• अगर असली खराबी है: तुरंत बदलें/रिफंड दें
• अगर खराबी नहीं है: धैर्य से समझाएं, विकल्प दें
• कभी न कहें "आप गलत हैं" - कहें "मैं समझाता हूँ यह कैसे काम करता है"

**जब तुरंत समाधान न कर सकें:**
• कहें: "मैं आपकी चिंता समझता हूँ। मैं आपके लिए सबसे अच्छा समाधान खोजता हूँ"
• समय सीमा दें: "मैं [निश्चित समय] तक आपको बताऊँगा"
• वादे के अनुसार फॉलो अप करें - इससे भरोसा बनता है
• अगर हम solve नहीं कर सकते: "मैं इसे [सप्लायर/मैनेजर] तक पहुँचाऊँगा और आपको अपडेट करूँगा"

**अनुचित माँगों के लिए:**
• दृढ़ लेकिन विनम्र रहें: "मैं समझता हूँ आप [X] चाहते हैं, लेकिन मैं सिर्फ [Y] ऑफर कर सकता हूँ"
• अपनी सीमाएँ समझाएं: "हमारी पॉलिसी [X] है क्योंकि [कारण]"
• विकल्प दें: "मैं [X] नहीं कर सकता, लेकिन मैं [Y] कर सकता हूँ"
• कभी न कहना है तो कहें: "मुझे खेद है, मैं उस अनुरोध को पूरा नहीं कर सकता"

**उपयोग करने के लिए वाक्य:**
✓ "मैं समझता हूँ आप कैसा महसूस कर रहे हैं"
✓ "मैं देखता हूँ मैं क्या कर सकता हूँ"
✓ "मैं असुविधा के लिए माफी चाहता हूँ"
✓ "मैं आपको यह ऑफर कर सकता हूँ"
✓ "इसे मेरे ध्यान में लाने के लिए धन्यवाद"

**बचने के लिए वाक्य:**
❌ "शांत हो जाइए" (और गुस्सा करता है)
❌ "यह मेरी समस्या नहीं है"
❌ "आपको करना चाहिए था..."
❌ "मैं कुछ नहीं कर सकता"
❌ "यह हमारी पॉलिसी है" (बिना स्पष्टीकरण के)

**स्थिति के बाद:**
• पेशेवर रहें - व्यक्तिगत रूप से न लें
• इससे सीखें - क्या इसे रोका जा सकता था?
• ग्राहक के बारे में नकारात्मक चर्चा न करें
• आगे बढ़ें - अन्य ग्राहकों पर प्रभाव न पड़ने दें`
  },

  {
    keywords: ['return', 'refund', 'exchange', 'वापसी', 'रिफंड', 'बदली'],
    category: 'complaints',
    responseEn: `**Handling Returns and Refunds:**

**When customer wants to return:**
1. **Listen to the reason** - Understand why they want to return
2. **Check your policy** - Know your return/exchange rules clearly
3. **Examine the product** - Check condition, packaging, usage
4. **Offer solutions in order:**
   • Exchange for different size/color/model
   • Store credit for future purchase
   • Refund (if within policy and product is unused)

**For used/damaged products:**
• If defect is genuine: replace or refund regardless of use
• If customer damaged it: politely explain "I can't accept returns on used items unless there's a manufacturing defect"
• Offer repair service if available
• Suggest: "I can't take it back, but I can help you with [alternative solution]"

**When you have no-refund policy:**
• Display it clearly at the counter
• Explain at time of sale: "Please check everything before purchase as we don't accept returns"
• If customer forgot policy: "I understand, but our policy is [X]. However, I can offer [exchange/credit]"
• Be consistent - don't make exceptions visibly

**For defective products:**
• Apologize immediately: "I'm sorry about this defect"
• Replace without argument
• Thank them: "Thank you for letting me know, I'll check the rest of the stock"
• Contact supplier for replacement/credit

**Key phrases:**
✓ "Let me see what I can do for you"
✓ "I can offer you an exchange or store credit"
✓ "Our policy allows [X] within [Y days]"
✓ "I apologize for the inconvenience"

**Mistakes to avoid:**
❌ Arguing about whether the product is defective
❌ Making customers feel guilty for returning
❌ Having unclear or inconsistent return policies
❌ Refusing to help without offering alternatives

**Remember:** A smooth return experience can turn an unhappy customer into a loyal one.`,
    responseHi: `**रिटर्न और रिफंड को हैंडल करना:**

**जब ग्राहक वापस करना चाहे:**
1. **कारण सुनें** - समझें क्यों वापस करना चाहते हैं
2. **अपनी पॉलिसी चेक करें** - अपने रिटर्न/एक्सचेंज नियम स्पष्ट जानें
3. **सामान की जाँच करें** - स्थिति, पैकेजिंग, उपयोग देखें
4. **क्रम में समाधान ऑफर करें:**
   • अलग साइज/रंग/मॉडल से एक्सचेंज
   • भविष्य की खरीद के लिए स्टोर क्रेडिट
   • रिफंड (अगर पॉलिसी के अंदर और सामान अप्रयुक्त है)

**उपयोग किए/क्षतिग्रस्त सामान के लिए:**
• अगर खराबी असली है: उपयोग के बावजूद बदलें या रिफंड दें
• अगर ग्राहक ने क्षतिग्रस्त किया: विनम्रता से समझाएं "मैं उपयोग किए सामान वापस नहीं ले सकता जब तक कि विनिर्माण खराबी न हो"
• अगर उपलब्ध हो तो मरम्मत सेवा ऑफर करें
• सुझाव दें: "मैं वापस नहीं ले सकता, लेकिन मैं [वैकल्पिक समाधान] में मदद कर सकता हूँ"

**जब आपकी नो-रिफंड पॉलिसी हो:**
• काउंटर पर स्पष्ट रूप से प्रदर्शित करें
• बिक्री के समय समझाएं: "कृपया खरीदने से पहले सब कुछ चेक कर लें क्योंकि हम रिटर्न स्वीकार नहीं करते"
• अगर ग्राहक पॉलिसी भूल गया: "मैं समझता हूँ, लेकिन हमारी पॉलिसी [X] है। हालाँकि, मैं [एक्सचेंज/क्रेडिट] ऑफर कर सकता हूँ"
• सुसंगत रहें - स्पष्ट रूप से अपवाद न करें

**खराब सामान के लिए:**
• तुरंत माफी माँगें: "मुझे इस खराबी के लिए खेद है"
• बहस के बिना बदलें
• धन्यवाद दें: "मुझे बताने के लिए धन्यवाद, मैं बाकी स्टॉक चेक करूँगा"
• सप्लायर से रिप्लेसमेंट/क्रेडिट के लिए संपर्क करें

**मुख्य वाक्य:**
✓ "मैं देखता हूँ मैं आपके लिए क्या कर सकता हूँ"
✓ "मैं आपको एक्सचेंज या स्टोर क्रेडिट ऑफर कर सकता हूँ"
✓ "हमारी पॉलिसी [Y दिनों] के भीतर [X] की अनुमति देती है"
✓ "मैं असुविधा के लिए माफी चाहता हूँ"

**गलतियाँ जिनसे बचना है:**
❌ इस बारे में बहस करना कि सामान खराब है या नहीं
❌ ग्राहकों को रिटर्न के लिए अपराधी महसूस कराना
❌ अस्पष्ट या असंगत रिटर्न पॉलिसी रखना
❌ विकल्प दिए बिना मदद करने से मना करना

**याद रखें:** एक सहज रिटर्न अनुभव एक नाखुश ग्राहक को वफादार ग्राहक में बदल सकता है।`
  },

  // ===== 3. CUSTOMER LOYALTY AND RETENTION =====
  {
    keywords: ['loyal', 'regular', 'repeat customer', 'वफादार', 'नियमित', 'बार-बार'],
    category: 'loyalty',
    responseEn: `**Building Customer Loyalty:**

**Make customers choose your shop again:**
1. **Remember them personally**
   • Learn and use their names
   • Remember their preferences and past purchases
   • Ask about their family occasionally

2. **Provide consistent quality**
   • Never compromise on product quality
   • Be honest about product limitations
   • Always give correct measurements/quantities

3. **Offer small gestures**
   • Greeting them warmly when they enter
   • Offering water/tea while they wait
   • Small surprise gifts occasionally (pen, keychain, sample)
   • Remembering birthdays/festivals with wishes

4. **Solve problems quickly**
   • If something goes wrong, fix it immediately
   • Don't argue over small amounts
   • Go the extra mile to satisfy them

5. **Give them priority**
   • Serve them first when they arrive
   • Keep items they frequently buy in stock
   • Inform them about new products they might like

**Loyalty programs that work:**
• **Simple punch card:** Buy 10 times, get 11th free/discounted
• **Points system:** Earn points on purchases, redeem for discounts
• **Exclusive offers:** Special prices or early access for regulars
• **Birthday/anniversary gifts:** Small token on special days

**What NOT to do:**
❌ Treat regulars differently when others are watching
❌ Give big discounts that hurt your margins
❌ Expect loyalty without earning it
❌ Take them for granted

**Key insight:** Customers stay loyal to shops where they feel valued, respected, and confident they'll always get fair treatment.

**Cost-effective loyalty ideas:**
• Personalized service (free)
• Remembering preferences (free)
• Small thank-you notes (minimal cost)
• Priority service during busy times (free)
• Occasional small gifts (low cost, high impact)`,
    responseHi: `**ग्राहक वफादारी बनाना:**

**ग्राहकों को आपकी दुकान फिर से चुनने पर मजबूर करें:**
1. **उन्हें व्यक्तिगत रूप से याद रखें**
   • उनके नाम सीखें और उपयोग करें
   • उनकी पसंद और पिछली खरीद याद रखें
   • कभी-कभी उनके परिवार के बारे में पूछें

2. **सुसंगत क्वालिटी प्रदान करें**
   • सामान की क्वालिटी पर कभी समझौता न करें
   • सामान की सीमाओं के बारे में ईमानदार रहें
   • हमेशा सही माप/मात्रा दें

3. **छोटे इशारे ऑफर करें**
   • जब वे आएं तो गर्मजोशी से अभिवादन करें
   • इंतज़ार में पानी/चाय ऑफर करें
   • कभी-कभी छोटे आश्चर्य उपहार (पेन, कीचेन, सैंपल)
   • जन्मदिन/त्योहार पर शुभकामनाएं याद रखें

4. **समस्याएं जल्दी सुलझाएं**
   • अगर कुछ गलत हो, तुरंत ठीक करें
   • छोटी रकम पर बहस न करें
   • उन्हें संतुष्ट करने के लिए अतिरिक्त प्रयास करें

5. **उन्हें प्राथमिकता दें**
   • जब वे आएं तो पहले सेवा करें
   • वे जो अक्सर खरीदते हैं उसे स्टॉक में रखें
   • उन्हें नए सामान के बारे में बताएं जो उन्हें पसंद आ सकते हैं

**काम करने वाली वफादारी योजनाएं:**
• **सरल पंच कार्ड:** 10 बार खरीदें, 11वीं मुफ्त/छूट पर पाएं
• **पॉइंट्स सिस्टम:** खरीद पर पॉइंट्स कमाएं, छूट के लिए रिडीम करें
• **विशेष ऑफर:** नियमित ग्राहकों के लिए विशेष कीमतें या जल्दी पहुंच
• **जन्मदिन/वर्षगांठ उपहार:** विशेष दिनों पर छोटा टोकन

**क्या नहीं करना है:**
❌ नियमित ग्राहकों के साथ अलग व्यवहार करें जब दूसरे देख रहे हों
❌ बड़ी छूट दें जो आपके मार्जिन को नुकसान पहुंचाए
❌ वफादारी की उम्मीद करें बिना इसे कमाए
❌ उन्हें हल्के में लें

**मुख्य अंतर्दृष्टि:** ग्राहक उन दुकानों के प्रति वफादार रहते हैं जहाँ वे महत्वपूर्ण, सम्मानित महसूस करते हैं और आश्वस्त होते हैं कि उन्हें हमेशा उचित व्यवहार मिलेगा।

**कम खर्च वाली वफादारी विचार:**
• व्यक्तिगत सेवा (मुफ्त)
• पसंद याद रखना (मुफ्त)
• छोटे धन्यवाद नोट (न्यूनतम लागत)
• व्यस्त समय में प्राथमिकता सेवा (मुफ्त)
• कभी-कभार छोटे उपहार (कम लागत, उच्च प्रभाव)`
  },

  // ===== 4. ATTRACTING CUSTOMERS AND LOCAL MARKETING =====
  {
    keywords: ['attract', 'marketing', 'customers', 'promotion', 'ग्राहक', 'प्रचार', 'मार्केटिंग'],
    category: 'marketing',
    responseEn: `**Attracting More Customers to Your Shop:**

**Low-cost marketing strategies:**

1. **Shop appearance matters**
   • Keep shop clean and well-lit
   • Display products attractively at entrance
   • Use clear, readable signboards
   • Keep entrance clutter-free

2. **WhatsApp marketing (free and effective)**
   • Create customer groups (separate for different product categories)
   • Send 2-3 updates per week maximum (don't spam)
   • Share new arrivals, special offers, festival stocks
   • Use photos and short videos
   • Respond quickly to inquiries

3. **Google My Business (free)**
   • Register your shop on Google Maps
   • Add photos, timings, contact details
   • Ask happy customers to leave reviews
   • Respond to all reviews (positive and negative)
   • Post updates about offers/new products

4. **Local visibility**
   • Distribute pamphlets in nearby areas (cost-effective)
   • Put up banners during festivals/seasons
   • Participate in local events/fairs
   • Collaborate with nearby non-competing shops

5. **Word-of-mouth (most powerful)**
   • Provide exceptional service to every customer
   • Ask satisfied customers to refer others
   • Offer referral discounts: "Bring a friend, both get 10% off"
   • Follow up with customers after purchase

**What to post on social media:**
• New product arrivals with photos
• Customer testimonials (with permission)
• Behind-the-scenes of your shop
• Tips related to your products
• Festival greetings and special offers
• Educational content about your products

**Timing your marketing:**
• Morning: Share "good morning" with product highlight
• Afternoon: Share usage tips or product benefits
• Evening: Share special offers or new arrivals
• Festival season: Start promotions 2 weeks early

**Mistakes to avoid:**
❌ Posting too frequently (annoys customers)
❌ Only posting about discounts (seems desperate)
❌ Ignoring customer messages/comments
❌ Copying competitors exactly
❌ Spending money on ads before fixing basic service

**Budget-friendly ideas:**
• WhatsApp status updates (free)
• Instagram posts/stories (free)
• Google My Business (free)
• Customer referral program (costs only discounts)
• Community participation (time investment)

**Key principle:** Marketing brings customers once. Good service brings them back repeatedly.`,
    responseHi: `**आपकी दुकान पर ज़्यादा ग्राहक लाना:**

**कम लागत वाली मार्केटिंग रणनीतियाँ:**

1. **दुकान का रूप मायने रखता है**
   • दुकान साफ और अच्छी रोशनी वाला रखें
   • प्रवेश द्वार पर सामान आकर्षक रूप से प्रदर्शित करें
   • स्पष्ट, पढ़ने योग्य साइनबोर्ड उपयोग करें
   • प्रवेश को अव्यवस्थित न रखें

2. **व्हाट्सएप मार्केटिंग (मुफ्त और प्रभावी)**
   • ग्राहक समूह बनाएं (अलग-अलग सामान श्रेणियों के लिए)
   • अधिकतम सप्ताह में 2-3 अपडेट भेजें (स्पैम न करें)
   • नए आगमन, विशेष ऑफर, त्योहार स्टॉक साझा करें
   • फोटो और छोटे वीडियो उपयोग करें
   • पूछताछ पर तुरंत जवाब दें

3. **गूगल माई बिज़नेस (मुफ्त)**
   • अपनी दुकान को गूगल मैप्स पर रजिस्टर करें
   • फोटो, समय, संपर्क विवरण जोड़ें
   • खुश ग्राहकों से समीक्षा छोड़ने को कहें
   • सभी समीक्षाओं का जवाब दें (सकारात्मक और नकारात्मक)
   • ऑफर/नए सामान के बारे में अपडेट पोस्ट करें

4. **स्थानीय दृश्यता**
   • आस-पास के क्षेत्रों में पर्चे बांटें (लागत-प्रभावी)
   • त्योहारों/मौसमों के दौरान बैनर लगाएं
   • स्थानीय कार्यक्रमों/मेलों में भाग लें
   • आस-पास की गैर-प्रतिस्पर्धी दुकानों के साथ सहयोग करें

5. **मुंह-बोली (सबसे शक्तिशाली)**
   • हर ग्राहक को असाधारण सेवा प्रदान करें
   • संतुष्ट ग्राहकों से दूसरों को रेफर करने को कहें
   • रेफरल छूट ऑफर करें: "दोस्त लाएं, दोनों को 10% छूट"
   • खरीद के बाद ग्राहकों से संपर्क करें

**सोशल मीडिया पर क्या पोस्ट करें:**
• फोटो के साथ नए सामान आगमन
• ग्राहक प्रशंसापत्र (अनुमति के साथ)
• आपकी दुकान के पीछे का दृश्य
• आपके सामान से संबंधित सुझाव
• त्योहार की शुभकामनाएं और विशेष ऑफर
• आपके सामान के बारे में शैक्षिक सामग्री

**मार्केटिंग का समय:**
• सुबह: उत्पाद हाइलाइट के साथ "सुप्रभात" साझा करें
• दोपहर: उपयोग सुझाव या उत्पाद लाभ साझा करें
• शाम: विशेष ऑफर या नए आगमन साझा करें
• त्योहार का मौसम: प्रचार 2 हफ्ते पहले शुरू करें

**गलतियाँ जिनसे बचना है:**
❌ बहुत बार पोस्ट करना (ग्राहकों को परेशान करता है)
❌ सिर्फ छूट के बारे में पोस्ट करना (हताश लगता है)
❌ ग्राहक संदेशों/टिप्पणियों को नजरअंदाज करना
❌ प्रतिस्पर्धियों की बिल्कुल नकल करना
❌ बुनियादी सेवा ठीक करने से पहले विज्ञापनों पर पैसा खर्च करना

**बजट-अनुकूल विचार:**
• व्हाट्सएप स्टेटस अपडेट (मुफ्त)
• इंस्टाग्राम पोस्ट/स्टोरीज (मुफ्त)
• गूगल माई बिज़नेस (मुफ्त)
• ग्राहक रेफरल कार्यक्रम (सिर्फ छूट की लागत)
• समुदाय भागीदारी (समय निवेश)

**मुख्य सिद्धांत:** मार्केटिंग ग्राहकों को एक बार लाती है। अच्छी सेवा उन्हें बार-बार वापस लाती है।`
  },

  // ===== 5. COMPETITION AND DIFFERENTIATION =====
  {
    keywords: ['competitor', 'competition', 'compete', 'प्रतिस्पर्धी', 'प्रतिस्पर्धा'],
    category: 'competition',
    responseEn: `**Competing Effectively with Other Shops:**

**Why customers choose your shop over others:**

1. **Service and relationship**
   • Remember customer names and preferences
   • Provide personalized recommendations
   • Be available when they need you
   • Build genuine relationships

2. **Convenience**
   • Keep popular items always in stock
   • Offer home delivery for regular customers
   • Stay open at convenient hours
   • Make shopping quick and easy

3. **Trust and reliability**
   • Never sell expired or defective products
   • Give honest advice even if it means less sale
   • Stand behind your products
   • Be consistent in quality and service

4. **Unique offerings**
   • Stock items competitors don't carry
   • Offer specialized knowledge/advice
   • Provide value-added services
   • Create a pleasant shopping environment

**When a competitor opens nearby:**

**Don't panic. Do this:**
• Analyze their strengths and weaknesses
• Identify what you do better than them
• Strengthen your customer relationships
• Improve your shop appearance and service
• Don't start a price war

**Competitive strategies:**
✓ **Differentiate:** Offer something they don't
✓ **Specialize:** Become known for specific products
✓ **Serve better:** Provide superior customer service
✓ **Build loyalty:** Make customers feel valued
✓ **Adapt:** Learn from their successful practices

**When competitor sells at very low prices:**

**Don't match blindly. Instead:**
• Understand their strategy (clearing stock? loss leader?)
• Focus on your value proposition
• Explain quality differences to customers
• Offer bundle deals instead of price cuts
• Build relationships that price can't break

**Key questions to ask yourself:**
• What do customers come to me for?
• What can I offer that others can't easily copy?
• Where am I stronger than competitors?
• What do my regular customers value most?

**Remember:** You can't compete on everything. Focus on 2-3 areas where you can be the best in your locality.

**Long-term winning strategy:**
Build a shop where customers feel comfortable, valued, and confident they'll always get fair treatment and quality products. No amount of price cutting can beat genuine customer loyalty.`,
    responseHi: `**अन्य दुकानों के साथ प्रभावी रूप से प्रतिस्पर्धा करना:**

**ग्राहक आपकी दुकान क्यों चुनते हैं दूसरों के बजाय:**

1. **सेवा और रिश्ता**
   • ग्राहकों के नाम और पसंद याद रखें
   • व्यक्तिगत अनुशंसाएं प्रदान करें
   • जब उन्हें आपकी ज़रूरत हो तो उपलब्ध रहें
   • वास्तविक रिश्ते बनाएं

2. **सुविधा**
   • लोकप्रिय सामान हमेशा स्टॉक में रखें
   • नियमित ग्राहकों के लिए होम डिलीवरी ऑफर करें
   • सुविधाजनक समय पर खुले रहें
   • खरीदारी त्वरित और आसान बनाएं

3. **भरोसा और विश्वसनीयता**
   • कभी एक्सपायर या खराब सामान न बेचें
   • ईमानदार सलाह दें भले ही कम बिक्री हो
   • अपने सामान के पीछे खड़े रहें
   • क्वालिटी और सेवा में सुसंगत रहें

4. **अद्वितीय पेशकश**
   • ऐसे सामान रखें जो प्रतिस्पर्धी नहीं रखते
   • विशेषज्ञ ज्ञान/सलाह ऑफर करें
   • मूल्य-वर्धित सेवाएं प्रदान करें
   • एक सुखद खरीदारी वातावरण बनाएं

**जब प्रतिस्पर्धी आस-पास खुले:**

**घबराएं नहीं। यह करें:**
• उनकी ताकत और कमजोरियों का विश्लेषण करें
• पहचानें कि आप उनसे बेहतर क्या करते हैं
• अपने ग्राहक रिश्तों को मजबूत करें
• अपनी दुकान का रूप और सेवा सुधारें
• कीमत युद्ध शुरू न करें

**प्रतिस्पर्धी रणनीतियाँ:**
✓ **अलग करें:** कुछ ऐसा ऑफर करें जो उनके पास नहीं है
✓ **विशेषज्ञता बनने:** विशिष्ट सामान के लिए जाने जाएं
✓ **बेहतर सेवा करें:** बेहतर ग्राहक सेवा प्रदान करें
✓ **वफादारी बनाएं:** ग्राहकों को महत्वपूर्ण महसूस कराएं
✓ **अनुकूलित करें:** उनकी सफल प्रथाओं से सीखें

**जब प्रतिस्पर्धी बहुत कम कीमत पर बेचे:**

**अंधाधुंध मैच न करें। इसके बजाय:**
• उनकी रणनीति समझें (स्टॉक क्लियर कर रहे हैं? लॉस लीडर?)
• अपने मूल्य प्रस्ताव पर ध्यान दें
• ग्राहकों को क्वालिटी अंतर समझाएं
• कीमत कटौती के बजाय बंडल डील ऑफर करें
• ऐसे रिश्ते बनाएं जिन्हें कीमत नहीं तोड़ सकती

**खुद से पूछने के लिए मुख्य प्रश्न:**
• ग्राहक मेरे पास किस लिए आते हैं?
• मैं क्या ऑफर कर सकता हूँ जो दूसरे आसानी से कॉपी नहीं कर सकते?
• मैं प्रतिस्पर्धियों से कहाँ मजबूत हूँ?
• मेरे नियमित ग्राहक सबसे ज़्यादा क्या महत्व देते हैं?

**याद रखें:** आप सब कुछ पर प्रतिस्पर्धा नहीं कर सकते। उन 2-3 क्षेत्रों पर ध्यान दें जहाँ आप अपने क्षेत्र में सर्वश्रेष्ठ बन सकते हैं।

**दीर्घकालिक जीत की रणनीति:**
एक ऐसी दुकान बनाएं जहाँ ग्राहक सहज, महत्वपूर्ण महसूस करें और आश्वस्त हों कि उन्हें हमेशा उचित व्यवहार और क्वालिटी सामान मिलेगा। कोई भी कीमत कटौती वास्तविक ग्राहक वफादारी को नहीं हरा सकती।`
  },

  // Continue with more categories...
  // Due to length, I'll add key categories. You can expand further.

  {
    keywords: ['stock', 'inventory', 'expiry', 'dead stock', 'स्टॉक', 'इन्वेंटरी', 'एक्सपायरी'],
    category: 'inventory',
    responseEn: `**Smart Inventory Management:**

**Identifying what to stock:**
• Track what sells daily/weekly
• Ask customers what they're looking for
• Observe what competitors stock successfully
• Start with small quantities of new items
• Focus on 80/20 rule: 20% items give 80% sales

**Avoiding dead stock:**
✓ Buy small quantities more frequently
✓ Check expiry dates before ordering
✓ Don't buy "just in case" items
✓ Return slow-moving items to suppliers if possible
✓ Discount items approaching expiry (50%+ off)

**Festival stocking:**
• Start planning 2 months before festival
• Look at last year's sales data
• Order 30% extra for fast-moving items
• Don't over-order specialty items
• Have a clearance plan for leftovers

**Organizing your shop:**
• Fast-moving items: Easy access, eye level
• Slow-moving items: Higher/lower shelves
• Related items: Keep together
• New items: Prominent display
• Expiry items: Front (first-in-first-out)

**Weekly inventory check:**
1. List items not sold in 30 days
2. Decide: discount, return, or discontinue
3. Reorder fast-moving items
4. Check expiry dates
5. Adjust quantities based on sales trends

**Key principle:** Empty shelf is better than dead stock. Cash tied up in unsold items is lost opportunity.`,
    responseHi: `**स्मार्ट इन्वेंटरी प्रबंधन:**

**क्या स्टॉक करना है पहचानना:**
• रोज़ाना/साप्ताहिक क्या बिकता है ट्रैक करें
• ग्राहकों से पूछें वे क्या ढूंढ रहे हैं
• देखें प्रतिस्पर्धी सफलतापूर्वक क्या स्टॉक करते हैं
• नए सामान की छोटी मात्रा से शुरू करें
• 80/20 नियम पर ध्यान दें: 20% सामान 80% बिक्री देते हैं

**डेड स्टॉक से बचना:**
✓ छोटी मात्रा बार-बार खरीदें
✓ ऑर्डर करने से पहले एक्सपायरी तिथि चेक करें
✓ "बस संभो करके" सामान न खरीदें
✓ अगर संभव हो तो धीमे बिकने वाले सामान सप्लायर को वापस करें
✓ एक्सपायरी के करीब सामान पर छूट दें (50%+ छूट)

**त्योहार स्टॉकिंग:**
• त्योहार से 2 महीने पहले प्लानिंग शुरू करें
• पिछले साल की बिक्री डेटा देखें
• तेज़ी से बिकने वाले सामान 30% ज़्यादा ऑर्डर करें
• विशेष सामान ज़्यादा ऑर्डर न करें
• बचे हुए सामान के लिए क्लियरेंस योजना रखें

**अपनी दुकान का आयोजन:**
• तेज़ी से बिकने वाले सामान: आसान पहुंच, आँख के स्तर पर
• धीमे बिकने वाले सामान: ऊपरी/निचली शेल्फ
• संबंधित सामान: एक साथ रखें
• नए सामान: प्रमुख प्रदर्शन
• एक्सपायरी सामान: आगे (पहले-आए-पहले-जाए)

**साप्ताहिक इन्वेंटरी चेक:**
1. 30 दिनों में नहीं बिके सामान की सूची बनाएं
2. तय करें: छूट, वापसी, या बंद करें
3. तेज़ी से बिकने वाले सामान फिर से ऑर्डर करें
4. एक्सपायरी तिथियाँ चेक करें
5. बिक्री रुझान के आधार पर मात्राएं समायोजित करें

**मुख्य सिद्धांत:** खाली शेल्फ डेड स्टॉक से बेहतर है। न बिके सामान में फँसा पैसा खोया अवसर है।`
  },

  {
    keywords: ['staff', 'employee', 'worker', 'train', 'कर्मचारी', 'स्टाफ', 'प्रशिक्षण'],
    category: 'staff',
    responseEn: `**Managing Staff Effectively:**

**Training new employees:**
• Day 1: Shop tour, introduce products, explain basic rules
• Week 1: Supervise closely, teach customer handling
• Month 1: Gradually increase responsibility
• Ongoing: Regular feedback and skill development

**Essential training areas:**
1. Product knowledge (what you sell, features, prices)
2. Customer service (greeting, handling queries, complaints)
3. Billing and cash handling (accuracy, honesty)
4. Shop maintenance (cleaning, organizing, restocking)
5. Safety procedures (emergency, theft prevention)

**Dividing work effectively:**
• Assign clear roles based on strengths
• Create written checklists for routine tasks
• Rotate responsibilities to prevent boredom
• Cross-train so everyone can handle multiple tasks

**Handling common issues:**

**Late coming:**
• Set clear expectations from start
• Track attendance consistently
• First time: verbal warning
• Repeated: written warning, then deduction/termination

**Unauthorized discounts:**
• Set clear discount policy in writing
• Explain consequences clearly
• Monitor bills regularly
• Reward honesty and rule-following

**Customer complaints about staff:**
• Listen to customer fully
• Investigate fairly
• Address issue with staff privately
• Provide additional training if needed
• Don't blame staff in front of customers

**Keeping staff motivated:**
✓ Recognize good work publicly
✓ Provide growth opportunities
✓ Pay fair wages on time
✓ Create positive work environment
✓ Listen to their suggestions

**Simple employee handbook should include:**
• Working hours and attendance rules
• Dress code and appearance standards
• Customer service guidelines
• Cash handling procedures
• Emergency contacts and procedures
• Disciplinary policy

**Key principle:** Well-trained staff are your biggest asset. Invest time in training - it saves money in the long run.`,
    responseHi: `**स्टाफ को प्रभावी रूप से प्रबंधित करना:**

**नए कर्मचारियों को प्रशिक्षित करना:**
• दिन 1: दुकान का दौरा, सामान परिचय, बुनियादी नियम समझाएं
• सप्ताह 1: क़रीब से देखरेख करें, ग्राहक हैंडलिंग सिखाएं
• महीना 1: धीरे-धीरे ज़िम्मेदारी बढ़ाएं
• चल रहा: नियमित प्रतिक्रिया और कौशल विकास

**आवश्यक प्रशिक्षण क्षेत्र:**
1. सामान ज्ञान (आप क्या बेचते हैं, विशेषताएं, कीमतें)
2. ग्राहक सेवा (अभिवादन, पूछताछ हैंडलिंग, शिकायतें)
3. बिलिंग और नकद हैंडलिंग (सटीकता, ईमानदारी)
4. दुकान रखरखाव (सफाई, व्यवस्थित करना, रीस्टॉकिंग)
5. सुरक्षा प्रक्रियाएं (आपातकाल, चोरी रोकथाम)

**काम प्रभावी रूप से बाँटना:**
• ताकत के आधार पर स्पष्ट भूमिकाएं असाइन करें
• नियमित कार्यों के लिए लिखित चेकलिस्ट बनाएं
• ऊब रोकने के लिए ज़िम्मेदारियाँ घुमाएं
• क्रॉस-ट्रेन करें ताकि हर कोई कई काम संभाल सके

**आम समस्याओं को हैंडल करना:**

**देर से आना:**
• शुरुआत से स्पष्ट अपेक्षाएं तय करें
• उपस्थिति को सुसंगत रूप से ट्रैक करें
• पहली बार: मौखिक चेतावनी
• बार-बार: लिखित चेतावनी, फिर कटौती/बर्खास्तगी

**अनधिकृत छूट:**
• स्पष्ट छूट नीति लिखित में तय करें
• परिणाम स्पष्ट रूप से समझाएं
• नियमित रूप से बिल मॉनिटर करें
• ईमानदारी और नियम-पालन को पुरस्कृत करें

**स्टाफ के बारे में ग्राहक शिकायतें:**
• ग्राहक की पूरी बात सुनें
• निष्पक्ष रूप से जाँच करें
• स्टाफ के साथ निजी रूप से मुद्दा संबोधित करें
• अगर ज़रूरत हो तो अतिरिक्त प्रशिक्षण प्रदान करें
• ग्राहकों के सामने स्टाफ को दोषी न ठहराएं

**स्टाफ को प्रेरित रखना:**
✓ अच्छे काम को सार्वजनिक रूप से पहचानें
✓ विकास के अवसर प्रदान करें
✓ समय पर उचित वेतन दें
✓ सकारात्मक कार्य वातावरण बनाएं
✓ उनके सुझाव सुनें

**सरल कर्मचारी हैंडबुक में शामिल होना चाहिए:**
• कार्य घंटे और उपस्थिति नियम
• ड्रेस कोड और उपस्थिति मानक
• ग्राहक सेवा दिशानिर्देश
• नकद हैंडलिंग प्रक्रियाएं
• आपातकालीन संपर्क और प्रक्रियाएं
• अनुशासनात्मक नीति

**मुख्य सिद्धांत:** अच्छी तरह से प्रशिक्षित स्टाफ आपकी सबसे बड़ी संपत्ति है। प्रशिक्षण में समय निवेश करें - यह लंबे समय में पैसा बचाता है।`
  },

  {
    keywords: ['upi', 'digital payment', 'online payment', 'fake payment', 'यूपीआई', 'डिजिटल'],
    category: 'digital',
    responseEn: `**Handling Digital Payments Safely:**

**Verifying UPI payments:**
✓ Always check your phone for payment confirmation
✓ Don't trust customer's phone screen alone
✓ Check transaction ID and amount match
✓ Wait for SMS/app notification before giving product
✓ Keep a separate device for payment checking

**Common UPI scams to watch for:**
❌ Fake payment screenshots
❌ "Payment pending" but showing success
❌ Wrong amount entered (1 instead of 100)
❌ Payment to wrong UPI ID
❌ Cancelled payment after showing success

**Protection measures:**
1. Use sound box for instant audio confirmation
2. Keep payment device separate from customer view
3. Check balance regularly throughout the day
4. Maintain written record of all digital payments
5. Reconcile digital and cash at end of day

**When customer claims payment but you didn't receive:**
• Stay calm and polite
• Ask them to show payment confirmation on their phone
• Check your payment app thoroughly
• If still not found: "Let me check with bank, I'll update you"
• Don't give product until payment is confirmed

**Best practices:**
✓ Display QR code prominently
✓ Announce "UPI payment available"
✓ Thank customers for digital payment
✓ Keep backup payment methods ready
✓ Educate staff on verification process

**Daily reconciliation:**
1. Count cash in hand
2. Check UPI app balance
3. Match with total sales recorded
4. Note any discrepancies immediately
5. Contact bank if payment missing

**Key principle:** Trust but verify. Digital payments are convenient but require careful verification to prevent losses.`,
    responseHi: `**डिजिटल पेमेंट सुरक्षित रूप से हैंडल करना:**

**यूपीआई पेमेंट सत्यापित करना:**
✓ पेमेंट पुष्टि के लिए हमेशा अपना फोन चेक करें
✓ सिर्फ ग्राहक के फोन स्क्रीन पर भरोसा न करें
✓ लेनदेन आईडी और राशि मेल खाती है चेक करें
✓ सामान देने से पहले एसएमएस/ऐप सूचना का इंतज़ार करें
✓ पेमेंट चेकिंग के लिए अलग डिवाइस रखें

**देखने के लिए आम यूपीआई घोटाले:**
❌ नकली पेमेंट स्क्रीनशॉट
❌ "पेमेंट लंबित" लेकिन सफलता दिखा रहा है
❌ गलत राशि दर्ज की गई (100 की जगह 1)
❌ गलत यूपीआई आईडी पर पेमेंट
❌ सफलता दिखाने के बाद रद्द पेमेंट

**सुरक्षा उपाय:**
1. तुरंत ऑडियो पुष्टि के लिए साउंड बॉक्स उपयोग करें
2. पेमेंट डिवाइस को ग्राहक की नज़र से अलग रखें
3. पूरे दिन नियमित रूप से बैलेंस चेक करें
4. सभी डिजिटल पेमेंट का लिखित रिकॉर्ड रखें
5. दिन के अंत में डिजिटल और नकद का मिलान करें

**जब ग्राहक कहे पेमेंट किया लेकिन आपको नहीं मिला:**
• शांत और विनम्र रहें
• उन्हें अपने फोन पर पेमेंट पुष्टि दिखाने को कहें
• अपनी पेमेंट ऐप अच्छी तरह चेक करें
• अगर फिर भी नहीं मिला: "मैं बैंक से चेक करूँगा, मैं आपको अपडेट करूँगा"
• पेमेंट पुष्ट होने तक सामान न दें

**सर्वोत्तम प्रथाएं:**
✓ क्यूआर कोड प्रमुखता से प्रदर्शित करें
✓ "यूपीआई पेमेंट उपलब्ध" घोषित करें
✓ डिजिटल पेमेंट के लिए ग्राहकों को धन्यवाद दें
✓ बैकअप पेमेंट विधियाँ तैयार रखें
✓ सत्यापन प्रक्रिया पर स्टाफ को शिक्षित करें

**दैनिक मिलान:**
1. हाथ में नकद गिनें
2. यूपीआई ऐप बैलेंस चेक करें
3. दर्ज कुल बिक्री से मिलाएं
4. किसी भी विसंगति को तुरंत नोट करें
5. अगर पेमेंट गायब हो तो बैंक से संपर्क करें

**मुख्य सिद्धांत:** भरोसा करें लेकिन सत्यापित करें। डिजिटल पेमेंट सुविधाजनक हैं लेकिन नुकसान रोकने के लिए सावधानीपूर्वक सत्यापन की आवश्यकता है।`
  },

  {
    keywords: ['festival', 'diwali', 'season', 'monsoon', 'त्योहार', 'दिवाली', 'मौसम'],
    category: 'seasonal',
    responseEn: `**Festival and Seasonal Planning:**

**Festival preparation timeline:**

**2 months before:**
• Analyze last year's festival sales
• Identify fast-moving items
• Contact suppliers for advance orders
• Plan budget for extra stock

**1 month before:**
• Place orders for popular items
• Arrange festive decorations
• Plan special offers/combos
• Train staff on expected rush

**2 weeks before:**
• Display festive products prominently
• Start marketing via WhatsApp/social media
• Prepare gift packaging
• Ensure adequate cash for change

**1 week before:**
• Final stock check
• Prepare for extended hours if needed
• Brief staff on festival procedures
• Set up additional display areas

**During festival:**
• Keep popular items well-stocked
• Monitor sales daily
• Adjust prices if needed
• Track what's selling fast vs slow

**After festival:**
• Clear leftover stock with discounts
• Analyze what worked and what didn't
• Plan for next year based on learnings
• Thank customers for their business

**Seasonal adjustments:**

**Monsoon:**
• Stock: Umbrellas, raincoats, waterproof items
• Protect: Keep products dry, use plastic covers
• Display: Indoor focus, easy access items

**Summer:**
• Stock: Cool drinks, fans, AC accessories
• Protect: Heat-sensitive items in cool area
• Display: Bright, refreshing arrangements

**Winter:**
• Stock: Warm clothing, heaters, seasonal foods
• Protect: Cold-sensitive products
• Display: Cozy, warm atmosphere

**Key principle:** Start early, plan based on data, don't over-stock, and have a clearance strategy for leftovers.`,
    responseHi: `**त्योहार और मौसमी योजना:**

**त्योहार तैयारी समय-रेखा:**

**2 महीने पहले:**
• पिछले साल की त्योहार बिक्री का विश्लेषण करें
• तेज़ी से बिकने वाले सामान पहचानें
• अग्रिम ऑर्डर के लिए सप्लायर से संपर्क करें
• अतिरिक्त स्टॉक के लिए बजट योजना बनाएं

**1 महीने पहले:**
• लोकप्रिय सामान के लिए ऑर्डर दें
• त्योहार सजावट व्यवस्थित करें
• विशेष ऑफर/कॉम्बो योजना बनाएं
• अपेक्षित भीड़ पर स्टाफ को प्रशिक्षित करें

**2 हफ्ते पहले:**
• त्योहार सामान प्रमुखता से प्रदर्शित करें
• व्हाट्सएप/सोशल मीडिया के माध्यम से मार्केटिंग शुरू करें
• गिफ्ट पैकेजिंग तैयार करें
• बदलाव के लिए पर्याप्त नकद सुनिश्चित करें

**1 हफ्ते पहले:**
• अंतिम स्टॉक चेक
• अगर ज़रूरत हो तो विस्तारित घंटे के लिए तैयार रहें
• त्योहार प्रक्रियाओं पर स्टाफ को संक्षेप में बताएं
• अतिरिक्त प्रदर्शन क्षेत्र सेट अप करें

**त्योहार के दौरान:**
• लोकप्रिय सामान अच्छी तरह स्टॉक रखें
• रोज़ाना बिक्री मॉनिटर करें
• अगर ज़रूरत हो तो कीमतें समायोजित करें
• ट्रैक करें क्या तेज़ी से बिक रहा है बनाम धीमा

**त्योहार के बाद:**
• छूट के साथ बचा हुआ स्टॉक क्लियर करें
• विश्लेषण करें क्या काम किया और क्या नहीं
• सीख के आधार पर अगले साल के लिए योजना बनाएं
• उनके व्यवसाय के लिए ग्राहकों को धन्यवाद दें

**मौसमी समायोजन:**

**मानसून:**
• स्टॉक: छाते, रेनकोट, वाटरप्रूफ सामान
• सुरक्षा: सामान सूखा रखें, प्लास्टिक कवर उपयोग करें
• प्रदर्शन: इनडोर फोकस, आसान पहुंच सामान

**गर्मी:**
• स्टॉक: ठंडे पेय, पंखे, एसी सहायक उपकरण
• सुरक्षा: गर्मी-संवेदनशील सामान ठंडे क्षेत्र में
• प्रदर्शन: उज्ज्वल, ताज़ा व्यवस्था

**सर्दी:**
• स्टॉक: गर्म कपड़े, हीटर, मौसमी खाद्य पदार्थ
• सुरक्षा: ठंड-संवेदनशील उत्पाद
• प्रदर्शन: आरामदायक, गर्म वातावरण

**मुख्य सिद्धांत:** जल्दी शुरू करें, डेटा के आधार पर योजना बनाएं, ज़्यादा स्टॉक न करें, और बचे हुए सामान के लिए क्लियरेंस रणनीति रखें।`
  },

  {
    keywords: ['layout', 'display', 'arrangement', 'shop design', 'लेआउट', 'प्रदर्शन', 'व्यवस्था'],
    category: 'layout',
    responseEn: `**Optimizing Shop Layout and Display:**

**Basic layout principles:**

**Entrance area:**
• Keep clean and welcoming
• Display seasonal/promotional items
• Ensure good lighting
• Make it easy to enter and exit

**Counter placement:**
• Position where you can see most of the shop
• Keep high-value items near counter
• Ensure easy access for billing
• Don't block customer flow

**Product arrangement:**
• Fast-moving items: Eye level, easy access
• Slow-moving items: Higher or lower shelves
• Related items: Keep together (cross-selling)
• New items: Prominent display
• Impulse buys: Near counter

**Shelf organization:**
• Group similar products together
• Use clear price tags
• Keep shelves fully stocked
• Face products forward
• Maintain clean, organized appearance

**Lighting tips:**
• Bright, even lighting throughout
• Highlight featured products
• Use warm lighting for food items
• Ensure no dark corners
• Replace burnt bulbs immediately

**Small shop optimization:**
• Use vertical space (tall shelves)
• Multi-purpose displays
• Keep aisles clear for movement
• Use mirrors to make space feel larger
• Regular decluttering

**Seasonal adjustments:**
• Rotate displays every 2-4 weeks
• Highlight seasonal products
• Create themed sections during festivals
• Keep fresh look to attract repeat customers

**Common mistakes to avoid:**
❌ Overcrowding shelves
❌ Poor lighting
❌ No clear product categories
❌ Blocking walkways
❌ Dirty or damaged displays

**Key principle:** Make shopping easy and pleasant. Customers should find what they need quickly and discover new items naturally.`,
    responseHi: `**दुकान लेआउट और प्रदर्शन को अनुकूलित करना:**

**बुनियादी लेआउट सिद्धांत:**

**प्रवेश क्षेत्र:**
• साफ और स्वागत योग्य रखें
• मौसमी/प्रचार सामान प्रदर्शित करें
• अच्छी रोशनी सुनिश्चित करें
• प्रवेश और निकास आसान बनाएं

**काउंटर प्लेसमेंट:**
• ऐसी जगह रखें जहाँ आप दुकान का ज़्यादातर हिस्सा देख सकें
• उच्च मूल्य वाले सामान काउंटर के पास रखें
• बिलिंग के लिए आसान पहुंच सुनिश्चित करें
• ग्राहक प्रवाह को अवरुद्ध न करें

**सामान व्यवस्था:**
• तेज़ी से बिकने वाले सामान: आँख के स्तर पर, आसान पहुंच
• धीमे बिकने वाले सामान: ऊपरी या निचली शेल्फ
• संबंधित सामान: एक साथ रखें (क्रॉस-सेलिंग)
• नए सामान: प्रमुख प्रदर्शन
• आवेग खरीद: काउंटर के पास

**शेल्फ संगठन:**
• समान सामान एक साथ समूहित करें
• स्पष्ट मूल्य टैग उपयोग करें
• शेल्फ पूरी तरह स्टॉक रखें
• सामान को आगे की ओर रखें
• साफ, व्यवस्थित उपस्थिति बनाए रखें

**रोशनी सुझाव:**
• पूरे में उज्ज्वल, समान रोशनी
• विशेष सामान को हाइलाइट करें
• खाद्य सामान के लिए गर्म रोशनी उपयोग करें
• सुनिश्चित करें कोई अंधेरे कोने न हों
• जली हुई बल्ब तुरंत बदलें

**छोटी दुकान अनुकूलन:**
• लंबवत स्थान उपयोग करें (ऊंची शेल्फ)
• बहु-उद्देश्य प्रदर्शन
• आंदोलन के लिए गलियारे स्पष्ट रखें
• स्थान को बड़ा महसूस कराने के लिए दर्पण उपयोग करें
• नियमित अव्यवस्था हटाना

**मौसमी समायोजन:**
• हर 2-4 हफ्तों में प्रदर्शन घुमाएं
• मौसमी सामान को हाइलाइट करें
• त्योहारों के दौरान थीम वाले अनुभाग बनाएं
• दोहराने वाले ग्राहकों को आकर्षित करने के लिए ताज़ा रूप रखें

**आम गलतियाँ जिनसे बचना है:**
❌ शेल्फ को ज़्यादा भीड़ना
❌ खराब रोशनी
❌ कोई स्पष्ट सामान श्रेणियाँ नहीं
❌ गलियारों को अवरुद्ध करना
❌ गंदे या क्षतिग्रस्त प्रदर्शन

**मुख्य सिद्धांत:** खरीदारी को आसान और सुखद बनाएं। ग्राहकों को जल्दी चाहिए सामान मिलना चाहिए और स्वाभाविक रूप से नए सामान खोजने चाहिए।`
  },

  // ===== 6. DAILY OPERATIONS AND TIME MANAGEMENT =====
  {
    keywords: ['time management', 'daily routine', 'opening', 'closing', 'checklist', 'समय प्रबंधन', 'दैनिक', 'चेकलिस्ट'],
    category: 'operations',
    responseEn: `**Daily Operations and Time Management:**

**Morning opening checklist:**
1. Unlock and turn on lights
2. Check cash in drawer (count and record)
3. Turn on equipment (AC, fridge, computer)
4. Check today's appointments/deliveries
5. Review yesterday's sales and notes
6. Restock shelves from back storage
7. Clean entrance and counter area
8. Check price tags and displays
9. Prepare change money
10. Open shop 5 minutes early

**During the day:**
• Serve customers promptly
• Restock as items sell
• Keep counter clean and organized
• Record all sales immediately
• Handle phone inquiries quickly
• Take short breaks (don't skip meals)
• Monitor stock levels
• Note customer requests for follow-up

**Evening closing checklist:**
1. Count cash and match with sales record
2. Prepare bank deposit (if applicable)
3. Restock shelves for tomorrow
4. Clean shop thoroughly
5. Turn off equipment properly
6. Check all locks and security
7. Turn off lights
8. Note tomorrow's tasks/appointments
9. Lock shop securely
10. Leave 5 minutes after closing time

**Time-saving tips:**
✓ Batch similar tasks together
✓ Create routines for repetitive work
✓ Use checklists to avoid forgetting
✓ Delegate when possible
✓ Don't multitask - focus on one thing
✓ Keep frequently used items within reach
✓ Set specific times for admin work

**Managing busy periods:**
• Stay calm and prioritize
• Serve one customer at a time
• Ask waiting customers to wait politely
• Focus on quick transactions
• Don't get into long conversations
• Ask for help if available

**Weekly tasks:**
• Deep cleaning
• Inventory check
• Order stock for next week
• Review sales and expenses
• Plan promotions
• Check equipment maintenance

**Key principle:** Good routines save time and prevent mistakes. Consistency builds customer trust.`,
    responseHi: `**दैनिक संचालन और समय प्रबंधन:**

**सुबह खोलने की चेकलिस्ट:**
1. ताला खोलें और लाइटें चालू करें
2. दराज़ में नकद चेक करें (गिनें और रिकॉर्ड करें)
3. उपकरण चालू करें (एसी, फ्रिज, कंप्यूटर)
4. आज की नियुक्तियाँ/डिलीवरी चेक करें
5. कल की बिक्री और नोट्स की समीक्षा करें
6. पीछे के भंडारण से शेल्फ रीस्टॉक करें
7. प्रवेश और काउंटर क्षेत्र साफ करें
8. मूल्य टैग और प्रदर्शन चेक करें
9. बदलाव का पैसा तैयार करें
10. 5 मिनट पहले दुकान खोलें

**दिन के दौरान:**
• ग्राहकों को तुरंत सेवा दें
• बिकने पर सामान रीस्टॉक करें
• काउंटर साफ और व्यवस्थित रखें
• सभी बिक्री तुरंत रिकॉर्ड करें
• फोन पूछताछ जल्दी हैंडल करें
• छोटे ब्रेक लें (भोजन न छोड़ें)
• स्टॉक स्तर मॉनिटर करें
• फॉलो-अप के लिए ग्राहक अनुरोध नोट करें

**शाम बंद करने की चेकलिस्ट:**
1. नकद गिनें और बिक्री रिकॉर्ड से मिलाएं
2. बैंक जमा तैयार करें (यदि लागू हो)
3. कल के लिए शेल्फ रीस्टॉक करें
4. दुकान पूरी तरह साफ करें
5. उपकरण ठीक से बंद करें
6. सभी ताले और सुरक्षा चेक करें
7. लाइटें बंद करें
8. कल के कार्य/नियुक्तियाँ नोट करें
9. दुकान सुरक्षित रूप से बंद करें
10. बंद समय के 5 मिनट बाद जाएं

**समय बचाने के सुझाव:**
✓ समान कार्यों को एक साथ batch करें
✓ दोहराव वाले काम के लिए routine बनाएं
✓ भूलने से बचने के लिए चेकलिस्ट उपयोग करें
✓ जब संभव हो तो delegate करें
✓ मल्टीटास्क न करें - एक चीज़ पर ध्यान दें
✓ अक्सर उपयोग होने वाले सामान पहुंच में रखें
✓ admin काम के लिए निश्चित समय तय करें

**व्यस्त अवधि को प्रबंधित करना:**
• शांत रहें और प्राथमिकता तय करें
• एक समय पर एक ग्राहक को सेवा दें
• इंतज़ार कर रहे ग्राहकों से विनम्रता से इंतज़ार करने को कहें
• त्वरित लेनदेन पर ध्यान दें
• लंबी बातचीत में न पड़ें
• अगर उपलब्ध हो तो मदद माँगें

**साप्ताहिक कार्य:**
• गहरी सफाई
• इन्वेंटरी चेक
• अगले सप्ताह के लिए स्टॉक ऑर्डर
• बिक्री और खर्चों की समीक्षा
• प्रचार योजना
• उपकरण रखरखाव चेक

**मुख्य सिद्धांत:** अच्छे routine समय बचाते हैं और गलतियाँ रोकते हैं। सुसंगतता ग्राहक भरोसा बनाती है।`
  },

  // ===== 7. SUPPLIERS AND PURCHASING =====
  {
    keywords: ['supplier', 'wholesaler', 'purchase', 'order', 'supply', 'सप्लायर', 'थोक', 'खरीद'],
    category: 'suppliers',
    responseEn: `**Managing Suppliers and Purchasing:**

**Finding reliable suppliers:**
• Ask other shopkeepers for recommendations
• Visit wholesale markets regularly
• Check supplier reputation and reliability
• Start with small orders to test quality
• Compare prices from multiple suppliers
• Check delivery speed and consistency

**Building good supplier relationships:**
✓ Pay on time, every time
✓ Build personal rapport
✓ Give regular orders (don't jump between suppliers)
✓ Provide feedback on product quality
✓ Be honest about your needs
✓ Maintain good communication

**Negotiating better terms:**
• Order in larger quantities for discounts
• Ask for credit periods (15-30 days)
• Request free delivery
• Negotiate return policies for unsold items
• Ask for promotional materials/support
• Build volume over time for better rates

**What to check when ordering:**
• Product quality and freshness
• Expiry dates (for perishables)
• Packaging condition
• Quantity matches order
• Price matches agreed rate
• Delivery timeline

**Common supplier issues and solutions:**

**Late deliveries:**
• Set clear expectations
• Order well in advance
• Have backup suppliers
• Communicate impact on your business

**Poor quality:**
• Inspect goods on delivery
• Reject substandard items immediately
• Document issues with photos
• Discuss with supplier for replacement

**Price increases:**
• Compare with other suppliers
• Negotiate before accepting
• Consider larger orders to lock prices
• Pass on to customers if necessary (be transparent)

**Purchasing best practices:**
✓ Keep inventory records
✓ Track what sells and what doesn't
✓ Order based on actual demand, not guesses
✓ Don't overstock (ties up cash)
✓ Maintain safety stock for popular items
✓ Review supplier performance regularly

**Red flags - when to change suppliers:**
❌ Consistent quality issues
❌ Frequent delivery delays
❌ Unresponsive to complaints
❌ Unreasonable price hikes
❌ Unreliable stock availability

**Key principle:** Good suppliers are partners in your business. Invest time in finding and maintaining good relationships.`,
    responseHi: `**सप्लायर और खरीद प्रबंधन:**

**विश्वसनीय सप्लायर खोजना:**
• अन्य दुकानदारों से अनुशंसाएं माँगें
• नियमित रूप से थोक बाज़ारों का दौरा करें
• सप्लायर की प्रतिष्ठा और विश्वसनीयता चेक करें
• क्वालिटी टेस्ट करने के लिए छोटे ऑर्डर से शुरू करें
• कई सप्लायरों से कीमतों की तुलना करें
• डिलीवरी गति और सुसंगतता चेक करें

**अच्छे सप्लायर रिश्ते बनाना:**
✓ समय पर भुगतान करें, हर बार
• व्यक्तिगत रिश्ता बनाएं
✓ नियमित ऑर्डर दें (सप्लायरों के बीच न कूदें)
✓ सामान क्वालिटी पर प्रतिक्रिया दें
✓ अपनी ज़रूरतों के बारे में ईमानदार रहें
✓ अच्छा संचार बनाए रखें

**बेहतर शर्तों पर मोलभाव:**
• छूट के लिए बड़ी मात्रा में ऑर्डर करें
• क्रेडिट अवधि माँगें (15-30 दिन)
• मुफ्त डिलीवरी का अनुरोध करें
• न बिके सामान के लिए रिटर्न नीतियों पर मोलभाव करें
• प्रचार सामग्री/समर्थन माँगें
• बेहतर दरों के लिए समय के साथ वॉल्यूम बनाएं

**ऑर्डर करते समय क्या चेक करें:**
• सामान क्वालिटी और ताजगी
• एक्सपायरी तिथियाँ (खराब होने वाले के लिए)
• पैकेजिंग स्थिति
• मात्रा ऑर्डर से मेल खाती है
• कीमत सहमत दर से मेल खाती है
• डिलीवरी समयसीमा

**आम सप्लायर समस्याएं और समाधान:**

**देर से डिलीवरी:**
• स्पष्ट अपेक्षाएं तय करें
• पहले से अच्छी तरह ऑर्डर करें
• बैकअप सप्लायर रखें
• अपने व्यवसाय पर प्रभाव की बात करें

**खराब क्वालिटी:**
• डिलीवरी पर सामान की जाँच करें
• तुरंत उपमानक वस्तुओं को अस्वीकार करें
• फोटो के साथ मुद्दों को दस्तावेज़ करें
• रिप्लेसमेंट के लिए सप्लायर से चर्चा करें

**कीमत वृद्धि:**
• अन्य सप्लायरों से तुलना करें
• स्वीकार करने से पहले मोलभाव करें
• कीमतें लॉक करने के लिए बड़े ऑर्डर पर विचार करें
• अगर ज़रूरी हो तो ग्राहकों पर पास करें (पारदर्शी रहें)

**खरीद सर्वोत्तम प्रथाएं:**
✓ इन्वेंटरी रिकॉर्ड रखें
✓ ट्रैक करें क्या बिकता है और क्या नहीं
✓ वास्तविक माँग के आधार पर ऑर्डर करें, अनुमान से नहीं
✓ ज़्यादा स्टॉक न करें (नकद बाँधता है)
✓ लोकप्रिय सामान के लिए सुरक्षा स्टॉक बनाए रखें
✓ नियमित रूप से सप्लायर प्रदर्शन की समीक्षा करें

**लाल झंडे - कब सप्लायर बदलें:**
❌ सुसंगत क्वालिटी मुद्दे
❌ बार-बार डिलीवरी में देरी
❌ शिकायतों के प्रति असंवेदनशील
❌ अनुचित मूल्य वृद्धि
❌ अविश्वसनीय स्टॉक उपलब्धता

**मुख्य सिद्धांत:** अच्छे सप्लायर आपके व्यवसाय में साझेदार हैं। अच्छे रिश्ते खोजने और बनाए रखने में समय निवेश करें।`
  },

  // ===== 8. SAFETY AND FRAUD PREVENTION =====
  // ===== RENT & LANDLORD NEGOTIATION =====
  {
    keywords: ['rent', 'landlord', 'owner', 'lease', 'किराया', 'मकान मालिक', 'जमीन', 'convince', 'negotiate', 'lower price', 'reduce rent'],
    category: 'rent',
    responseEn: `**How to Negotiate Lower Rent with Your Landlord:**

**Before the conversation:**
• Research market rates in your area (visit 5-10 similar shops)
• Calculate your exact revenue vs rent percentage (rent should be max 10-15% of sales)
• Prepare data: Show your sales records, footfall patterns, and business challenges
• Know your leverage: How long you've been a good tenant, any improvements you've made

**During negotiation:**
1. **Start with relationship** - "I value our relationship and want to continue long-term"
2. **Present facts, not emotions** - Show your sales data, expense breakdown
3. **Explain market reality** - "Similar shops in this area pay ₹X per sq ft"
4. **Offer something in return:**
   • Longer lease (2-3 years instead of 1)
   • Advance rent payment (3-6 months upfront)
   • Take care of minor repairs yourself
   • Agree to small annual increase (5% instead of 10%)
5. **Suggest win-win** - "If rent is ₹X, I can sign for 2 years and pay 3 months advance"

**If landlord refuses:**
• Ask for a grace period during slow months
• Request rent-free period for shop renovation
• Suggest quarterly payment instead of monthly
• Propose revenue-sharing model (rare but works for some)

**What NOT to do:**
❌ Threaten to leave immediately (unless you're ready)
❌ Compare with other tenants directly
❌ Get emotional or aggressive
❌ Negotiate without data

**Key principle:** Landlords prefer stable, long-term tenants over frequent changes. Show them you're serious about staying if the rent is fair.`,
    responseHi: `**मकान मालिक से कम किराए के लिए मोलभाव कैसे करें:**

**बातचीत से पहले:**
• अपने क्षेत्र में बाज़ार दरों का पता लगाएं (5-10 ऐसी ही दुकानें देखें)
• अपना सटीक राजस्व बनाम किराया प्रतिशत निकालें (किराया बिक्री का अधिकतम 10-15% होना चाहिए)
• डेटा तैयार करें: अपने बिक्री रिकॉर्ड, फुटफॉल पैटर्न, और व्यापार चुनौतियां दिखाएं
• अपनी ताकत जानें: आप कितने समय से अच्छे किराएदार हैं, आपने क्या सुधार किए हैं

**मोलभाव के दौरान:**
1. **रिश्ते से शुरू करें** - "मैं हमारे रिश्ते को महत्व देता हूँ और लंबे समय तक जारी रखना चाहता हूँ"
2. **भावनाएं नहीं, तथ्य प्रस्तुत करें** - अपना बिक्री डेटा, खर्च विवरण दिखाएं
3. **बाज़ार की सच्चाई समझाएं** - "इस क्षेत्र में ऐसी दुकानें ₹X प्रति वर्ग फुट देती हैं"
4. **बदले में कुछ ऑफर करें:**
   • लंबा लीज़ (1 के बजाय 2-3 साल)
   • एडवांस किराया भुगतान (3-6 महीने एक साथ)
   • छोटी मरम्मत खुद करें
   • छोटी सालाना वृद्धि स्वीकार करें (10% की जगह 5%)
5. **जीत-जीत सुझाव दें** - "अगर किराया ₹X है, तो मैं 2 साल के लिए साइन कर सकता हूँ और 3 महीने एडवांस दे सकता हूँ"

**अगर मकान मालिक न माने:**
• धीमे महीनों के लिए ग्रेस पीरियड माँगें
• दुकान रिनोवेशन के लिए किराया-मुक्त अवधि का अनुरोध करें
• मासिक की जगह तिमाही भुगतान सुझाएं
• राजस्व-साझाकरण मॉडल प्रस्तावित करें

**क्या नहीं करना है:**
❌ तुरंत चले जाने की धमकी दें (जब तक आप तैयार न हों)
❌ अन्य किराएदारों से सीधी तुलना करें
❌ भावुक या आक्रामक हों
❌ डेटा के बिना मोलभाव करें

**मुख्य सिद्धांत:** मकान मालिक बार-बार बदलने वाले किराएदारों की तुलना में स्थिर, लंबे समय वाले किराएदार पसंद करते हैं। उन्हें दिखाएं कि अगर किराया उचित है तो आप रहने के लिए गंभीर हैं।`
  },

  // ===== STAFF MANAGEMENT =====
  {
    keywords: ['staff', 'employee', 'worker', 'helper', 'कर्मचारी', 'नौकर', 'मददगार', 'train', 'salary', 'manage staff'],
    category: 'staff',
    responseEn: `**Managing Shop Staff Effectively:**

**Hiring the right person:**
• Look for honesty over skills (skills can be taught)
• Check references from previous employers
• Start with a 1-month trial period
• Clear expectations from day one

**Training essentials:**
1. **Product knowledge** - What you sell, where it's kept, prices
2. **Customer handling** - Greeting, billing, handling complaints
3. **Cash handling** - Counting, giving change, UPI verification
4. **Shop maintenance** - Cleaning, restocking, display
5. **Honesty rules** - No unauthorized discounts, report everything

**Daily management:**
• Set fixed working hours and break times
• Create a daily checklist (opening/closing tasks)
• Keep a register for cash and stock
• Review performance weekly

**Common problems and solutions:**

**Staff comes late:**
→ Set clear rules: 3 late arrivals = salary deduction
→ Keep an attendance register
→ Lead by example (you should be on time too)

**Staff is rude to customers:**
→ Train on customer service basics
→ Role-play difficult situations
→ Reward polite behavior publicly

**Staff takes unauthorized breaks:**
→ Define break timings clearly
→ Give them a phone timer
→ Monitor but don't micromanage

**Theft or dishonesty:**
→ Install CCTV (even a dummy one helps)
→ Keep cash counting visible
→ Do surprise stock checks
→ Zero tolerance policy

**Motivation tips:**
✓ Small bonuses for good sales months
✓ Festival bonuses (even ₹500 matters)
✓ Public appreciation
✓ Occasional treats (chai-snacks together)
✓ Clear growth path (helper → senior → manager)

**Salary structure:**
• Fixed salary + performance bonus works best
• Pay on time, every time (builds trust)
• Give festival bonus (1/2 month salary)
• Consider PF/ESI for long-term staff

**Key principle:** Treat staff with respect but maintain clear boundaries. A happy, well-trained staff member is worth 3 average ones.`,
    responseHi: `**दुकान के स्टाफ को प्रभावी रूप से प्रबंधित करना:**

**सही व्यक्ति को नौकर रखना:**
• कौशल से ज्यादा ईमानदारी देखें (कौशल सिखाया जा सकता है)
• पिछले नियोक्ताओं से संदर्भ जांचें
• 1 महीने की ट्रायल पीरियड से शुरू करें
• पहले दिन से स्पष्ट अपेक्षाएं

**प्रशिक्षण आवश्यकताएं:**
1. **उत्पाद ज्ञान** - आप क्या बेचते हैं, कहाँ रखा है, कीमतें
2. **ग्राहक हैंडलिंग** - अभिवादन, बिलिंग, शिकायतें संभालना
3. **नकद हैंडलिंग** - गिनती, छूट देना, यूपीआई सत्यापन
4. **दुकान रखरखाव** - सफाई, रीस्टॉकिंग, प्रदर्शन
5. **ईमानदारी नियम** - बिना अनुमति छूट नहीं, सब रिपोर्ट करें

**दैनिक प्रबंधन:**
• निश्चित कार्य घंटे और ब्रेक समय तय करें
• दैनिक चेकलिस्ट बनाएं (खोलने/बंद करने के कार्य)
• नकद और स्टॉक के लिए रजिस्टर रखें
• साप्ताहिक प्रदर्शन समीक्षा करें

**आम समस्याएं और समाधान:**

**स्टाफ देर से आता है:**
→ स्पष्ट नियम तय करें: 3 बार देर = तनख्वाह कटौती
→ उपस्थिति रजिस्टर रखें
→ उदाहरण बनें (आपको भी समय पर आना चाहिए)

**स्टाफ ग्राहकों से बदतमीजी करता है:**
→ ग्राहक सेवा मूल बातों का प्रशिक्षण दें
→ कठिन स्थितियों की भूमिका निभाएं
→ विनम्र व्यवहार को सार्वजनिक रूप से पुरस्कृत करें

**स्टाफ अनधिकृत ब्रेक लेता है:**
→ ब्रेक समय स्पष्ट रूप से परिभाषित करें
→ उन्हें फोन टाइमर दें
→ निगरानी करें लेकिन सूक्ष्म प्रबंधन न करें

**चोरी या बेईमानी:**
→ सीसीटीवी लगाएं (एक नकली भी मदद करती है)
→ नकद गिनती दृश्यमान रखें
→ आकस्मिक स्टॉक जांच करें
→ शून्य सहिष्णुता नीति

**प्रेरणा टिप्स:**
✓ अच्छे बिक्री महीनों के लिए छोटे बोनस
✓ त्योहार बोनस (₹500 भी मायने रखता है)
✓ सार्वजनिक प्रशंसा
✓ कभी-कभी ट्रीट (साथ में चाय-नाश्ता)
✓ स्पष्ट विकास पथ (हेल्पर → सीनियर → मैनेजर)

**वेतन संरचना:**
• निश्चित वेतन + प्रदर्शन बोनस सबसे अच्छा काम करता है
• समय पर भुगतान करें, हर बार (भरोसा बनता है)
✓ त्योहार बोनस दें (1/2 महीने का वेतन)
✓ लंबे समय वाले स्टाफ के लिए पीएफ/ईएसआई पर विचार करें

**मुख्य सिद्धांत:** स्टाफ के साथ सम्मान से पेश आएं लेकिन स्पष्ट सीमाएं बनाए रखें। एक खुश, अच्छी तरह से प्रशिक्षित स्टाफ सदस्य 3 औसत लोगों के बराबर है।`
  },

  // ===== SUPPLIER MANAGEMENT =====
  {
    keywords: ['supplier', 'wholesaler', 'distributor', 'सप्लायर', 'थोक', 'वितरक', 'order', 'purchase', 'buy stock'],
    category: 'supplier',
    responseEn: `**Managing Suppliers Smartly:**

**Finding good suppliers:**
• Visit wholesale markets regularly (build relationships)
• Ask other shopkeepers for recommendations
• Start with small orders to test quality
• Compare at least 3 suppliers for major items
• Check delivery reliability before committing

**Negotiating better deals:**
1. **Volume discounts** - "If I order 100 pieces, what's the rate?"
2. **Credit period** - Ask for 7-15 days credit for regular orders
3. **Free delivery** - Especially for bulk orders
4. **Return policy** - For damaged/expired goods
5. **Loyalty benefits** - Long-term relationship perks

**Order management:**
• Keep a supplier diary (names, contacts, items, rates)
• Order before stock runs out (track fast-moving items)
• Don't over-order (cash gets blocked)
• Check every delivery against your order
• Inspect quality before accepting

**Common supplier problems:**

**Supplier delivers late:**
→ Set clear delivery timelines
→ Order 3-4 days before you need stock
→ Have backup suppliers for critical items
→ Penalize consistent late delivery (switch suppliers)

**Quality is poor:**
→ Reject immediately at delivery time
→ Take photos as evidence
→ Don't pay until replacement arrives
→ Switch suppliers if problem continues

**Prices keep increasing:**
→ Lock rates for 3-6 months with advance payment
→ Compare with other suppliers regularly
→ Buy in bulk during price dips
→ Pass on to customers only as last resort

**Supplier pushes unwanted items:**
→ Stick to your order list
→ Don't get pressured by "special offers"
→ Calculate if you actually need it
→ Politely but firmly refuse

**Building strong relationships:**
✓ Pay on time (most important!)
✓ Give regular orders (not just when convenient)
✓ Provide feedback on quality
✓ Refer other customers to them
✓ Festival greetings and small gifts
✓ Attend their trade events if invited

**Red flags - change suppliers if:**
❌ Consistent quality issues
❌ Frequent delivery delays
❌ Unresponsive to complaints
❌ Hidden charges appear
❌ Credit terms keep changing

**Key principle:** A reliable supplier is a business partner. Invest time in finding and maintaining good relationships.`,
    responseHi: `**सप्लायर को समझदारी से प्रबंधित करना:**

**अच्छे सप्लायर खोजना:**
• नियमित रूप से थोक बाजारों का दौरा करें (रिश्ते बनाएं)
• अन्य दुकानदारों से सिफारिशें माँगें
• क्वालिटी जांचने के लिए छोटे ऑर्डर से शुरू करें
• प्रमुख वस्तुओं के लिए कम से कम 3 सप्लायरों की तुलना करें
• प्रतिबद्ध होने से पहले डिलीवरी विश्वसनीयता जांचें

**बेहतर सौदे के लिए मोलभाव:**
1. **वॉल्यूम छूट** - "अगर मैं 100 पीस ऑर्डर करूं, तो क्या रेट है?"
2. **क्रेडिट अवधि** - नियमित ऑर्डर के लिए 7-15 दिन का क्रेडिट माँगें
3. **मुफ्त डिलीवरी** - विशेष रूप से बल्क ऑर्डर के लिए
4. **वापसी नीति** - क्षतिग्रस्त/समाप्त सामान के लिए
5. **वफादारी लाभ** - लंबे समय के रिश्ते के फायदे

**ऑर्डर प्रबंधन:**
• सप्लायर डायरी रखें (नाम, संपर्क, वस्तुएं, दरें)
• स्टॉक खत्म होने से पहले ऑर्डर करें (तेजी से बिकने वाली वस्तुओं को ट्रैक करें)
• ज़्यादा ऑर्डर न करें (नकद फंस जाता है)
• हर डिलीवरी को अपने ऑर्डर से मिलाकर जांचें
• स्वीकार करने से पहले क्वालिटी की जांच करें

**आम सप्लायर समस्याएं:**

**सप्लायर देर से डिलीवर करता है:**
→ स्पष्ट डिलीवरी समयसीमा तय करें
→ आपको जरूरत से 3-4 दिन पहले ऑर्डर करें
→ महत्वपूर्ण वस्तुओं के लिए बैकअप सप्लायर रखें
→ लगातार देर से डिलीवरी पर दंड लगाएं (सप्लायर बदलें)

**क्वालिटी खराब है:**
→ डिलीवरी के समय तुरंत अस्वीकार करें
→ सबूत के रूप में फोटो लें
→ रिप्लेसमेंट आने तक भुगतान न करें
→ अगर समस्या जारी रहे तो सप्लायर बदलें

**कीमतें बार-बार बढ़ रही हैं:**
→ एडवांस पेमेंट के साथ 3-6 महीने के लिए दरें लॉक करें
→ नियमित रूप से अन्य सप्लायरों से तुलना करें
→ कीमत गिरावट के दौरान बल्क में खरीदें
→ आखिरी उपाय के रूप में ही ग्राहकों पर पास करें

**सप्लायर अवांछित वस्तुएं थोपता है:**
→ अपनी ऑर्डर सूची पर टिके रहें
→ "विशेष ऑफर" से दबाव में न आएं
• गणना करें कि क्या आपको वास्तव में इसकी जरूरत है
→ विनम्रता से लेकिन दृढ़ता से मना करें

**मजबूत रिश्ते बनाना:**
✓ समय पर भुगतान करें (सबसे महत्वपूर्ण!)
✓ नियमित ऑर्डर दें (सिर्फ सुविधाजनक होने पर नहीं)
✓ क्वालिटी पर प्रतिक्रिया दें
✓ उन्हें अन्य ग्राहकों का रेफरल दें
✓ त्योहार अभिवादन और छोटे उपहार
✓ अगर आमंत्रित करें तो उनके व्यापार कार्यक्रमों में शामिल हों

**लाल झंडे - सप्लायर बदलें अगर:**
❌ लगातार क्वालिटी समस्याएं
❌ बार-बार डिलीवरी में देरी
❌ शिकायतों के प्रति असंवेदनशील
❌ छिपे शुल्क दिखाई देते हैं
❌ क्रेडिट शर्तें बार-बार बदलती हैं

**मुख्य सिद्धांत:** एक विश्वसनीय सप्लायर एक व्यापार भागीदार है। अच्छे रिश्ते खोजने और बनाए रखने में समय निवेश करें।`
  },

  // ===== SHOP DISPLAY & LAYOUT =====
  {
    keywords: ['display', 'layout', 'arrange', 'shelf', 'decoration', 'प्रदर्शन', 'सजावट', 'व्यवस्था', 'shop look', 'organize'],
    category: 'display',
    responseEn: `**Optimizing Your Shop Display & Layout:**

**Basic principles:**
• Clean, well-lit shops attract more customers
• Eye-level products sell fastest
• Keep fast-moving items near the counter
• Group related items together

**Entrance area (most important):**
• Keep it clean and clutter-free
• Display seasonal/festive items here
• Good lighting is essential
• Welcome sign or offer board

**Shelf arrangement:**
• **Top shelf:** Lighter items, less popular products
• **Eye level:** Best sellers, high-margin items (prime real estate!)
• **Lower shelf:** Heavy items, bulk products
• **Counter area:** impulse buys, small items, accessories

**Product grouping:**
✓ Keep similar items together (all soaps, all biscuits)
✓ Place complementary items nearby (tea near cups, chips near drinks)
✓ Create "combo zones" (snacks + drinks together)
✓ Seasonal section (rotate every month)

**Lighting tips:**
• Bright, white light for general area
• Spot lights for featured products
• Avoid dark corners (customers won't go there)
• LED bulbs save electricity and last longer

**Signage and pricing:**
• Clear price tags on everything
• "New Arrival" boards for fresh stock
• "Best Seller" tags build trust
• Festival offers displayed prominently
• Your shop name visible from outside

**Small shop optimization:**
• Use vertical space (tall shelves)
• Mirrors make small shops look bigger
• Keep aisles clear for movement
• Multi-purpose displays
• Regular decluttering (weekly)

**Common mistakes:**
❌ Overcrowding shelves (looks messy)
❌ No price tags (customers hesitate)
❌ Dark corners (wasted space)
❌ Popular items hidden away
❌ No seasonal updates

**Quick wins (do this week):**
1. Move best sellers to eye level
2. Add proper lighting
3. Put price tags on everything
4. Clean and declutter entrance
5. Create a "new arrivals" section

**Key principle:** Your shop layout should make shopping easy and encourage customers to buy more. Good display = more sales.`,
    responseHi: `**अपनी दुकान के प्रदर्शन और लेआउट को अनुकूलित करना:**

**बुनियादी सिद्धांत:**
• साफ, अच्छी रोशनी वाली दुकानें ज़्यादा ग्राहक आकर्षित करती हैं
• आँख के स्तर पर उत्पाद सबसे तेजी से बिकते हैं
• तेजी से बिकने वाली वस्तुओं को काउंटर के पास रखें
• संबंधित वस्तुओं को एक साथ समूहित करें

**प्रवेश क्षेत्र (सबसे महत्वपूर्ण):**
• इसे साफ और अव्यवस्थित रहित रखें
• मौसमी/त्योहार वस्तुएं यहां प्रदर्शित करें
• अच्छी रोशनी आवश्यक है
• स्वागत संकेत या ऑफर बोर्ड

**शेल्फ व्यवस्था:**
• **ऊपरी शेल्फ:** हल्की वस्तुएं, कम लोकप्रिय उत्पाद
• **आँख के स्तर:** सर्वश्रेष्ठ विक्रेता, उच्च-मार्जिन वस्तुएं (प्रमुख रियल एस्टेट!)
• **निचली शेल्फ:** भारी वस्तुएं, बल्क उत्पाद
• **काउंटर क्षेत्र:** आवेग खरीद, छोटी वस्तुएं, सहायक उपकरण

**उत्पाद समूहीकरण:**
✓ समान वस्तुओं को एक साथ रखें (सभी साबुन, सभी बिस्कुट)
✓ पूरक वस्तुओं को पास रखें (कप के पास चाय, पेय के पास चिप्स)
✓ "कॉम्बो ज़ोन" बनाएं (स्नैक्स + पेय एक साथ)
✓ मौसमी अनुभाग (हर महीने घुमाएं)

**रोशनी सुझाव:**
• सामान्य क्षेत्र के लिए उज्ज्वल, सफेद रोशनी
• विशेष उत्पादों के लिए स्पॉट लाइट
• अंधेरे कोनों से बचें (ग्राहक वहां नहीं जाएंगे)
• LED बल्ब बिजली बचाते हैं और लंबे समय तक चलते हैं

**साइनेज और मूल्य निर्धारण:**
• सब कुछ पर स्पष्ट मूल्य टैग
• ताजा स्टॉक के लिए "नया आगमन" बोर्ड
• "बेस्ट सेलर" टैग भरोसा बनाते हैं
• त्योहार ऑफर प्रमुखता से प्रदर्शित
• आपकी दुकान का नाम बाहर से दिखाई दे

**छोटी दुकान अनुकूलन:**
• लंबवत स्थान का उपयोग करें (ऊंची शेल्फ)
• दर्पण छोटी दुकानों को बड़ा दिखाते हैं
• आंदोलन के लिए गलियारे स्पष्ट रखें
• बहु-उद्देश्य प्रदर्शन
• नियमित अव्यवस्था हटाना (साप्ताहिक)

**आम गलतियाँ:**
❌ शेल्फ को ज़्यादा भीड़ना (अव्यवस्थित दिखता है)
❌ कोई मूल्य टैग नहीं (ग्राहक झिझकते हैं)
❌ अंधेरे कोने (बर्बाद स्थान)
❌ लोकप्रिय वस्तुएं छिपी हुई
❌ कोई मौसमी अपडेट नहीं

**त्वरित जीत (इस सप्ताह करें):**
1. सर्वश्रेष्ठ विक्रेताओं को आँख के स्तर पर ले जाएं
2. उचित रोशनी जोड़ें
3. सब कुछ पर मूल्य टैग लगाएं
4. प्रवेश को साफ और अव्यवस्था मुक्त करें
5. "नए आगमन" अनुभाग बनाएं

**मुख्य सिद्धांत:** आपकी दुकान का लेआउट खरीदारी को आसान बनाना चाहिए और ग्राहकों को ज़्यादा खरीदने के लिए प्रोत्साहित करना चाहिए। अच्छा प्रदर्शन = ज़्यादा बिक्री।`
  },

  // ===== THEFT & SAFETY =====
  {
    keywords: ['theft', 'shoplifting', 'fraud', 'safety', 'security', 'चोरी', 'धोखाधड़ी', 'सुरक्षा'],
    category: 'safety',
    responseEn: `**Shop Safety and Fraud Prevention:**

**Preventing theft:**
• Keep high-value items near counter or in locked cabinets
• Maintain good sightlines - avoid blind spots
• Greet every customer (thieves dislike attention)
• Keep shop well-lit and organized
• Install mirrors for better visibility
• Use security cameras if affordable
• Train staff to be alert but not accusatory

**Common theft tactics to watch for:**
❌ Distraction techniques (one person asks questions while another steals)
❌ Large bags or coats used to conceal items
❌ Groups that split up and create confusion
❌ Customers who seem overly nervous or watchful
❌ People who handle many items but buy nothing

**When you suspect theft:**
• Stay calm and observe
• Provide excellent customer service (thieves prefer easy targets)
• If certain, confront politely: "Can I help you find something?"
• Never physically confront or accuse
• If theft occurs, note description and report to police
• Don't chase - your safety is more important

**UPI and payment fraud:**
✓ Always verify payment received before giving product
✓ Check your own phone, not customer's screen
✓ Verify amount matches (watch for 1 vs 100)
✓ Check transaction ID and status
✓ Keep sound box for audio confirmation
✓ Reconcile digital payments daily

**Cash handling safety:**
• Count cash in front of customer
• Use counterfeit detector for large notes
• Keep cash drawer organized
• Don't keep large amounts overnight
• Make bank deposits regularly
• Vary your deposit routine

**Emergency preparedness:**
• Keep first aid kit accessible
• Know emergency numbers (police, fire, ambulance)
• Have fire extinguisher (check expiry)
• Create emergency exit plan
• Keep important documents in safe place
• Backup digital records regularly

**Staff-related security:**
• Trust but verify
• Monitor cash handling closely
• Install CCTV if possible
• Conduct surprise cash counts
• Don't keep all cash in one place
• Rotate responsibilities

**When to call police:**
✓ Active theft in progress
✓ Suspicious activity outside shop
✓ Threatening or violent behavior
✓ Large-scale fraud
✓ Any situation where you feel unsafe

**Key principle:** Prevention is better than cure. Stay alert, maintain good systems, and trust your instincts.`,
    responseHi: `**दुकान सुरक्षा और धोखाधड़ी रोकथाम:**

**चोरी रोकना:**
• उच्च मूल्य वाले सामान काउंटर के पास या बंद अलमारियों में रखें
• अच्छी दृष्टि रेखा बनाए रखें - अंधे धब्बों से बचें
• हर ग्राहक का अभिवादन करें (चोर ध्यान पसंद नहीं करते)
• दुकान को अच्छी तरह रोशन और व्यवस्थित रखें
• बेहतर दृश्यता के लिए दर्पण स्थापित करें
• अगर सस्ती हो तो सुरक्षा कैमरे उपयोग करें
• स्टाफ को सतर्क लेकिन आरोप न लगाने के लिए प्रशिक्षित करें

**देखने के लिए आम चोरी रणनीतियाँ:**
❌ ध्यान भटकाने की तकनीक (एक व्यक्ति सवाल पूछता है जबकि दूसरा चुराता है)
❌ सामान छिपाने के लिए उपयोग किए जाने वाले बड़े बैग या कोट
❌ समूह जो विभाजित होते हैं और भ्रम पैदा करते हैं
❌ ग्राहक जो अत्यधिक घबराए हुए या सतर्क दिखते हैं
❌ लोग जो कई सामान संभालते हैं लेकिन कुछ नहीं खरीदते

**जब आपको चोरी का संदेह हो:**
• शांत रहें और अवलोकन करें
• उत्कृष्ट ग्राहक सेवा प्रदान करें (चोर आसान लक्ष्य पसंद करते हैं)
• अगर निश्चित हैं, विनम्रता से सामना करें: "क्या मैं आपको कुछ खोजने में मदद कर सकता हूँ?"
• कभी भी शारीरिक रूप से सामना न करें या आरोप न लगाएं
• अगर चोरी होती है, विवरण नोट करें और पुलिस को रिपोर्ट करें
• पीछा न करें - आपकी सुरक्षा ज़्यादा महत्वपूर्ण है

**यूपीआई और पेमेंट धोखाधड़ी:**
✓ सामान देने से पहले हमेशा प्राप्त पेमेंट सत्यापित करें
✓ ग्राहक की स्क्रीन नहीं, अपना फोन चेक करें
✓ राशि मेल खाती है चेक करें (1 बनाम 100 पर नज़र रखें)
✓ लेनदेन आईडी और स्थिति चेक करें
✓ ऑडियो पुष्टि के लिए साउंड बॉक्स रखें
✓ डिजिटल पेमेंट का दैनिक मिलान करें

**नकद हैंडलिंग सुरक्षा:**
• ग्राहक के सामने नकद गिनें
• बड़े नोटों के लिए नकली डिटेक्टर उपयोग करें
• नकद दराज़ व्यवस्थित रखें
• रात भर बड़ी रकम न रखें
• नियमित रूप से बैंक जमा करें
• अपनी जमा routine बदलते रहें

**आपातकालीन तैयारी:**
• प्राथमिक चिकित्सा किट सुलभ रखें
• आपातकालीन नंबर जानें (पुलिस, अग्निशामक, एम्बुलेंस)
• अग्निशामक यंत्र रखें (समाप्ति चेक करें)
• आपातकालीन निकास योजना बनाएं
• महत्वपूर्ण दस्तावेज़ सुरक्षित स्थान पर रखें
• डिजिटल रिकॉर्ड का नियमित बैकअप लें

**स्टाफ-संबंधित सुरक्षा:**
• भरोसा करें लेकिन सत्यापित करें
• नकद हैंडलिंग की क़रीब से निगरानी करें
• अगर संभव हो तो सीसीटीवी स्थापित करें
• आकस्मिक नकद गिनती करें
• सारा नकद एक जगह न रखें
• ज़िम्मेदारियाँ घुमाएं

**पुलिस को कब कॉल करें:**
✓ चोरी चल रही है
✓ दुकान के बाहर संदिग्ध गतिविधि
✓ धमकी देने वाला या हिंसक व्यवहार
✓ बड़े पैमाने पर धोखाधड़ी
✓ कोई भी स्थिति जहाँ आप असुरक्षित महसूस करें

**मुख्य सिद्धांत:** रोकथाम इलाज से बेहतर है। सतर्क रहें, अच्छे सिस्टम बनाए रखें, और अपनी प्रवृत्ति पर भरोसा करें।`
  }
];

// Function to find relevant knowledge entry based on question
export function findKnowledgeEntry(question: string): KnowledgeEntry | null {
  const lowerQuestion = question.toLowerCase();
  
  // Score each entry based on keyword matches
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;
  
  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  
  // Only return match if at least one keyword matched
  return bestScore > 0 ? bestMatch : null;
}
