function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name];
}

const requestWindows = new Map<string, { count: number; start: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_MINUTE = 20;
const MAX_TRANSCRIPT_LENGTH = 1600;

const ALLOWED_SHOP_TYPES = new Set([
  'kirana', 'medical', 'bakery', 'sweet', 'tailor', 'salon',
  'hardware', 'mobile', 'vegetable', 'tea', 'restaurant', 'other',
]);

function getClientAddress(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (
    (typeof raw === 'string' ? raw.split(',')[0].trim() : '') ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isRateLimited(address: string): boolean {
  const now = Date.now();
  const existing = requestWindows.get(address);
  if (!existing || now - existing.start >= WINDOW_MS) {
    requestWindows.set(address, { count: 1, start: now });
    return false;
  }
  existing.count++;
  return existing.count > MAX_REQUESTS_PER_MINUTE;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (isRateLimited(getClientAddress(req))) {
    return res.status(429).json({ error: 'Too many voice requests. Please wait a minute.' });
  }

  const body = typeof req.body === 'string'
    ? (() => { try { return JSON.parse(req.body); } catch { return null; } })()
    : req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid JSON request.' });
  }

  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';
  if (!transcript || transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return res.status(400).json({ error: 'Enter a voice transcript of up to 1,600 characters.' });
  }

  const requestedShopType = typeof body.shopType === 'string' && body.shopType.trim()
    ? body.shopType.trim()
    : 'other';
  if (!ALLOWED_SHOP_TYPES.has(requestedShopType)) {
    return res.status(400).json({ error: 'Unknown shop type.' });
  }

  const candidates = Array.isArray(body.candidates)
    ? body.candidates
      .filter((value: unknown) => typeof value === 'string' && value.trim())
      .slice(0, 5)
      .map((value: string) => value.trim().slice(0, MAX_TRANSCRIPT_LENGTH))
    : [];
  const language = body.language === 'hi' ? 'hi' : 'en';

  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Voice proxy configuration is incomplete.');
    return res.status(503).json({ error: 'The voice interpretation service is not configured.' });
  }

  const endpoint = supabaseUrl.replace(/\/+$/, '') + '/functions/v1/parse-voice-entry';
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + supabaseAnonKey,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        transcript,
        candidates,
        shopType: requestedShopType,
        language,
      }),
    });

    const data = await upstream.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      console.error('Voice interpreter returned a non-JSON response.');
      return res.status(502).json({ error: 'The voice interpretation service returned an invalid response.' });
    }
    return res.status(upstream.status).json(data);
  } catch {
    console.error('Voice interpreter could not be reached.');
    return res.status(502).json({ error: 'The voice interpretation service is temporarily unavailable.' });
  }
}
