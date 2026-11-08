import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
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
  const [active, setActive] = useState(false);
  const [response, setResponse] = useState('');
  const lesson = getRecommendedLesson(state.shopProfile.shopType);
  const area = catalog.areas.find((item) => item.id === lesson.areaId);

  const startPractice = () => {
    setResponse('');
    setActive(true);
  };

  const leavePractice = () => {
    setResponse('');
    setActive(false);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-bg text-text">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-5 pt-4 sm:px-6 sm:pt-6">
        {active ? (
          <main className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={leavePractice}
              className="mb-4 inline-flex min-h-10 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft size={17} /> Back
            </button>

            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary">
              <BookOpen size={15} /> {area?.name.toUpperCase() || 'SELL BETTER'}
            </div>
            <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>

            <section className="mb-4 rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-text-secondary">THE SITUATION</p>
              <p className="text-sm leading-6">{lesson.situation}</p>
            </section>

            <section className="mb-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <p className="mb-2 text-[11px] font-bold tracking-[0.13em] text-primary">WHAT WOULD YOU DO?</p>
              <h2 className="text-base font-semibold leading-6">{lesson.prompt}</h2>
            </section>

            <div className="mb-3">
              <label htmlFor="sell-better-response" className="mb-2 block text-sm font-semibold">
                Your response
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
              <BookOpen size={15} /> LEARN · SELL BETTER
            </div>

            <h1 className="max-w-lg text-[28px] font-bold leading-tight tracking-tight sm:text-3xl">
              Understand people. Build trust. Grow your dukaan.
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              One practical customer situation at a time.
            </p>

            <section className="mt-7 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <p className="mb-2 text-[11px] font-bold tracking-[0.15em] text-primary">YOUR NEXT PRACTICE</p>
              <h2 className="text-xl font-bold leading-snug">{lesson.title}</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{lesson.situation}</p>
              <button
                type="button"
                onClick={startPractice}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Start practice <ArrowRight size={17} />
              </button>
            </section>

            <p className="mt-4 text-center text-xs text-text-secondary">
              A few minutes · No tests · No marks
            </p>
            <p className="mt-auto pt-8 text-center text-[11px] text-text-secondary">
              Founder preview · Draft situations · English only
            </p>
          </main>
        )}
      </div>
    </div>
  );
}
