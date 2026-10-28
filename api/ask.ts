function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return runtime.process?.env?.[name];
}

const requestWindows = new Map<
  string,
  { count: number; start: number }
>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function getClientAddress(req: any): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded;

  return (
    (typeof raw === "string"
      ? raw.split(",")[0].trim()
      : "") ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function isRateLimited(address: string): boolean {
  const now = Date.now();
  const existing = requestWindows.get(address);

  if (!existing || now - existing.start >= WINDOW_MS) {
    requestWindows.set(address, {
      count: 1,
      start: now,
    });
    return false;
  }

  existing.count++;
  return existing.count > MAX_REQUESTS;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  if (isRateLimited(getClientAddress(req))) {
    return res.status(429).json({
      error: "Too many questions. Please wait a minute.",
    });
  }

  const supabaseUrl = getEnv("SUPABASE_URL")?.replace(/\/$/, "");
  const anonKey = getEnv("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    console.error("Supabase environment configuration is missing.");

    return res.status(503).json({
      error: "The AI service is not configured.",
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const language =
      body?.language === "Hindi" ? "Hindi" : "English";

    const shopContext =
      typeof body?.shopContext === "string"
        ? body.shopContext.slice(0, 1500)
        : "Shop type not provided.";

    if (!question || question.length > 1600) {
      return res.status(400).json({
        error: "Enter a question of up to 1,600 characters.",
      });
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/ask-dukaan-dost`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          question,
          language,
          shopContext,
        }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Supabase function failed:", {
        status: response.status,
        error: result?.error,
      });

      return res.status(
        response.status >= 500 ? 502 : response.status
      ).json({
        error:
          typeof result?.error === "string"
            ? result.error
            : "The AI advisor could not answer right now.",
      });
    }

    const answer =
      typeof result?.answer === "string"
        ? result.answer.trim()
        : "";

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned an empty answer.",
      });
    }

    return res.status(200).json({
      answer: answer.slice(0, 8000),
    });
  } catch (error) {
    console.error(
      "Dukaan Dost request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return res.status(502).json({
      error: "The AI advisor is temporarily unavailable.",
    });
  }
}
