import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, X } from 'lucide-react';

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
  const [draftTranscript, setDraftTranscript] = useState('');
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const handledRef = useRef(false);
  const transcriptRef = useRef('');
  const baseTranscriptRef = useRef('');
  const finalSessionTranscriptRef = useRef('');
  const interimSessionTranscriptRef = useRef('');

  const updateDraft = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    transcriptRef.current = cleaned;
    setDraftTranscript(cleaned);
  };

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
    baseTranscriptRef.current = transcriptRef.current;
    finalSessionTranscriptRef.current = '';
    interimSessionTranscriptRef.current = '';
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      onStatus?.(
        language === 'hi'
          ? 'सुन रहा हूँ… बोलिए। पूरा होने पर नीचे टिक दबाएँ।'
          : 'Listening… speak naturally. Tap the arrow when you finish.'
      );
    };

    recognition.onresult = (event) => {
      if (handledRef.current) return;
      const finals: string[] = [];
      const interims: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) continue;
        if (result.isFinal) finals.push(transcript);
        else interims.push(transcript);
      }
      finalSessionTranscriptRef.current = finals.join(' ').trim();
      interimSessionTranscriptRef.current = interims.join(' ').trim();
      updateDraft([
        baseTranscriptRef.current,
        finalSessionTranscriptRef.current,
        interimSessionTranscriptRef.current,
      ].filter(Boolean).join(' '));
      if (transcriptRef.current) {
        onStatus?.(
          language === 'hi'
            ? 'बात सही दिख रही है या नहीं जाँचें। भेजने के लिए टिक दबाएँ।'
            : 'Review the recognised words. Tap the arrow to send.'
        );
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (!handledRef.current && !transcriptRef.current) {
        onStatus?.(speechStatus(event.error, language));
      } else if (!handledRef.current && transcriptRef.current) {
        onStatus?.(
          language === 'hi'
            ? 'आवाज़ रुक गई। लिखे हुए शब्द जाँचें या माइक्रोफ़ोन से आगे बोलें।'
            : 'Listening paused. Review the text or tap the microphone to continue.'
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (!handledRef.current) {
        if (transcriptRef.current) {
          onStatus?.(
            language === 'hi'
              ? 'आवाज़ रुक गई। शब्द जाँचें, आगे बोलने के लिए माइक्रोफ़ोन दबाएँ, या भेजने के लिए टिक दबाएँ।'
              : 'Listening paused. Review the text, tap the microphone to continue, or use the arrow to send.'
          );
        } else {
          onStatus?.(
            language === 'hi'
              ? 'आवाज़ सुनाई नहीं दी। माइक्रोफ़ोन दबाकर फिर बोलें।'
              : 'We did not hear you clearly. Tap the microphone and try again.'
          );
        }
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

  const sendTranscript = () => {
    const transcript = transcriptRef.current.trim();
    if (!transcript || disabled || handledRef.current) return;
    handledRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already have stopped.
    }
    recognitionRef.current = null;
    setListening(false);
    updateDraft('');
    baseTranscriptRef.current = '';
    finalSessionTranscriptRef.current = '';
    interimSessionTranscriptRef.current = '';
    onStatus?.(language === 'hi' ? 'भेज रहे हैं…' : 'Sending…');
    onTranscript(transcript);
  };

  const clearTranscript = () => {
    handledRef.current = true;
    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already have stopped.
    }
    recognitionRef.current = null;
    setListening(false);
    updateDraft('');
    baseTranscriptRef.current = '';
    finalSessionTranscriptRef.current = '';
    interimSessionTranscriptRef.current = '';
    onStatus?.(language === 'hi' ? 'लिखे हुए शब्द हटा दिए।' : 'Voice draft cleared.');
  };

  const buttonLabel =
    label ||
    (language === 'hi'
      ? listening ? 'आवाज़ रोकें' : 'आवाज़ से पूछें'
      : listening ? 'Stop listening' : 'Use voice');

  return (
    <div className="flex flex-col items-stretch gap-2 w-full min-w-0">
      <div className="flex items-center gap-2">
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
        {listening && (
          <span className="text-xs text-text-secondary animate-pulse">
            {language === 'hi' ? 'सुन रहा है…' : 'Listening…'}
          </span>
        )}
      </div>

      {draftTranscript && (
        <div className="w-full rounded-2xl border border-border bg-card p-3">
          <label className="text-xs font-semibold text-text-secondary block mb-2">
            {language === 'hi' ? 'भेजने से पहले जाँचें' : 'Review before sending'}
          </label>
          <textarea
            value={draftTranscript}
            onChange={(event) => {
              handledRef.current = false;
              baseTranscriptRef.current = event.target.value;
              finalSessionTranscriptRef.current = '';
              interimSessionTranscriptRef.current = '';
              updateDraft(event.target.value);
            }}
            rows={3}
            className="input-field w-full resize-y text-sm"
            aria-label={language === 'hi' ? 'पहचाने गए शब्द' : 'Recognised speech'}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={clearTranscript}
              disabled={disabled}
              aria-label={language === 'hi' ? 'आवाज़ का ड्राफ़्ट मिटाएँ' : 'Clear voice draft'}
              title={language === 'hi' ? 'मिटाएँ' : 'Clear'}
              className="w-10 h-10 rounded-full border border-border text-text-secondary flex items-center justify-center disabled:opacity-40"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={sendTranscript}
              disabled={disabled || !draftTranscript.trim()}
              aria-label={language === 'hi' ? 'संदेश भेजें' : 'Send voice message'}
              title={language === 'hi' ? 'भेजें' : 'Send'}
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
            >
              <ArrowUp size={21} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
