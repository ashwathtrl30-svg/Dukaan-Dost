export interface FeedbackSignal {
  label: string;
  phrases: string[];
  why: string;
  question: string;
}
export interface LessonFeedbackGuide {
  lessonId: string;
  principle: string;
  signals: FeedbackSignal[];
}
export interface FeedbackGuideCatalog {
  schemaVersion: number;
  lessons: LessonFeedbackGuide[];
}
export interface LessonFeedback {
  status: 'matched' | 'unmatched' | 'needs_detail' | 'privacy' | 'unavailable';
  recognition: string;
  consideration: { label: string; why: string; question: string; heading: string } | null;
  matchedPhrase: string | null;
  message: string | null;
}
export function buildLessonFeedback(lessonId: string, response: string, catalog: FeedbackGuideCatalog): LessonFeedback;

export function getNextLessonIndex(currentIndex: number, totalLessons: number): number | null;
