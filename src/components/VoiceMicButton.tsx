import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { transcribeVoiceAudio, MAX_VOICE_AUDIO_BYTES } from '../voice/audioTranscription';
import {
  buildSpeechTranscriptCandidates,
  buildSpeechTranscriptParts,
  joinSpeechTranscript,
  updateSpeechRecognitionSegments,
  appendFinalSpeechRecognitionSession,
  getSpeechRecognitionMode,
  requestVoiceRecording,
  releaseVoiceRecording,
  cancelVoiceRecordingRequest,
  type SpeechRecognitionSegment,
} from '../voice/speechRecognition';

type RecognitionAlternative = { transcript?: string; confidence?: number };
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
  onTranscript: (transcript: string, candidates?: string[]) => void;
  /** Called with replaceable live snapshots while speech is still being recognised. */
  onInterimTranscript?: (transcript: string) => void;
  onStatus?: (status: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  /** Shop-specific terms used by the server-side speech recognizer. */
  customVocabulary?: string[];
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
  customVocabulary = [],
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
  const committedSpeechSegmentsRef = useRef<SpeechRecognitionSegment[]>([]);
  const sessionSegmentsRef = useRef<SpeechRecognitionSegment[]>([]);
  const lastInterimTranscriptRef = useRef('');
  const restartTimerRef = useRef<number | null>(null);
  const audioLimitTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcribingRef = useRef(false);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
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

  const clearAudioLimitTimer = () => {
    if (audioLimitTimerRef.current !== null) {
      window.clearTimeout(audioLimitTimerRef.current);
      audioLimitTimerRef.current = null;
    }
  };

  const releaseMediaStream = () => {
    const stream = mediaStreamRef.current;
    mediaStreamRef.current = null;
    stream?.getTracks().forEach(track => track.stop());
  };

  const finishAudioFailure = (sessionId: number, message: string) => {
    if (
      sessionId !== recordingSessionIdRef.current ||
      publishedSessionIdRef.current === sessionId
    ) return;

    publishedSessionIdRef.current = sessionId;
    transcribingRef.current = false;
    transcriptionAbortRef.current = null;
    releaseMediaStream();
    audioChunksRef.current = [];
    notifyRecording(false);
    releaseVoiceRecording(ownerRef.current);
    setStatus(message);
  };

  const transcribeCapturedAudio = async (sessionId: number, audio: Blob) => {
    if (
      sessionId !== recordingSessionIdRef.current ||
      publishedSessionIdRef.current === sessionId
    ) return;

    if (audio.size > MAX_VOICE_AUDIO_BYTES) {
      finishAudioFailure(
        sessionId,
        languageRef.current === 'hi'
          ? 'रिकॉर्डिंग बहुत लंबी है। कृपया इसे छोटे हिस्सों में बोलें।'
          : 'This recording is too large. Please split it into shorter recordings.',
      );
      return;
    }

    transcribingRef.current = true;
    setStatus(languageRef.current === 'hi'
      ? 'आपकी आवाज़ और सामान के नाम पहचान रहा हूँ…'
      : 'Recognising your speech and shop product names…');

    const controller = new AbortController();
    transcriptionAbortRef.current = controller;
    try {
      const transcript = await transcribeVoiceAudio(audio, {
        language: languageRef.current,
        customVocabulary,
        signal: controller.signal,
      });

      if (
        sessionId !== recordingSessionIdRef.current ||
        publishedSessionIdRef.current === sessionId
      ) return;

      publishedSessionIdRef.current = sessionId;
      transcribingRef.current = false;
      transcriptionAbortRef.current = null;
      onTranscriptRef.current(transcript, [transcript]);
      notifyRecording(false);
      releaseVoiceRecording(ownerRef.current);
      setStatus(languageRef.current === 'hi'
        ? 'आवाज़ दर्ज हुई। टेक्स्ट जाँचें, फिर टिक या भेजने का तीर दबाएँ।'
        : 'Speech captured. Review the text, then confirm or send it.');
    } catch (error) {
      if (
        sessionId !== recordingSessionIdRef.current ||
        publishedSessionIdRef.current === sessionId
      ) return;

      const message = error instanceof Error ? error.message : '';
      finishAudioFailure(
        sessionId,
        languageRef.current === 'hi'
          ? 'आवाज़ का टेक्स्ट नहीं बन पाया। इंटरनेट जाँचकर फिर बोलें।'
          : (message || 'We could not transcribe this recording. Check your connection and try again.'),
      );
    }
  };

  const beginMediaRecordingSession = async (sessionId: number) => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      if (
        sessionId !== recordingSessionIdRef.current ||
        !shouldListenRef.current
      ) return;
      shouldListenRef.current = false;
      const name = error instanceof DOMException ? error.name : '';
      finishRecording(
        sessionId,
        name === 'NotAllowedError' || name === 'SecurityError'
          ? speechStatus('not-allowed', languageRef.current)
          : name === 'NotFoundError'
            ? speechStatus('audio-capture', languageRef.current)
            : speechStatus(undefined, languageRef.current),
      );
      return;
    }

    if (
      sessionId !== recordingSessionIdRef.current ||
      !shouldListenRef.current ||
      !recordingRef.current
    ) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    try {
      const preferredType = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        preferredType ? { mimeType: preferredType } : undefined,
      );

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = event => {
        if (
          sessionId === recordingSessionIdRef.current &&
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (sessionId !== recordingSessionIdRef.current) return;
        setStatus(languageRef.current === 'hi'
          ? 'माइक्रोफ़ोन रिकॉर्डिंग में समस्या हुई। फिर कोशिश करें।'
          : 'Microphone recording failed. Please try again.');
      };

      recorder.onstop = () => {
        clearAudioLimitTimer();
        if (sessionId !== recordingSessionIdRef.current) {
          releaseMediaStream();
          audioChunksRef.current = [];
          return;
        }

        mediaRecorderRef.current = null;
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        const audioType = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, { type: audioType });
        releaseMediaStream();

        if (blob.size === 0) {
          finishAudioFailure(
            sessionId,
            languageRef.current === 'hi'
              ? 'कोई आवाज़ रिकॉर्ड नहीं हुई। कृपया फिर बोलें।'
              : 'No audio was captured. Please try speaking again.',
          );
          return;
        }

        void transcribeCapturedAudio(sessionId, blob);
      };

      recorder.start(1000);
      setStatus(languageRef.current === 'hi'
        ? 'सुन रहा हूँ… आराम से बोलें। पूरा होने पर माइक्रोफ़ोन फिर दबाएँ।'
        : 'Listening… speak naturally. Tap the microphone again when finished.');

      audioLimitTimerRef.current = window.setTimeout(() => {
        if (
          sessionId === recordingSessionIdRef.current &&
          recordingRef.current &&
          shouldListenRef.current
        ) {
          setStatus(languageRef.current === 'hi'
            ? 'रिकॉर्डिंग की समय-सीमा पूरी हुई। टेक्स्ट तैयार कर रहा हूँ…'
            : 'Recording limit reached. Preparing the transcript…');
          stopRecording(true);
        }
      }, 90_000);
    } catch {
      stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioChunksRef.current = [];
      // Older browsers may expose getUserMedia but not a usable MediaRecorder.
      // Retain the existing recognition fallback for those devices.
      createRecognitionSession(sessionId);
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
    const finalSegments = [
      ...committedSpeechSegmentsRef.current,
      ...sessionSegmentsRef.current.filter(segment => segment?.isFinal),
    ];
    const candidates = buildSpeechTranscriptCandidates(finalSegments);

    // Set the guard before calling application code so re-entrant events cannot publish twice.
    publishedSessionIdRef.current = sessionId;
    committedTranscriptRef.current = transcript;
    sessionSegmentsRef.current = [];
    committedSpeechSegmentsRef.current = [];
    if (transcript) onTranscriptRef.current(transcript, candidates);
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
    const speechMode = getSpeechRecognitionMode(
      navigator.userAgent,
      navigator.platform,
      navigator.maxTouchPoints,
    );
    recognition.continuous = speechMode.continuous;
    recognition.interimResults = speechMode.interimResults;
    recognition.maxAlternatives = 5;
    sessionSegmentsRef.current = [];
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (
        recognitionRef.current !== recognition ||
        recordingSessionId !== recordingSessionIdRef.current ||
        !shouldListenRef.current
      ) return;
      const mobileMode = !speechMode.continuous;
      setStatus(languageRef.current === 'hi'
        ? (mobileMode
          ? 'सुन रहा हूँ… बोलते रहें। पूरा होने पर माइक्रोफ़ोन फिर दबाएँ।'
          : 'सुन रहा हूँ… पूरा बोलें। रोकने के लिए माइक्रोफ़ोन फिर दबाएँ।')
        : (mobileMode
          ? 'Listening… keep speaking. Tap the microphone again when you are finished.'
          : 'Listening… say your full message. Tap the microphone again when finished.'));
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
      // Mobile recognition is intentionally final-only; do not stream unstable
      // partial hypotheses into the editable transcript.
      if (speechMode.interimResults) publishInterim(parts.transcript);
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

      committedSpeechSegmentsRef.current = [
        ...committedSpeechSegmentsRef.current,
        ...sessionSegmentsRef.current.filter(segment => segment?.isFinal),
      ];
      committedTranscriptRef.current = appendFinalSpeechRecognitionSession(
        committedTranscriptRef.current,
        sessionSegmentsRef.current,
      );
      sessionSegmentsRef.current = [];

      if (speechMode.restartOnEnd && shouldListenRef.current && !fatalErrorRef.current) {
        // A browser may end a recognizer after silence. Preserve only final segments
        // and restart within the same logical recording session.
        lastInterimTranscriptRef.current = '';
        if (speechMode.interimResults) publishInterim(committedTranscriptRef.current);
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
    clearAudioLimitTimer();

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        mediaRecorderRef.current = null;
        releaseMediaStream();
        finishAudioFailure(
          recordingSessionIdRef.current,
          languageRef.current === 'hi'
            ? 'रिकॉर्डिंग पूरी नहीं हो सकी। कृपया फिर कोशिश करें।'
            : 'The recording could not be completed. Please try again.',
        );
      }
      return;
    }

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
    committedSpeechSegmentsRef.current = [];
    sessionSegmentsRef.current = [];
    lastInterimTranscriptRef.current = '';
    fatalErrorRef.current = null;
    shouldListenRef.current = true;
    notifyRecording(true);

    if (
      navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    ) {
      void beginMediaRecordingSession(recordingSessionId);
    } else {
      // Browser speech recognition remains a compatibility fallback.
      createRecognitionSession(recordingSessionId);
    }
  };

  const startListening = () => {
    if (disabledRef.current) return;

    if (recordingRef.current) {
      // Do not launch a second capture while the recorded audio is being transcribed.
      if (transcribingRef.current) {
        setStatus(languageRef.current === 'hi'
          ? 'आवाज़ का टेक्स्ट तैयार हो रहा है…'
          : 'Your audio is still being transcribed…');
        return;
      }
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
      clearAudioLimitTimer();
      transcriptionAbortRef.current?.abort();
      transcriptionAbortRef.current = null;
      transcribingRef.current = false;
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        try { recorder.stop(); } catch { /* The stream may already have stopped. */ }
      }
      releaseMediaStream();
      audioChunksRef.current = [];
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
