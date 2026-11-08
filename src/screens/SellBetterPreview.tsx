import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
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

const areaIcons = [Users, MessageCircle, Wallet, Lightbulb, ShieldCheck, HeartHandshake];
const loopSteps = [
  { number: '01', title: 'Think', description: 'Understand the situation.' },
  { number: '02', title: 'Respond', description: 'Share what you would do.' },
  { number: '03', title: 'Discover', description: 'Understand what matters and why.' },
  { number: '04', title: 'Apply', description: 'Leave with one useful action.' },
];

function getCategoryLabels(ids: string[]) {
  return ids.map((id) => catalog.categories.find((category) => category.id === id)?.label || id);
}

export function SellBetterPreview() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [response, setResponse] = useState('');

  const selectedArea = catalog.areas.find((area) => area.id === selectedAreaId) || null;
  const selectedLesson = catalog.lessons.find((lesson) => lesson.id === selectedLessonId) || null;

  const visibleLessons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.lessons.filter((lesson) => {
      const matchesArea = !selectedAreaId || lesson.areaId === selectedAreaId;
      const categoryText = getCategoryLabels(lesson.categories).join(' ').toLowerCase();
      const matchesSearch = !query || [lesson.id, lesson.title, lesson.situation, lesson.prompt, categoryText]
        .some((value) => value.toLowerCase().includes(query));
      return matchesArea && matchesSearch;
    });
  }, [selectedAreaId, search]);

  const openLibrary = (areaId: string | null = null) => {
    setSelectedAreaId(areaId);
    setSelectedLessonId(null);
    setSearch('');
    setResponse('');
  };

  const openLesson = (lesson: SellBetterLesson) => {
    setSelectedLessonId(lesson.id);
    setResponse('');
  };

  const backToLibrary = () => {
    setSelectedLessonId(null);
    setResponse('');
  };

  const backToHome = () => {
    setSelectedAreaId(null);
    setSelectedLessonId(null);
    setSearch('');
    setResponse('');
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-bg text-text">
      <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-5 sm:px-6">
        {selectedLesson ? (
          <SituationDetail
            lesson={selectedLesson}
            area={catalog.areas.find((area) => area.id === selectedLesson.areaId)!}
            response={response}
            onResponseChange={setResponse}
            onBack={backToLibrary}
          />
        ) : selectedAreaId !== null || search.trim() ? (
          <LibraryView
            area={selectedArea}
            lessons={visibleLessons}
            search={search}
            onSearchChange={setSearch}
            onBack={backToHome}
            onOpenLesson={openLesson}
            onClearArea={() => setSelectedAreaId(null)}
          />
        ) : (
          <HomeView
            onBrowse={() => openLibrary(null)}
            onSelectArea={(areaId) => openLibrary(areaId)}
            onOpenLesson={openLesson}
          />
        )}
      </div>
    </div>
  );
}

function PreviewNotice() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/25 dark:text-amber-100">
      <ShieldCheck size={19} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">Founder preview · Draft content</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-85">
          These situations are being refined. They have not yet been validated with shopkeepers or reviewed for Hindi and Hinglish release.
        </p>
      </div>
    </div>
  );
}

function HomeView({
  onBrowse,
  onSelectArea,
  onOpenLesson,
}: {
  onBrowse: () => void;
  onSelectArea: (areaId: string) => void;
  onOpenLesson: (lesson: SellBetterLesson) => void;
}) {
  const featuredLesson = catalog.lessons[0];

  return (
    <>
      <PreviewNotice />

      <header className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-primary">
          <BookOpen size={15} />
          <span>LEARN · SELL BETTER</span>
        </div>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Understand people. Build trust. Grow your dukaan.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
          Short, practical situations that help you think through real customer moments and make better business decisions.
        </p>
      </header>

      <section className="mb-7 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">A simple learning loop</p>
            <p className="mt-1 text-xs text-text-secondary">No exams. No marks. Think it through in your own words.</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Sparkles size={18} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loopSteps.map((step, index) => (
            <div key={step.number} className="relative rounded-2xl bg-bg p-3">
              <p className="text-[11px] font-bold tracking-wider text-primary">{step.number}</p>
              <p className="mt-1 text-sm font-bold">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{step.description}</p>
              {index < loopSteps.length - 1 && (
                <ArrowRight size={13} className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-text-secondary sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-primary">BUILD PRACTICAL SKILLS</p>
            <h2 className="mt-1 text-xl font-bold">Six areas. One better dukaan.</h2>
          </div>
          <span className="whitespace-nowrap text-xs text-text-secondary">24 situations</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalog.areas.map((area, index) => {
            const Icon = areaIcons[index] || Store;
            return (
              <button
                type="button"
                key={area.id}
                onClick={() => onSelectArea(area.id)}
                className="group flex min-h-[132px] items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold leading-snug">{area.name}</span>
                    <ChevronRight size={17} className="shrink-0 text-text-secondary transition group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">{area.description}</span>
                  <span className="mt-3 inline-flex rounded-full bg-bg px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                    {area.lessonCount} situations
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-7 rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-primary">START WITH A SITUATION</p>
            <h2 className="mt-1 text-lg font-bold">{featuredLesson.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{featuredLesson.situation}</p>
          </div>
          <span className="shrink-0 rounded-xl bg-card px-2.5 py-1.5 text-xs font-bold text-primary">{featuredLesson.id}</span>
        </div>
        <button type="button" onClick={() => onOpenLesson(featuredLesson)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Explore this situation <ArrowRight size={16} />
        </button>
      </section>

      <section className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Store size={19} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">Built around independent local businesses</h2>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              The draft situations cover kirana, clothing, mobile, produce, tailoring, salons, hardware, bakery and other small retail contexts.
            </p>
            <button type="button" onClick={onBrowse} className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Browse all 24 situations <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <div className="pb-2 text-center text-[11px] text-text-secondary">
        UX preview only · Responses are not saved or sent
      </div>
    </>
  );
}

function LibraryView({
  area,
  lessons,
  search,
  onSearchChange,
  onBack,
  onOpenLesson,
  onClearArea,
}: {
  area: LessonArea | null;
  lessons: SellBetterLesson[];
  search: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
  onOpenLesson: (lesson: SellBetterLesson) => void;
  onClearArea: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ArrowLeft size={17} /> Back
        </button>
        <span className="text-xs text-text-secondary">Draft library · 24 total</span>
      </div>

      <header className="mb-5">
        <p className="text-xs font-bold tracking-[0.16em] text-primary">SITUATION LIBRARY</p>
        <h1 className="mt-1 text-2xl font-bold">{area ? area.name : 'Explore all situations'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {area ? area.description : 'Choose a situation that feels familiar to your shop. Each one focuses on a single practical decision.'}
        </p>
      </header>

      <label className="mb-4 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <Search size={18} className="shrink-0 text-text-secondary" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search situations or shop types"
          aria-label="Search situations or shop types"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-text-secondary"
        />
        {search && (
          <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search" className="rounded-lg p-1 text-text-secondary hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X size={16} />
          </button>
        )}
      </label>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {area && (
          <button type="button" onClick={onClearArea} className="min-h-9 rounded-full border border-primary bg-primary px-3 text-xs font-semibold text-white">
            {area.shortName} <X size={12} className="ml-1 inline" />
          </button>
        )}
        <span className="text-xs text-text-secondary">{lessons.length} {lessons.length === 1 ? 'situation' : 'situations'}</span>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => (
          <button
            type="button"
            key={lesson.id}
            onClick={() => onOpenLesson(lesson)}
            className="group block w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-wider text-primary">{lesson.id}</span>
              <ChevronRight size={17} className="shrink-0 text-text-secondary transition group-hover:translate-x-0.5" />
            </div>
            <h2 className="text-base font-bold leading-snug">{lesson.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{lesson.situation}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {getCategoryLabels(lesson.categories).map((label) => (
                <span key={label} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-text-secondary">{label}</span>
              ))}
            </div>
          </button>
        ))}
        {lessons.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-9 text-center">
            <Search size={22} className="mx-auto text-text-secondary" />
            <p className="mt-3 text-sm font-semibold">No matching situations</p>
            <p className="mt-1 text-xs text-text-secondary">Try a different word or clear the search.</p>
            <button type="button" onClick={() => { onSearchChange(''); onClearArea(); }} className="mt-3 min-h-10 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary/5">
              Show all situations
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function SituationDetail({
  lesson,
  area,
  response,
  onResponseChange,
  onBack,
}: {
  lesson: SellBetterLesson;
  area: LessonArea;
  response: string;
  onResponseChange: (value: string) => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ArrowLeft size={17} /> All situations
        </button>
        <span className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold text-text-secondary">{lesson.id}</span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold tracking-[0.16em] text-primary">{area.name.toUpperCase()}</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {getCategoryLabels(lesson.categories).map((label) => (
            <span key={label} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-text-secondary">{label}</span>
          ))}
        </div>
      </div>

      <section className="mb-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-primary">
          <BookOpen size={15} /> THE SITUATION
        </div>
        <p className="text-[15px] leading-7">{lesson.situation}</p>
      </section>

      <section className="mb-4 rounded-3xl border border-primary/25 bg-primary/5 p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-primary">
          <Lightbulb size={16} /> THINK IT THROUGH
        </div>
        <h2 className="text-lg font-bold leading-snug">{lesson.prompt}</h2>
      </section>

      <section className="mb-5 rounded-3xl border border-border bg-card p-5">
        <label htmlFor="sell-better-response" className="block text-sm font-bold">What would you naturally say or do?</label>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">There may be more than one sensible approach. Write your thinking in your own words.</p>
        <textarea
          id="sell-better-response"
          value={response}
          onChange={(event) => onResponseChange(event.target.value)}
          rows={5}
          maxLength={1500}
          placeholder="Write your response here…"
          className="mt-4 min-h-[132px] w-full resize-y rounded-2xl border border-border bg-bg p-3.5 text-sm leading-relaxed outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-text-secondary">
          <span>{response.length}/1500 characters</span>
          <span>Not saved · Preview only</span>
        </div>
      </section>

      <section className="mb-5 rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={17} className="text-primary" />
          <h2 className="text-sm font-bold">How the learning loop continues</h2>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
            <div><p className="text-sm font-semibold">Think and respond</p><p className="mt-0.5 text-xs text-text-secondary">Your own reasoning comes first.</p></div>
          </div>
          <div className="flex gap-3 opacity-70">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-bold">2</span>
            <div><p className="text-sm font-semibold">Discover</p><p className="mt-0.5 text-xs text-text-secondary">A later phase will explain relevant considerations and trade-offs based on the actual response.</p></div>
          </div>
          <div className="flex gap-3 opacity-70">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-bold">3</span>
            <div><p className="text-sm font-semibold">Apply</p><p className="mt-0.5 text-xs text-text-secondary">A later phase will end with one useful, practical takeaway.</p></div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-bg p-3 text-xs leading-relaxed text-text-secondary">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
          No score, marks or single scripted “correct answer”.
        </div>
      </section>

      <div className="mb-2 text-center text-[11px] leading-relaxed text-text-secondary">
        This is a design preview. Your response stays temporarily on this screen and is cleared when you leave it. No AI feedback is generated.
      </div>
    </>
  );
}
