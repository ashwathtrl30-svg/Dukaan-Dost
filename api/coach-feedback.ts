import { createClient } from '@supabase/supabase-js';
import { buildCoachFeedbackPrompt, validateCoachSessionFeedback } from '../src/coach/coachFeedback.js';
import type { CoachSessionFeedback } from '../src/coach/coachFeedback.js';
import type { CoachTranscriptMessage } from '../src/coach/coachSimulation.js';

function env(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.[name];
}
function send(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}
function token(req: any): string | null {
  const raw = req.headers?.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (typeof header !== 'string') return null;
  return /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(header.trim())?.[1] ?? null;
}
function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function bodyOf(req: any): Record<string, unknown> | null {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return body && typeof body === 'object' && !Array.isArray(body) && JSON.stringify(body).length <= 2000 ? body : null;
  } catch { return null; }
}
function cleanTranscriptText(value: unknown): string {
  if (typeof value !== 'string') return '[message removed]';
  const text = value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 && text.length <= 4000 ? text : '[message removed]';
}
function redactPrivateDetails(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
    .replace(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/g, '[phone number removed]')
    .replace(/\b[\w.-]{2,}@(upi|okaxis|okhdfcbank|oksbi|ybl|paytm)\b/gi, '[payment ID removed]')
    .replace(/\b(?:otp|one[- ]time password|verification code)\s*[:=-]?\s*\d{4,8}\b/gi, '[code removed]');
}
const rateLimits = new Map<string, { start: number; count: number }>();
function limited(userId: string): boolean {
  const now = Date.now();
  const current = rateLimits.get(userId);
  if (!current || now - current.start >= 60000) {
    rateLimits.set(userId, { start: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > 8;
}
async function getSaved(client: any, userId: string, sessionId: string) {
  const { data, error } = await client.from('coach_assessments')
    .select('assessment_data, created_at')
    .eq('user_id', userId).eq('session_id', sessionId)
    .eq('assessment_type', 'session_feedback')
    .eq('assessment_key', 'session-feedback:' + sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const record = data.assessment_data;
  const validated = validateCoachSessionFeedback(record && typeof record === 'object' ? record.feedback : null);
  if (validated.ok === false) throw new Error('Saved Coach feedback could not be validated.');
  return { feedback: validated.value, createdAt: data.created_at, reused: true };
}
async function generateFeedback(apiKey: string, language: 'en' | 'hi', shopType: string | null, transcript: readonly CoachTranscriptMessage[]): Promise<CoachSessionFeedback> {
  const prompt = buildCoachFeedbackPrompt(language, shopType, transcript);
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Generate fair evidence-based post-practice feedback. Use exactly the required JSON fields. Never provide ratings, personal judgements or identifying details.' }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 750, responseMimeType: 'application/json' },
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Feedback generation failed.');
  const parts = result?.candidates?.[0]?.content?.parts;
  const output = Array.isArray(parts) ? parts.map((part: { text?: string }) => typeof part.text === 'string' ? part.text : '').join('').trim() : '';
  if (!output) throw new Error('Feedback generation returned no content.');
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error('Feedback generation returned invalid JSON.'); }
  const validated = validateCoachSessionFeedback(parsed);
  if (validated.ok === false) throw new Error('Feedback did not meet its quality and privacy contract.');
  return validated.value;
}

async function createFeedback(client: any, userId: string, apiKey: string, session: any, res: any) {
  const saved = await getSaved(client, userId, session.id);
  if (saved) return send(res, 200, { sessionId: session.id, ...saved });

  const { data, error } = await client.from('coach_messages')
    .select('message_index, speaker, content')
    .eq('session_id', session.id).eq('user_id', userId)
    .order('message_index', { ascending: true });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length < 2 || rows.length > 24) return send(res, 409, { error: 'The completed conversation transcript is not available for feedback.' });

  const transcript: CoachTranscriptMessage[] = rows
    .filter((row: any) => row.speaker === 'customer' || row.speaker === 'shopkeeper')
    .map((row: any) => ({
      speaker: row.speaker as 'customer' | 'shopkeeper',
      content: redactPrivateDetails(cleanTranscriptText(row.content)),
    }));
  if (!transcript.some((item) => item.speaker === 'customer') || !transcript.some((item) => item.speaker === 'shopkeeper')) {
    return send(res, 409, { error: 'The completed conversation does not contain enough dialogue for feedback.' });
  }
  if (transcript.reduce((sum, item) => sum + item.content.length, 0) > 12000) {
    return send(res, 413, { error: 'This conversation is too long to review safely.' });
  }

  // Notice that session.outcome is never read or supplied to the feedback model.
  const feedback = await generateFeedback(apiKey, session.language === 'hi' ? 'hi' : 'en', session.shop_type, transcript);
  const createdAt = new Date().toISOString();
  const inserted = await client.from('coach_assessments').insert({
    user_id: userId,
    workspace_id: session.workspace_id,
    session_id: session.id,
    assessment_type: 'session_feedback',
    assessment_key: 'session-feedback:' + session.id,
    milestone_number: null,
    assessment_data: { version: 1, feedback, source: 'completed_transcript', generatedAt: createdAt },
  }).select('created_at').single();

  if (inserted.error) {
    if (inserted.error.code === '23505') {
      const raced = await getSaved(client, userId, session.id);
      if (raced) return send(res, 200, { sessionId: session.id, ...raced });
    }
    throw inserted.error;
  }
  return send(res, 200, { sessionId: session.id, feedback, createdAt: inserted.data?.created_at ?? createdAt, reused: false });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed.' });
  }
  const body = bodyOf(req);
  if (!body || !validId(body.sessionId)) return send(res, 400, { error: 'A valid completed practice session is required.' });

  const url = env('SUPABASE_URL');
  const anon = env('SUPABASE_ANON_KEY');
  const gemini = env('GEMINI_API_KEY');
  if (!url || !anon || !gemini) {
    return send(res, 503, { error: 'Feedback is unavailable in this isolated preview until its Coach backend is configured.', code: 'COACH_FEEDBACK_NOT_CONFIGURED' });
  }
  const accessToken = token(req);
  if (!accessToken) return send(res, 401, { error: 'Sign in before requesting private Coach feedback.' });

  try {
    const client = createClient(url.replace(/\/$/, ''), anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: 'Bearer ' + accessToken } },
    });
    const auth = await client.auth.getUser(accessToken);
    if (auth.error || !auth.data.user) return send(res, 401, { error: 'Your sign-in session has expired.' });
    const userId = auth.data.user.id;
    if (limited(userId)) return send(res, 429, { error: 'Too many feedback requests. Please wait a minute.' });

    const result = await client.from('coach_sessions')
      .select('id, workspace_id, shop_type, language, status')
      .eq('id', body.sessionId).eq('user_id', userId).maybeSingle();
    if (result.error) throw result.error;
    const session = result.data;
    if (!session) return send(res, 404, { error: 'This practice session was not found for your account.' });
    if (session.status !== 'completed') {
      return send(res, 409, { error: session.status === 'abandoned'
        ? 'An abandoned practice does not receive completed-session feedback.'
        : 'Complete the customer conversation before requesting feedback.' });
    }
    return await createFeedback(client, userId, gemini, session, res);
  } catch (error) {
    console.error('Coach feedback request failed.', error instanceof Error ? error.message : 'Unknown error');
    return send(res, 502, { error: 'The Coach feedback service is temporarily unavailable. Please try again.' });
  }
}
