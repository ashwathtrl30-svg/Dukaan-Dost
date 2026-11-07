import { supabase } from '../supabaseClient';
import {
  normalizeAssessmentData,
  normalizeBaselineAnswers,
  normalizeCoachText,
} from './coachData';
import type {
  CoachAssessmentRecord,
  CoachBaselineAnswer,
  CoachLanguage,
  CoachLearningProfileRecord,
  CoachLearningState,
  CoachMessageRecord,
  CoachProfileDraft,
  CoachProfileRecord,
  CoachSessionOutcome,
  CoachSessionRecord,
  CreateCoachSessionInput,
  NewCoachMessage,
} from './types';

const coachCloudEnabled = import.meta.env.VITE_COACH_CLOUD_ENABLED === 'true';

function requireCoachClient() {
  if (!coachCloudEnabled || !supabase) {
    throw new Error('Coach cloud storage is disabled until an isolated Coach database is configured.');
  }
  return supabase;
}

async function requireCurrentUserId(): Promise<string> {
  const client = requireCoachClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error('Sign in to Dukaan Dost before saving Coach progress.');
  return data.user.id;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: string }).code === '23505';
}

async function getOrCreateWorkspace(userId: string): Promise<string> {
  const client = requireCoachClient();

  // A staff account uses its active workspace membership. Owners use the
  // workspace whose owner_user_id is their own verified Auth identity.
  const { data: membership, error: membershipError } = await client
    .from('coach_workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (membership?.workspace_id) return membership.workspace_id as string;

  const { data: ownedWorkspace, error: ownedError } = await client
    .from('coach_workspaces')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (ownedError) throw ownedError;
  if (ownedWorkspace?.id) return ownedWorkspace.id as string;

  const { data: createdWorkspace, error: createError } = await client
    .from('coach_workspaces')
    .insert({ owner_user_id: userId })
    .select('id')
    .single();

  if (!createError && createdWorkspace?.id) return createdWorkspace.id as string;
  if (!isUniqueViolation(createError)) throw createError ?? new Error('Could not create the Coach workspace.');

  // A second device may have created this owner workspace at the same time.
  const { data: racedWorkspace, error: racedReadError } = await client
    .from('coach_workspaces')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (racedReadError) throw racedReadError;
  if (!racedWorkspace?.id) throw new Error('The Coach workspace was created elsewhere but could not be loaded.');
  return racedWorkspace.id as string;
}

async function readCoachProfile(userId: string): Promise<CoachProfileRecord | null> {
  const client = requireCoachClient();
  const { data, error } = await client
    .from('coach_profiles')
    .select('user_id, workspace_id, shop_type, city, preferred_language, baseline_completed_at, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as CoachProfileRecord | null;
}

export async function loadOrCreateCoachProfile(
  draft: CoachProfileDraft = {},
): Promise<CoachProfileRecord> {
  const client = requireCoachClient();
  const userId = await requireCurrentUserId();
  const existing = await readCoachProfile(userId);
  if (existing) return existing;

  const workspaceId = await getOrCreateWorkspace(userId);
  const { data, error } = await client
    .from('coach_profiles')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      shop_type: draft.shopType ?? null,
      city: draft.city?.trim().slice(0, 100) || null,
      preferred_language: draft.preferredLanguage ?? 'en',
    })
    .select('user_id, workspace_id, shop_type, city, preferred_language, baseline_completed_at, created_at, updated_at')
    .single();

  if (!error && data) return data as CoachProfileRecord;
  if (!isUniqueViolation(error)) throw error ?? new Error('Could not create the individual Coach profile.');

  // Another tab/device may have created the profile between the read and insert.
  const racedProfile = await readCoachProfile(userId);
  if (!racedProfile) throw new Error('The Coach profile was created elsewhere but could not be loaded.');
  return racedProfile;
}

export async function updateCoachProfile(draft: CoachProfileDraft): Promise<CoachProfileRecord> {
  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile(draft);
  const updates: Record<string, unknown> = {};

  if (draft.shopType !== undefined) updates.shop_type = draft.shopType;
  if (draft.city !== undefined) updates.city = draft.city.trim().slice(0, 100) || null;
  if (draft.preferredLanguage !== undefined) updates.preferred_language = draft.preferredLanguage;

  if (Object.keys(updates).length === 0) return profile;

  const { data, error } = await client
    .from('coach_profiles')
    .update(updates)
    .eq('user_id', profile.user_id)
    .select('user_id, workspace_id, shop_type, city, preferred_language, baseline_completed_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as CoachProfileRecord;
}

export async function saveCoachBaseline(
  input: unknown,
): Promise<CoachAssessmentRecord> {
  const normalized = normalizeBaselineAnswers(input);
  if (!normalized.ok) throw new Error(normalized.error);

  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const assessmentKey = 'baseline-v1';

  const { data: existing, error: existingError } = await client
    .from('coach_assessments')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('assessment_key', assessmentKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as CoachAssessmentRecord;

  const assessmentData = { version: 1, answers: normalized.value as CoachBaselineAnswer[] };
  const { data, error } = await client
    .from('coach_assessments')
    .insert({
      user_id: profile.user_id,
      workspace_id: profile.workspace_id,
      session_id: null,
      assessment_type: 'baseline',
      assessment_key: assessmentKey,
      milestone_number: null,
      assessment_data: assessmentData,
    })
    .select('*')
    .single();

  if (error && isUniqueViolation(error)) {
    const { data: raced, error: racedError } = await client
      .from('coach_assessments')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('assessment_key', assessmentKey)
      .single();
    if (racedError) throw racedError;
    return raced as CoachAssessmentRecord;
  }
  if (error) throw error;

  const { error: profileUpdateError } = await client
    .from('coach_profiles')
    .update({ baseline_completed_at: new Date().toISOString() })
    .eq('user_id', profile.user_id);
  if (profileUpdateError) throw profileUpdateError;

  return data as CoachAssessmentRecord;
}

export async function createCoachSession(
  input: CreateCoachSessionInput,
): Promise<CoachSessionRecord> {
  if (!/^[a-z0-9][a-z0-9:_-]{0,79}$/i.test(input.scenarioCode)) {
    throw new Error('The internal Coach scenario code is invalid.');
  }

  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const { data, error } = await client
    .from('coach_sessions')
    .insert({
      user_id: profile.user_id,
      workspace_id: profile.workspace_id,
      scenario_code: input.scenarioCode,
      shop_type: input.shopType ?? profile.shop_type,
      language: input.language,
      status: 'in_progress',
      outcome: null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as CoachSessionRecord;
}

export async function appendCoachMessage(
  input: NewCoachMessage,
): Promise<CoachMessageRecord> {
  if (!Number.isInteger(input.messageIndex) || input.messageIndex < 0) {
    throw new Error('The Coach transcript message order is invalid.');
  }

  const normalized = normalizeCoachText(input.content);
  if (!normalized.ok) throw new Error(normalized.error);

  const client = requireCoachClient();
  const userId = await requireCurrentUserId();
  const { data, error } = await client
    .from('coach_messages')
    .insert({
      session_id: input.sessionId,
      user_id: userId,
      message_index: input.messageIndex,
      speaker: input.speaker,
      content: normalized.value,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as CoachMessageRecord;
}

export async function completeCoachSession(
  sessionId: string,
  outcome: CoachSessionOutcome,
  status: 'completed' | 'abandoned' = 'completed',
): Promise<CoachSessionRecord> {
  const client = requireCoachClient();
  const userId = await requireCurrentUserId();
  const { data, error } = await client
    .from('coach_sessions')
    .update({
      status,
      outcome,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('This Coach session was already closed or does not belong to the current account.');
  return data as CoachSessionRecord;
}

async function saveAssessment(
  assessmentType: 'session_feedback' | 'milestone_review',
  assessmentKey: string,
  assessmentData: unknown,
  options: { sessionId?: string; milestoneNumber?: number } = {},
): Promise<CoachAssessmentRecord> {
  const normalized = normalizeAssessmentData(assessmentData);
  if (!normalized.ok) throw new Error(normalized.error);

  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();

  const { data: existing, error: existingError } = await client
    .from('coach_assessments')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('assessment_key', assessmentKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as CoachAssessmentRecord;

  const { data, error } = await client
    .from('coach_assessments')
    .insert({
      user_id: profile.user_id,
      workspace_id: profile.workspace_id,
      session_id: options.sessionId ?? null,
      assessment_type: assessmentType,
      assessment_key: assessmentKey,
      milestone_number: options.milestoneNumber ?? null,
      assessment_data: normalized.value,
    })
    .select('*')
    .single();

  if (error && isUniqueViolation(error)) {
    const { data: raced, error: racedError } = await client
      .from('coach_assessments')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('assessment_key', assessmentKey)
      .single();
    if (racedError) throw racedError;
    return raced as CoachAssessmentRecord;
  }
  if (error) throw error;
  return data as CoachAssessmentRecord;
}

export function saveCoachSessionFeedback(
  sessionId: string,
  assessmentData: Record<string, unknown>,
): Promise<CoachAssessmentRecord> {
  return saveAssessment('session_feedback', `session-feedback:${sessionId}`, assessmentData, { sessionId });
}

export function saveCoachMilestoneReview(
  milestoneNumber: number,
  assessmentData: Record<string, unknown>,
): Promise<CoachAssessmentRecord> {
  if (!Number.isInteger(milestoneNumber) || milestoneNumber < 10 || milestoneNumber % 10 !== 0) {
    throw new Error('Coach milestone reviews are saved at completed-session milestones of 10 or more.');
  }
  return saveAssessment(
    'milestone_review',
    `milestone:${milestoneNumber}`,
    assessmentData,
    { milestoneNumber },
  );
}

function normalizeLearningState(value: CoachLearningState): CoachLearningState {
  if (
    !Number.isInteger(value.completedSessions) ||
    value.completedSessions < 0 ||
    !value.dimensionSignals ||
    typeof value.dimensionSignals !== 'object' ||
    Array.isArray(value.dimensionSignals) ||
    !Array.isArray(value.focusAreas) ||
    !Array.isArray(value.strengths) ||
    !Array.isArray(value.recentPatternIds)
  ) {
    throw new Error('The Coach learning state is invalid.');
  }

  const normalized = normalizeAssessmentData(value);
  if (!normalized.ok) throw new Error(normalized.error);
  return normalized.value as unknown as CoachLearningState;
}

export async function loadCoachLearningProfile(): Promise<CoachLearningProfileRecord | null> {
  const client = requireCoachClient();
  const userId = await requireCurrentUserId();
  const { data, error } = await client
    .from('coach_learning_profiles')
    .select('user_id, workspace_id, learning_state, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as CoachLearningProfileRecord | null;
}

export async function saveCoachLearningProfile(
  learningState: CoachLearningState,
): Promise<CoachLearningProfileRecord> {
  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const learning_state = normalizeLearningState(learningState);

  const { data, error } = await client
    .from('coach_learning_profiles')
    .upsert(
      {
        user_id: profile.user_id,
        workspace_id: profile.workspace_id,
        learning_state,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, workspace_id, learning_state, updated_at')
    .single();

  if (error) throw error;
  return data as CoachLearningProfileRecord;
}

export function isCoachCloudAvailable(): boolean {
  return coachCloudEnabled && supabase !== null;
}

export type { CoachLanguage };
