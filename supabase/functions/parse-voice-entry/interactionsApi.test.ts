import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTranscriptionRequest,
  extractInteractionTranscript,
  GEMINI_TRANSCRIPTION_MODEL,
} from "./interactionsApi";

test("builds the dedicated Transcribe request with Indian language hints and custom vocabulary", () => {
  const request = buildTranscriptionRequest(
    "UklGRg==",
    "audio/wav",
    ["Chocolate Bomboloni", "San Sebastian Cheesecake", "Chocolate Bomboloni"],
  );

  assert.equal(request.model, GEMINI_TRANSCRIPTION_MODEL);
  assert.deepEqual(request.input, [{
    type: "audio",
    data: "UklGRg==",
    mime_type: "audio/wav",
  }]);
  assert.deepEqual(request.generation_config.transcription_config, {
    custom_vocabulary: ["Chocolate Bomboloni", "San Sebastian Cheesecake"],
    language_codes: ["hi-IN", "en-IN"],
    mode: { type: "verbatim" },
  });
});

test("caps custom vocabulary at 150 phrases", () => {
  const vocabulary = Array.from({ length: 180 }, (_, index) => `Product ${index}`);
  const request = buildTranscriptionRequest("YQ==", "audio/wav", vocabulary);

  assert.equal(request.generation_config.transcription_config.custom_vocabulary.length, 150);
  assert.equal(request.transcription_config.custom_vocabulary[0], "Product 0");
  assert.equal(request.transcription_config.custom_vocabulary[149], "Product 149");
});

test("extracts text from the raw Interactions REST steps response", () => {
  const transcript = extractInteractionTranscript({
    id: "test-interaction",
    status: "completed",
    steps: [{
      type: "model_output",
      content: [
        { type: "text", text: "ek chocolate bomboloni pachas rupaye sale add karo" },
      ],
    }],
  });

  assert.equal(transcript, "ek chocolate bomboloni pachas rupaye sale add karo");
});

test("uses ASR word annotations when a text block is not present", () => {
  const transcript = extractInteractionTranscript({
    steps: [{
      type: "model_output",
      content: [
        { type: "word_info", text: "Chocolate" },
        { type: "word_info", text: "Bomboloni" },
      ],
    }],
  });

  assert.equal(transcript, "Chocolate Bomboloni");
});

test("accepts the SDK convenience output_text field when supplied", () => {
  assert.equal(
    extractInteractionTranscript({ output_text: "  San Sebastian Cheesecake  " }),
    "San Sebastian Cheesecake",
  );
});

test("returns an empty transcript for missing or unrelated response content", () => {
  assert.equal(extractInteractionTranscript(null), "");
  assert.equal(extractInteractionTranscript({ steps: [{ type: "function_call", content: [] }] }), "");
});
