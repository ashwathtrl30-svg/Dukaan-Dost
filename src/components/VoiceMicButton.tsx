import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

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
  onTranscript: (transcript: string) => void;
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

export function VoiceMicButton({
  language,
  onTranscript,
  onStatus,
  onRecordingChange,
  disabled = false,
  shape = 'rounded',
  label,
}: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const fatalErrorRef = useRef<string | null>(null);
  const committedTranscriptRef = useRef('');
  const sessionFinalTranscriptRef = useRef('');
  const restartTimerRef = useRef<number | null>(null);

  // Keep current callbacks without tying microphone lifetime to callback identity.
  // Parent components often pass inline callbacks, which change on every render.
  const onTranscriptRef = useRef(onTranscript);
  const onStatusRef = useRef(onStatus);
  const onRecordingChangeRef = useRef(onRecordingChange);
  const languageRef = useRef(language);
  onTranscriptRef.current = onTranscript;
  onStatusRef.current = onStatus;
  onRecordingChangeRef.current = onRecordingChange;
  languageRef.current = language;

  const notifyRecording = (active: boolean) => {
    setListening(active);
    onRecordingChangeRef.current?.(active);
  };

  const setStatus = (message: string) => {
    onStatusRef.current?.(message);
  };

  const getTranscript = () =>
    [committedTranscriptRef.current, sessionFinalTranscriptRef.current]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  const clearRestartTimer = () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const stopAndPublish = (message?: string) => {
    shouldListenRef.current = false;
    clearRestartTimer();
    const transcript = getTranscript();
    if (transcript) onTranscriptRef.current(transcript);
    notifyRecording(false);
    if (message) {
      setStatus(message);
    } else if (transcript) {
      setStatus(languageRef.current === 'hi'
        ? 'आवाज़ दर्ज हुई। टेक्स्ट जाँचें, फिर टिक या भेजने का तीर दबाएँ।'
        : 'Speech captured. Review the text, then press the checkmark or send arrow.');
    } else {
      setStatus(languageRef.current === 'hi'
        ? 'हम आपकी बात साफ़ नहीं सुन पाए। कृपया साफ़ बोलकर फिर कोशिश करें।'
        : 'We did not hear you clearly. Please speak clearly and try again.');
    }
  };

  const createRecognitionSession = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      shouldListenRef.current = false;
      notifyRecording(false);
      setStatus(languageRef.current === 'hi'
        ? 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टाइप करें।'
        : 'Voice recognition is not supported by this browser. Please type instead.');
      return;
    }

    let recognition: RecognitionLike;
    try {
      recognition = new Recognition();
    } catch {
      shouldListenRef.current = false;
      notifyRecording(false);
      setStatus(speechStatus(undefined, languageRef.current));
      return;
    }

    recognition.lang = languageRef.current === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    sessionFinalTranscriptRef.current = '';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (recognitionRef.current !== recognition || !shouldListenRef.current) return;
      notifyRecording(true);
      setStatus(languageRef.current === 'hi'
        ? 'सुन रहा हूँ… पूरा बोलें। रोकने के लिए माइक्रोफ़ोन फिर दबाएँ।'
        : 'Listening… say your full message. Tap the microphone again when finished.');
    };

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const phrase = result?.[0]?.transcript?.trim();
        if (!phrase) continue;
        if (result.isFinal) finalParts.push(phrase);
        else interimParts.push(phrase);
      }
      sessionFinalTranscriptRef.current = finalParts.join(' ').replace(/\s+/g, ' ').trim();
      const transcript = [
        committedTranscriptRef.current,
        sessionFinalTranscriptRef.current,
        interimParts.join(' '),
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (transcript) onTranscriptRef.current(transcript);
    };

    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      const code = event.error;
      // Browsers commonly end a session after silence. Treat no-speech as
      // recoverable and restart listening from onend.
      if (code === 'no-speech' || code === 'aborted') return;
      fatalErrorRef.current = code || 'unknown';
      setStatus(speechStatus(code, languageRef.current));
      shouldListenRef.current = false;
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;

      const completed = sessionFinalTranscriptRef.current.trim();
      if (completed) {
        committedTranscriptRef.current = [
          committedTranscriptRef.current,
          completed,
        ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      }
      sessionFinalTranscriptRef.current = '';

      if (shouldListenRef.current && !fatalErrorRef.current) {
        // SpeechRecognition can stop itself after a pause even in continuous
        // mode. Restart a fresh session while keeping the user in recording mode.
        const captured = committedTranscriptRef.current;
        if (captured) onTranscriptRef.current(captured);
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (shouldListenRef.current && !fatalErrorRef.current) {
            createRecognitionSession();
          }
        }, 250);
        return;
      }

      const transcript = committedTranscriptRef.current;
      if (transcript) onTranscriptRef.current(transcript);
      notifyRecording(false);
      if (fatalErrorRef.current) {
        // Preserve the specific browser error already shown by onerror.
        fatalErrorRef.current = null;
      } else if (!transcript) {
        setStatus(languageRef.current === 'hi'
          ? 'कोई आवाज़ दर्ज नहीं हुई। कृपया साफ़ बोलकर फिर कोशिश करें।'
          : 'No speech was captured. Please speak clearly and try again.');
      } else {
        setStatus(languageRef.current === 'hi'
          ? 'आवाज़ दर्ज हुई। टेक्स्ट जाँचें, फिर टिक या भेजने का तीर दबाएँ।'
          : 'Speech captured. Review the text, then press the checkmark or send arrow.');
      }
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      shouldListenRef.current = false;
      notifyRecording(false);
      setStatus(speechStatus(undefined, languageRef.current));
    }
  };

  const startListening = () => {
    if (listening || shouldListenRef.current) {
      shouldListenRef.current = false;
      setStatus(languageRef.current === 'hi' ? 'रिकॉर्डिंग पूरी हो रही है…' : 'Finishing recording…');
      clearRestartTimer();
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          stopAndPublish();
        }
      } else {
        stopAndPublish();
      }
      return;
    }

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    committedTranscriptRef.current = '';
    sessionFinalTranscriptRef.current = '';
    fatalErrorRef.current = null;
    shouldListenRef.current = true;
    notifyRecording(true);
    createRecognitionSession();
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearRestartTimer();
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // The browser may already have closed the recognizer.
        }
      }
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
