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
    return res.st¶»§q«^uÉÉ½È¥¹ÍÑ…¹•½˜ÉÉ½È€ü•ÉÉ½È¹µ•ÍÍ…”€è€U¹­¹½İ¸•ÉÉ½Èœ°(€€€€¤ì(€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÔÀÈ¤¹©Í½¸¡ì(€€€€€•ÉÉ½Èè€$Ù½¥”¥¹Ñ•ÉÁÉ•Ñ…Ñ¥½¸¥ÌÑ•µÁ½É…É¥±äÕ¹…Ù…¥±…‰±”¸9½Ñ¡¥¹œİ…Ì…‘‘•¸œ°(€€€ô¤ì(€ô)ô(