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


export interface VoiceRecordingRequest {
  owner: symbol;
  stop: () => void;
  start: () => void;
}

let activeVoiceRecording: VoiceRecordingRequest | null = null;
let pendingVoiceRecording: VoiceRecordingRequest | null = null;

/**
 * Serializes microphone ownership across all mounted VoiceMicButton instances.
 * A waiting request starts only after the active browser recognizer releases its
 * ownership, preventing Home/Notebook overlays from opening two microphones.
 */
export function requestVoiceRecording(request: VoiceRecordingRequest): void {
  if (activeVoiceRecording?.owner === request.owner) return;

  if (!activeVoiceRecording) {
    activeVoiceRecording = request;
    request.start();
    return;
  }

  pendingVoiceRecording = request;
  activeVoiceRecording.stop();
}

export function releaseVoiceRecording(owner: symbol): void {
  if (activeVoiceRecording?.owner !== owner) return;

  activeVoiceRecording = null;
  const pending = pendingVoiceRecording;
  pendingVoiceRecording = null;

  if (pending) {
    activeVoiceRecording = pending;
    pending.start();
  }
}

/** Removes a request that was queued by a component which is now unmounting. */
export function cancelVoiceRecordingRequest(owner: symbol): void {
  if (pendingVoiceRecording?.owner === owner) {
    pendingVoiceRecording = null;
  }
  if (activeVoiceRecording?.owner === owner) {
    releaseVoiceRecording(owner);
  }
}


export interface SpeechRecognitionMode {
  continuous: boolean;
  interimResults: boolean;
  restartOnEnd: boolean;
}

/**
 * Desktop browsers can keep one continuous recognition session and provide
 * replaceable interim hypotheses. Mobile browsers use short final-only sessions;
 * the UI keeps one logical recording active and restarts safely after each session
 * until the user explicitly taps the microphone to finish.
 */
export function getSpeechRecognitionMode(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): SpeechRecognitionMode {
  const isMobileBrowser =
    /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);

  return isMobileBrowser
    ? { continuous: false, interimResults: false, restartOnEnd: true }
    : { continuous: true, interimResults: true, restartOnEnd: true };
}


/** Adds only finalized segments from one recognizer instance to a logical recording. */
export function appendFinalSpeechRecognitionSession(
  committedTranscript: string,
  sessionSegments: SpeechRecognitionSegment[],
): string {
  const finalTranscript = buildSpeechTranscriptParts('', sessionSegments).finalTranscript;
  return joinSpeechTranscript(committedTranscript, finalTranscript);
}
