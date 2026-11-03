import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import {
  buildSpeechTranscriptParts,
  joinSpeechTranscript,
  updateSpeechRecognitionSegments,
  requestVoiceRecording,
  releaseVoiceRecording,
  cancelVoiceRecordingRequest,
  type SpeechRecognitionSegment,
} from '../voice/speechRecognition';

type RecognitionAlternative = { transcript?: string };
type RecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternative;
};
type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};
type RecognitionErrorEvent = Event & { error?: string };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

type VoiceMicButtonProps = {
  language: 'en' | 'hi';
  /** Called once, with the final transcript, when a logical recording finishes. */
  onTranscript: (transcript: string) => void;
  /** Called with replaceable live snapshots while speech is still being recognised. */
  onInterimTranscript?: (transcript: string) => void;
  onStatus?: (status: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
  shape?: 'circle' | 'rounded';
  label?: string;
};

function speechStatus(code: string | undefined, language: 'en' | 'hi'): string {
  const hindi = language === 'hi';
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return hindi
      ? 'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।'
      : 'Microphone access was denied. Allow it in your browser settings.';
  }
  if (code === 'no-speech') {
    return hindi
      ? 'आवाज़ साफ़ नहीं सुनाई दी। कृपया साफ़ बोलकर फिर कोशिश करें।'
      : 'We did not hear you clearly. Please speak clearly and try again.';
  }
  if (code === 'network') {
    return hindi
      ? 'आवाज़ पहचानने की सेवा उपलब्ध नहीं है। इंटरनेट जाँचें या टाइप करें।'
      : 'Speech recognition is unavailable. Check your connection or type instead.';
  }
  if (code === 'audio-capture') {
    return hindi
      ? 'माइक्रोफ़ोन नहीं मिला। डिवाइस की सेटिंग जाँचें।'
      : 'No microphone was found. Check your device settings.';
  }
  return hindi
    ? 'आवाज़ साफ़ नहीं समझ आई। कृपया धीरे और साफ़ बोलें या टाइप करें।'
    : 'We could not understand that clearly. Please speak slowly and clearly, or type instead.';
}

function detachRecognition(recognition: RecognitionLike, abort: boolean): void {
  recognition.onstart = null;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
  if (abort) {
    try {
      recognition.abort();
    } catch {
      // The browser may already have closed the recognizer.
    }
  }
}

export function VoiceMicButton({
  language,
  onTranscript,
  onInterimTranscript,
  onStatus,
  onRecordingChange,
  disabled = false,
  shape = 'rounded',
  label,
}: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const recordingRef = useRef(false);
  const recordingSessionIdRef = useRef(0);
  const publishedSessionIdRef = useRef<number | null>(null);
  const fatalErrorRef = useRef<string | null>(null);
  const committedTranscriptRef = useRef('');
  const sessionSegmentsRef = useRef<SpeechRecognitionSegment[]>([]);
  const lastInterimTranscriptRef = useRef('');
  const restartTimerRef = useRef<number | null>(null);
  const ownerRef = useRef(Symbol('voice-mic'));
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // Keep current callbacks without tying microphone lifetime to callback identity.
  const onTranscriptRef = useRef(onTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const onStatusRef = useRef(onStatus);
  const onRecordingChangeRef = useRef(onRecordingChange);
  const languageRef = useRef(language);
  onTranscriptRef.current = onTranscript;
  onInterimTranscriptRef.current = onInterimTranscript;
  onStatusRef.current = onStatus;
  onRecordingChangeRef.current = onRecordingChange;
  languageRef.current = language;

  const notifyRecording = (active: boolean) => {
    if (recordingRef.current === active) return;
    recordingRef.current = active;
    setListening(active);
    onRecordingChangeRef.current?.(active);
  };

  const setStatus = (message: string) => {
    onStatusRef.current?.(message);
  };

  const clearRestartTimer = () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const publishInterim = (transcript: string) => {
    if (!transcript || transcript === lastInterimTranscriptRef.current) return;
    lastInterimTranscriptRef.current = transcript;
    onInterimTranscriptRef.current?.(transcript);
  };

  const finishRecording = (sessionId: number, statusMessage?: string) => {
    if (
      sessionId !== recordingSessionIdRef.current ||
      publishedSessionIdRef.current === sessionId
    ) return;

    shouldListenRef.current = false;
    clearRestartTimer();
    const parts = buildSpeechTranscriptParts('', sessionSegmentsRef.current);
    const transcript = joinSpeechTranscript(committedTranscriptRef.current, parts.finalTranscript);

    // Set the guard before calling application code so re-entrant events cannot publish twice.
    publishedSessionIdRef.current = sessionId;
    committedTranscriptRef.current = transcript;
    sessionSegmentsRef.current = [];
    if (transcript) onTranscriptRef.current(transcript);
    notifyRecording(false);

    releaseVoiceRecording(ownerRef.current);

    if (fatalErrorRef.current) {
      fatalErrorRef.current = null;
    } else if (statusMessage) {
      setStatus(statusMessage);
    } else if (transcript) {
      setStatus(languageRef.current === 'hi'
        ? 'आवाज़ दर्ज हुई। टेक्स्ट जाँचें, फिर टिक या भेजने का तीर दबाएँ।'
        : 'Speech captured. Review the text, then press the checkmark or send arrow.');
    } else {
      setStatus(languageRef.current === 'hi'
        ? 'कोई आवाज़ दर्ज नहीं हुई। कृपया साफ़ बोलकर फिर कोशिश करें।'
        : 'No speech was captured. Please speak clearly and try again.');
    }
  };

  const createRecognitionSession = (recordingSessionId: number) => {
    if (
      recordingSessionId !== recordingSessionIdRef.current ||
      !recordingRef.current ||
      !shouldListenRef.current ||
      recognitionRef.current
    ) return;

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      shouldListenRef.current = false;
      finishRecording(
        recordingSessionId,
        languageRef.current === 'hi'
          ? 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टाइप करें।'
          : 'Voice recognition is not supported by this browser. Please type instead.',
      );
      return;
    }

    let recognition: RecognitionLike;
    try {
      recognition = new Recognition();
    } catch {
      shouldListenRef.current = false;
      finishRecording(recordingSessionId, speechStatus(undefined, languageRef.current));
      return;
    }

    recognition.lang = languageRef.current === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    sessionSegmentsRef.current = [];
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (
        recognitionRef.current !== recognition ||
        recordingSessionId !== recordingSessionIdRef.current ||
        !shouldListenRef.current
      ) return;
      setStatus(languageRef.current === 'hi'
        ? 'सुन रहा हूँ… पूरा बोलें। रोकने के लिए माइक्रोफ़ोन फिर दबाएँ।'
        : 'Listening… say your full message. Tap the microphone again when finished.');
    };

    recognition.onresult = (event) => {
      if (
        recognitionRef.current !== recognition ||
        recordingSessionId !== recordingSessionIdRef.current ||
        !recordingRef.current
      ) return;

      // SpeechRecognition.resultIndex identifies the first result changed by this event.
      // Retaining earlier segments avoids replaying or appending the full result list.
      sessionSegmentsRef.current = updateSpeechRecognitionSegments(
        sessionSegmentsRef.current,
        event,
      );
      const parts = buildSpeechTranscriptParts(
        committedTranscriptRef.current,
        sessionSegmentsRef.current,
      );
      publishInterim(parts.transcript);
    };

    recognition.onerror = (event) => {
      if (
        recognitionRef.current !== recognition ||
        recordingSessionId !== recordingSessionIdRef.current
      ) return;
      const code = event.error;
      // Silence and an intentional abort are recoverable; onend decides whether to restart.
      if (code === 'no-speech' || code === 'aborted') return;
      fatalErrorRef.current = code || 'unknown';
      setStatus(speechStatus(code, languageRef.current));
      shouldListenRef.current = false;
    };

    recognition.onend = () => {
      if (
        recognitionRef.current !== recognition ||
        recordingSessionId !== recordingSessionIdRef.current
      ) return;
      recognitionRef.current = null;

      const parts = buildSpeechTranscriptParts('', sessionSegmentsRef.current);
      committedTranscriptRef.current = joinSpeechTranscript(
        committedTranscriptRef.current,
        parts.finalTranscript,
      );
      sessionSegmentsRef.current = [];

      if (shouldListenRef.current && !fatalErrorRef.current) {
        // A browser may end a recognizer after silence. Preserve only final segments
        // and restart within the same logical recording session.
        lastInterimTranscriptRef.current = '';
        publishInterim(committedTranscriptRef.current);
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (
            recordingSessionId === recordingSessionIdRef.current &&
            recordingRef.current &&
            shouldListenRef.current &&
            !recognitionRef.current &&
            !fatalErrorRef.current
          ) {
            createRecognitionSession(recordingSessionId);
          }
        }, 250);
        return;
      }

      finishRecording(recordingSessionId);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      shouldListenRef.current = false;
      detachRecognition(recognition, true);
      finishRecording(recordingSessionId, speechStatus(undefined, languageRef.current));
    }
  };

  const stopRecording = (showFinishingStatus: boolean) => {
    if (!recordingRef.current || !shouldListenRef.current) return;

    shouldListenRef.current = false;
    if (showFinishingStatus) {
      setStatus(languageRef.current === 'hi' ? 'रिकॉर्डिंग पूरी हो रही है…' : 'Finishing recording…');
    }
    clearRestartTimer();
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        recognitionRef.current = null;
        detachRecognition(recognition, true);
        finishRecording(recordingSessionIdRef.current);
      }
    } else {
      finishRecording(recordingSessionIdRef.current);
    }
  };

  const beginRecordingSession = () => {
    if (disabledRef.current || recordingRef.current) {
      releaseVoiceRecording(ownerRef.current);
      return;
    }

    // A stale recognizer should never overlap a new logical recording.
    if (recognitionRef.current) {
      detachRecognition(recognitionRef.current, true);
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const recordingSessionId = recordingSessionIdRef.current + 1;
    recordingSessionIdRef.current = recordingSessionId;
    publishedSessionIdRef.current = null;
    committedTranscriptRef.current = '';
    sessionSegmentsRef.current = [];
    lastInterimTranscriptRef.current = '';
    fatalErrorRef.current = null;
    shouldListenRef.current = true;
    notifyRecording(true);
    createRecognitionSession(recordingSessionId);
  };

  const startListening = () => {
    if (disabledRef.current) return;

    if (recordingRef.current) {
      // A second tap while stop is pending must not create another recognizer.
      stopRecording(true);
      return;
    }

    // A different screen's microphone is stopped first. The coordinator starts
    // this request only after the previous recognizer has ended or been aborted.
    requestVoiceRecording({
      owner: ownerRef.current,
      stop: () => stopRecording(false),
      start: beginRecordingSession,
    });
  };

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === 'hidden') stopRecording(false);
    };
    const stopOnPageHide = () => stopRecording(false);

    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('pagehide', stopOnPageHide);

    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('pagehide', stopOnPageHide);
      // Invalidate queued events and timers before aborting the browser recognizer.
      shouldListenRef.current = false;
      recordingSessionIdRef.current += 1;
      recordingRef.current = false;
      clearRestartTimer();
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) detachRecognition(recognition, true);
      cancelVoiceRecordingRequest(ownerRef.current);
      // App-level state (Home) can outlive this button when tabs change.
      onRecordingChangeRef.current?.(false);
    };
  }, []);

  const buttonLabel =
    label ||
    (language === 'hi'
      ? listening ? 'रिकॉर्डिंग रोकें' : 'आवाज़ से पूछें'
      : listening ? 'Stop recording' : 'Use voice');

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={disabled}
      aria-label={buttonLabel}
      aria-pressed={listening}
      title={buttonLabel}
      className={
        'w-12 h-12 flex-shrink-0 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ' +
        (shape === 'circle' ? 'rounded-full ' : 'rounded-2xl ') +
        (listening ? 'bg-red-600 text-white ring-2 ring-red-200' : 'bg-primary/10 text-primary')
      }
    >
      <Mic size={20} strokeWidth={2.2} />
    </button>
  );
}
