export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }

  let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  while (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Supabase keep-alive configuration is missing.");
    return res.status(503).json({ ok: false, error: "Health check is not configured." });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/dukaan_dost_health_check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: "{}",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      console.error("Supabase keep-alive failed with HTTP status:", response.status);
      return res.status(502).json({ ok: false, error: "Supabase health check failed." });
    }

    const result = await response.json().catch(() => null);
    if (result !== true) {
      console.error("Supabase keep-alive returned an unexpected result.");
      return res.status(502).json({ ok: false, error: "Supabase health check failed." });
    }

    return res.status(200).json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Supabase keep-alive request failed:", error instanceof Error ? error.message : "Unknown error.");
    return res.status(502).json({ ok: false, error: "Supabase health check failed." });
  }
}
