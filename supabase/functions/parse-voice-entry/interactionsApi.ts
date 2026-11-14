export const GEMINI_TRANSCRIPTION_MODEL = "gemini-3.5-transcribe";
const MAX_CUSTOM_VOCABULARY_TERMS = 150;

export interface GeminiTranscriptionRequest {
  model: string;
  input: Array<{
    type: "audio";
    data: string;
    mime_type: string;
  }>;
  transcription_config: {
    custom_vocabulary: string[];
    language_codes: string[];
  };
}

/**
 * Build the raw REST request for Gemini's dedicated transcription model.
 * Hindi and Indian English are both supplied because shopkeepers commonly
 * code-mix them in the same utterance.
 */
export function buildTranscriptionRequest(
  audioBase64: string,
  mimeType: string,
  customVocabulary: string[],
): GeminiTranscriptionRequest {
  const vocabulary = Array.from(new Set(
    customVocabulary
      .filter(value => typeof value === "string" && value.trim())
      .map(value => value.trim().slice(0, 80)),
  )).slice(0, MAX_CUSTOM_VOCABULARY_TERMS);

  return {
    model: GEMINI_TRANSCRIPTION_MODEL,
    input: [{ type: "audio", data: audioBase64, mime_type: mimeType }],
    transcription_config: {
      custom_vocabulary: vocabulary,
      language_codes: ["hi-IN", "en-IN"],
    },
  };
}

/**
 * The Interactions REST API returns model output in steps[].content[].
 * output_text is added by Google's SDK and is not a raw REST response field.
 */
export function extractInteractionTranscript(response: unknown): string {
  if (!response || typeof response !== "object") return "";

  const data = response as Record<string, unknown>;
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const steps = Array.isArray(data.steps)
    ? data.steps
    : Array.isArray(data.output)
      ? data.output
      : [];

  const content = steps
    .filter((step): step is Record<string, unknown> =>
      !!step && typeof step === "object" &&
      (!("type" in step) || step.type === "model_output"),
    )
    .flatMap(step => Array.isArray(step.content) ? step.content : [])
    .filter((part): part is Record<string, unknown> =>
      !!part && typeof part === "object",
    );

  const textBlocks = content
    .filter(part => part.type === "text" && typeof part.text === "string")
    .map(part => (part.text as string).trim())
    .filter(Boolean);

  if (textBlocks.length > 0) return textBlocks.join("\n").trim();

  return content
    .filter(part => part.type === "word_info" && typeof part.text === "string")
    .map(part => (part.text as string).trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}
