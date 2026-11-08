export type CoachLanguage = 'en' | 'hi';

export type CoachWorkspaceRole = 'owner' | 'staff';
export type CoachWorkspaceStatus = 'active' | 'invited' | 'suspended';
export type CoachSessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type CoachSessionOutcome = 'purchased' | 'not_purchased' | 'returned_later' | 'left' | 'unclear';
export type CoachMessageSpeaker = 'customer' | 'shopkeeper' | 'coach';
export type CoachAssessmentType = 'baseline' | 'session_feedback' | 'milestone_review';

export const COACH_BASELINE_QUESTION_IDS = [
  'price_objection',
  'customer_complaint',
  'lost_sale',
] as const;

export type CoachBaselineQuestionId = typeof COACH_BASELINE_QUESTION_IDS[number];

export interface CoachBaselineAnswer {
  questionId: CoachBaselineQuestionId;
  answer: string;
}

export interface CoachWorkspaceRecord {
  id: string;
  owner_user_id: string;
  shop_name: string | null;
  shop_type: string | null;
  city: string | null;
  business_context: Record<string, unknown>;
  created_at: string;
}

export interface CoachProfileRecord {
  user_id: string;
  workspace_id: string;
  preferred_language: CoachLanguage;
  baseline_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachSessionRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  scenario_code: string;
  shop_type: string | null;
  language: CoachLanguage;
  status: CoachSessionStatus;
  outcome: CoachSessionOutcome | null;
  started_at: string;
  completed_at: string | null;
}

export interface CoachMessageRecord {
  id: string;
  session_id: string;
  user_id: string;
  message_index: number;
  speaker: CoachMessageSpeaker;
  content: string;
  created_at: string;
}

export interface CoachAssessmentRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  session_id: string | null;
  assessment_type: CoachAssessmentType;
  assessment_key: string;
  milestone_number: number | null;
  assessment_data: Record<string, unknown>;
  created_at: string;
}

export interface CoachTeachingAdjustment {
  mode: 'focused_micro_practice';
  dimension: string;
  opportunityStreak: number;
}

export interface CoachLearningState {
  completedSessions: number;
  dimensionSignals: Record<string, number>;
  focusAreas: string[];
  strengths: string[];
  recentPatternIds: string[];
  dimensionEvidence?: Record<string, {
    observations: number;
    strengths: number;
    practiceOpportunities: number;
  }>;
  opportunityStreaks?: Record<string, number>;
  teachingAdjustment?: CoachTeachingAdjustment | null;
  updatedAt: string | null;
}

export interface CoachLearningProfileRecord {
  user_id: string;
  workspace_id: string;
  learning_state: CoachLearningState;
  updated_at: string;
}

export interface CoachProfileDraft {
  shopName?: string | null;
  shopType?: string | null;
  city?: string | null;
  preferredLanguage?: CoachLanguage;
}

export interface CoachWorkspaceDraft {
  shopName?: string | null;
  shopType?: string | null;
  city?: string | null;
  businessContext?: Record<string, unknown>;
}

export interface CreateCoachSessionInput {
  scenarioCode: string;
  language: CoachLanguage;
}

export interface NewCoachMessage {
  sessionId: string;
  messageIndex: number;
  speaker: CoachMessageSpeaker;
  content: string;
}
