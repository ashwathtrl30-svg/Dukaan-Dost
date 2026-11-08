import { createClient } from '@supabase/supabase-js';
import {
  buildCoachMilestonePrompt,
  validateCoachMilestoneReview,
} from '../src/coach/coachLearning.js';
import type {
  CoachLearningTranscriptMessage,
  CoachMilestoneReview,
  CoachMilestoneSessionInput,
} from '../src/coach/coachLearning.js';

const MILESTONE_NUMBER = 10;

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
function bodyOf(req: any): Record<string, unknown> | null {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return body && typeof body === 'object' && !Array.isArray(body) &&
      JSON.stringify(body).length <= 1000 ? body : null;
  } catch {
    return null;
  }
}
function redact(value: unknown): string {
  if (typeof value !== 'string') return '[message unavailable]';
  return value.normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
    .replace(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/g, '[phone number removed]')
    .replace(/\b[\w.-]{2,}@(upi|okaxis|okhdfcbank|oksbi|ybl|paytm)\b/gi, '[payment ID removed]')
    .replace(/\b(?:otp|one[- ]time password|verification code)\s*[:=-]?\s*\d{4,8}\b/gi, '[code removed]')
    .slice(0, 4000);
}
const rateLimits = new Map<string, { start: number; count: number }>();
function limited(userId: string): boolean {
  const now = Date.now();
  const previous = rateLimits.get(userId);
  if (!previous || now - previous.start >= 60000) {
    rateLimits.set(userId, { start: now, count: 1 });
    return false;
  }
  previous.count += 1;
  return previous.count > 6;
}

async function getCompletedCount(client: any, userId: string): Promise<number> {
  const result = await client.from('coach_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'completed');
  if (result.error) throw result.error;
  return result.count ?? 0;
}

async function getSavedReview(
  client: any,
  userId: string,
  sessions: readonly CoachMilestoneSessionInput[],
) {
  const result = await client.from('coach_assessments')
    .select('assessment_data, created_at')
    .eq('user_id', userId)
    .eq('assessment_type', 'milestone_review')
    .eq('assessment_key', 'milestone:10')
    .eq('milestone_number', MILESTONE_NUMBER)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const row = result.data.assessment_data;
  const validated = validateCoachMilestoneReview(
    row && typeof row === 'object' ? row.review : null,
    sessions,
  );
  if (!validated.ok) throw new Error('The saved first-ten review could not be verified against its original conversations.');
  return {
    review: validated.value,
    createdAt: result.data.created_at,
    reused: true,
  };
}

async function loadFirstTenSessions(client: any, userId: string): Promise<{
  sessions: CoachMilestoneSessionInput[];
  workspaceId: string;
}> {
  const result = await client.from('coach_sessions')
    .select('id, workspace_id, shop_type, language, completed_at')
    .eq('user_id', userId).eq('status', 'completed')
    .order('completed_at', { ascending: true })
    .order('started_at', { ascending: true })
    .limit(MILESTONE_NUMBER);
  if (result.error) throw result.error;
  const rows = Array.isArray(result.data) ? result.data : [];
  if (rows.length < MILESTONE_NUMBER) {
    throw new Error('The first-ten practice review is not available yet.');
  }

  const ids = rows.map((row: any) => row.id);
  const messagesResult = await client.from('coach_messages')
    .select('session_id, message_index, speaker, content')
    .eq('user_id', userId).in('session_id', ids)
    .order('message_index', { ascending: true });
  if (messagesResult.error) throw messagesResult.error;

  const grouped = new Map<string, CoachLearningTranscriptMessage[]>();
  for (const row of (messagesResult.data || []) as any[]) {
    if (row.speaker !== 'customer' && row.speaker !== 'shopkeeper') continue;
    const current = grouped.get(row.session_id) ?? [];
    current.push({ speaker: row.speaker, content: redact(row.content) });
    grouped.set(row.session_id, current);
  }

  const sessions: CoachMilestoneSessionInput[] = rows.map((row: any, index: number) => ({
    practiceNumber: index + 1,
    shopType: typeof row.shop_type === 'string' ? row.shop_type : null,
    language: row.language === 'hi' ? 'hi' : 'en',
    messages: grouped.get(row.id) ?? [],
  }));
  if (sessions.some((session) =>
    !session.messages.some((item) => item.speaker === 'customer') ||
    !session.messages.some((item) => item.speaker === 'shopkeeper')
  )) {
    throw new Error('One or more of the first ten conversations cannot be reviewed because its transcript is incomplete.');
  }
  return { sessions, workspaceId: rows[0].workspace_id };
}

async function generateReview(apiKey: string, sessions: readonly CoachMilestoneSessionInput[]): Promise<CoachMilestoneReview> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: 'Prepare a balanced, transcript-grounded first-ten-practices review. Do not use outcomes, scores, unsupported claims or personal judgements. Return only the required JSON fields.' }],
      },
      contents: [{ role: 'user', parts: [{ text: buildCoachMilestonePrompt(sessions) }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 1200, responseMimeType: 'application/json' },
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Milestone review generation failed.');
  const parts = result?.candidates?.[0]?.content?.parts;
  const output = Array.isArray(parts)
    ? parts.map((part: { text?: string }) => typeof part.text === 'string' ? part.text : '').join('').trim()
    : '';
  if (!output) throw new Error('Milestone review generation returned no content.');
  let parsed: unknown;
  try { parsed = JSON.parse(output); }
  catch { throw new Error('Milestone review generation returned invalid JSON.'); }
  const validated = validateCoachMilestoneReview(parsed, sessions);
  if (!validated.ok) throw new Error('Milestone review failed its evidence and privacy checks.');
  return validated.value;
}

async function handleProgress(client: any, userId: string, res: any) {
  const completedSessions = await getCompletedCount(client, userId);
  let reviewExists = false;
  if (completedSessions >= MILESTONE_NUMBER) {
    const result = await client.from('coach_assessments')
      .select('id')
      .eq('user_id', userId)
      .eq('assessment_type', 'milestone_review')
      .eq('assessment_key', 'milestone:10')
      .eq('milestone_number', MILESTONE_NUMBER)
      .maybeSingle();
    if (result.error) throw result.error;
    reviewExists = Boolean(result.data?.id);
  }
  return send(res, 200, {
    completedSessions,
    milestoneNumber: MILESTONE_NUMBER,
    milestoneReady: completedSessions >= MILESTONE_NUMBER,
    reviewExists,
  });
}

async function handleReview(client: any, userId: string, apiKey: string | undefined, res: any) {
  const completedSessions = await getCompletedCount(client, userId);
  if (completedSessions < MILESTONE_NUMBER) {
    return send(res, 409, {
      error: 'Complete ten customer practices before requesting the first-ten review.',
      completedSessions,
      requiredSessions: MILESTONE_NUMBER,
    });
  }
  const { sessions, workspaceId } = await loadFirstTenSessions(client, userId);
  const saved = await getSavedReview(client, userId, sessions);
  if (saved) {
    return send(res, 200, {
      milestoneNumber: MILESTONE_NUMBER,
      ...saved,
    });
  }
  if (!apiKey) {
    return send(res, 503, {
      error: 'The first-ten review is unavailable until the isolated Coach AI service is configured.',
      code: 'COACH_MILESTONE_AI_NOT_CONFIGURED',
    });
  }

  const review = await generateReview(apiKey, sessions);
  const createdAt = new Date().toISOString();
  const inserted = await client.from('coach_assessments').insert({
    user_id: userId,
    workspace_id: workspaceId,
    session_id: null,
    assessment_type: 'milestone_review',
    assessment_key: 'milestone:10',
    milestone_number: MILESTONE_NUMBER,
    assessment_data: {
      version: 1,
      review,
      source: 'first_ten_completed_transcripts',
      generatedAt: createdAt,
    },
  }).select('created_at').single();

  if (inserted.error) {
    if (inserted.error.code === '23505') {
      const raced = await getSavedReview(client, userId, sessions);
      if (raced) return send(res, 200, { milestoneNumber: MILESTONE_NUMBER, ...raced });
    }
    throw inserted.error;
  }
  return send(res, 200, {
    milestoneNumber: MILESTONE_NUMBER,
    review,
    createdAt: inserted.data?.created_at ?? createdAt,
    reused: false,
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed.' });
  }
  const body = bodyOf(req);
  if (!body || (body.action !== 'progress' && body.action !== 'review')) {
    return send(res, 400, { error: 'A valid milestone action is required.' });
  }

  const url = env('SUPABASE_URL');
  const anon = env('SUPABASE_ANON_KEY');
  const gemini = env('GEMINI_API_KEY');
  if (!url || !anon) {
    return send(res, 503, {
      error: 'Milestone progress is unavailable in this isolated preview until its private Coach database is configured.',
      code: 'COACH_MILESTONE_NOT_CONFIGURED',
    });
  }
  const accessToken = token(req);
  if (!accessToken) return send(res, 401, { error: 'Sign in before accessing your private Coach progress.' });

  try {
    const client = createClient(url.replace(/\/$/, ''), anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: 'Bearer ' + accessToken } },
    });
    const auth = await client.auth.getUser(accessToken);
    if (auth.error || !auth.data.user) return send(res, 401, { error: 'Your sign-in session has expired.' });
    const userId = auth.data.user.id;
    if (limited(userId)) return send(res, 429, { error: 'Too many Coach progress requests. Please wait a minute.' });

    if (body.action === 'progress') return await handleProgress(client, userId, res);
    return await handleReview(client, userId, gemini, res);
  } catch (error) {
    console.error('Coach milestone request failed.', error instanceof Error ? error.message : 'Unknown error');
    return send(res, 502, { error: 'The first-ten Coach review is temporarily unavailable. Please try again.' });
  }
}
