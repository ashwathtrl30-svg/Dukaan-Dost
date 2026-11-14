export interface TranscribeVoiceAudioOptions {
  language: 'en' | 'hi';
  customVocabulary?: string[];
  signal?: AbortSignal;
}

export const MAX_VOICE_AUDIO_BYTES = 2_500_000;

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/aac',
]);

function normalizeAudioMimeType(value: string): string {
  const mimeType = value.toLowerCase().split(';', 1)[0].trim();
  if (mimeType === 'audio/x-wav') return 'audio/wav';
  if (mimeType === 'audio/x-m4a') return 'audio/m4a';
  return mimeType;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }

  return btoa(binary);
}

export async function transcribeVoiceAudio(
  audio: Blob,
  options: TranscribeVoiceAudioOptions,
): Promise<string> {
  if (!(audio instanceof Blob) || audio.size === 0) {
    throw new Error('No audio was captured. Please try again.');
  }
  if (audio.size > MAX_VOICE_AUDIO_BYTES) {
    throw new Error('This recording is too large. Please split it into shorter recordings.');
  }

  const mimeType = normalizeAudioMimeType(audio.type || 'audio/webm');
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
    throw new Error('This browser produced an unsupported audio format. Please try another browser.');
  }

  const audioBase64 = arrayBufferToBase64(await audio.arrayBuffer());
  const customVocabulary = Array.isArray(options.customVocabulary)
    ? Array.from(new Set(
      options.customVocabulary
        .filter(value => typeof value === 'string' && value.trim())
        .map(value => value.trim().slice(0, 80)),
    )).slice(0, 150)
    : [];

  const response = await fetch('/api/parse-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'transcribe',
      audioBase64,
      mimeType,
      language: options.language,
      customVocabulary,
    }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  const payload = await response.json().catch(() => null) as
    | { transcript?: unknown; error?: unknown }
    | null;

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : 'The speech transcription service is temporarily unavailable.';
    throw new Error(message);
  }

  const transcript = typeof payload?.transcript === 'string'
    ? payload.transcript.trim()
    : '';
  if (!transcript) {
    throw new Error('No speech could be recognised. Please speak clearly and try again.');
  }
  if (transcript.length > 1600) {
    throw new Error('This recording is too long. Please split it into shorter recordings.');
  }

  return transcript;
}
