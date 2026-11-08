import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import {
  analyseCoachBaseline,
  COACH_BASELINE_QUESTIONS,
  restoreCoachBaselineAssessment,
  validateCoachBaseline,
} from '../coach/coachAssessment';
import type { CoachBaselineObservation } from '../coach/coachAssessment';
import { isCoachCloudAvailable, loadCoachBaseline, saveCoachBaseline } from '../coach/coachRepository';
import { appendCoachTranscript, cancelCoachSpeech, isCoachSpeechSynthesisSupported, speakCoachText, useCoachVoiceInput } from '../coach/useCoachVoice';
import type { CoachVoiceError } from '../coach/useCoachVoice';
import type { CoachSessionFeedback } from '../coach/coachFeedback';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Mic,
  MicOff,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet,
  Volume2,
} from 'lucide-react';

type CoachScreen =
  | 'home'
  | 'sales-intro'
  | 'assessment-preview'
  | 'assessment-observation'
  | 'simulation-preview'
  | 'feedback-preview'
  | 'milestone-preview';

const coachCopy = {
  en: {
    eyebrow: 'LEARN',
    headline: 'Build the skills that move your shop forward.',
    subhead: 'Choose an AI coach and practise the decisions you make every day.',
    salesTitle: 'Sales & Customer Handling',
    salesDescription: 'Understand customers, handle difficult conversations and build trust that brings people back.',
    financeTitle: 'Financial Management',
    financeDescription: 'Build confidence with cash flow, costs, pricing and everyday money decisions.',
    inventoryTitle: 'Inventory Management',
    inventoryDescription: 'Make smarter stock decisions, reduce money tied up on shelves and stay ready for demand.',
    comingSoon: 'Coming soon',
    recommended: 'START HERE',
    personalCoach: 'Your practical, personal business coach',
    introTitle: 'Turn everyday customer moments into better business decisions.',
    introDescription: 'Practise with realistic AI customer simulations shaped around your shop, your language and the way you do business.',
    shopContext: 'Your shop profile',
    tailored: 'Scenarios tailored to your business',
    natural: 'Natural customer conversations',
    usefulFeedback: 'Honest, practical feedback after each practice',
    ethical: 'Better selling without pressure or false promises',
    transparency: 'You will always know when you are speaking with an AI simulation. Practice conversations never create real sales, expenses, stock changes or udhaar entries.',
    previewButton: 'Preview the coaching experience',
    startButton: 'Start your coaching journey',
    previewHint: 'The three-question starting assessment is active in this preview. Live AI customer conversations and account-level progress will be connected in later phases.',
    assessment: 'Getting to know your approach',
    assessmentHint: 'Three short situations help establish your starting point.',
    question: 'QUESTION',
    of: 'OF',
    answerPlaceholder: 'Write what you would naturally say or do...',
    voiceStart: 'Speak your answer',
    voiceStop: 'Stop listening',
    voiceListening: 'Listening… speak naturally.',
    voicePrivacy: 'Your browser may process speech using its own service. Review the text before continuing or sending; Dukaan Dost does not store a separate audio recording.',
    voiceUnsupported: 'Voice input is not supported in this browser. You can type your reply instead.',
    voicePermissionDenied: 'Microphone permission is blocked. Allow microphone access in your browser settings, then try again.',
    voiceNoSpeech: 'No speech was detected. Try again or type your reply.',
    voiceNoMicrophone: 'No microphone was found. Connect or enable a microphone, or type your reply.',
    voiceNetwork: 'Speech recognition could not connect. Check your internet connection or type your reply.',
    voiceLanguage: 'This browser does not support the selected speech language. Try typing your reply.',
    voiceUnknown: 'Voice input could not start. Please try again or type your reply.',
    voicePlaybackUnavailable: 'Read-aloud is not supported in this browser.',
    continue: 'Continue',
    seeConversation: 'See the conversation screen',
    temporary: 'Answers stay only in this temporary preview session; they are not uploaded to an account.',
    observationTitle: 'Your starting observation',
    baselineComplete: 'STARTING POINT',
    observationIntro: 'This is an early reading of the three answers you gave—not a score or a fixed judgement.',
    observationDisclaimer: 'This is a simple text-based first reading, not the full AI assessment, a score or a fixed judgement. Your profile will develop as you practise.',
    previewNotSaved: 'This development preview has no Coach database connected. Your answers have not been saved to an account.',
    baselineSaved: 'Your three answers and starting observation have been saved to your individual Coach profile.',
    tryConversation: 'Continue to the conversation preview',
    answerRequired: 'Please write an answer before continuing.',
    saveFailed: 'Your answers could not be saved. Please try again.',
    saving: 'Saving your starting point…',
    simulation: 'Customer conversation',
    customer: 'Customer',
    aiSimulation: 'AI simulation',
    replyPlaceholder: 'Write your reply to the customer…',
    livePreviewUnavailable: 'Live AI practice is intentionally disabled in this isolated preview. No Coach database or AI secret is connected, and no session was created.',
    startPractice: 'Start customer practice',
    sendReply: 'Send reply',
    finishPractice: 'End this practice',
    sessionStarting: 'Preparing your customer…',
    customerThinking: 'Customer is replying…',
    practiceCompleted: 'This customer conversation is complete. You can now review feedback based on what you actually said.',
    practiceAbandoned: 'This practice was ended before completion. It will not produce completed-session feedback.',
    replyRequired: 'Write a reply before sending.',
    startFailed: 'The customer practice could not be started. Please try again.',
    replyFailed: 'Your reply could not be sent. It has not been added twice. Please retry.',
    feedbackUnavailable: 'Live AI feedback is disabled in this isolated preview. No private Coach database or AI secret is connected, so no feedback was generated or saved.',
    feedbackFailed: 'Feedback could not be generated from this completed conversation. Your transcript is unchanged. Please try again.',
    feedbackLoading: 'Reviewing your conversation…',
    getFeedback: 'Get feedback on this conversation',
    feedbackRetry: 'Try feedback again',
    feedbackExample: 'You could say:',
    backToConversation: 'Back to conversation',
    feedbackPrivacy: 'This feedback is based only on the saved practice conversation. It is not a score or a judgement of you as a person.',
    simulationDisclosure: 'You are speaking with an AI customer in a practice simulation. No real sales, expenses, stock or udhaar entries are created.',
    seeFeedback: 'See the feedback screen',
    feedbackTitle: 'Feedback that helps you improve',
    feedbackIntro: 'After a completed conversation, your coach will review what you actually said and did.',
    currentFeedback: 'Current feedback',
    currentFeedbackDesc: 'An honest view of how you handled the situation, based on your actual conversation.',
    improveAreas: 'Areas to improve',
    improveAreasDesc: 'Specific moments where a different approach could help the customer and protect your business.',
    howImprove: 'How to improve',
    howImproveDesc: 'A practical action and a natural example sentence you can use in your shop.',
    readAloud: 'Read aloud',
    feedbackNote: 'This is the feedback layout. No score or judgement is being generated in this screen preview.',
    seeMilestone: 'See the first-ten review',
    milestoneTitle: 'Your first 10 conversations',
    milestoneIntro: 'A meaningful review of your progress after your first ten completed customer simulations.',
    milestoneReview: 'Overall performance review',
    milestoneReviewDesc: 'A concise picture of how you handled different customer situations across all ten conversations.',
    improvement: 'How have you improved?',
    improvementDesc: 'A comparison of your earlier responses with your tenth conversation, highlighting only genuine progress.',
    noProgress: 'Your progress will appear here after ten completed conversations.',
    backToLearn: 'Back to Learn',
    backToCoach: 'Back to Sales Coach',
    designPreview: 'DESIGN PREVIEW',
    category: 'Business type',
    location: 'Location',
    noProfile: 'Your saved shop details will be used here.',
    next: 'Next question',
    viewFeedback: 'View feedback layout',
    practiceLength: 'A few minutes at a time',
    trust: 'Trust first. Business results matter.',
  },
  hi: {
    eyebrow: 'सीखें',
    headline: 'अपनी दुकान को आगे बढ़ाने वाले हुनर सीखें।',
    subhead: 'AI कोच चुनें और रोज़ के कारोबार से जुड़े फैसलों का अभ्यास करें।',
    salesTitle: 'बिक्री और ग्राहक संभालना',
    salesDescription: 'ग्राहकों को समझें, मुश्किल बातचीत संभालें और ऐसा भरोसा बनाएँ जिससे ग्राहक दोबारा आएँ।',
    financeTitle: 'वित्तीय प्रबंधन',
    financeDescription: 'रोज़ के पैसों, खर्चों, भाव और नकदी के फैसलों में भरोसा बढ़ाएँ।',
    inventoryTitle: 'स्टॉक प्रबंधन',
    inventoryDescription: 'सही स्टॉक रखें, शेल्फ़ पर फँसा पैसा घटाएँ और ग्राहक की माँग के लिए तैयार रहें।',
    comingSoon: 'जल्द आ रहा है',
    recommended: 'यहाँ से शुरू करें',
    personalCoach: 'आपका काम का, निजी बिज़नेस कोच',
    introTitle: 'रोज़ के ग्राहक अनुभव को बेहतर कारोबारी फैसलों में बदलें।',
    introDescription: 'अपनी दुकान, भाषा और काम करने के तरीके के हिसाब से बने वास्तविक AI ग्राहक-सिमुलेशन के साथ अभ्यास करें।',
    shopContext: 'आपकी दुकान की जानकारी',
    tailored: 'आपके कारोबार के हिसाब से परिस्थितियाँ',
    natural: 'स्वाभाविक ग्राहक बातचीत',
    usefulFeedback: 'हर अभ्यास के बाद साफ़ और काम की सलाह',
    ethical: 'बिना दबाव या झूठे वादों के बेहतर बिक्री',
    transparency: 'आपको हमेशा पता रहेगा कि आप AI सिमुलेशन से बात कर रहे हैं। अभ्यास से असली बिक्री, खर्च, स्टॉक या उधार की एंट्री नहीं बनेगी।',
    previewButton: 'कोच का अनुभव देखें',
    startButton: 'अपना अभ्यास शुरू करें',
    previewHint: 'तीन शुरुआती सवालों वाला आकलन इस डेमो में काम करता है। असली AI ग्राहक बातचीत और अकाउंट में सेव प्रगति अगले चरणों में जुड़ेगी।',
    assessment: 'आपका तरीका समझते हैं',
    assessmentHint: 'तीन छोटी परिस्थितियाँ आपकी शुरुआती सोच समझने में मदद करेंगी।',
    question: 'सवाल',
    of: 'में से',
    answerPlaceholder: 'आप स्वाभाविक रूप से क्या कहेंगे या करेंगे, लिखें...',
    voiceStart: 'बोलकर जवाब दें',
    voiceStop: 'सुनना बंद करें',
    voiceListening: 'सुन रहे हैं… स्वाभाविक रूप से बोलें।',
    voicePrivacy: 'आपका ब्राउज़र अपनी speech service से आवाज़ प्रोसेस कर सकता है। आगे बढ़ने या भेजने से पहले लिखे हुए शब्द जाँच लें; Dukaan Dost अलग audio recording सेव नहीं करता।',
    voiceUnsupported: 'इस ब्राउज़र में आवाज़ से लिखने की सुविधा नहीं है। आप अपना जवाब टाइप कर सकते हैं।',
    voicePermissionDenied: 'माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र की सेटिंग में माइक्रोफ़ोन की अनुमति दें और फिर कोशिश करें।',
    voiceNoSpeech: 'आवाज़ सुनाई नहीं दी। फिर कोशिश करें या जवाब टाइप करें।',
    voiceNoMicrophone: 'माइक्रोफ़ोन नहीं मिला। माइक्रोफ़ोन जोड़ें या चालू करें, या जवाब टाइप करें।',
    voiceNetwork: 'आवाज़ पहचानने वाली सेवा से कनेक्शन नहीं हो पाया। इंटरनेट जाँचें या जवाब टाइप करें।',
    voiceLanguage: 'यह ब्राउज़र चुनी हुई भाषा को सपोर्ट नहीं करता। जवाब टाइप करके देखें।',
    voiceUnknown: 'आवाज़ से जवाब शुरू नहीं हो पाया। फिर कोशिश करें या टाइप करें।',
    voicePlaybackUnavailable: 'इस ब्राउज़र में जवाब सुनने की सुविधा उपलब्ध नहीं है।',
    continue: 'आगे बढ़ें',
    seeConversation: 'बातचीत की स्क्रीन देखें',
    temporary: 'इस डेमो में जवाब केवल इसी अस्थायी सेशन में रहेंगे; वे किसी अकाउंट पर अपलोड नहीं होंगे।',
    observationTitle: 'आपकी शुरुआती समझ',
    baselineComplete: 'शुरुआती स्थिति',
    observationIntro: 'यह आपके तीन जवाबों की शुरुआती समझ है—कोई स्कोर या पक्का फैसला नहीं।',
    observationDisclaimer: 'यह केवल शुरुआती टेक्स्ट-आधारित संकेत हैं, AI का पूरा आकलन, स्कोर या पक्का फैसला नहीं। अभ्यास के साथ आपकी समझ बेहतर होगी।',
    previewNotSaved: 'इस डेवलपमेंट डेमो में Coach डेटाबेस जुड़ा नहीं है। आपके जवाब किसी अकाउंट में सेव नहीं हुए हैं।',
    baselineSaved: 'आपके तीनों जवाब और शुरुआती समझ आपके निजी Coach प्रोफ़ाइल में सेव हो गए हैं।',
    tryConversation: 'बातचीत का डेमो देखें',
    answerRequired: 'आगे बढ़ने से पहले अपना जवाब लिखें।',
    saveFailed: 'आपके जवाब सेव नहीं हो पाए। कृपया फिर कोशिश करें।',
    saving: 'आपकी शुरुआती जानकारी सेव हो रही है…',
    simulation: 'ग्राहक से बातचीत',
    customer: 'ग्राहक',
    aiSimulation: 'AI सिमुलेशन',
    replyPlaceholder: 'ग्राहक को अपना जवाब लिखें…',
    livePreviewUnavailable: 'इस अलग डेवलपमेंट डेमो में AI अभ्यास बंद है। Coach डेटाबेस या AI सीक्रेट जुड़ा नहीं है, इसलिए कोई सेशन नहीं बनाया गया।',
    startPractice: 'ग्राहक से अभ्यास शुरू करें',
    sendReply: 'जवाब भेजें',
    finishPractice: 'अभ्यास समाप्त करें',
    sessionStarting: 'ग्राहक तैयार हो रहा है…',
    customerThinking: 'ग्राहक जवाब दे रहा है…',
    practiceCompleted: 'यह ग्राहक बातचीत पूरी हो गई। अब आप अपने असली जवाबों पर आधारित फीडबैक देख सकते हैं।',
    practiceAbandoned: 'यह अभ्यास पूरा होने से पहले समाप्त किया गया। इससे पूरा सेशन वाला फीडबैक नहीं बनेगा।',
    replyRequired: 'भेजने से पहले अपना जवाब लिखें।',
    startFailed: 'ग्राहक अभ्यास शुरू नहीं हो पाया। फिर कोशिश करें।',
    replyFailed: 'आपका जवाब नहीं भेजा जा सका। इसे दोबारा सेव नहीं किया गया है। फिर कोशिश करें।',
    feedbackUnavailable: 'इस अलग डेवलपमेंट डेमो में AI फीडबैक बंद है। Coach डेटाबेस या AI सीक्रेट जुड़ा नहीं है, इसलिए फीडबैक बनाया या सेव नहीं हुआ।',
    feedbackFailed: 'इस पूरी बातचीत से फीडबैक नहीं बन पाया। आपकी बातचीत सुरक्षित है। कृपया फिर कोशिश करें।',
    feedbackLoading: 'आपकी बातचीत को समझ रहे हैं…',
    getFeedback: 'इस बातचीत का फीडबैक देखें',
    feedbackRetry: 'फीडबैक फिर से बनाएँ',
    feedbackExample: 'आप ऐसे कह सकते हैं:',
    backToConversation: 'बातचीत पर वापस जाएँ',
    feedbackPrivacy: 'यह फीडबैक केवल सेव की गई अभ्यास-बातचीत पर आधारित है। यह कोई स्कोर या आपके व्यक्तित्व पर फैसला नहीं है।',
    simulationDisclosure: 'आप एक AI ग्राहक से अभ्यास कर रहे हैं। इससे असली बिक्री, खर्च, स्टॉक या उधार की एंट्री नहीं बनेगी।',
    seeFeedback: 'फीडबैक की स्क्रीन देखें',
    feedbackTitle: 'ऐसी सलाह जो आपको बेहतर बनाए',
    feedbackIntro: 'बातचीत पूरी होने पर आपका कोच आपके असली जवाब और फैसलों को समझेगा।',
    currentFeedback: 'अभी का फीडबैक',
    currentFeedbackDesc: 'आपने बातचीत कैसे संभाली, उसका साफ़ और ईमानदार आकलन।',
    improveAreas: 'सुधार की जगह',
    improveAreasDesc: 'वे खास मौके जहाँ दूसरा तरीका ग्राहक और कारोबार—दोनों के लिए बेहतर हो सकता है।',
    howImprove: 'कैसे सुधारें',
    howImproveDesc: 'एक काम की रणनीति और ऐसा उदाहरण वाक्य जिसे आप दुकान में बोल सकें।',
    readAloud: 'सुनकर पढ़ें',
    feedbackNote: 'यह केवल फीडबैक स्क्रीन का डेमो है। यहाँ कोई स्कोर या फैसला नहीं बनाया जा रहा।',
    seeMilestone: 'पहले दस अभ्यासों की समीक्षा देखें',
    milestoneTitle: 'आपकी पहली 10 बातचीत',
    milestoneIntro: 'पहले दस पूरे ग्राहक-सिमुलेशन के बाद आपकी प्रगति की सार्थक समीक्षा।',
    milestoneReview: 'कुल प्रदर्शन की समीक्षा',
    milestoneReviewDesc: 'दसों बातचीत में अलग-अलग ग्राहकों को आपने कैसे संभाला, उसकी छोटी-सी तस्वीर।',
    improvement: 'आपमें क्या सुधार आया?',
    improvementDesc: 'पहले के जवाबों की दसवीं बातचीत से तुलना—सिर्फ़ असली सुधार को दिखाते हुए।',
    noProgress: 'दस पूरी बातचीत के बाद आपकी प्रगति यहाँ दिखाई देगी।',
    backToLearn: 'सीखें पर वापस जाएँ',
    backToCoach: 'सेल्स कोच पर वापस जाएँ',
    designPreview: 'डिज़ाइन डेमो',
    category: 'दुकान का प्रकार',
    location: 'जगह',
    noProfile: 'आपकी सेव की गई दुकान की जानकारी यहाँ इस्तेमाल होगी।',
    next: 'अगला सवाल',
    viewFeedback: 'फीडबैक की स्क्रीन देखें',
    practiceLength: 'एक बार में कुछ मिनट',
    trust: 'पहले भरोसा। कारोबार का फायदा भी ज़रूरी है।',
  },
};

function getShopTypeLabel(shopType: string | null, lang: 'en' | 'hi'): string {
  if (!shopType) return '';
  const labels: Record<string, { en: string; hi: string }> = {
    kirana: { en: 'Kirana / grocery', hi: 'किराना / जनरल स्टोर' },
    medical: { en: 'Medical store', hi: 'मेडिकल स्टोर' },
    bakery: { en: 'Bakery', hi: 'बेकरी' },
    sweet: { en: 'Sweet shop', hi: 'मिठाई की दुकान' },
    tailor: { en: 'Tailor', hi: 'दर्जी' },
    salon: { en: 'Salon / parlour', hi: 'सैलून / पार्लर' },
    hardware: { en: 'Hardware', hi: 'हार्डवेयर' },
    mobile: { en: 'Mobile shop', hi: 'मोबाइल की दुकान' },
    vegetable: { en: 'Fruit / vegetable shop', hi: 'फल / सब्ज़ी की दुकान' },
    tea: { en: 'Tea stall', hi: 'चाय की दुकान' },
    restaurant: { en: 'Restaurant / dhaba', hi: 'रेस्टोरेंट / ढाबा' },
    other: { en: 'Local business', hi: 'स्थानीय कारोबार' },
  };
  return labels[shopType]?.[lang] || labels.other[lang];
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-border/70 bg-bg">
      <button
        type="button"
        onClick={onBack}
        className="dd-mobile-back-button w-11 h-11 rounded-xl flex items-center justify-center text-text hover:bg-primary/5 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="dd-mobile-back-icon" size={22} />
      </button>
      <h1 className="text-body-lg font-semibold text-text flex-1 min-w-0 truncate">{title}</h1>
    </div>
  );
}

function PreviewNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 flex items-start gap-2.5 text-amber-900" role="status">
      <ShieldCheck size={17} className="shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function PrimaryAction({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn-primary w-full">
      {children}
    </button>
  );
}

export function LearnScreen() {
  const { state } = useStore();
  const lang: 'en' | 'hi' = state.language === 'hi' ? 'hi' : 'en';
  const copy = coachCopy[lang];
  const shopType = getShopTypeLabel(state.shopProfile.shopType, lang);
  const city = state.shopProfile.city.trim();
  const [screen, setScreen] = useState<CoachScreen>('home');
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [answers, setAnswers] = useState(['', '', '']);
  const [baselineObservation, setBaselineObservation] = useState<CoachBaselineObservation | null>(null);
  const [baselineError, setBaselineError] = useState('');
  const [baselineSaving, setBaselineSaving] = useState(false);
  const [baselineStorageMessage, setBaselineStorageMessage] = useState('');
  const [simulationSessionId, setSimulationSessionId] = useState<string | null>(null);
  const [simulationMessages, setSimulationMessages] = useState<Array<{ speaker: 'customer' | 'shopkeeper'; content: string }>>([]);
  const [simulationReply, setSimulationReply] = useState('');
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [simulationError, setSimulationError] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'continue' | 'completed' | 'abandoned'>('idle');
  const [simulationOutcome, setSimulationOutcome] = useState<string | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<CoachSessionFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const isDesignPreview = import.meta.env.VITE_SALES_COACH_UI_PREVIEW === 'true';

  const baselineVoice = useCoachVoiceInput({
    language: lang,
    disabled: screen !== 'assessment-preview' || baselineSaving,
    onTranscript: (transcript) => setAnswers((current) => current.map((answer, index) =>
      index === assessmentIndex ? appendCoachTranscript(answer, transcript) : answer
    )),
  });
  const simulationVoice = useCoachVoiceInput({
    language: lang,
    disabled: screen !== 'simulation-preview' || simulationBusy || simulationStatus !== 'continue',
    onTranscript: (transcript) => setSimulationReply((current) => appendCoachTranscript(current, transcript)),
  });

  useEffect(() => {
    if (screen !== 'simulation-preview') cancelCoachSpeech();
  }, [screen]);

  useEffect(() => () => cancelCoachSpeech(), []);

  const voiceErrorText = (error: CoachVoiceError | null): string => {
    switch (error) {
      case 'unsupported': return copy.voiceUnsupported;
      case 'permission-denied': return copy.voicePermissionDenied;
      case 'no-speech': return copy.voiceNoSpeech;
      case 'no-microphone': return copy.voiceNoMicrophone;
      case 'network': return copy.voiceNetwork;
      case 'language': return copy.voiceLanguage;
      case 'unknown': return copy.voiceUnknown;
      default: return '';
    }
  };

  const openAssessmentPreview = async () => {
    setBaselineError('');
    if (baselineObservation) {
      setScreen('assessment-observation');
      return;
    }

    setBaselineSaving(true);
    try {
      if (isCoachCloudAvailable()) {
        const existing = await loadCoachBaseline();
        if (existing) {
          const restored = restoreCoachBaselineAssessment(existing.assessment_data, lang);
          if (restored.ok === false) throw new Error(restored.error);
          setAnswers(COACH_BASELINE_QUESTIONS.map((question) =>
            restored.value.answers.find((answer) => answer.questionId === question.id)?.answer ?? ''
          ));
          setBaselineObservation(restored.value.observation);
          setBaselineStorageMessage(copy.baselineSaved);
          setScreen('assessment-observation');
          return;
        }
      }

      setAssessmentIndex(0);
      setAnswers(['', '', '']);
      setBaselineObservation(null);
      setBaselineStorageMessage('');
      setScreen('assessment-preview');
    } catch (error) {
      console.error('Existing Coach baseline could not be loaded.', error);
      setBaselineError(copy.saveFailed);
    } finally {
      setBaselineSaving(false);
    }
  };

  const handleAssessmentContinue = async () => {
    baselineVoice.stop();
    if (!answers[assessmentIndex]?.trim()) {
      setBaselineError(copy.answerRequired);
      return;
    }
    setBaselineError('');

    if (assessmentIndex < 2) {
      setAssessmentIndex((current) => current + 1);
      return;
    }

    const baselineAnswers = COACH_BASELINE_QUESTIONS.map((question, index) => ({
      questionId: question.id,
      answer: answers[index],
    }));
    const validated = validateCoachBaseline(baselineAnswers);
    if (validated.ok === false) {
      setBaselineError(validated.error);
      if (typeof validated.questionIndex === 'number') setAssessmentIndex(validated.questionIndex);
      return;
    }

    const observation = analyseCoachBaseline(validated.value, lang);
    if (observation.ok === false) {
      setBaselineError(observation.error);
      return;
    }

    setBaselineSaving(true);
    try {
      const cloudAvailable = isCoachCloudAvailable();
      let finalObservation = observation.value;
      let finalAnswers = validated.value;
      if (cloudAvailable) {
        const saved = await saveCoachBaseline(
          validated.value,
          {
            shopName: state.shopProfile.shopName,
            shopType: state.shopProfile.shopType,
            city: state.shopProfile.city,
            preferredLanguage: lang,
          },
          observation.value,
        );
        const restored = restoreCoachBaselineAssessment(saved.assessment_data, lang);
        if (restored.ok === false) throw new Error(restored.error);
        finalObservation = restored.value.observation;
        finalAnswers = restored.value.answers;
      }
      setAnswers(COACH_BASELINE_QUESTIONS.map((question) =>
        finalAnswers.find((answer) => answer.questionId === question.id)?.answer ?? ''
      ));
      setBaselineObservation(finalObservation);
      setBaselineStorageMessage(cloudAvailable ? copy.baselineSaved : copy.previewNotSaved);
      setScreen('assessment-observation');
    } catch (error) {
      console.error('Coach baseline could not be saved.', error);
      setBaselineError(copy.saveFailed);
    } finally {
      setBaselineSaving(false);
    }
  };

  const callCoachSimulation = async (payload: Record<string, unknown>) => {
    if (!supabase) throw new Error(copy.livePreviewUnavailable);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error(copy.livePreviewUnavailable);
    const response = await fetch('/api/coach-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + data.session.access_token,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const failure = new Error(typeof result?.error === 'string' ? result.error : copy.startFailed) as Error & { code?: string };
      failure.code = typeof result?.code === 'string' ? result.code : undefined;
      throw failure;
    }
    return result as Record<string, any>;
  };

  const callCoachFeedback = async (sessionId: string) => {
    if (!supabase) throw new Error(copy.feedbackUnavailable);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error(copy.feedbackUnavailable);
    const response = await fetch('/api/coach-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + data.session.access_token,
      },
      body: JSON.stringify({ sessionId }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const failure = new Error(typeof result?.error === 'string' ? result.error : copy.feedbackFailed) as Error & { code?: string };
      failure.code = typeof result?.code === 'string' ? result.code : undefined;
      throw failure;
    }
    return result as { sessionId: string; feedback: CoachSessionFeedback; createdAt?: string };
  };

  const openCoachFeedback = async () => {
    if (!simulationSessionId) {
      setFeedbackError(copy.feedbackFailed);
      return;
    }
    if (coachFeedback) {
      setScreen('feedback-preview');
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError('');
    try {
      const result = await callCoachFeedback(simulationSessionId);
      setCoachFeedback(result.feedback);
      setScreen('feedback-preview');
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : copy.feedbackFailed);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const startCoachSimulation = async () => {
    simulationVoice.stop();
    cancelCoachSpeech();
    setScreen('simulation-preview');
    setSimulationError('');
    setSimulationSessionId(null);
    setSimulationBusy(true);
    setSimulationMessages([]);
    setSimulationReply('');
    setSimulationStatus('idle');
    setSimulationOutcome(null);
    setCoachFeedback(null);
    setFeedbackError('');
    setFeedbackLoading(false);
    try {
      let result: Record<string, any>;
      try {
        result = await callCoachSimulation({ action: 'start' });
      } catch (error) {
        if ((error as Error & { code?: string }).code !== 'COACH_SESSION_EXISTS') throw error;
        result = await callCoachSimulation({ action: 'resume' });
      }
      setSimulationSessionId(result.sessionId);
      const messages = Array.isArray(result.conversation)
        ? result.conversation
        : [{ speaker: 'customer', content: result.customerMessage }];
      setSimulationMessages(messages.filter((message: any) =>
        (message?.speaker === 'customer' || message?.speaker === 'shopkeeper') &&
        typeof message?.content === 'string'
      ));
      setSimulationStatus(result.status === 'completed' ? 'completed' : 'continue');
      setSimulationOutcome(typeof result.outcome === 'string' ? result.outcome : null);
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : copy.startFailed);
    } finally {
      setSimulationBusy(false);
    }
  };

  const sendCoachReply = async () => {
    simulationVoice.stop();
    cancelCoachSpeech();
    const message = simulationReply.trim();
    if (!message) {
      setSimulationError(copy.replyRequired);
      return;
    }
    if (!simulationSessionId) {
      setSimulationError(copy.startFailed);
      return;
    }
    setSimulationError('');
    setSimulationBusy(true);
    try {
      const result = await callCoachSimulation({
        action: 'reply',
        sessionId: simulationSessionId,
        message,
      });
      setSimulationMessages((current) => [
        ...current,
        { speaker: 'shopkeeper', content: message },
        { speaker: 'customer', content: result.customerMessage },
      ]);
      setSimulationReply('');
      setSimulationStatus(result.status === 'completed' ? 'completed' : 'continue');
      setSimulationOutcome(typeof result.outcome === 'string' ? result.outcome : null);
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : copy.replyFailed);
    } finally {
      setSimulationBusy(false);
    }
  };

  const abandonCoachSimulation = async () => {
    simulationVoice.stop();
    cancelCoachSpeech();
    if (!simulationSessionId) {
      setScreen('assessment-observation');
      return;
    }
    setSimulationBusy(true);
    setSimulationError('');
    try {
      await callCoachSimulation({ action: 'abandon', sessionId: simulationSessionId });
      setSimulationStatus('abandoned');
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : copy.replyFailed);
    } finally {
      setSimulationBusy(false);
    }
  };

  const goBackFromAssessment = () => {
    if (assessmentIndex > 0) {
      setAssessmentIndex((current) => current - 1);
      return;
    }
    setScreen('sales-intro');
  };

  const headerTitle =
    screen === 'assessment-preview' ? copy.assessment :
    screen === 'assessment-observation' ? copy.observationTitle :
    screen === 'simulation-preview' ? copy.simulation :
    screen === 'feedback-preview' ? copy.feedbackTitle :
    screen === 'milestone-preview' ? copy.milestoneTitle :
    copy.salesTitle;

  return (
    <div className="h-full min-h-0 flex flex-col bg-bg">
      {screen === 'home' && (
        <>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-[0.16em]">
              <BookOpen size={15} />
              <span>{copy.eyebrow}</span>
            </div>
            <h1 className="text-screen-title text-text mt-2">{copy.headline}</h1>
            <p className="text-small text-text-secondary mt-2 leading-relaxed">{copy.subhead}</p>
          </div>

          <div className="flex-1 min-h-0 scroll-area px-5 pb-6">
            <div className="rounded-2xl p-4 mb-5 border border-primary/10 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-card flex items-center justify-center text-primary shadow-sm">
                  <Sparkles size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text text-body">{copy.personalCoach}</p>
                  <p className="text-small text-text-secondary mt-1 leading-relaxed">{copy.trust}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-text-secondary tracking-[0.12em]">
                {lang === 'hi' ? 'अपना कोच चुनें' : 'CHOOSE YOUR COACH'}
              </p>
              {isDesignPreview && (
                <span className="text-[10px] font-bold tracking-wide text-amber-800 bg-amber-100 rounded-full px-2.5 py-1">
                  {copy.designPreview}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setScreen('sales-intro')}
                className="w-full text-left rounded-2xl border border-primary/25 bg-card p-4 shadow-sm transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={copy.salesTitle}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={25} strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body font-semibold text-text">{copy.salesTitle}</span>
                      <span className="text-[10px] font-bold tracking-wide text-primary bg-primary/10 rounded-full px-2 py-1">
                        {copy.recommended}
                      </span>
                    </div>
                    <p className="text-small text-text-secondary leading-relaxed mt-1.5">{copy.salesDescription}</p>
                  </div>
                  <ChevronRight size={21} className="text-primary shrink-0 mt-1" />
                </div>
                <div className="mt-3 pt-3 border-t border-border/70 flex items-center gap-2 text-xs text-text-secondary">
                  <MessageCircle size={14} />
                  <span>{copy.practiceLength}</span>
                  <span className="text-border">•</span>
                  <span>{lang === 'hi' ? 'व्यावहारिक बातचीत' : 'Practical conversations'}</span>
                </div>
              </button>

              <div className="rounded-2xl border border-border bg-card/70 p-4 opacity-80">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Wallet size={24} strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body font-semibold text-text">{copy.financeTitle}</span>
                      <span className="text-[10px] font-semibold text-text-secondary bg-bg rounded-full px-2 py-1">{copy.comingSoon}</span>
                    </div>
                    <p className="text-small text-text-secondary leading-relaxed mt-1.5">{copy.financeDescription}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4 opacity-80">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
                    <Boxes size={24} strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body font-semibold text-text">{copy.inventoryTitle}</span>
                      <span className="text-[10px] font-semibold text-text-secondary bg-bg rounded-full px-2 py-1">{copy.comingSoon}</span>
                    </div>
                    <p className="text-small text-text-secondary leading-relaxed mt-1.5">{copy.inventoryDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
              <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
              <p>{copy.transparency}</p>
            </div>
          </div>
        </>
      )}

      {screen === 'sales-intro' && (
        <>
          <BackHeader title={copy.salesTitle} onBack={() => setScreen('home')} />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="rounded-2xl p-5 bg-primary text-white overflow-hidden relative">
              <div className="absolute -right-7 -top-8 w-36 h-36 rounded-full border border-white/15" />
              <div className="absolute -right-1 -top-2 w-24 h-24 rounded-full border border-white/10" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  <Users size={25} />
                </div>
                <p className="text-xs font-bold tracking-[0.14em] text-white/80">{copy.personalCoach}</p>
                <h2 className="text-xl font-bold leading-snug mt-2">{copy.introTitle}</h2>
                <p className="text-sm text-white/85 leading-relaxed mt-3">{copy.introDescription}</p>
              </div>
            </div>

            <div className="card mt-4 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Store size={17} className="text-primary" />
                <h3 className="text-body font-semibold text-text">{copy.shopContext}</h3>
              </div>
              {shopType || city ? (
                <div className="flex flex-wrap gap-2">
                  {shopType && <span className="rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">{shopType}</span>}
                  {city && <span className="rounded-full bg-bg text-text-secondary px-3 py-1.5 text-xs font-medium">{city}</span>}
                </div>
              ) : (
                <p className="text-small text-text-secondary">{copy.noProfile}</p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {[
                { icon: Store, title: copy.tailored },
                { icon: MessageCircle, title: copy.natural },
                { icon: CheckCircle2, title: copy.usefulFeedback },
                { icon: ShieldCheck, title: copy.ethical },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <p className="text-small text-text font-medium">{item.title}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <PreviewNotice>{copy.transparency}</PreviewNotice>
            </div>
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg">
            {baselineError && <p className="text-xs text-red-600 mb-2" role="alert">{baselineError}</p>}
            {isDesignPreview ? (
              <>
                <PrimaryAction onClick={openAssessmentPreview}>
                  {copy.previewButton}
                  <ArrowRight size={18} />
                </PrimaryAction>
                <p className="text-[11px] text-text-secondary text-center leading-relaxed mt-2">{copy.previewHint}</p>
              </>
            ) : (
              <PrimaryAction onClick={openAssessmentPreview}>
                {copy.startButton}
                <ArrowRight size={18} />
              </PrimaryAction>
            )}
          </div>
        </>
      )}

      {screen === 'assessment-preview' && (
        <>
          <BackHeader title={headerTitle} onBack={goBackFromAssessment} />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-text-secondary tracking-wide">{copy.assessmentHint}</p>
              <span className="text-xs font-bold text-primary tabular-nums">{assessmentIndex + 1} {copy.of} 3</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: ((assessmentIndex + 1) / 3) * 100 + '%' }}
              />
            </div>

            <div className="card p-4 border border-primary/15">
              <p className="text-[11px] font-bold tracking-[0.12em] text-primary mb-3">
                {copy.question} {assessmentIndex + 1}
              </p>
              <div className="flex items-start gap-2">
                <h2 className="text-lg font-semibold text-text leading-relaxed flex-1">
                  {COACH_BASELINE_QUESTIONS[assessmentIndex].prompt[lang]}
                </h2>
                <button
                  type="button"
                  onClick={() => speakCoachText(COACH_BASELINE_QUESTIONS[assessmentIndex].prompt[lang], lang)}
                  disabled={!isCoachSpeechSynthesisSupported()}
                  className="w-9 h-9 rounded-lg border border-border text-text-secondary flex items-center justify-center shrink-0 disabled:opacity-40"
                  aria-label={copy.readAloud}
                  title={copy.readAloud}
                >
                  <Volume2 size={17} />
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">{COACH_BASELINE_QUESTIONS[assessmentIndex].helper[lang]}</p>
              <textarea
                value={answers[assessmentIndex]}
                onChange={(event) => setAnswers((current) =>
                  current.map((answer, index) => index === assessmentIndex ? event.target.value : answer)
                )}
                rows={5}
                maxLength={4000}
                aria-invalid={Boolean(baselineError)}
                className="input-field h-auto min-h-[132px] resize-y mt-5 leading-relaxed"
                placeholder={copy.answerPlaceholder}
                aria-label={copy.answerPlaceholder}
              />
              {baselineError && <p className="text-xs text-red-600 mt-3" role="alert">{baselineError}</p>}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-text-secondary">{copy.temporary}</span>
                  <button
                    type="button"
                    onClick={baselineVoice.toggle}
                    disabled={baselineSaving}
                    title={baselineVoice.isListening ? copy.voiceStop : copy.voiceStart}
                    aria-label={baselineVoice.isListening ? copy.voiceStop : copy.voiceStart}
                    aria-pressed={baselineVoice.isListening}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 ${baselineVoice.isListening ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:bg-primary/5'}`}
                  >
                    {baselineVoice.isListening ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>
                </div>
                {baselineVoice.isListening && <p className="text-xs text-primary" role="status">{copy.voiceListening}</p>}
                {baselineVoice.interimTranscript && <p className="text-xs text-text-secondary" aria-live="polite">{baselineVoice.interimTranscript}</p>}
                {baselineVoice.error && <p className="text-xs text-red-600" role="alert">{voiceErrorText(baselineVoice.error)}</p>}
                <p className="text-[10px] leading-relaxed text-text-secondary">{copy.voicePrivacy}</p>
              </div>
            </div>

            {isDesignPreview && (
              <div className="mt-4">
                <PreviewNotice>{copy.previewHint}</PreviewNotice>
              </div>
            )}
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg">
            <PrimaryAction onClick={() => void handleAssessmentContinue()} disabled={baselineSaving}>
              {baselineSaving ? copy.saving : assessmentIndex < 2 ? copy.next : copy.continue}
              <ArrowRight size={18} />
            </PrimaryAction>
          </div>
        </>
      )}

      {screen === 'assessment-observation' && (
        <>
          <BackHeader
            title={copy.observationTitle}
            onBack={() => setScreen('sales-intro')}
          />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Sparkles size={18} />
                <p className="text-xs font-bold tracking-wide">{copy.baselineComplete}</p>
              </div>
              <h2 className="text-lg font-semibold text-text leading-relaxed">{copy.observationTitle}</h2>
              <p className="text-sm text-text-secondary leading-relaxed mt-2">{copy.observationIntro}</p>
              <p className="text-sm text-text leading-relaxed mt-4">
                {baselineObservation?.text ?? copy.observationIntro}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed mt-3">
                {baselineObservation?.disclaimer ?? copy.observationDisclaimer}
              </p>
            </div>
            <div className="mt-4">
              <PreviewNotice>{baselineStorageMessage || copy.previewNotSaved}</PreviewNotice>
            </div>
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg">
            <PrimaryAction onClick={() => void startCoachSimulation()} disabled={baselineSaving}>
              {copy.tryConversation}
              <ArrowRight size={18} />
            </PrimaryAction>
          </div>
        </>
      )}

      {screen === 'simulation-preview' && (
        <>
          <BackHeader title={headerTitle} onBack={() => setScreen('assessment-observation')} />
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{copy.customer}</p>
                <p className="text-[11px] text-text-secondary">{copy.aiSimulation}</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold tracking-wide">
              {simulationStatus === 'completed' ? (lang === 'hi' ? 'पूरा हुआ' : 'COMPLETED') : copy.aiSimulation}
            </span>
          </div>

          <div className="flex-1 min-h-0 scroll-area px-5 py-5">
            {simulationMessages.length > 0 ? (
              <div className="space-y-4">
                {simulationMessages.map((message, index) => (
                  <div
                    key={index}
                    className={message.speaker === 'customer' ? 'flex justify-start' : 'flex justify-end'}
                  >
                    <div className={message.speaker === 'customer' ? 'max-w-[88%]' : 'max-w-[88%]'}>
                      <div className={message.speaker === 'customer'
                        ? 'rounded-2xl rounded-tl-sm bg-card border border-border p-4 shadow-sm'
                        : 'rounded-2xl rounded-tr-sm bg-primary text-white p-4 shadow-sm'}>
                        <div className="flex items-start gap-2">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{message.content}</p>
                          {message.speaker === 'customer' && (
                            <button
                              type="button"
                              onClick={() => speakCoachText(message.content, lang)}
                              disabled={!isCoachSpeechSynthesisSupported()}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/5 shrink-0 disabled:opacity-40"
                              aria-label={copy.readAloud}
                              title={copy.readAloud}
                            >
                              <Volume2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={message.speaker === 'customer'
                        ? 'text-[11px] text-text-secondary mt-2 ml-1'
                        : 'text-[11px] text-text-secondary mt-2 mr-1 text-right'}>
                        {message.speaker === 'customer' ? copy.customer : (lang === 'hi' ? 'आप' : 'You')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <MessageCircle size={21} />
                </div>
                <p className="text-sm font-semibold text-text">
                  {simulationBusy ? copy.sessionStarting : copy.startPractice}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed mt-2">{copy.simulationDisclosure}</p>
              </div>
            )}

            {simulationBusy && simulationMessages.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary" role="status">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {copy.customerThinking}
              </div>
            )}

            {simulationError && (
              <div className="mt-4">
                <PreviewNotice>{simulationError}</PreviewNotice>
              </div>
            )}

            {simulationStatus === 'completed' && (
              <div className="mt-4">
                <PreviewNotice>
                  {copy.practiceCompleted}
                  {simulationOutcome ? ' ' + (lang === 'hi' ? 'ग्राहक का फैसला: ' : 'Customer outcome: ') + simulationOutcome.replace(/_/g, ' ') + '.' : ''}
                </PreviewNotice>
              </div>
            )}

            {simulationStatus === 'abandoned' && (
              <div className="mt-4">
                <PreviewNotice>{copy.practiceAbandoned}</PreviewNotice>
              </div>
            )}

            {feedbackError && (
              <div className="mt-4">
                <PreviewNotice>{feedbackError}</PreviewNotice>
              </div>
            )}
          </div>

          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg space-y-2">
            {!simulationSessionId && simulationStatus === 'idle' && (
              <PrimaryAction onClick={() => void startCoachSimulation()} disabled={simulationBusy}>
                {simulationBusy ? copy.sessionStarting : copy.startPractice}
                <ArrowRight size={18} />
              </PrimaryAction>
            )}

            {simulationStatus === 'continue' && simulationSessionId && (
              <>
                <textarea
                  value={simulationReply}
                  onChange={(event) => setSimulationReply(event.target.value)}
                  rows={3}
                  maxLength={4000}
                  className="input-field h-auto min-h-[88px] resize-y leading-relaxed"
                  placeholder={copy.replyPlaceholder}
                  aria-label={copy.replyPlaceholder}
                  disabled={simulationBusy}
                />
                <div className="flex items-center justify-between gap-3 -mt-1">
                  <div className="min-w-0 flex-1 space-y-1">
                    {simulationVoice.isListening && <p className="text-xs text-primary" role="status">{copy.voiceListening}</p>}
                    {simulationVoice.interimTranscript && <p className="text-xs text-text-secondary" aria-live="polite">{simulationVoice.interimTranscript}</p>}
                    {simulationVoice.error && <p className="text-xs text-red-600" role="alert">{voiceErrorText(simulationVoice.error)}</p>}
                    <p className="text-[10px] leading-relaxed text-text-secondary">{copy.voicePrivacy}</p>
                  </div>
                  <button
                    type="button"
                    onClick={simulationVoice.toggle}
                    disabled={simulationBusy}
                    title={simulationVoice.isListening ? copy.voiceStop : copy.voiceStart}
                    aria-label={simulationVoice.isListening ? copy.voiceStop : copy.voiceStart}
                    aria-pressed={simulationVoice.isListening}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 ${simulationVoice.isListening ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:bg-primary/5'}`}
                  >
                    {simulationVoice.isListening ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>
                </div>
                <PrimaryAction
                  onClick={() => void sendCoachReply()}
                  disabled={simulationBusy || simulationVoice.isListening || !simulationReply.trim()}
                >
                  {simulationBusy ? copy.customerThinking : copy.sendReply}
                  <ArrowRight size={18} />
                </PrimaryAction>
                <button
                  type="button"
                  onClick={() => void abandonCoachSimulation()}
                  disabled={simulationBusy}
                  className="btn-text w-full"
                >
                  {copy.finishPractice}
                </button>
              </>
            )}

            {simulationStatus === 'completed' && simulationSessionId && (
              <PrimaryAction onClick={() => void openCoachFeedback()} disabled={feedbackLoading}>
                {feedbackLoading ? copy.feedbackLoading : coachFeedback ? copy.seeFeedback : feedbackError ? copy.feedbackRetry : copy.getFeedback}
                <ArrowRight size={18} />
              </PrimaryAction>
            )}

            {(simulationStatus === 'completed' || simulationStatus === 'abandoned') && (
              <button type="button" onClick={() => setScreen('home')} className="btn-text w-full">
                {copy.backToLearn}
              </button>
            )}
          </div>
        </>
      )}

      {screen === 'feedback-preview' && (
        <>
          <BackHeader title={headerTitle} onBack={() => setScreen('simulation-preview')} />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="mb-4">
              <p className="text-sm text-text-secondary leading-relaxed">{copy.feedbackIntro}</p>
              <p className="text-xs text-text-secondary leading-relaxed mt-2">{copy.feedbackPrivacy}</p>
            </div>

            {coachFeedback ? (
              <div className="space-y-3">
                <section className="card p-4 border-l-4 border-l-primary" aria-labelledby="coach-feedback-current">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-primary" />
                    <h2 id="coach-feedback-current" className="text-body font-semibold text-text">{copy.currentFeedback}</h2>
                    <button type="button" onClick={() => speakCoachText(coachFeedback.currentFeedback, lang)} disabled={!isCoachSpeechSynthesisSupported()} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary disabled:opacity-40" aria-label={copy.readAloud} title={copy.readAloud}>
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{coachFeedback.currentFeedback}</p>
                </section>

                <section className="card p-4 border-l-4 border-l-amber-500" aria-labelledby="coach-feedback-improve">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={18} className="text-amber-600" />
                    <h2 id="coach-feedback-improve" className="text-body font-semibold text-text">{copy.improveAreas}</h2>
                    <button type="button" onClick={() => speakCoachText(coachFeedback.areasToImprove, lang)} disabled={!isCoachSpeechSynthesisSupported()} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary disabled:opacity-40" aria-label={copy.readAloud} title={copy.readAloud}>
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{coachFeedback.areasToImprove}</p>
                </section>

                <section className="card p-4 border-l-4 border-l-blue-500" aria-labelledby="coach-feedback-how">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={18} className="text-blue-600" />
                    <h2 id="coach-feedback-how" className="text-body font-semibold text-text">{copy.howImprove}</h2>
                    <button type="button" onClick={() => speakCoachText(coachFeedback.howToImprove + ' ' + coachFeedback.exampleSentence, lang)} disabled={!isCoachSpeechSynthesisSupported()} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary disabled:opacity-40" aria-label={copy.readAloud} title={copy.readAloud}>
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{coachFeedback.howToImprove}</p>
                  <blockquote className="mt-3 border-l-2 border-primary/40 pl-3 text-sm text-text leading-relaxed">
                    <span className="text-xs font-semibold text-text-secondary">{copy.feedbackExample}</span>
                    <p className="mt-1">“{coachFeedback.exampleSentence}”</p>
                  </blockquote>
                </section>
              </div>
            ) : (
              <PreviewNotice>{feedbackError || copy.feedbackFailed}</PreviewNotice>
            )}
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg space-y-2">
            <PrimaryAction onClick={() => setScreen('simulation-preview')}>
              {copy.backToConversation}
              <ArrowRight size={18} />
            </PrimaryAction>
            <button type="button" onClick={() => setScreen('home')} className="btn-text w-full">
              {copy.backToLearn}
            </button>
          </div>
        </>
      )}

      {screen === 'milestone-preview' && (
        <>
          <BackHeader title={headerTitle} onBack={() => setScreen('feedback-preview')} />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 mb-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Clock3 size={18} />
                <p className="text-xs font-bold tracking-wide">{lang === 'hi' ? 'पहला बड़ा पड़ाव' : 'FIRST MILESTONE'}</p>
              </div>
              <h2 className="text-lg font-bold text-text">{copy.milestoneTitle}</h2>
              <p className="text-sm text-text-secondary leading-relaxed mt-2">{copy.milestoneIntro}</p>
            </div>

            <div className="card p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={18} className="text-primary" />
                <h3 className="text-body font-semibold text-text">{copy.milestoneReview}</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{copy.milestoneReviewDesc}</p>
            </div>

            <div className="card p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-primary" />
                <h3 className="text-body font-semibold text-text">{copy.improvement}</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{copy.improvementDesc}</p>
            </div>

            <div className="rounded-xl bg-bg border border-dashed border-border p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-card mx-auto flex items-center justify-center text-text-secondary mb-2">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-small text-text-secondary">{copy.noProgress}</p>
            </div>
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg space-y-2">
            <PrimaryAction onClick={() => setScreen('home')}>
              {copy.backToLearn}
              <ArrowRight size={18} />
            </PrimaryAction>
            <button type="button" onClick={() => setScreen('sales-intro')} className="btn-text w-full">
              {copy.backToCoach}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
