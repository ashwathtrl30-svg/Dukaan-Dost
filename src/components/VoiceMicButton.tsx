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
  const finalTranscriptRef = useRef('');
  const currentTranscriptRef = useRef('');
  const stoppingRef = useRef(false);

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
      onRecordingChange?.(false);
    };
  }, [onRecordingChange]);

  const startListening = () => {
    if (listening) {
      stoppingRef.current = true;
      onStatus?.(language === 'hi' ? 'रिकॉर्डिंग पूरी हो रही है…' : 'Finishing recording…');
      try {
        recognitionRef.current?.stop();
      } catch {
        setListening(false);
        onRecordingChange?.(false);
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

    finalTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    stoppingRef.current = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    // Continuous mode gives shopkeepers time to say a whole list of entries.
    // Nothing is sent or saved automatically when a recognition result arrives.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      onRecordingChange?.(true);
      onStatus?.(language === 'hi' ? 'सुन रहा हूँ… पूरा बोलें, फिर माइक्रोफ़ोन रोकें।' : 'Listening… finish your full message, then stop the microphone.');
    };

    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const phrase = result?.[0]?.transcript?.trim();
        if (!phrase) continue;
        if (result.isFinal) finalParts.push(phrase);
        else interimParts.push(phrase);
      }
      finalTranscriptRef.current = finalParts.join(' ').replace(/\s+/g, ' ').trim();
      currentTranscriptRef.current = [finalTranscriptRef.current, interimParts.join(' ')]
        .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (currentTranscriptRef.current) onTranscript(currentTranscriptRef.current);
    };

    recognition.onerror = (event) => {
      setListening(false);
      onRecordingChange?.(false);
      if (event.error !== 'aborted') onStatus?.(speechStatus(event.error, language));
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      onRecordingChange?.(false);
      const transcript = finalTranscriptRef.current || currentTranscriptRef.current;
      if (transcript.trim()) {
        onTranscript(transcript.trim());
        onStatus?.(
          language === 'hi'
            ? 'आवाज़ दर्ज हुई। अब टेक्स्ट जाँचें और भेजने/जोड़ने के लिए तीर या टिक दबाएँ।'
            : 'Speech captured. Review the text, then press the arrow or checkmark to send or add it.'
        );
      } else if (!stoppingRef.current) {
        onStatus?.(language === 'hi'
          ? 'हम आपकी बात साफ़ नहीं सुन पाए। कृपया साफ़ बोलकर फिर कोशिश करें।'
          : 'We did not hear you clearly. Please speak clearly and try again.');
      } else {
        onStatus?.(language === 'hi'
          ? 'कोई आवाज़ दर्ज नहीं हुई। कृपया साफ़ बोलकर फिर कोशिश करें।'
          : 'No speech was captured. Please speak clearly and try again.');
      }
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      onRecordingChange?.(false);
      onStatus?.(speechStatus(undefined, language));
    }
  };

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
