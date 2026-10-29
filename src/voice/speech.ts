export type VoiceLanguage = 'en' | 'hi';

export function detectVoiceLanguage(text: string, fallback: VoiceLanguage): VoiceLanguage {
  if (/[\u0900-\u097f]/u.test(text)) return 'hi';
  if (
    /\b(?:aaj|kal|meri|mera|mere|kitna|kitne|kitni|kaise|kya|kyun|kyon|batao|bataiye|udhaar|udhar|kharcha|kharch|munafa|bikri|paisa|rupaye|rupay|hai|hain|hua|hui|huye)\b/i.test(text)
  ) {
    return 'hi';
  }
  return fallback;
}

export function speakText(
  text: string,
  preferredLanguage: VoiceLanguage,
  onEnd?: () => void,
  onError?: () => void,
): boolean {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    onError?.();
    return false;
  }

  const plainText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/[\x60*_#>]/g, ' ')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    onError?.();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.lang = /[\u0900-\u097f]/u.test(plainText) || preferredLanguage === 'hi'
    ? 'hi-IN'
    : 'en-IN';
  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();
  window.speechSynthesis.speak(utterance);
  return true;
}
