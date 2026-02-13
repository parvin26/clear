/** CLEAR governance API client (Phase 1). */
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const AUTH_TOKEN_KEY = "clear_access_token";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export interface EnterpriseOut {
  id: number;
  name: string | null;
  sector: string | null;
  geography: string | null;
  operating_model: string | null;
  size_band: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionListItem {
  decision_id: string;
  enterprise_id: number | null;
  current_status: string;
  current_artifact_version: number;
  created_at: string;
}

export interface DecisionOut {
  decision_id: string;
  enterprise_id: number | null;
  current_status: string;
  current_artifact_version: number;
  created_at: string;
  updated_at: string;
  latest_artifact: Record<string, unknown> | null;
  latest_artifact_hash: string | null;
  responsible_owner?: string | null;
  expected_outcome?: string | null;
  outcome_review_reminder?: boolean;
  outcome_review_notes?: string | null;
}

export interface MilestoneOut {
  id: number;
  decision_id: string;
  milestone_name: string;
  responsible_person: string | null;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEventOut {
  event_id: string;
  decision_id: string;
  event_type: string;
  artifact_version: number | null;
  artifact_hash: string | null;
  supersedes_event_id: string | null;
  reason_code: string | null;
  actor_id: string | null;
  actor_role: string | null;
  created_at: string;
}

export interface EvidenceLinkOut {
  id: number;
  decision_id: string;
  evidence_type: string;
  source_ref: Record<string, unknown>;
  source_table: string | null;
  source_id: string | null;
  retrieval_metadata: Record<string, unknown> | null;
  integrity_hash: string | null;
  created_at: string;
}

// Enterprises
export async function listEnterprises(skip = 0, limit = 50): Promise<EnterpriseOut[]> {
  const { data } = await apiClient.get<EnterpriseOut[]>("/api/clear/enterprises", { params: { skip, limit } });
  return data;
}

export async function getEnterprise(id: number): Promise<EnterpriseOut> {
  const { data } = await apiClient.get<EnterpriseOut>(`/api/clear/enterprises/${id}`);
  return data;
}

/** Activation progress for first CLEAR cycle (from GET /api/clear/enterprises/:id/activation). */
export interface EnterpriseActivationOut {
  workspace_created_at: string | null;
  completed_steps: string[];
  completed_count: number;
  next_step_key: string | null;
  all_complete: boolean;
  days_since_start: number;
  activation_mode: string;
}

export async function getEnterpriseActivation(enterpriseId: number): Promise<EnterpriseActivationOut> {
  const { data } = await apiClient.get<EnterpriseActivationOut>(`/api/clear/enterprises/${enterpriseId}/activation`);
  return data;
}

/** Cohort manager view: enterprises with activation_mode=cohort and their activation. */
export interface CohortModeEnterpriseRow {
  enterprise: EnterpriseOut;
  activation: EnterpriseActivationOut;
}

export async function listCohortModeEnterprises(params?: {
  skip?: number;
  limit?: number;
}): Promise<CohortModeEnterpriseRow[]> {
  const { data } = await apiClient.get<CohortModeEnterpriseRow[]>("/api/clear/cohorts/enterprises", { params });
  return data;
}

export async function createEnterprise(body: Partial<EnterpriseOut>): Promise<EnterpriseOut> {
  const { data } = await apiClient.post<EnterpriseOut>("/api/clear/enterprises", body);
  return data;
}

// Decisions
export async function listDecisions(params?: {
  enterprise_id?: number;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<DecisionListItem[]> {
  const { data } = await apiClient.get<DecisionListItem[]>("/api/clear/decisions", { params });
  return data;
}

export async function getDecision(decisionId: string): Promise<DecisionOut> {
  const { data } = await apiClient.get<DecisionOut>(`/api/clear/decisions/${decisionId}`);
  return data;
}

/** Decision velocity: avg cycle days, band, trend. For dashboard and portfolio. */
export interface DecisionVelocityOut {
  avg_cycle_days: number | null;
  avg_time_to_decision: number | null;
  avg_time_to_execution: number | null;
  avg_time_to_review: number | null;
  velocity_band: string | null;
  trend_direction: string;
  cycle_count: number;
  per_decision?: { decision_id: string; total_cycle_days: number }[];
}

export async function getDecisionVelocity(enterpriseId?: number): Promise<DecisionVelocityOut> {
  const { data } = await apiClient.get<DecisionVelocityOut>("/api/clear/decision-velocity", {
    params: enterpriseId != null ? { enterprise_id: enterpriseId } : {},
  });
  return data;
}

export async function getEnterpriseDecisionVelocity(enterpriseId: number): Promise<DecisionVelocityOut> {
  const { data } = await apiClient.get<DecisionVelocityOut>(`/api/clear/enterprises/${enterpriseId}/decision-velocity`);
  return data;
}

export async function createDecision(body: {
  enterprise_id?: number;
  initial_artifact?: Record<string, unknown>;
  actor_id?: string;
  actor_role?: string;
}): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>("/api/clear/decisions", body);
  return data;
}

export async function bootstrapDraftFromAnalysis(params: {
  domain: string;
  analysis_id: number;
  enterprise_id?: number;
  actor_id?: string;
  actor_role?: string;
}): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>("/api/clear/decisions/bootstrap-from-analysis", null, {
    params: { domain: params.domain, analysis_id: params.analysis_id, enterprise_id: params.enterprise_id, actor_id: params.actor_id, actor_role: params.actor_role },
  });
  return data;
}

/** Multi-agent diagnostic run (orchestration). Use when USE_BACKEND_DIAGNOSTIC_RUN is true. */
export interface DiagnosticRunResponse {
  decision_id: string | null;
  idea_stage?: boolean;
  idea_stage_message?: string;
  synthesis_summary: {
    primary_domain?: string;
    emerging_decision?: string;
    decision_statement?: string;
    recommended_next_step?: string;
    recommended_playbooks?: string[];
    recommended_first_milestones?: { title?: string; description?: string }[];
  };
  synthesis?: Record<string, unknown>;
  next_step: string;
  next_step_payload: Record<string, unknown>;
}

export async function runDiagnosticRun(params: {
  onboarding_context?: Record<string, unknown> | null;
  diagnostic_data: Record<string, unknown>;
}): Promise<DiagnosticRunResponse> {
  const { data } = await apiClient.post<DiagnosticRunResponse>("/api/clear/diagnostic/run", params);
  return data;
}

export async function submitIdeaStageSignup(body: { email?: string; short_text?: string }): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>("/api/clear/diagnostic/idea-stage", body);
  return data;
}

export async function submitHumanReviewRequest(body: {
  decision_id: string;
  name?: string;
  email: string;
  whatsapp?: string;
  country?: string;
  company?: string;
  role?: string;
  consent?: boolean;
}): Promise<{ id: number; decision_id: string; status: string; message: string }> {
  const { data } = await apiClient.post("/api/clear/human-review", body);
  return data;
}

export async function addArtifactVersion(
  decisionId: string,
  artifact: Record<string, unknown>,
  opts?: { supersedes_event_id?: string; reason_code?: string; actor_id?: string; actor_role?: string }
): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>(`/api/clear/decisions/${decisionId}/artifact`, artifact, {
    params: opts,
  });
  return data;
}

export async function finalizeDecision(decisionId: string, body?: { actor_id?: string; actor_role?: string }): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>(`/api/clear/decisions/${decisionId}/finalize`, body ?? {});
  return data;
}

export async function signOffDecision(decisionId: string, body: { actor_id: string; actor_role?: string; comment?: string }): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>(`/api/clear/decisions/${decisionId}/sign-off`, body);
  return data;
}

export async function listLedgerEvents(decisionId: string): Promise<LedgerEventOut[]> {
  const { data } = await apiClient.get<LedgerEventOut[]>(`/api/clear/decisions/${decisionId}/ledger`);
  return data;
}

export async function listEvidenceLinks(decisionId: string): Promise<EvidenceLinkOut[]> {
  const { data } = await apiClient.get<EvidenceLinkOut[]>(`/api/clear/decisions/${decisionId}/evidence`);
  return data;
}

export async function addEvidenceLink(
  decisionId: string,
  body: { decision_id: string; evidence_type: string; source_ref: { system: string; uri?: string; table?: string; id?: string }; source_table?: string | null; source_id?: string | null }
): Promise<EvidenceLinkOut> {
  const { data } = await apiClient.post<EvidenceLinkOut>(`/api/clear/decisions/${decisionId}/evidence`, { ...body, decision_id: decisionId });
  return data;
}

/** Upload a file as evidence. Use FormData with keys: file, evidence_type (optional, default "document"). */
export async function uploadEvidenceFile(decisionId: string, formData: FormData): Promise<EvidenceLinkOut> {
  const { data } = await apiClient.post<EvidenceLinkOut>(`/api/clear/decisions/${decisionId}/evidence/upload`, formData);
  return data;
}

/** Full URL for an evidence file (e.g. uploaded file served at /api/clear/uploads/evidence/...). */
export function getEvidenceFileUrl(uri: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  return `${base}${uri.startsWith("/") ? uri : `/${uri}`}`;
}

export async function updateDecisionExecution(
  decisionId: string,
  body: { responsible_owner?: string | null; expected_outcome?: string | null; outcome_review_reminder?: boolean; outcome_review_notes?: string | null }
): Promise<DecisionOut> {
  const { data } = await apiClient.patch<DecisionOut>(`/api/clear/decisions/${decisionId}/execution`, body);
  return data;
}

export async function listMilestones(decisionId: string): Promise<MilestoneOut[]> {
  const { data } = await apiClient.get<MilestoneOut[]>(`/api/clear/decisions/${decisionId}/milestones`);
  return data;
}

export async function createMilestone(
  decisionId: string,
  body: { milestone_name: string; responsible_person?: string | null; due_date?: string | null; status?: string; notes?: string | null }
): Promise<MilestoneOut> {
  const { data } = await apiClient.post<MilestoneOut>(`/api/clear/decisions/${decisionId}/milestones`, body);
  return data;
}

export async function updateMilestone(
  decisionId: string,
  milestoneId: number,
  body: { milestone_name?: string; responsible_person?: string | null; due_date?: string | null; status?: string; notes?: string | null }
): Promise<MilestoneOut> {
  const { data } = await apiClient.patch<MilestoneOut>(`/api/clear/decisions/${decisionId}/milestones/${milestoneId}`, body);
  return data;
}

export async function deleteMilestone(decisionId: string, milestoneId: number): Promise<{ ok: boolean }> {
  const { data } = await apiClient.delete<{ ok: boolean }>(`/api/clear/decisions/${decisionId}/milestones/${milestoneId}`);
  return data;
}

export async function tagChatSession(decisionId: string, sessionId: string, agentDomain: string): Promise<{ decision_id: string; session_id: string; agent_domain: string }> {
  const { data } = await apiClient.put(`/api/clear/decisions/${decisionId}/chat-session`, null, {
    params: { session_id: sessionId, agent_domain: agentDomain },
  });
  return data;
}

/** Partial update of decision artifact (governance, emr). Merged with latest then new version appended. */
export async function patchArtifactPartial(
  decisionId: string,
  body: { governance?: Record<string, unknown>; emr?: Record<string, unknown> }
): Promise<DecisionOut> {
  const { data } = await apiClient.patch<DecisionOut>(`/api/clear/decisions/${decisionId}/artifact`, body);
  return data;
}

export interface OutcomeReviewCreateBody {
  summary?: string | null;
  what_worked?: string | null;
  what_did_not_work?: string | null;
  key_learnings?: string | null;
  assumptions_validated?: string | null;
  assumptions_broken?: string | null;
  readiness_impact?: string | null; // "minus_one" | "zero" | "plus_one"
  main_constraint?: string | null;
  keep_raise_reduce_stop?: string | null; // "keep" | "raise" | "reduce" | "stop"
}

export interface OutcomeReviewOut {
  id: string;
  created_at: string;
  decision_id: string;
  summary?: string | null;
  what_worked?: string | null;
  what_did_not_work?: string | null;
  key_learnings?: string | null;
  assumptions_validated?: string | null;
  assumptions_broken?: string | null;
  readiness_impact?: string | null;
  main_constraint?: string | null;
  keep_raise_reduce_stop?: string | null;
}

export async function createOutcomeReview(decisionId: string, body: OutcomeReviewCreateBody): Promise<OutcomeReviewOut> {
  const { data } = await apiClient.post<OutcomeReviewOut>(`/api/clear/decisions/${decisionId}/outcome-review`, body);
  return data;
}

export async function listOutcomeReviews(decisionId: string): Promise<OutcomeReviewOut[]> {
  const { data } = await apiClient.get<OutcomeReviewOut[]>(`/api/clear/decisions/${decisionId}/outcome-reviews`);
  return data;
}

// Enterprise Health Score (execution discipline, governance, learning)
export interface EnterpriseHealthScore {
  total_score: number;
  execution_score: number;
  governance_score: number;
  learning_score: number;
  status_label: string;
  trend_direction: string | null;
  execution_max: number;
  governance_max: number;
  learning_max: number;
}

export async function getEnterpriseHealthScore(enterpriseId: number): Promise<EnterpriseHealthScore> {
  const { data } = await apiClient.get<EnterpriseHealthScore>(`/api/clear/enterprises/${enterpriseId}/health-score`);
  return data;
}

/** Execution Capital Readiness Index (ECRI): 0–100, components, band, trend. */
export interface EnterpriseReadinessIndex {
  readiness_index: number;
  activation_component: number;
  health_component: number;
  velocity_component: number;
  governance_component: number;
  readiness_band: string;
  trend_direction: string | null;
}

export async function getEnterpriseReadinessIndex(enterpriseId: number): Promise<EnterpriseReadinessIndex> {
  const { data } = await apiClient.get<EnterpriseReadinessIndex>(`/api/clear/enterprises/${enterpriseId}/readiness-index`);
  return data;
}

// Portfolio (org = portfolio), timeline, members, comments, feedback, suggested resources
export interface PortfolioEnrichedItem {
  enterprise_id: number;
  enterprise_name: string | null;
  country: string | null;
  industry: string | null;
  company_size_band: string | null;
  last_decision_id: string | null;
  last_primary_domain: string | null;
  readiness_band: string | null;
  last_review_date: string | null;
  has_committed_plan: boolean;
  health_score?: number | null;
  health_status_label?: string | null;
  health_trend_direction?: string | null;
  avg_cycle_days?: number | null;
  velocity_band?: string | null;
  trend_direction?: string | null;
  readiness_index?: number | null;
  ecri_readiness_band?: string | null;
  ecri_trend_direction?: string | null;
}

export async function getOrgPortfolio(
  portfolioId: number,
  params?: {
    readiness_band?: string;
    primary_domain?: string;
    country?: string;
    industry?: string;
    no_review_days?: number;
    health_score_min?: number;
    health_score_max?: number;
    velocity_band?: string;
    ecri_readiness_band?: string;
  }
): Promise<PortfolioEnrichedItem[]> {
  const { data } = await apiClient.get<PortfolioEnrichedItem[]>(`/api/clear/orgs/${portfolioId}/portfolio`, { params });
  return data;
}

export interface TimelineItem {
  decision_id: string;
  created_at: string | null;
  primary_domain: string | null;
  readiness_band: string | null;
  decision_statement: string | null;
  has_outcome_review: boolean;
}

export async function getEnterpriseTimeline(enterpriseId: number): Promise<TimelineItem[]> {
  const { data } = await apiClient.get<TimelineItem[]>(`/api/clear/enterprises/${enterpriseId}/timeline`);
  return data;
}

export async function inviteEnterpriseMember(
  enterpriseId: number,
  body: { email: string; role: string },
  baseUrl?: string
): Promise<{ invite_url: string; email: string; role: string; expires_at: string | null }> {
  const { data } = await apiClient.post(`/api/clear/enterprises/${enterpriseId}/members`, body, {
    params: baseUrl ? { base_url: baseUrl } : undefined,
  });
  return data;
}

export async function listEnterpriseMembers(enterpriseId: number): Promise<{ id: number; enterprise_id: number; email: string; role: string; created_at: string | null }[]> {
  const { data } = await apiClient.get(`/api/clear/enterprises/${enterpriseId}/members`);
  return data;
}

export async function getViewingRole(decisionId: string, token: string | null): Promise<{ role: string | null; email: string | null }> {
  if (!token) return { role: null, email: null };
  const { data } = await apiClient.get<{ role: string | null; email: string | null }>(
    `/api/clear/decisions/${decisionId}/viewing-role`,
    { params: { token } }
  );
  return data;
}

export interface DecisionCommentOut {
  id: number;
  decision_id: string;
  author_email: string;
  author_role: string | null;
  content: string;
  created_at: string | null;
}

export async function listDecisionComments(decisionId: string): Promise<DecisionCommentOut[]> {
  const { data } = await apiClient.get<DecisionCommentOut[]>(`/api/clear/decisions/${decisionId}/comments`);
  return data;
}

export async function createDecisionComment(
  decisionId: string,
  body: { content: string; author_email: string; author_role?: string | null }
): Promise<DecisionCommentOut> {
  const { data } = await apiClient.post<DecisionCommentOut>(`/api/clear/decisions/${decisionId}/comments`, body);
  return data;
}

export async function createImpactFeedback(body: {
  decision_id?: string | null;
  enterprise_id?: number | null;
  cycle_number?: number | null;
  question: string;
  score?: number | null;
  comment?: string | null;
}): Promise<{ id: number; message: string }> {
  const { data } = await apiClient.post<{ id: number; message: string }>("/api/clear/impact-feedback", body);
  return data;
}

export async function getSuggestedResources(decisionId: string): Promise<{ resources: { title?: string; content?: string; source_type?: string }[] }> {
  const { data } = await apiClient.get<{ resources: { title?: string; content?: string; source_type?: string }[] }>(
    `/api/clear/decisions/${decisionId}/suggested-resources`
  );
  return data;
}

export interface ReadinessOut {
  band: "Nascent" | "Emerging" | "Institutionalizing";
  metrics: {
    number_of_reviews: number;
    milestone_completion_rate: number;
    total_milestones: number;
    completed_milestones: number;
    governance_adherence: number;
  };
}

export async function getReadiness(decisionId: string): Promise<ReadinessOut> {
  const { data } = await apiClient.get<ReadinessOut>(`/api/clear/decisions/${decisionId}/readiness`);
  return data;
}

export interface DecisionChatStartOut {
  session_id: string;
  initial_assistant_message: string;
}

export async function decisionChatSeed(decisionId: string): Promise<{ initial_message: string }> {
  const { data } = await apiClient.post<{ initial_message: string }>(`/api/clear/decisions/${decisionId}/chat/seed`);
  return data;
}

export async function decisionChatStart(decisionId: string): Promise<DecisionChatStartOut> {
  const { data } = await apiClient.post<DecisionChatStartOut>(`/api/clear/decisions/${decisionId}/chat/start`);
  return data;
}

export async function commitExecutionPlan(
  decisionId: string,
  body: { must_do_milestone_ids: string[]; commit_note?: string | null }
): Promise<DecisionOut> {
  const { data } = await apiClient.post<DecisionOut>(`/api/clear/decisions/${decisionId}/execution/commit`, body);
  return data;
}

export async function decisionChatMessage(
  decisionId: string,
  body: { session_id: string; message: string }
): Promise<{ assistant_message: string }> {
  const { data } = await apiClient.post<{ assistant_message: string }>(
    `/api/clear/decisions/${decisionId}/chat/message`,
    body
  );
  return data;
}

// --- Auth ---
export interface AuthUser {
  id: number;
  email: string | null;
  name: string | null;
  email_verified_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export async function sendSignupOtp(email: string): Promise<{ message: string; expires_in_minutes: number }> {
  const { data } = await apiClient.post<{ message: string; expires_in_minutes: number }>("/api/auth/send-signup-otp", {
    email,
  });
  return data;
}

export async function register(body: {
  email: string;
  otp: string;
  password: string;
  name?: string | null;
}): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/auth/register", body);
  return data;
}

export async function login(body: { email: string; password: string }): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/auth/login", body);
  return data;
}

export async function sendMagicLink(email: string): Promise<{ message: string; expires_in_minutes: number }> {
  const { data } = await apiClient.post<{ message: string; expires_in_minutes: number }>(
    "/api/auth/send-magic-link",
    { email }
  );
  return data;
}

export async function verifyMagicLink(token: string, email: string): Promise<TokenResponse> {
  const { data } = await apiClient.get<TokenResponse>("/api/auth/verify-magic-link", {
    params: { token, email },
  });
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/api/auth/me");
  return data;
}

// --- Advisor workspace ---
const advisorParams = (token?: string | null) => (token ? { params: { token } } : {});

export interface AdvisorMeOut {
  email: string;
  pending_review_requests: {
    id: number;
    decision_id: string;
    enterprise_id: number;
    enterprise_name: string | null;
    requested_by: string | null;
    requested_at: string | null;
    due_date: string | null;
    status: string;
  }[];
  enterprises: { id: number; name: string | null }[];
  recent_reviews: {
    id: number;
    decision_id: string;
    headline_assessment: string | null;
    confidence: string | null;
    created_at: string | null;
  }[];
}

export async function getAdvisorMe(token?: string | null): Promise<AdvisorMeOut> {
  const { data } = await apiClient.get<AdvisorMeOut>("/api/clear/advisor/me", advisorParams(token));
  return data;
}

export async function listAdvisorEnterprises(token?: string | null): Promise<{ id: number; name: string | null; sector?: string | null; geography?: string | null }[]> {
  const { data } = await apiClient.get("/api/clear/advisor/enterprises", advisorParams(token));
  return data;
}

export async function listAdvisorEnterpriseDecisions(
  enterpriseId: number,
  token?: string | null
): Promise<{ decision_id: string; enterprise_id: number | null; current_status: string; created_at: string | null; decision_statement?: string }[]> {
  const { data } = await apiClient.get(`/api/clear/advisor/enterprises/${enterpriseId}/decisions`, advisorParams(token));
  return data;
}

export async function getAdvisorDecision(decisionId: string, token?: string | null): Promise<DecisionOut> {
  const { data } = await apiClient.get<DecisionOut>(`/api/clear/advisor/decisions/${decisionId}`, advisorParams(token));
  return data;
}

export interface AdvisorReviewOut {
  id: number;
  decision_id: string;
  headline_assessment: string | null;
  what_looks_strong: string | null;
  what_worries_most: string | null;
  next_4_6_weeks: string | null;
  confidence: string | null;
  created_at: string | null;
}

export async function listAdvisorReviews(decisionId: string, token?: string | null): Promise<AdvisorReviewOut[]> {
  const { data } = await apiClient.get<AdvisorReviewOut[]>(`/api/clear/advisor/decisions/${decisionId}/reviews`, advisorParams(token));
  return data;
}

export async function submitAdvisorReview(
  decisionId: string,
  body: {
    headline_assessment?: string | null;
    what_looks_strong?: string | null;
    what_worries_most?: string | null;
    next_4_6_weeks?: string | null;
    confidence?: string | null;
  },
  token?: string | null
): Promise<AdvisorReviewOut> {
  const { data } = await apiClient.post<AdvisorReviewOut>(
    `/api/clear/advisor/decisions/${decisionId}/review`,
    body,
    token ? { params: { token } } : undefined
  );
  return data;
}

export async function inviteAdvisorToDecision(
  decisionId: string,
  body: { name?: string; email: string; role?: string },
  baseUrl?: string
): Promise<{ invite_url: string; email: string; role: string; expires_at?: string | null }> {
  const { data } = await apiClient.post(
    `/api/clear/decisions/${decisionId}/advisor-invite`,
    body,
    baseUrl ? { params: { base_url: baseUrl } } : undefined
  );
  return data;
}
