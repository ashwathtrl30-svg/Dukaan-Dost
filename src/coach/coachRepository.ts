import { supabase } from '../supabaseClient';
import {
  normalizeAssessmentData,
  normalizeBaselineAnswers,
  normalizeCoachText,
} from './coachData';
import type {
  CoachAssessmentRecord,
  CoachBaselineAnswer,
  CoachLearningProfileRecord,
  CoachLearningState,
  CoachMessageRecord,
  CoachProfileDraft,
  CoachProfileRecord,
  CoachSessionOutcome,
  CoachSessionRecord,
  CoachWorkspaceDraft,
  CoachWorkspaceRecord,
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

function optionalText(value: string | null | undefined, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = value?.trim() ?? '';
  return normalized ? normalized.slice(0, maxLength) : null;
}

async function getOrCreateWorkspace(
  userId: string,
  draft: CoachWorkspaceDraft = {},
): Promise<string> {
  const client = requireCoachClient();

  // An invited or suspended staff identity must not silently create a second shop.
  const { data: membership, error: membershipError } = await client
    .from('coach_workspace_memberships')
    .select('workspace_id, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (membership?.status === 'active') return membership.workspace_id as string;
  if (membership?.status === 'invited') {
    throw new Error('A shop invitation is waiting for this account to be activated.');
  }
  if (membership?.status === 'suspended') {
    throw new Error('This account’s Coach access is paused. Ask the shop owner to review the membership.');
  }

  const { data: ownedWorkspace, error: ownedError } = await client
    .from('coach_workspaces')
    .select('id, shop_name, shop_type, city')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (ownedError) throw ownedError;

  if (ownedWorkspace?.id) {
    const updates: Record<string, unknown> = {};
    const shopName = optionalText(draft.shopName, 120);
    const shopType = optionalText(draft.shopType, 32);
    const city = optionalText(draft.city, 100);
    if (shopName !== undefined) updates.shop_name = shopName;
    if (shopType !== undefined) updates.shop_type = shopType;
    if (city !== undefined) updates.city = city;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await client
        .from('coach_workspaces')
        .update(updates)
        .eq('id', ownedWorkspace.id);
      if (updateError) throw updateError;
    }
    return ownedWorkspace.id as string;
  }

  const { data: createdWorkspace, error: createError } = await client
    .from('coach_workspaces')
    .insert({
      owner_user_id: userId,
      shop_name: optionalText(draft.shopName, 120) ?? null,
      shop_type: optionalText(draft.shopType, 32) ?? null,
      city: optionalText(draft.city, 100) ?? null,
    })
    .select('id')
    .single();

  if (!createError && createdWorkspace?.id) return createdWorkspace.id as string;
  if (!isUniqueViolation(createError)) {
    throw createError ?? new Error('Could not create the Coach workspace.');
  }

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
    .select('user_id, workspace_id, preferred_language, baseline_completed_at, created_at, updated_at')
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
  const workspaceId = await getOrCreateWorkspace(userId, draft);
  const existing = await readCoachProfile(userId);

  if (existing) {
    if (existing.workspace_id !== workspaceId) {
      throw new Error('This Coach profile is linked to a different shop workspace. It was not moved automatically.');
    }
    if (draft.preferredLanguage && draft.preferredLanguage !== existing.preferred_language) {
      const { data, error } = await client
        .from('coach_profiles')
        .update({ preferred_language: draft.preferredLanguage })
        .eq('user_id', userId)
        .select('user_id, workspace_id, preferred_language, baseline_completed_at, created_at, updated_at')
        .single();
      if (error) throw error;
      return data as CoachProfileRecord;
    }
    return existing;
  }

  const { data, error } = await client
    .from('coach_profiles')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      preferred_language: draft.preferredLanguage ?? 'en',
    })
    .select('user_id, workspace_id, preferred_language, baseline_completed_at, created_at, updated_at')
    .single();

  if (!error && data) return data as CoachProfileRecord;
  if (!isUniqueViolation(error)) {
    throw error ?? new Error('Could not create the individual Coach profile.');
  }

  // Another tab/device may have created the profile between the read and insert.
  const racedProfile = await readCoachProfile(userId);
  if (!racedProfile) throw new Error('The Coach profile was created elsewhere but could not be loaded.');
  if (racedProfile.workspace_id !== workspaceId) {
    throw new Error('The existing Coach profile belongs to a different shop workspace.');
  }
  return racedProfile;
}

export async function updateCoachProfile(
  preferredLanguage: 'en' | 'hi',
): Promise<CoachProfileRecord> {
  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const { data, error } = await client
    .from('coach_profiles')
    .update({ preferred_language: preferredLanguage })
    .eq('user_id', profile.user_id)
    .select('user_id, workspace_id, preferred_language, baseline_completed_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as CoachProfileRecord;
}

export async function loadCoachWorkspace(): Promise<CoachWorkspaceRecord> {
  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const { data, error } = await client
    .from('coach_workspaces')
    .select('id, owner_user_id, shop_name, shop_type, city, created_at')
    .eq('id', profile.workspace_id)
    .single();

  if (error) throw error;
  return data as CoachWorkspaceRecord;
}

/** Only the workspace owner can change shared shop context; RLS rejects staff edits. */
export async function updateCoachWorkspaceContext(
  draft: CoachWorkspaceDraft,
): Promise<CoachWorkspaceRecord> {
  const client = requireCoachClient();
  const profile = await loadOrCreateCoachProfile();
  const updates: Record<string, unknown> = {};
  const shopName = optionalText(draft.shopName, 120);
  const shopType = optionalText(draft.shopType, 32);
  const city = optionalText(draft.city, 100);
  if (shopName !== undefined) updates.shop_name = shopName;
  if (shopType !== undefined) updates.shop_type = shopType;
  if (city !== undefined) updates.city = city;
  if (Object.keys(updates).length === 0) return loadCoachWorkspace();

  const { data, error } = await client
    .from('coach_workspaces')
    .update(updates)
    .eq('id', profile.workspace_id)
    .select('id, owner_user_id, shop_name, shop_type, city, created_at')
    .single();

  if (error) throw error;
  return data as CoachWorkspaceRecord;
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
  if (existing) {
    if (!profile.baseline_completed_at) {
      const { error: repairError } = await client
        .from('coach_profiles')
        .update({ baseline_completed_at: new Date().toISOString() })
        .eq('user_id', profile.user_id);
      if (repairError) throw repairError;
    }
    return existing as CoachAssessmentRecord;
  }

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
  const workspace = await loadCoachWorkspace();
  const { data, error } = await client
    .from('coach_sessions')
    .insert({
      user_id: profile.user_id,
      workspace_id: profile.workspace_id,
      scenario_code: input.scenarioCode,
      shop_type: workspace.shop_type,
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

export async function saveCoachMilestoneReview(
  milestoneNumber: number,
  assessmentData: Record<string, unknown>,
): Promise<CoachAssessmentRecord> {
  if (!Number.isInteger(milestoneNumber) || milestoneNumber < 10 || milestoneNumber % 10 !== 0) {
    throw new Error('Coach milestone reviews are saved at completed-session milestones of 10 or more.');
  }

  const client = requireCoachClient();
  const userId = await requireCurrentUserId();
  const { count, error } = await client
    .from('coach_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (error) throw error;
  if ((count ?? 0) < milestoneNumber) {
    throw new Error('This Coach milestone is not available yet.');
  }

  return saveAssessment(
    'milestone_review',
    `milestone:${milestoneNumber}`,
    assessmentData,
    { milestoneNumber },
  );
}

function normalizeLearningState(value: unknown): CoachLearningState {
  if (
    typeof value !== 'object' || value === null || Array.isArray(value) ||
    !('completedSessions' in value) ||
    !Number.isInteger(value.completedSessions) ||
    (value.completedSessions as number) < 0 ||
    !('dimensionSignals' in value) ||
    !value.dimensionSignals ||
    typeof value.dimensionSignals !== 'object' ||
    Array.isArray(value.dimensionSignals) ||
    !('focusAreas' in value) || !Array.isArray(value.focusAreas) ||
    !('strengths' in value) || !Array.isArray(value.strengths) ||
    !('recentPatternIds' in value) || !Array.isArray(value.recentPatternIds)
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
  const normalizedState = normalizeLearningState(learningState);

  const { data, error } = await client
    .from('coach_learning_profiles')
    .upsert(
      {
        user_id: profile.user_id,
        workspace_id: profile.workspace_id,
        learning_state: normalizedState,
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
