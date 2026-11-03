export interface SpeechRecognitionSegment {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript?: string } | undefined;
}

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechTranscriptParts {
  finalTranscript: string;
  interimTranscript: string;
  transcript: string;
}

export function joinSpeechTranscript(...parts: string[]): string {
  return parts
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Applies only the result entries changed by a Web Speech API event.
 * Existing earlier segments remain stable; a changed interim segment is replaced,
 * not appended, when the browser marks it final.
 */
export function updateSpeechRecognitionSegments(
  previous: SpeechRecognitionSegment[],
  event: SpeechRecognitionEventLike,
): SpeechRecognitionSegment[] {
  const resultCount = Math.max(0, event.results.length);
  const next = previous.slice(0, resultCount);
  const reportedIndex = Number.isInteger(event.resultIndex) ? event.resultIndex : 0;
  const startIndex = Math.max(0, Math.min(reportedIndex, resultCount));

  for (let index = startIndex; index < resultCount; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript?.trim() || '';
    next[index] = {
      transcript,
      isFinal: result?.isFinal === true,
    };
  }

  return next;
}

export function buildSpeechTranscriptParts(
  committedTranscript: string,
  segments: SpeechRecognitionSegment[],
): SpeechTranscriptParts {
  const finalTranscript = joinSpeechTranscript(
    ...segments.filter(segment => segment?.isFinal).map(segment => segment.transcript),
  );
  const interimTranscript = joinSpeechTranscript(
    ...segments.filter(segment => segment && !segment.isFinal).map(segment => segment.transcript),
  );

  return {
    finalTranscript,
    interimTranscript,
    transcript: joinSpeechTranscript(committedTranscript, finalTranscript, interimTranscript),
  };
}
