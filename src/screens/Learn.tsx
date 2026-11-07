import React, { useState } from 'react';
import { useStore } from '../store';
import {
  analyseCoachBaseline,
  COACH_BASELINE_QUESTIONS,
  restoreCoachBaselineAssessment,
  validateCoachBaseline,
} from '../coach/coachAssessment';
import type { CoachBaselineObservation } from '../coach/coachAssessment';
import { isCoachCloudAvailable, loadCoachBaseline, saveCoachBaseline } from '../coach/coachRepository';
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
    voiceLater: 'Voice input will be connected in a later phase',
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
    sampleLabel: 'ILLUSTRATIVE CUSTOMER MESSAGE',
    sampleCustomer: 'I saw a similar product for less at another shop. What makes this one worth the price?',
    customer: 'Customer',
    aiSimulation: 'AI simulation',
    replyPlaceholder: 'Your reply will appear here...',
    composerHint: 'The live customer engine, voice conversation and read-aloud controls will be connected in later phases.',
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
    simulationDisclosure: 'This is a sample screen, not a live customer conversation.',
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
    voiceLater: 'बोलकर जवाब देने की सुविधा अगले चरण में जुड़ेगी',
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
    sampleLabel: 'उदाहरण के लिए ग्राहक का संदेश',
    sampleCustomer: 'मुझे यही चीज़ दूसरी दुकान पर कम भाव में मिली। मैं आपसे ही क्यों खरीदूँ?',
    customer: 'ग्राहक',
    aiSimulation: 'AI सिमुलेशन',
    replyPlaceholder: 'आपका जवाब यहाँ दिखाई देगा...',
    composerHint: 'असली ग्राहक इंजन, बोलकर बातचीत और जवाब सुनने की सुविधा अगले चरणों में जुड़ेगी।',
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
    simulationDisclosure: 'यह केवल उदाहरण की स्क्रीन है, असली ग्राहक से बातचीत नहीं।',
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
  const isDesignPreview = import.meta.env.VITE_SALES_COACH_UI_PREVIEW === 'true';

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
          if (!restored.ok) throw new Error(restored.error);
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
    if (!validated.ok) {
      setBaselineError(validated.error);
      if (typeof validated.questionIndex === 'number') setAssessmentIndex(validated.questionIndex);
      return;
    }

    const observation = analyseCoachBaseline(validated.value, lang);
    if (!observation.ok) {
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
        if (!restored.ok) throw new Error(restored.error);
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
              <h2 className="text-lg font-semibold text-text leading-relaxed">
                {COACH_BASELINE_QUESTIONS[assessmentIndex].prompt[lang]}
              </h2>
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
              <div className="flex items-center justify-between gap-3 mt-3">
                <span className="text-[11px] text-text-secondary">{copy.temporary}</span>
                <button
                  type="button"
                  disabled
                  title={copy.voiceLater}
                  aria-label={copy.voiceLater}
                  className="w-11 h-11 rounded-xl border border-border text-text-secondary/60 flex items-center justify-center shrink-0 disabled:opacity-60"
                >
                  <Mic size={19} />
                </button>
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
            <PrimaryAction onClick={() => setScreen('simulation-preview')}>
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
            <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold tracking-wide">
              {copy.designPreview}
            </span>
          </div>

          <div className="flex-1 min-h-0 scroll-area px-5 py-5">
            <div className="max-w-[88%]">
              <div className="rounded-2xl rounded-tl-sm bg-card border border-border p-4 shadow-sm">
                <p className="text-sm text-text leading-relaxed">{copy.sampleCustomer}</p>
              </div>
              <p className="text-[11px] text-text-secondary mt-2 ml-1">{copy.sampleLabel}</p>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-border bg-card/50 p-4">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <MessageCircle size={16} />
                <p className="text-xs font-semibold">{copy.replyPlaceholder}</p>
              </div>
              <div className="h-20 rounded-xl bg-bg border border-border/70 px-3 py-3 text-xs text-text-secondary/80">
                {lang === 'hi' ? 'यहाँ आपकी बातचीत होगी…' : 'Your conversation will appear here…'}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-text-secondary/70">
                  <Mic size={16} />
                  <Volume2 size={16} />
                </div>
                <span className="text-[10px] text-text-secondary">{copy.simulationDisclosure}</span>
              </div>
            </div>

            <div className="mt-4">
              <PreviewNotice>{copy.composerHint}</PreviewNotice>
            </div>
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg">
            <PrimaryAction onClick={() => setScreen('feedback-preview')}>
              {copy.seeFeedback}
              <ArrowRight size={18} />
            </PrimaryAction>
          </div>
        </>
      )}

      {screen === 'feedback-preview' && (
        <>
          <BackHeader title={headerTitle} onBack={() => setScreen('simulation-preview')} />
          <div className="flex-1 min-h-0 scroll-area px-5 py-4">
            <div className="mb-4">
              <p className="text-sm text-text-secondary leading-relaxed">{copy.feedbackIntro}</p>
            </div>

            <div className="space-y-3">
              <div className="card p-4 border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-primary" />
                  <h2 className="text-body font-semibold text-text">{copy.currentFeedback}</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{copy.currentFeedbackDesc}</p>
              </div>
              <div className="card p-4 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-amber-600" />
                  <h2 className="text-body font-semibold text-text">{copy.improveAreas}</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{copy.improveAreasDesc}</p>
              </div>
              <div className="card p-4 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={18} className="text-blue-600" />
                  <h2 className="text-body font-semibold text-text">{copy.howImprove}</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{copy.howImproveDesc}</p>
                <div className="mt-3 pt-3 border-t border-border/70 flex items-center gap-2 text-xs text-text-secondary">
                  <Volume2 size={15} />
                  <span>{copy.readAloud}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <PreviewNotice>{copy.feedbackNote}</PreviewNotice>
            </div>
          </div>
          <div className="px-5 pt-3 pb-4 border-t border-border bg-bg">
            <PrimaryAction onClick={() => setScreen('milestone-preview')}>
              {copy.seeMilestone}
              <ArrowRight size={18} />
            </PrimaryAction>
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
