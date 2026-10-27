import { Language } from './types';

const translations = {
  en: {
    // App
    appName: 'DukaanDost',
    tagline: 'Your Shop\'s Smart Advisor',
    
    // Onboarding
    chooseLanguage: 'Choose your language',
    english: 'English',
    hindi: 'हिंदी',
    welcome: 'Welcome!',
    welcomePromise: 'Tell us about your shop in 2 minutes. We\'ll help you earn more and spend less.',
    start: 'Start',
    getStarted: 'Let\'s Begin',
    
    // Phone login
    phoneTitle: 'Enter your phone number',
    phoneDesc: 'We\'ll send a code to verify. Your number stays safe with us.',
    phoneNumber: 'Phone Number',
    sendOtp: 'Send Code',
    enterOtp: 'Enter the 6-digit code',
    otpSent: 'Code sent to',
    verify: 'Verify',
    resend: 'Resend Code',
    
    // Interview
    interviewProgress: 'of',
    back: 'Back',
    skip: 'Skip',
    next: 'Next',
    voiceInput: 'Tap to speak',
    
    // Interview questions
    q_shopType: 'What kind of shop do you have?',
    q_shopName: 'What is your shop\'s name?',
    q_shopNameOptional: '(Optional — you can skip this)',
    q_city: 'Which city or town is your shop in?',
    q_citySuggest: 'We think you\'re in',
    q_cityConfirm: 'Yes, that\'s right',
    q_cityChange: 'No, different city',
    q_duration: 'How long have you been running this shop?',
    q_ownership: 'Do you own or rent the shop?',
    q_workers: 'How many people work in the shop, including you?',
    q_monthlySales: 'Roughly how much does the shop sell in a month?',
    q_udhaar: 'Do you give things on credit (udhaar)?',
    q_accounting: 'How do you keep accounts now?',
    q_worries: 'What worries you most about your shop?',
    q_worriesHint: 'You can pick more than one',
    
    // Shop type options
    st_kirana: 'Grocery / Kirana',
    st_medical: 'Medical Store',
    st_bakery: 'Bakery',
    st_sweet: 'Sweet Shop',
    st_tailor: 'Tailor',
    st_salon: 'Salon / Parlour',
    st_hardware: 'Hardware',
    st_mobile: 'Mobile Shop',
    st_vegetable: 'Vegetable / Fruit',
    st_tea: 'Tea Stall',
    st_restaurant: 'Restaurant / Dhaba',
    st_other: 'Other',
    
    // Duration options
    d_under1: 'Less than 1 year',
    d_1to5: '1 to 5 years',
    d_5to10: '5 to 10 years',
    d_over10: 'More than 10 years',
    
    // Ownership
    o_own: 'I own it',
    o_rent: 'I rent it',
    
    // Monthly sales
    ms_under50k: 'Less than ₹50,000',
    ms_50kto1L: '₹50,000 to ₹1,00,000',
    ms_1Lto3L: '₹1,00,000 to ₹3,00,000',
    ms_3Lto5L: '₹3,00,000 to ₹5,00,000',
    ms_5Lto10L: '₹5,00,000 to ₹10,00,000',
    ms_over10L: 'More than ₹10,00,000',
    
    // Udhaar
    u_never: 'Never',
    u_sometimes: 'Sometimes',
    u_often: 'Often / Regularly',
    
    // Accounting
    a_memory: 'I remember in my head',
    a_notebook: 'Notebook / Register',
    a_app: 'Another app',
    a_nothing: 'I don\'t keep accounts',
    
    // Worries
    w_low_profit: 'Low profit',
    w_too_much_stock: 'Too much stock',
    w_customers_not_paying: 'Customers not paying (udhaar)',
    w_rising_costs: 'Rising costs',
    w_competition: 'Too much competition',
    w_no_time: 'No time for anything',
    w_dont_know: 'I don\'t know',
    
    // Profile summary
    profileSummary: 'Your Shop Profile',
    editAnswer: 'Tap to change',
    confirmProfile: 'Looks good, continue',
    
    // Welcome tour
    tour1Title: 'Track your money',
    tour1Desc: 'Add sales and expenses in seconds. See your profit every day.',
    tour2Title: 'Get smart advice',
    tour2Desc: 'We\'ll tell you how to earn more and spend less — in simple words.',
    tour3Title: 'Ask anything',
    tour3Desc: 'Ask us anything about your shop. Voice or text, in Hindi or English.',
    tourSkip: 'Skip',
    tourNext: 'Next',
    tourDone: 'Let\'s Go!',
    
    // Navigation
    navHome: 'Home',
    navInsights: 'Insights',
    navAsk: 'Ask',
    navTools: 'Tools',
    navLearn: 'Learn',
    
    // Home
    greeting: 'Namaste',
    today: 'Today',
    salesToday: 'Sales Today',
    expensesToday: 'Expenses Today',
    profitToday: 'Profit Today',
    noDataYet: 'Add today\'s sales to get started',
    addSale: 'Add Sale',
    todayAdvice: 'Today\'s Advice',
    quickAdd: 'Quick Add',
    sale: 'Sale',
    expense: 'Expense',
    udhaar: 'Udhaar',
    weeklyOverview: 'This Week',
    weekComparison: 'This week was better than last week by',
    weekComparisonDown: 'This week was less than last week by',
    
    // Data entry
    enterAmount: 'Enter amount',
    save: 'Save',
    undo: 'Undo',
    voice: 'Voice',
    voiceListening: 'Listening...',
    voiceConfirm: 'Is this correct?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    paymentCash: 'Cash',
    paymentUpi: 'UPI',
    paymentUdhaar: 'Udhaar',
    todayTotal: 'Today\'s Total',
    
    // Expense categories
    ec_stock: 'Stock Purchase',
    ec_rent: 'Rent',
    ec_electricity: 'Electricity',
    ec_salary: 'Salary',
    ec_transport: 'Transport',
    ec_packaging: 'Packaging',
    ec_maintenance: 'Maintenance',
    ec_other: 'Other',
    
    // Udhaar
    customerName: 'Customer Name',
    amount: 'Amount',
    dueDate: 'When will they pay?',
    addUdhaar: 'Add Udhaar',
    totalOwed: 'Total Owed to You',
    whoOwesToday: 'Who to ask today',
    sendReminder: 'Send Reminder',
    
    // Ask tab
    askTitle: 'Ask DukaanDost',
    askPlaceholder: 'Ask any queries...',
    suggestedQ1: 'Why was my profit low this week?',
    suggestedQ2: 'Which customers owe me the most?',
    suggestedQ3: 'How can I reduce electricity cost?',
    suggestedQ4: 'What should I stock for upcoming festivals?',
    readAloud: 'Read aloud',
    wasHelpful: 'Was this helpful?',
    yes: 'Yes',
    no: 'No',
    
    // Tools
    toolsTitle: 'Tools',
    tool_profitCalc: 'Profit Calculator',
    tool_priceSetter: 'Price Setter',
    tool_breakeven: 'Break-Even',
    tool_udhaarTracker: 'Udhaar Tracker',
    tool_costPlanner: 'Monthly Cost Planner',
    tool_stockReorder: 'Stock Reorder',
    tool_festival: 'Festival Planner',
    tool_digitalPay: 'Digital Payments',
    tool_loanCheck: 'Loan Checker',
    tool_savings: 'Savings Goal',
    tool_billSplit: 'Bill Splitter',
    tool_bargain: 'Bargain Helper',
    
    // Learn
    learnTitle: 'Learn',
    lessonOfDay: 'Lesson of the Day',
    allLessons: 'All Lessons',
    tryInShop: 'Try it in my shop',
    minutes: 'min',
    
    // Profile
    profileTitle: 'Profile',
    shopDetails: 'Shop Details',
    language: 'Language',
    reminderTime: 'Daily Reminder',
    textSizeLabel: 'Text Size',
    normal: 'Normal',
    large: 'Large',
    darkMode: 'Dark Mode',
    appLock: 'App Lock (PIN)',
    privacy: 'Privacy',
    exportData: 'Export My Data',
    deleteData: 'Delete All Data',
    shareApp: 'Share with another shopkeeper',
    help: 'Help & Support',
    about: 'About DukaanDost',
    
    // Privacy
    privacyTitle: 'Your Privacy',
    privacyDesc: 'Your data belongs to you. We never sell it or show ads. We collect only what we need to help your shop.',
    privacyPoints: [
      'Your phone number is used only for login',
      'Your shop data is stored securely',
      'We never share your data with advertisers',
      'You can delete everything anytime',
    ],
    
    // Alerts
    alertsTitle: 'Alerts',
    dailyReminder: 'Daily sales reminder',
    udhaarAlerts: 'Udhaar due dates',
    festivalAlerts: 'Festival reminders',
    insightsAlerts: 'Smart insights',
    
    // General
    rupee: '₹',
    perDay: '/day',
    perMonth: '/month',
    noInternet: 'No internet — working offline',
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    done: 'Done',
    close: 'Close',
  },
  
  hi: {
    // App
    appName: 'दुकानदोस्त',
    tagline: 'आपकी दुकान का समझदार सलाहकार',
    
    // Onboarding
    chooseLanguage: 'अपनी भाषा चुनें',
    english: 'English',
    hindi: 'हिंदी',
    welcome: 'स्वागत है!',
    welcomePromise: '2 मिनट में अपनी दुकान के बारे में बताइए। हम आपको ज़्यादा कमाने और कम खर्च करने में मदद करेंगे।',
    start: 'शुरू करें',
    getStarted: 'चलिए शुरू करते हैं',
    
    // Phone login
    phoneTitle: 'अपना फ़ोन नंबर डालें',
    phoneDesc: 'हम एक कोड भेजेंगे। आपका नंबर हमारे पास सुरक्षित है।',
    phoneNumber: 'फ़ोन नंबर',
    sendOtp: 'कोड भेजें',
    enterOtp: '6 अंक का कोड डालें',
    otpSent: 'कोड भेजा गया',
    verify: 'पक्का करें',
    resend: 'कोड फिर भेजें',
    
    // Interview
    interviewProgress: 'में से',
    back: 'पीछे',
    skip: 'छोड़ें',
    next: 'आगे',
    voiceInput: 'बोलने के लिए टैप करें',
    
    // Interview questions
    q_shopType: 'आपकी दुकान किस तरह की है?',
    q_shopName: 'आपकी दुकान का नाम क्या है?',
    q_shopNameOptional: '(यह ज़रूरी नहीं है)',
    q_city: 'आपकी दुकान किस शहर या कस्बे में है?',
    q_citySuggest: 'हमें लगता है आप यहाँ हैं',
    q_cityConfirm: 'हाँ, सही है',
    q_cityChange: 'नहीं, दूसरा शहर',
    q_duration: 'आप कब से यह दुकान चला रहे हैं?',
    q_ownership: 'दुकान अपनी है या किराए पर?',
    q_workers: 'दुकान में कितने लोग काम करते हैं, आप सहित?',
    q_monthlySales: 'महीने में roughly कितने का माल बिकता है?',
    q_udhaar: 'क्या आप उधार देते हैं?',
    q_accounting: 'अभी हिसाब कैसे रखते हैं?',
    q_worries: 'दुकान को लेकर सबसे ज़्यादा क्या चिंता है?',
    q_worriesHint: 'एक से ज़्यादा चुन सकते हैं',
    
    // Shop type options
    st_kirana: 'किराना / जनरल स्टोर',
    st_medical: 'मेडिकल स्टोर',
    st_bakery: 'बेकरी',
    st_sweet: 'मिठाई की दुकान',
    st_tailor: 'दर्ज़ी',
    st_salon: 'सैलून / पार्लर',
    st_hardware: 'हार्डवेयर',
    st_mobile: 'मोबाइल की दुकान',
    st_vegetable: 'सब्ज़ी / फल',
    st_tea: 'चाय की टपरी',
    st_restaurant: 'रेस्टोरेंट / ढाबा',
    st_other: 'अन्य',
    
    // Duration options
    d_under1: '1 साल से कम',
    d_1to5: '1 से 5 साल',
    d_5to10: '5 से 10 साल',
    d_over10: '10 साल से ज़्यादा',
    
    // Ownership
    o_own: 'अपनी है',
    o_rent: 'किराए पर है',
    
    // Monthly sales
    ms_under50k: '₹50,000 से कम',
    ms_50kto1L: '₹50,000 से ₹1,00,000',
    ms_1Lto3L: '₹1,00,000 से ₹3,00,000',
    ms_3Lto5L: '₹3,00,000 से ₹5,00,000',
    ms_5Lto10L: '₹5,00,000 से ₹10,00,000',
    ms_over10L: '₹10,00,000 से ज़्यादा',
    
    // Udhaar
    u_never: 'कभी नहीं',
    u_sometimes: 'कभी-कभी',
    u_often: 'अक्सर / रोज़',
    
    // Accounting
    a_memory: 'याद रखता हूँ',
    a_notebook: 'रजिस्टर / कॉपी',
    a_app: 'दूसरा ऐप',
    a_nothing: 'हिसाब नहीं रखता',
    
    // Worries
    w_low_profit: 'कम मुनाफ़ा',
    w_too_much_stock: 'ज़्यादा सामान पड़ा है',
    w_customers_not_paying: 'ग्राहक पैसे नहीं देते (उधार)',
    w_rising_costs: 'बढ़ते खर्चे',
    w_competition: 'बहुत प्रतिस्पर्धा',
    w_no_time: 'समय ही नहीं मिलता',
    w_dont_know: 'पता नहीं',
    
    // Profile summary
    profileSummary: 'आपकी दुकान की जानकारी',
    editAnswer: 'बदलने के लिए टैप करें',
    confirmProfile: 'सही है, आगे बढ़ें',
    
    // Welcome tour
    tour1Title: 'पैसों का हिसाब',
    tour1Desc: 'सेकंड में बिक्री और खर्च डालें। रोज़ मुनाफ़ा देखें।',
    tour2Title: 'समझदार सलाह',
    tour2Desc: 'हम बताएँगे कैसे ज़्यादा कमाएँ और कम खर्च करें — आसान भाषा में।',
    tour3Title: 'कुछ भी पूछें',
    tour3Desc: 'दुकान के बारे में कुछ भी पूछें। आवाज़ या टाइप, हिंदी या अंग्रेज़ी।',
    tourSkip: 'छोड़ें',
    tourNext: 'आगे',
    tourDone: 'चलिए शुरू करें!',
    
    // Navigation
    navHome: 'होम',
    navInsights: 'विश्लेषण',
    navAsk: 'पूछें',
    navTools: 'टूल्स',
    navLearn: 'सीखें',
    
    // Home
    greeting: 'नमस्ते',
    today: 'आज',
    salesToday: 'आज की बिक्री',
    expensesToday: 'आज का खर्च',
    profitToday: 'आज का मुनाफ़ा',
    noDataYet: 'शुरू करने के लिए आज की बिक्री डालें',
    addSale: 'बिक्री डालें',
    todayAdvice: 'आज की सलाह',
    quickAdd: 'जल्दी डालें',
    sale: 'बिक्री',
    expense: 'खर्च',
    udhaar: 'उधार',
    weeklyOverview: 'इस हफ़्ते',
    weekComparison: 'पिछले हफ़्ते से यह हफ़्ता बेहतर रहा',
    weekComparisonDown: 'पिछले हफ़्ते से यह हफ़्ता कम रहा',
    
    // Data entry
    enterAmount: 'रकम डालें',
    save: 'सेव करें',
    undo: 'वापस',
    voice: 'आवाज़',
    voiceListening: 'सुन रहे हैं...',
    voiceConfirm: 'क्या यह सही है?',
    confirm: 'पक्का',
    cancel: 'रद्द करें',
    paymentCash: 'नकद',
    paymentUpi: 'UPI',
    paymentUdhaar: 'उधार',
    todayTotal: 'आज का कुल',
    
    // Expense categories
    ec_stock: 'सामान खरीदा',
    ec_rent: 'किराया',
    ec_electricity: 'बिजली',
    ec_salary: 'तनख़्वाह',
    ec_transport: 'यातायात',
    ec_packaging: 'पैकेजिंग',
    ec_maintenance: 'मरम्मत',
    ec_other: 'अन्य',
    
    // Udhaar
    customerName: 'ग्राहक का नाम',
    amount: 'रकम',
    dueDate: 'कब तक पैसे देंगे?',
    addUdhaar: 'उधार डालें',
    totalOwed: 'आपको कुल कितना मिलना है',
    whoOwesToday: 'आज किससे माँगें',
    sendReminder: 'याद दिलाएँ',
    
    // Ask tab
    askTitle: 'दुकानदोस्त से पूछें',
    askPlaceholder: 'कोई भी सवाल पूछें...',
    suggestedQ1: 'इस हफ़्ते मुनाफ़ा कम क्यों रहा?',
    suggestedQ2: 'कौन से ग्राहक सबसे ज़्यादा उधार रखते हैं?',
    suggestedQ3: 'बिजली का बिल कैसे कम करें?',
    suggestedQ4: 'आने वाले त्योहारों के लिए क्या स्टॉक करें?',
    readAloud: 'सुनाएँ',
    wasHelpful: 'क्या यह काम आया?',
    yes: 'हाँ',
    no: 'नहीं',
    
    // Tools
    toolsTitle: 'टूल्स',
    tool_profitCalc: 'मुनाफ़ा कैलकुलेटर',
    tool_priceSetter: 'कीमत तय करें',
    tool_breakeven: 'कितना बेचना ज़रूरी',
    tool_udhaarTracker: 'उधार ट्रैकर',
    tool_costPlanner: 'महीने का खर्च प्लानर',
    tool_stockReorder: 'स्टॉक ऑर्डर',
    tool_festival: 'त्योहार प्लानर',
    tool_digitalPay: 'डिजिटल पेमेंट',
    tool_loanCheck: 'लोन चेकर',
    tool_savings: 'बचत लक्ष्य',
    tool_billSplit: 'बिल बाँटें',
    tool_bargain: 'भाव-ताोल',
    
    // Learn
    learnTitle: 'सीखें',
    lessonOfDay: 'आज का पाठ',
    allLessons: 'सभी पाठ',
    tryInShop: 'अपनी दुकान में आज़माएँ',
    minutes: 'मिनट',
    
    // Profile
    profileTitle: 'प्रोफ़ाइल',
    shopDetails: 'दुकान की जानकारी',
    language: 'भाषा',
    reminderTime: 'रोज़ याद दिलाने का समय',
    textSizeLabel: 'अक्षरों का आकार',
    normal: 'सामान्य',
    large: 'बड़ा',
    darkMode: 'डार्क मोड',
    appLock: 'ऐप लॉक (PIN)',
    privacy: 'प्राइवेसी',
    exportData: 'मेरा डेटा निकालें',
    deleteData: 'सब डेटा मिटाएँ',
    shareApp: 'दूसरे दुकानदार को बताएँ',
    help: 'मदद',
    about: 'दुकानदोस्त के बारे में',
    
    // Privacy
    privacyTitle: 'आपकी प्राइवेसी',
    privacyDesc: 'आपका डेटा आपका है। हम इसे कभी बेचते नहीं या विज्ञापन नहीं दिखाते।',
    privacyPoints: [
      'फ़ोन नंबर सिर्फ़ लॉगिन के लिए',
      'दुकान का डेटा सुरक्षित रखा जाता है',
      'विज्ञापन वालों को कुछ नहीं देते',
      'कभी भी सब कुछ मिटा सकते हैं',
    ],
    
    // Alerts
    alertsTitle: 'सूचनाएँ',
    dailyReminder: 'रोज़ बिक्री याद',
    udhaarAlerts: 'उधार की तारीख़',
    festivalAlerts: 'त्योहार याद',
    insightsAlerts: 'समझदार सलाह',
    
    // General
    rupee: '₹',
    perDay: '/दिन',
    perMonth: '/महीना',
    noInternet: 'इंटरनेट नहीं — ऑफ़लाइन चल रहा है',
    loading: 'लोड हो रहा है...',
    error: 'कुछ गड़बड़ हो गई',
    retry: 'फिर कोशिश करें',
    done: 'हो गया',
    close: 'बंद करें',
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language): string {
  const value = (translations as any)[lang]?.[key] || (translations as any).en[key] || key;
  return String(value);
}

export function tArray(key: 'privacyPoints', lang: Language): string[] {
  const value = (translations as any)[lang]?.[key] || (translations as any).en[key] || [];
  return value as string[];
}

export default translations;
