export interface TranscribeVoiceAudioOptions {
  language: 'en' | 'hi';
  customVocabulary?: string[];
  signal?: AbortSignal;
}

/** 60 seconds of 16 kHz, 16-bit mono PCM plus a WAV header. */
export const MAX_VOICE_AUDIO_BYTES = 2_100_000;

function getAudioContextConstructor(): typeof AudioContext | undefined {
  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  return window.AudioContext || browserWindow.webkitAudioContext;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

/**
 * Convert browser-specific MediaRecorder output (often WebM/Opus on Android)
 * into the documented, portable WAV/PCM input format used by Gemini audio understanding.
 */
async function convertToMonoWav(audio: Blob): Promise<Blob> {
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) {
    throw new Error('This browser cannot process recorded audio. Please use an updated browser.');
  }

  const audioContext = new AudioContextConstructor();
  try {
    const decoded = await audioContext.decodeAudioData(await audio.arrayBuffer());
    const targetRate = 16_000;
    const frameCount = Math.ceil(decoded.duration * targetRate);
    if (frameCount <= 0 || frameCount > targetRate * 60) {
      throw new Error('Please keep each voice recording to 60 seconds or less.');
    }

    const bytesPerSample = 2;
    const dataBytes = frameCount * bytesPerSample;
    const wavBuffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(wavBuffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataBytes, true);

    const channels = Array.from(
      { length: decoded.numberOfChannels },
      (_, channel) => decoded.getChannelData(channel),
    );
    const sourceRate = decoded.sampleRate;

    for (let frame = 0; frame < frameCount; frame += 1) {
      const sourcePosition = frame * sourceRate / targetRate;
      const left = Math.min(Math.floor(sourcePosition), decoded.length - 1);
      const right = Math.min(left + 1, decoded.length - 1);
      const fraction = sourcePosition - left;

      let mixedSample = 0;
      for (const channel of channels) {
        const sample = channel[left] * (1 - fraction) + channel[right] * fraction;
        mixedSample += sample / channels.length;
      }

      const clamped = Math.max(-1, Math.min(1, mixedSample));
      const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(44 + frame * bytesPerSample, pcm, true);
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    await audioContext.close().catch(() => undefined);
  }
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

  const wavAudio = await convertToMonoWav(audio);
  if (wavAudio.size > MAX_VOICE_AUDIO_BYTES) {
    throw new Error('This recording is too large. Please split it into shorter recordings.');
  }

  const audioBase64 = arrayBufferToBase64(await wavAudio.arrayBuffer());
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
      mimeType: 'audio/wav',
      language: options.language,
      shopType: 'other',
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
