import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Boxes, ChevronRight, PiggyBank, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import catalogJson from '../../docs/sell-better/phase-2/lesson-catalog.preview.v2.json';

type LessonArea = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  lessonCount: number;
};

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

type PreviewCatalog = {
  areas: LessonArea[];
  categories: LessonCategory[];
  lessons: SellBetterLesson[];
};

const catalog = catalogJson as PreviewCatalog;

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

function getRecommendedLesson(shopType: string | null): SellBetterLesson {
  const category = shopType ? shopTypeCategory[shopType] : null;
  if (category) {
    const match = catalog.lessons.find((lesson) => lesson.categories.includes(category));
    if (match) return match;
  }
  return catalog.lessons.find((lesson) => lesson.id === 'LR-04') || catalog.lessons[0];
}

export function SellBetterPreview() {
  const { state } = useStore();
  const [activePath, setActivePath] = useState<'learn' | 'sell-better'>('learn');
  const [response, setResponse] = useState('');
  const lesson = getRecommendedLesson(state.shopProfile.shopType);
  const area = catalog.areas.find((item) => item.id === lesson.areaId);

  const openSellBetter = () => {
    setResponse('');
    setActivePath('sell-better');
  };

  const backToLearn = () => {
    setResponse('');
    setActivePath('learn');
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

            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary">
              <TrendingUp size={15} /> SELL BETTER
            </div>
            <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>

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
                onChange={(event) => setResponse(event.target.value)}
                rows={4}
                maxLength={1500}
                placeholder="Write what you would naturally say or do..."
                className="min-h-[116px] w-full resize-y rounded-xl border border-border bg-card p-3 text-sm leading-relaxed outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <p className="mt-auto pt-2 text-center text-[11px] text-text-secondary">
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
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-text-secondary">
                  <PiggyBank size={23} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">Save Better</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-secondary">Make smarter money and cost decisions.</span>
                </span>
                <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-text-secondary">Coming soon</span>
              </div>

              <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-border bg-card/70 p-4 opacity-75">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-text-secondary">
                  <Boxes size={23} />
                </span>
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
