import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Boxes, ChevronRight, PiggyBank, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import catalogJson from '../../docs/sell-better/phase-2/lesson-catalog.preview.v2.json';
import feedbackGuideJson from '../../docs/sell-better/phase-4/feedback-guides.v1.json';
import { buildLessonFeedback } from '../sellBetter/feedbackEngine.js';
import type { FeedbackGuideCatalog, LessonFeedback } from '../sellBetter/feedbackEngine.js';

type LessonArea = { id: string; name: string; shortName: string; description: string; lessonCount: number };
type LessonCategory = { id: string; label: string };
type SellBetterLesson = {
  id: string;
  areaId: string;
  title: string;
  categories: string[];
  situation: string;
  prompt: string;
  objective: string;
  takeaway: string;
};
type PreviewCatalog = { areas: LessonArea[]; categories: LessonCategory[]; lessons: SellBetterLesson[] };

const catalog = catalogJson as PreviewCatalog;
const feedbackGuides = feedbackGuideJson as FeedbackGuideCatalog;
const shopTypeCategory: Record<string, string> = {
  kirana: 'kirana-grocery',
  bakery: 'bakery-sweet-shop',
  sweet: 'bakery-sweet-shop',
  tailor: 'tailoring',
  salon: 'salons',
  hardware: 'hardware',
  mobile: 'mobile-phone-shops',
  vegetable: 'fruit-vegetable-vendors',
};

function getRecommendedIndex(shopType: string | null): number {
  const category = shopType ? shopTypeCategory[shopType] : null;
  if (category) {
    const matchIndex = catalog.lessons.findIndex((lesson) => lesson.categories.includes(category));
    if (matchIndex >= 0) return matchIndex;
  }
  const generalIndex = catalog.lessons.findIndex((lesson) => lesson.id === 'LR-04');
  return generalIndex >= 0 ? generalIndex : 0;
}

type LessonStage = 'think' | 'discover' | 'apply' | 'complete';

export function SellBetterPreview() {
  const { state } = useStore();
  const [activePath, setActivePath] = useState<'learn' | 'sell-better'>('learn');
  const [stage, setStage] = useState<LessonStage>('think');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonStep, setLessonStep] = useState(0);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<LessonFeedback | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const recommendedIndex = useMemo(
    () => getRecommendedIndex(state.shopProfile.shopType),
    [state.shopProfile.shopType],
  );
  const lesson = catalog.lessons[lessonIndex] ?? catalog.lessons[0];

  const openSellBetter = () => {
    setLessonIndex(recommendedIndex);
    setLessonStep(0);
    setResponse('');
    setFeedback(null);
    setResponseMessage('');
    setStage('think');
    setActivePath('sell-better');
  };

  const backToLearn = () => {
    setResponse('');
    setFeedback(null);
    setResponseMessage('');
    setStage('think');
    setLessonStep(0);
    setActivePath('learn');
  };

  const revealFeedback = () => {
    const result = buildLessonFeedback(lesson.id, response, feedbackGuides);
    if (result.status === 'needs_detail' || result.status === 'privacy') {
      setResponseMessage(result.message || 'Please review your response and try again.');
      return;
    }
    setResponseMessage('');
    setFeedback(result);
    setStage('discover');
  };

  const continueLesson = () => {
    if (lessonStep + 1 >= catalog.lessons.length) {
      setStage('complete');
      return;
    }
    // Start with the best explicit category match, then wrap once so all 24
    // situations are visited exactly once before the completion screen.
    setLessonIndex((current) => (current + 1) % catalog.lessons.length);
    setLessonStep((current) => current + 1);
    setResponse('');
    setFeedback(null);
    setResponseMessage('');
    setStage('think');
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-bg text-text">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-5 pt-4 sm:px-6 sm:pt-6">
        {activePath === 'sell-better' ? (
          <main className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={backToLearn}
              className="mb-4 inline-flex min-h-10 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft size={17} /> Learn
            </button>

            {stage === 'complete' ? (
              <section className="flex flex-1 flex-col justify-center py-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen size={23} />
                </div>
                <h1 className="mb-2 text-2xl font-bold">You've reached the end of this practice set.</h1>
                <p className="mb-6 text-sm leading-6 text-text-secondary">
                  You have worked through all 24 available situations. More reviewed lessons can be added as Sell Better grows.
                </p>
                <button type="button" onClick={backToLearn} className="min-h-11 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  Back to Learn
                </button>
              </section>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary">
                  <TrendingUp size={15} /> SELL BETTER
                  <span className="ml-auto font-medium tracking-normal text-text-secondary">
                    {stage === 'think' ? 'Think · Respond' : stage === 'discover' ? 'Discover' : 'Apply'}
                  </span>
                </div>
                <div className="mb-4 h-1 overflow-hidden rounded-full bg-border" aria-label="Lesson stage">
                  <div className={`h-full rounded-full bg-primary transition-all ${stage === 'think' ? 'w-1/3' : stage === 'discover' ? 'w-2/3' : 'w-full'}`} />
                </div>
                <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>

                {stage === 'think' && (
                  <>
                    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
                      <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-text-secondary">THE SITUATION</p>
                      <p className="text-sm leading-6">{lesson.situation}</p>
                    </section>
                    <section className="mb-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                      <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-primary">THINK IT THROUGH</p>
                      <h2 className="text-base font-semibold leading-6">{lesson.prompt}</h2>
                    </section>
                    <div className="mb-3">
                      <label htmlFor="sell-better-response" className="mb-2 block text-sm font-semibold">
                        What would you say or do?
                      </label>
                      <textarea
                        id="sell-better-response"
                        value={response}
                        onChange={(event) => {
                          setResponse(event.target.value.slice(0, 1500));
                          setResponseMessage('');
                        }}
                        rows={4}
                        maxLength={1500}
                        placeholder="Write what you would naturally say or do..."
                        aria-describedby="sell-better-privacy"
                        className="min-h-[116px] w-full resize-y rounded-xl border border-border bg-card p-3 text-sm leading-relaxed outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <p id="sell-better-privacy" className="mt-2 text-xs leading-5 text-text-secondary">
                        Keep customer details anonymous. Do not include names, phone numbers or payment IDs.
                      </p>
                      {responseMessage && (
                        <p role="alert" className="mt-2 text-sm leading-5 text-red-600">{responseMessage}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!response.trim()}
                      onClick={revealFeedback}
                      className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Discover <ChevronRight size={17} />
                    </button>
                  </>
                )}

                {stage === 'discover' && (
                  <>
                    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
                      <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-text-secondary">YOUR RESPONSE</p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{response}</p>
                    </section>
                    {feedback?.message ? (
                      <section className="mb-4 rounded-2xl border border-border bg-card p-4">
                        <p className="text-sm leading-6">{feedback.message}</p>
                        <p className="mt-2 text-sm leading-6">{lesson.objective}</p>
                      </section>
                    ) : (
                      <>
                        <section className="mb-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                          <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-primary">
                            {feedback?.status === 'matched' ? 'WHAT YOU CONSIDERED' : 'A NOTE ABOUT YOUR RESPONSE'}
                          </p>
                          <p className="text-sm leading-6">{feedback?.recognition}</p>
                        </section>
                        {feedback?.consideration && (
                          <section className="mb-4 rounded-2xl border border-border bg-card p-4">
                            <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-text-secondary">{feedback.consideration.heading}</p>
                            <p className="mb-1 text-sm font-semibold">{feedback.consideration.label}</p>
                            <p className="text-sm leading-6">{feedback.consideration.why}</p>
                            <p className="mt-3 text-sm font-medium leading-6">{feedback.consideration.question}</p>
                          </section>
                        )}
                      </>
                    )}
                    <p className="mb-4 text-xs leading-5 text-text-secondary">
                      This is a guided reflection based on a limited set of lesson ideas, not a grade or a complete judgement. It may not recognise every valid way of expressing an idea.
                    </p>
                    <button type="button" onClick={() => setStage('apply')} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                      See what to apply <ChevronRight size={17} />
                    </button>
                  </>
                )}

                {stage === 'apply' && (
                  <>
                    <section className="mb-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                      <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-primary">TAKE THIS TO YOUR DUKAAN</p>
                      <p className="text-base font-semibold leading-7">{lesson.takeaway}</p>
                    </section>
                    <p className="mb-6 text-sm leading-6 text-text-secondary">
                      Keep this in mind the next time a similar situation comes up. Adapt it to the customer and the facts in front of you.
                    </p>
                    <button type="button" onClick={continueLesson} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                      Next situation <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </>
            )}
            <p className="pt-4 text-center text-[11px] text-text-secondary">
              Preview only · Your response is not saved or sent.
            </p>
          </main>
        ) : (
          <main className="flex flex-1 flex-col">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary">
              <BookOpen size={15} /> LEARN
            </div>
            <h1 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl">
              What would you like to get better at?
            </h1>
            <p className="mb-5 text-sm leading-6 text-text-secondary">
              Build practical skills to run your dukaan better.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={openSellBetter}
                className="group flex min-h-[92px] w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp size={23} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">Sell Better</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">Understand customers. Build trust. Grow sales.</span>
                </span>
                <ChevronRight size={19} className="shrink-0 text-text-secondary transition group-hover:translate-x-0.5" />
              </button>
              <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-border bg-card/70 p-4 opacity-75">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-text-secondary"><PiggyBank size={23} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">Save Better</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">Make smarter money and cost decisions.</span>
                </span>
                <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-text-secondary">Coming soon</span>
              </div>
              <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-border bg-card/70 p-4 opacity-75">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-text-secondary"><Boxes size={23} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">Manage Stock Better</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">Make better stock and replenishment decisions.</span>
                </span>
                <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-text-secondary">Coming soon</span>
              </div>
            </div>
            <p className="mt-auto pt-8 text-center text-[11px] text-text-secondary">
              Founder preview · Sell Better situations are still drafts.
            </p>
          </main>
        )}
      </div>
    </div>
  );
}
