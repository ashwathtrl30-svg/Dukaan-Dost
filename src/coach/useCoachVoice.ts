import { useCallback, useEffect, useRef, useState } from 'react';

export type CoachVoiceLanguage = 'en' | 'hi';
export type CoachVoiceError =
  | 'unsupported'
  | 'permission-denied'
  | 'no-speech'
  | 'no-microphone'
  | 'network'
  | 'language'
  | 'unknown';

interface SpeechAlternativeLike {
  transcript: string;
}

interface SpeechResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
}

interface SpeechResultListLike {
  length: number;
  [index: number]: SpeechResultLike;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: SpeechResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function getCoachSpeechLocale(language: CoachVoiceLanguage): 'en-IN' | 'hi-IN' {
  return language === 'hi' ? 'hi-IN' : 'en-IN';
}

/** Join a recognised speech segment to the draft without repeating an identical final segment. */
export function appendCoachTranscript(
  currentValue: string,
  incomingValue: string,
  maxLength = 4000,
): string {
  const clean = (value: string) => value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

  const current = clean(currentValue);
  const incoming = clean(incomingValue);
  if (!incoming) return current;
  if (!current) return incoming;

  const currentLower = current.toLocaleLowerCase();
  const incomingLower = incoming.toLocaleLowerCase();
  if (currentLower.endsWith(incomingLower)) return current;
  if (incomingLower.startsWith(currentLower)) return incoming;
  return (current + ' ' + incoming).slice(0, maxLength).trim();
}

export function mapCoachSpeechRecognitionError(errorCode: string): CoachVoiceError {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied';
    case 'no-speech':
      return 'no-speech';
    case 'audio-capture':
      return 'no-microphone';
    case 'network':
      return 'network';
    case 'language-not-supported':
      return 'language';
    default:
      return 'unknown';
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const host = window as SpeechRecognitionWindow;
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function isCoachSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

export function isCoachSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.speechSynthesis?.speak === 'function'
    && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Read text aloud using the browser's native speech synthesis; no audio file is created. */
export function speakCoachText(
  text: string,
  language: CoachVoiceLanguage,
): boolean {
  if (!isCoachSpeechSynthesisSupported()) return false;
  const content = text.normalize('NFKC').trim().slice(0, 3000);
  if (!content) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(content);
  const locale = getCoachSpeechLocale(language);
  utterance.lang = locale;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const prefix = language === 'hi' ? 'hi' : 'en';
  const preferredVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.toLowerCase()))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
  if (preferredVoice) utterance.voice = preferredVoice;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function cancelCoachSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export interface UseCoachVoiceInputOptions {
  language: CoachVoiceLanguage;
  disabled?: boolean;
  onTranscript: (transcript: string) => void;
}

export function useCoachVoiceInput({
  language,
  disabled = false,
  onTranscript,
}: UseCoachVoiceInputOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<CoachVoiceError | null>(null);

  onTranscriptRef.current = onTranscript;

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setIsListening(false);
      setInterimTranscript('');
      return;
    }
    try {
      // Keep the UI in its listening state until onend fires. Browsers may
      // deliver the final recognised words only after stop() has been called.
      recognition.stop();
    } catch {
      try { recognition.abort(); } catch { /* The browser may already have stopped it. */ }
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  const start = useCallback(() => {
    setError(null);
    if (disabled) return;

    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError('unsupported');
      return;
    }

    const previous = recognitionRef.current;
    if (previous) {
      previous.onstart = null;
      previous.onresult = null;
      previous.onerror = null;
      previous.onend = null;
      try { previous.abort(); } catch { /* Ignore a stale browser recognition instance. */ }
      recognitionRef.current = null;
    }

    const recognition = new Recognition();
    recognition.lang = getCoachSpeechLocale(language);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? '';
        if (result?.isFinal) finalText += (finalText ? ' ' : '') + transcript;
        else interimText += (interimText ? ' ' : '') + transcript;
      }
      setInterimTranscript(interimText.trim());
      if (finalText.trim()) onTranscriptRef.current(finalText.trim());
    };
    recognition.onerror = (event) => {
      setError(mapCoachSpeechRecognitionError(event.error));
      setIsListening(false);
      setInterimTranscript('');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError('unknown');
    }
  }, [disabled, language]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (disabled && isListening) stop();
  }, [disabled, isListening, stop]);

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* Ignore teardown after the browser has stopped. */ }
    }
  }, []);

  return {
    isListening,
    interimTranscript,
    error,
    toggle,
    start,
    stop,
    clearError,
    isSupported: isCoachSpeechRecognitionSupported(),
  };
}
