import { createClient } from '@supabase/supabase-js';
import {
  applyCoachSimulationTransition,
  buildCoachSimulationOpeningPrompt,
  buildCoachSimulationReplyPrompt,
  buildCoachSimulationSystemPrompt,
  countCoachShopkeeperTurns,
  selectCoachSimulationPlan,
  validateCoachGeneratedTurn,
} from '../src/coach/coachSimulation.js';
import type { CoachTranscriptMessage } from '../src/coach/coachSimulation.js';

function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.[name];
}

function send(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function getToken(req: any): string | null {
  const raw = req.headers && req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

function parseBody(req: any): Record<string, unknown> | null {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    if (JSON.stringify(body).length > 12000) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

function safeMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  return text.length > 0 && text.length <= 4000 ? text : null;
}

function getArchetype(code: string): string | null {
  const allowed = ['bargainer', 'price-comparer', 'quality-conscious', 'brand-conscious',
    'guidance-seeking', 'hesitant', 'loyal-regular', 'urgent', 'impulse', 'dissatisfied'];
  return allowed.find((value) =>
    code.includes('_' + value + '_focus-') || code.endsWith('_' + value)
  ) ?? null;
}

function getSessionNumber(code: string): number {
  const match = /^ddsc1_(\d{2,})_/.exec(code);
  return match ? Number(match[1]) : 0;
}

function mapTranscript(rows: Array<{ speaker: string; content: string }>): CoachTranscriptMessage[] {
  return rows
    .filter((row) => row.speaker === 'customer' || row.speaker === 'shopkeeper')
    .map((row) => ({ speaker: row.speaker as 'customer' | 'shopkeeper', content: row.content }));
}

const rateWindows = new Map<string, { started: number; count: number }>();
function isLimited(userId: string): boolean {
  const now = Date.now();
  const current = rateWindows.get(userId);
  if (!current || now - current.started >= 60000) {
    rateWindows.set(userId, { started: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > 18;
}

async function generateCustomer(
  apiKey: string,
  plan: ReturnType<typeof selectCoachSimulationPlan>,
  prompt: string,
) {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildCoachSimulationSystemPrompt(plan) }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.88, maxOutputTokens: 450, responseMimeType: 'application/json' },
      }),
    },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Customer generation failed.');
  const parts = result && result.candidates && result.candidates[0] &&
    result.candidates[0].content && result.candidates[0].content.parts;
  const text = Array.isArray(parts)
    ? parts.map((part: { text?: string }) => typeof part.text === 'string' ? part.text : '').join('').trim()
    : '';
  if (!text) throw new Error('The customer response was empty.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The customer response was not valid JSON.');
  }
  const validated = validateCoachGeneratedTurn(parsed);
  if (!validated.ok) throw new Error('The customer response failed validation.');
  return validated.value;
}

async function startSession(client: any, userId: string, apiKey: string, res: any) {
  const profileResult = await client.from('coach_profiles')
    .select('user_id, workspace_id, preferred_language, baseline_completed_at')
    .eq('user_id', userId).maybeSingle();
  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data;
  if (!profile || !profile.workspace_id || !profile.baseline_completed_at) {
    return send(res, 409, { error: 'Complete your three starting questions before beginning a customer practice.' });
  }

  const baseline = await client.from('coach_assessments')
    .select('id, assessment_data').eq('user_id', userId)
    .eq('assessment_key', 'baseline-v1')
    .eq('assessment_type', 'baseline').maybeSingle();
  if (baseline.error) throw baseline.error;
  if (!baseline.data) return send(res, 409, { error: 'Your saved starting assessment could not be found.' });

  const baselineData = baseline.data.assessment_data;
  const baselineSignalIds = baselineData && baselineData.initialObservation && Array.isArray(baselineData.initialObservation.signalIds)
    ? baselineData.initialObservation.signalIds.filter((value: unknown) => typeof value === 'string')
    : [];

  const active = await client.from('coach_sessions')
    .select('id').eq('user_id', userId)
    .eq('status', 'in_progress').limit(1);
  if (active.error) throw active.error;
  if (active.data && active.data.length) {
    return send(res, 409, {
      error: 'You have an unfinished practice. Resume it rather than starting another.',
      code: 'COACH_SESSION_EXISTS',
    });
  }

  const results = await Promise.all([
    client.from('coach_workspaces').select('id, shop_type, city')
      .eq('id', profile.workspace_id).single(),
    client.from('coach_sessions').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),
    client.from('coach_sessions').select('scenario_code')
      .eq('user_id', userId).eq('status', 'completed')
      .order('started_at', { ascending: false }).limit(10),
    client.from('coach_learning_profiles').select('learning_state')
      .eq('user_id', userId).maybeSingle(),
  ]);
  for (const result of results) if (result.error) throw result.error;

  const workspace = results[0].data;
  const completedCount = results[1].count || 0;
  const recentRows = results[2].data || [];
  const learning = results[3].data ? results[3].data.learning_state : null;
  const recentPatternIds = recentRows
    .map((row: { scenario_code: string }) => getArchetype(row.scenario_code))
    .filter((value: string | null): value is string => value !== null)
    .reverse(); // Query is newest-first; selection rotates against the two most recent patterns.

  const plan = selectCoachSimulationPlan({
    completedSessions: completedCount,
    shopType: workspace.shop_type,
    city: workspace.city,
    language: profile.preferred_language === 'hi' ? 'hi' : 'en',
    focusAreas: learning && Array.isArray(learning.focusAreas) ? learning.focusAreas : [],
    dimensionSignals: learning && learning.dimensionSignals && typeof learning.dimensionSignals === 'object'
      ? learning.dimensionSignals : {},
    teachingAdjustment: learning && typeof learning === 'object' ? learning.teachingAdjustment ?? null : null,
    recentPatternIds,
    baselineSignalIds,
  });
  const opening = await generateCustomer(apiKey, plan, buildCoachSimulationOpeningPrompt(plan));
  if (opening.status !== 'continue' || opening.outcome !== null) {
    throw new Error('The initial customer message had an invalid status.');
  }

  const created = await client.from('coach_sessions').insert({
    user_id: userId,
    workspace_id: profile.workspace_id,
    scenario_code: plan.scenarioCode,
    shop_type: workspace.shop_type,
    language: profile.preferred_language === 'hi' ? 'hi' : 'en',
    status: 'in_progress',
    outcome: null,
  }).select('id').single();
  if (created.error) throw created.error;

  const firstMessage = await client.from('coach_messages').insert({
    session_id: created.data.id,
    user_id: userId,
    message_index: 0,
    speaker: 'customer',
    content: opening.nextMessage,
  });
  if (firstMessage.error) {
    await client.from('coach_sessions').update({
      status: 'abandoned',
      outcome: 'unclear',
      completed_at: new Date().toISOString(),
    }).eq('id', created.data.id).eq('user_id', userId);
    throw firstMessage.error;
  }

  return send(res, 200, {
    sessionId: created.data.id,
    customerMessage: opening.nextMessage,
    status: 'continue',
    outcome: null,
    shopkeeperTurns: 0,
  });
}

async function resumeSession(client: any, userId: string, res: any) {
  const active = await client.from('coach_sessions')
    .select('id, status, outcome')
    .eq('user_id', userId).eq('status', 'in_progress')
    .order('started_at', { ascending: false }).limit(1);
  if (active.error) throw active.error;
  if (!active.data || !active.data.length) {
    return send(res, 404, { error: 'There is no unfinished customer practice to resume.' });
  }
  const session = active.data[0];
  const messages = await client.from('coach_messages')
    .select('message_index, speaker, content')
    .eq('session_id', session.id).eq('user_id', userId)
    .order('message_index', { ascending: true });
  if (messages.error) throw messages.error;
  const transcript = mapTranscript(messages.data || []);
  return send(res, 200, {
    sessionId: session.id,
    conversation: transcript,
    status: session.status,
    outcome: session.outcome,
    shopkeeperTurns: countCoachShopkeeperTurns(transcript),
  });
}

async function abandonSession(client: any, userId: string, id: string, res: any) {
  const abandoned = await client.from('coach_sessions').update({
    status: 'abandoned',
    outcome: 'unclear',
    completed_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', userId).eq('status', 'in_progress')
    .select('id').maybeSingle();
  if (abandoned.error) throw abandoned.error;
  if (!abandoned.data) return send(res, 409, { error: 'This practice has already been closed.' });
  return send(res, 200, {
    sessionId: id,
    status: 'abandoned',
    outcome: 'unclear',
    feedbackAvailable: false,
  });
}

async function replyToCustomer(
  client: any,
  userId: string,
  id: string,
  shopkeeperText: string,
  apiKey: string,
  res: any,
) {
  const sessionResult = await client.from('coach_sessions')
    .select('id, shop_type, language, scenario_code, status, outcome')
    .eq('id', id).eq('user_id', userId).maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  const session = sessionResult.data;
  if (!session) return send(res, 404, { error: 'This practice session was not found for your account.' });

  const rowsResult = await client.from('coach_messages')
    .select('message_index, speaker, content')
    .eq('session_id', id).eq('user_id', userId)
    .order('message_index', { ascending: true });
  if (rowsResult.error) throw rowsResult.error;
  const rows = rowsResult.data || [];
  const transcript = mapTranscript(rows);

  if (session.status === 'completed') {
    const lastCustomer = transcript.filter((item) => item.speaker === 'customer').pop();
    return send(res, 200, {
      sessionId: id,
      status: 'completed',
      outcome: session.outcome || 'unclear',
      customerMessage: lastCustomer ? lastCustomer.content : 'This practice has ended.',
      shopkeeperTurns: countCoachShopkeeperTurns(transcript),
    });
  }
  if (session.status !== 'in_progress') {
    return send(res, 409, { error: 'This practice was abandoned and cannot be continued.' });
  }

  const last = rows.length ? rows[rows.length - 1] : null;
  if (!last) return send(res, 409, { error: 'The practice transcript is empty.' });
  let updatedTranscript = transcript;

  if (last.speaker === 'customer') {
    if (rows.length >= 2 && rows[rows.length - 2].speaker === 'shopkeeper' &&
      rows[rows.length - 2].content === shopkeeperText) {
      const lastCustomer = transcript.filter((item) => item.speaker === 'customer').pop();
      return send(res, 200, {
        sessionId: id, status: 'continue', outcome: null,
        customerMessage: lastCustomer ? lastCustomer.content : '',
        shopkeeperTurns: countCoachShopkeeperTurns(transcript),
      });
    }
    if (countCoachShopkeeperTurns(transcript) >= 8) {
      return send(res, 409, { error: 'This practice has reached its eight-reply limit.' });
    }
    const inserted = await client.from('coach_messages').insert({
      session_id: id,
      user_id: userId,
      message_index: last.message_index + 1,
      speaker: 'shopkeeper',
      content: shopkeeperText,
    });
    if (inserted.error) throw inserted.error;
    updatedTranscript = transcript.concat([{ speaker: 'shopkeeper', content: shopkeeperText }]);
  } else if (last.speaker !== 'shopkeeper' || last.content !== shopkeeperText) {
    return send(res, 409, { error: 'The conversation is out of sequence. Resume the practice and try again.' });
  }

  const archetype = getArchetype(session.scenario_code);
  const number = getSessionNumber(session.scenario_code);
  if (!archetype || !number) throw new Error('The stored customer scenario is invalid.');
  const profileResults = await Promise.all([
    client.from('coach_learning_profiles').select('learning_state').eq('user_id', userId).maybeSingle(),
    client.from('coach_assessments').select('assessment_data').eq('user_id', userId)
      .eq('assessment_key', 'baseline-v1').eq('assessment_type', 'baseline').maybeSingle(),
  ]);
  if (profileResults[0].error) throw profileResults[0].error;
  if (profileResults[1].error) throw profileResults[1].error;
  const learning = profileResults[0].data ? profileResults[0].data.learning_state : null;
  const baselineData = profileResults[1].data ? profileResults[1].data.assessment_data : null;
  const baselineSignalIds = baselineData && baselineData.initialObservation && Array.isArray(baselineData.initialObservation.signalIds)
    ? baselineData.initialObservation.signalIds.filter((value: unknown) => typeof value === 'string')
    : [];

  const plan = selectCoachSimulationPlan({
    completedSessions: number - 1,
    shopType: session.shop_type,
    language: session.language === 'hi' ? 'hi' : 'en',
    focusAreas: learning && Array.isArray(learning.focusAreas) ? learning.focusAreas : [],
    dimensionSignals: learning && learning.dimensionSignals && typeof learning.dimensionSignals === 'object'
      ? learning.dimensionSignals : {},
    teachingAdjustment: learning && typeof learning === 'object' ? learning.teachingAdjustment ?? null : null,
    archetypeOverride: archetype as any,
    baselineSignalIds,
  });
  const generated = await generateCustomer(
    apiKey,
    plan,
    buildCoachSimulationReplyPrompt(plan, updatedTranscript, shopkeeperText),
  );
  const transition = applyCoachSimulationTransition(updatedTranscript, generated);
  const previousIndex = rows[rows.length - 1].message_index;
  const nextIndex = previousIndex + (last.speaker === 'shopkeeper' ? 1 : 2);

  const customerMessage = await client.from('coach_messages').insert({
    session_id: id,
    user_id: userId,
    message_index: nextIndex,
    speaker: 'customer',
    content: transition.nextMessage,
  });
  if (customerMessage.error) throw customerMessage.error;

  if (transition.status === 'completed') {
    const completed = await client.from('coach_sessions').update({
      status: 'completed',
      outcome: transition.outcome || 'unclear',
      completed_at: new Date().toISOString(),
    }).eq('id', id).eq('user_id', userId).eq('status', 'in_progress')
      .select('id').maybeSingle();
    if (completed.error) throw completed.error;
    if (!completed.data) throw new Error('The completed practice status could not be saved.');
  }

  return send(res, 200, {
    sessionId: id,
    customerMessage: transition.nextMessage,
    status: transition.status,
    outcome: transition.outcome,
    shopkeeperTurns: countCoachShopkeeperTurns(updatedTranscript),
    reachedTurnLimit: transition.reachedTurnLimit,
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed.' });
  }
  const body = parseBody(req);
  if (!body) return send(res, 400, { error: 'The request body is invalid or too large.' });
  const action = body.action;
  if (action !== 'start' && action !== 'resume' && action !== 'reply' && action !== 'abandon') {
    return send(res, 400, { error: 'A valid Coach action is required.' });
  }

  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  const geminiKey = getEnv('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !geminiKey) {
    return send(res, 503, {
      error: 'Live customer practice is disabled in this isolated development preview.',
      code: 'COACH_SIMULATION_NOT_CONFIGURED',
    });
  }
  const token = getToken(req);
  if (!token) return send(res, 401, { error: 'Sign in before starting a private Coach practice.' });

  try {
    const client = createClient(supabaseUrl.replace(/\/$/, ''), anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: 'Bearer ' + token } },
    });
    const auth = await client.auth.getUser(token);
    if (auth.error || !auth.data.user) {
      return send(res, 401, { error: 'Your sign-in session has expired.' });
    }
    const userId = auth.data.user.id;
    if (isLimited(userId)) {
      return send(res, 429, { error: 'Too many practice actions. Please wait a minute.' });
    }
    if (action === 'start') return await startSession(client, userId, geminiKey, res);
    if (action === 'resume') return await resumeSession(client, userId, res);

    const id = typeof body.sessionId === 'string' ? body.sessionId : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return send(res, 400, { error: 'A valid practice session is required.' });
    if (action === 'abandon') return await abandonSession(client, userId, id, res);
    const text = safeMessage(body.message);
    if (!text) return send(res, 400, { error: 'Write a message of up to 4,000 characters.' });
    return await replyToCustomer(client, userId, id, text, geminiKey, res);
  } catch (error) {
    console.error('Coach customer request failed.', error instanceof Error ? error.message : 'Unknown error');
    return send(res, 502, { error: 'The Coach customer service is temporarily unavailable.' });
  }
}
