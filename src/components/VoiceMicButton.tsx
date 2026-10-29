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
    return hindi ? 'आवाज़ सुनाई नहीं दी। फिर कोशिश करें।' : 'No speech detected. Please try again.';
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
    ? 'आवाज़ पहचान नहीं पाए। कृपया फिर कोशिश करें या टाइप करें।'
    : 'Could not recognise that speech. Please try again or type instead.';
}

export function VoiceMicButton({
  language,
  onTranscript,
  onStatus,
  disabled = false,
  shape = 'rounded',
  label,
}: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    return () => {
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
    };
  }, []);

  const startListening = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        setListening(false);
      }
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      onStatus?.(
        language === 'hi'
          ? 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टाइप करें।'
          : 'Voice recognition is not supported by this browser. Please type instead.'
      );
      return;
    }

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    let recognition: RecognitionLike;
    try {
      recognition = new Recognition();
    } catch {
      onStatus?.(speechStatus(undefined, language));
      return;
    }

    handledRef.current = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      onStatus?.(language === 'hi' ? 'सुन रहा हूँ… बोलिए।' : 'Listening… speak now.');
    };

    recognition.onresult = (event) => {
      if (handledRef.current) return;
      const phrases: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal && result[0]?.transcript) phrases.push(result[0].transcript);
      }
      const transcript = phrases.join(' ').trim();
      if (!transcript) return;

      handledRef.current = true;
      onStatus?.(language === 'hi' ? 'समझ रहा हूँ…' : 'Processing speech…');
      onTranscript(transcript);
      try {
        recognition.stop();
      } catch {
        // The recognition session may already have stopped.
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (!handledRef.current) onStatus?.(speechStatus(event.error, language));
    };

    recognition.onend = () => {
      setListening(false);
      if (!handledRef.current) {
        onStatus?.(
          language === 'hi'
            ? 'आवाज़ नहीं मिली। माइक्रोफ़ोन दबाकर फिर बोलें।'
            : 'No voice input was captured. Tap the microphone and try again.'
        );
      }
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      onStatus?.(speechStatus(undefined, language));
    }
  };

  const buttonLabel =
    label ||
    (language === 'hi'
      ? listening
        ? 'आवाज़ रोकें'
        : 'आवाज़ से पूछें'
      : listening
        ? 'Stop listening'
        : 'Use voice');

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
