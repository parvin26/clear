/** Unified API client for all agents. */
import axios from "axios";
import type {
  CFOInput,
  CFOAnalysisOut,
  CFOAnalysisListItem,
  CFOChatRequest,
  CFOChatResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_TOKEN_KEY = "clear_access_token";
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// CFO API
export async function postCfoDiagnostic(
  payload: CFOInput
): Promise<{ id: number }> {
  const response = await apiClient.post<CFOAnalysisOut>("/api/cfo/diagnose", payload);
  return { id: response.data.id };
}

export async function getCfoAnalyses(
  page: number = 1,
  pageSize: number = 10
): Promise<CFOAnalysisListItem[]> {
  const response = await apiClient.get<CFOAnalysisListItem[]>("/api/cfo/analyses", {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

export async function getAnalyses(
  page: number = 1,
  pageSize: number = 10
): Promise<CFOAnalysisListItem[]> {
  return getCfoAnalyses(page, pageSize);
}

export async function getCfoAnalysis(id: number): Promise<CFOAnalysisOut> {
  const response = await apiClient.get<CFOAnalysisOut>(`/api/cfo/analyses/${id}`);
  return response.data;
}

// Legacy alias for CFO
export async function getAnalysis(id: number): Promise<CFOAnalysisOut> {
  return getCfoAnalysis(id);
}

export async function postCfoChat(payload: CFOChatRequest): Promise<CFOChatResponse> {
  const response = await apiClient.post<CFOChatResponse>("/api/cfo/chat", payload);
  return response.data;
}

// CMO API
export async function postCmoDiagnostic(payload: any): Promise<any> {
  const response = await apiClient.post("/api/cmo/diagnose", payload);
  return response.data;
}

export async function getCmoAnalyses(params?: { offset?: number; limit?: number; user_id?: number }): Promise<any> {
  const response = await apiClient.get("/api/cmo/analyses", { params });
  return response.data;
}

export async function getCmoAnalysis(id: number): Promise<any> {
  const response = await apiClient.get(`/api/cmo/analyses/${id}`);
  return response.data;
}

export async function postCmoChat(payload: { question: string; user_id?: number }): Promise<any> {
  const response = await apiClient.post("/api/cmo/chat", payload);
  return response.data;
}

// CMO API object (for backward compatibility)
export const api = {
  diagnose: postCmoDiagnostic,
  getAnalyses: getCmoAnalyses,
  getAnalysis: getCmoAnalysis,
  chat: async (request: { question: string; user_id?: number }) => {
    return postCmoChat(request);
  },
  getChatMessages: async (userId?: number, limit: number = 50) => {
    const response = await apiClient.get("/api/cmo/chat/messages", {
      params: { user_id: userId, limit },
    });
    return response.data.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      sources: msg.sources,
      timestamp: new Date(msg.created_at),
    }));
  },
};

// COO API
export async function postCooDiagnostic(payload: any): Promise<{ id: number }> {
  const response = await apiClient.post("/api/coo/diagnose", payload);
  return { id: response.data.id };
}

export async function getCooAnalyses(params?: { page?: number; page_size?: number }): Promise<any> {
  const response = await apiClient.get("/api/coo/analyses", { params });
  return response.data;
}

export async function getCooAnalysis(id: number): Promise<any> {
  const response = await apiClient.get(`/api/coo/analyses/${id}`);
  return response.data;
}

export async function sendChatMessage(
  message: string,
  analysisId?: number | null,
  sessionId?: string | null
): Promise<any> {
  const response = await apiClient.post("/api/coo/chat/message", {
    message,
    analysis_id: analysisId,
    session_id: sessionId,
  });
  return response.data;
}

export async function getChatHistory(sessionId: string): Promise<any[]> {
  const response = await apiClient.get("/api/coo/chat/history", {
    params: { session_id: sessionId },
  });
  return response.data;
}

// CTO API
export async function postCtoDiagnostic(payload: any): Promise<any> {
  const response = await apiClient.post("/api/cto/diagnose", payload);
  return response.data;
}

export async function getCtoAnalyses(params?: { page?: number; page_size?: number }): Promise<any> {
  const response = await apiClient.get("/api/cto/analyses", { params });
  return response.data;
}

export async function getCtoAnalysis(id: number): Promise<any> {
  const response = await apiClient.get(`/api/cto/analyses/${id}`);
  return response.data;
}

export async function postCtoChat(payload: { message: string; conversation_history?: any[] }): Promise<any> {
  const response = await apiClient.post("/api/cto/chat", payload);
  return response.data;
}

// CTO API object (for backward compatibility)
export const ctoApi = {
  diagnose: postCtoDiagnostic,
  getAnalyses: async (page: number = 1, pageSize: number = 20) => {
    return getCtoAnalyses({ page, page_size: pageSize });
  },
  getAnalysis: getCtoAnalysis,
  chat: postCtoChat,
};

// Legacy aliases
export const cooApi = {
  diagnose: postCooDiagnostic,
  getAnalyses: getCooAnalyses,
  chat: sendChatMessage,
};

// Phase 3: Capability (read-only)
export interface FinancingReadinessItem {
  id: number;
  enterprise_id: number;
  decision_id: string | null;
  readiness_score: string | number;
  flags_json: string[] | null;
  rationale_json: Record<string, unknown> | null;
  computed_at: string;
}

export interface CapabilityScoreItem {
  id: number;
  enterprise_id: number;
  decision_id: string | null;
  capability_id: number;
  capability_code?: string;
  capability_name?: string;
  domain?: string;
  score: number;
  confidence: number | null;
  evidence_json: Record<string, unknown> | null;
  computed_at: string | null;
}

export async function getCapabilityFinancingReadiness(enterpriseId: number): Promise<FinancingReadinessItem[]> {
  const response = await apiClient.get<FinancingReadinessItem[]>(
    `/api/capabilities/enterprises/${enterpriseId}/financing-readiness`,
    { params: { limit: 50 } }
  );
  return response.data;
}

export async function getCapabilityScores(enterpriseId: number): Promise<CapabilityScoreItem[]> {
  const response = await apiClient.get<CapabilityScoreItem[]>(
    `/api/capabilities/enterprises/${enterpriseId}/capabilities`,
    { params: { limit: 100 } }
  );
  return response.data;
}

// Phase 4: Institutional (read-only)
export interface PortfolioItem {
  id: number;
  institution_id: number;
  name: string;
  created_at: string;
}

export interface PortfolioEnterpriseItem {
  portfolio_enterprise_id: number;
  enterprise_id: number;
  enterprise_name: string | null;
  added_at: string;
}

export interface EnterpriseSnapshot {
  enterprise_id: number;
  enterprise_name: string | null;
  decisions_by_domain: Record<string, Array<{ decision_id: string; analysis_id: number; created_at: string | null }>>;
  execution_summary: { task_count: number; by_status: Record<string, number> };
  outcomes_summary: Array<{ outcome_type: string; measured_at: string | null; metrics_json: unknown }>;
  capability_trend: Array<{ capability_id: number; score: number; computed_at: string | null }>;
  financing_readiness_latest: {
    readiness_score: number;
    flags_json: string[] | null;
    rationale_json: Record<string, unknown> | null;
    computed_at: string | null;
  } | null;
}

export async function getInstitutionalPortfolios(params?: { institution_id?: number }): Promise<PortfolioItem[]> {
  const response = await apiClient.get<PortfolioItem[]>("/api/institutional/portfolios", { params });
  return response.data;
}

export async function getPortfolioEnterprises(portfolioId: number): Promise<PortfolioEnterpriseItem[]> {
  const response = await apiClient.get<PortfolioEnterpriseItem[]>(
    `/api/institutional/portfolios/${portfolioId}/enterprises`
  );
  return response.data;
}

export async function getEnterpriseSnapshot(enterpriseId: number): Promise<EnterpriseSnapshot> {
  const response = await apiClient.get<EnterpriseSnapshot>(
    `/api/institutional/enterprises/${enterpriseId}/snapshot`
  );
  return response.data;
}

/** Direct download from backend; no frontend transformation. */
export function getDecisionExportUrl(decisionId: string, format: "json" | "csv"): string {
  return `${API_BASE_URL}/api/institutional/decisions/${decisionId}/export?format=${format}&scope=full`;
}

/** Direct download from backend; no frontend transformation. */
export function getEnterpriseExportUrl(enterpriseId: number, format: "json" | "csv"): string {
  return `${API_BASE_URL}/api/institutional/enterprises/${enterpriseId}/export?format=${format}&scope=full`;
}

// ----- Cohorts (institutional rollout) -----

export interface CohortOut {
  id: number;
  name: string;
  partner_org_id: number | null;
  start_date: string | null;
  activation_window_days: number;
  created_at: string;
}

export interface CohortCreateBody {
  name: string;
  partner_org_id?: number | null;
  start_date?: string | null;
  activation_window_days?: number;
}

export interface CohortEnterpriseRow {
  cohort_enterprise_id: number;
  enterprise_id: number;
  enterprise_name: string | null;
  joined_at: string | null;
  activation_progress: Record<string, unknown>;
  activation_completed_count: number;
  activation_complete: boolean;
  health_score: number | null;
  decision_velocity: {
    avg_cycle_days: number | null;
    velocity_band: string | null;
    cycle_count: number;
  };
}

export interface CohortSummary {
  cohort_id: number;
  cohort_name: string;
  enterprises_enrolled: number;
  activation_complete_count: number;
  average_activation_pct: number;
  average_health_score: number | null;
  average_decision_velocity_days: number | null;
  at_risk_count: number;
}

export async function listCohorts(params?: { partner_org_id?: number; skip?: number; limit?: number }): Promise<CohortOut[]> {
  const { data } = await apiClient.get<CohortOut[]>("/api/institutional/cohorts", { params });
  return data;
}

export async function getCohort(cohortId: number): Promise<CohortOut> {
  const { data } = await apiClient.get<CohortOut>(`/api/institutional/cohorts/${cohortId}`);
  return data;
}

export async function createCohort(body: CohortCreateBody): Promise<CohortOut> {
  const { data } = await apiClient.post<CohortOut>("/api/institutional/cohorts", body);
  return data;
}

export async function listCohortEnterprises(
  cohortId: number,
  params?: { activation_incomplete?: boolean; health_score_below?: number; velocity_band?: string }
): Promise<CohortEnterpriseRow[]> {
  const { data } = await apiClient.get<CohortEnterpriseRow[]>(`/api/institutional/cohorts/${cohortId}/enterprises`, { params });
  return data;
}

export async function getCohortSummary(cohortId: number): Promise<CohortSummary> {
  const { data } = await apiClient.get<CohortSummary>(`/api/institutional/cohorts/${cohortId}/summary`);
  return data;
}

export async function addEnterpriseToCohort(
  cohortId: number,
  body: { enterprise_id: number; activation_progress?: Record<string, unknown> }
): Promise<{ cohort_id: number; enterprise_id: number; cohort_enterprise_id: number; joined_at: string | null }> {
  const { data } = await apiClient.post(`/api/institutional/cohorts/${cohortId}/enterprises`, body);
  return data;
}

/**
 * Trigger browser download of backend export (pass-through; no parsing or transformation).
 */
export async function triggerExportDownload(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const obj = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = obj;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(obj);
}

/** Speech-to-text via Wispr Flow (backend proxy). Send base64 16kHz WAV, get transcribed text. */
export async function transcribeAudio(params: {
  audioBase64: string;
  language?: string[];
  beforeText?: string;
  afterText?: string;
}): Promise<{ text: string }> {
  const { data } = await apiClient.post<{ text: string }>("/api/transcribe", {
    audio: params.audioBase64,
    language: params.language ?? ["en"],
    before_text: params.beforeText,
    after_text: params.afterText,
  });
  return data;
}

// --- Inquiries (partner, guided-start, contact) ---
export interface PartnerInquiryPayload {
  organization_name: string;
  organization_type?: string;
  portfolio_size?: string;
  primary_use_case?: string;
  contact_email: string;
  notes?: string;
}

export interface GuidedStartRequestPayload {
  organization?: string;
  team_size?: string;
  primary_challenge?: string;
  email: string;
  preferred_onboarding_type?: string;
}

export interface ContactInquiryPayload {
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  reason?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
}

export async function postPartnerInquiry(payload: PartnerInquiryPayload): Promise<{ ok: boolean; id: number }> {
  const { data } = await apiClient.post<{ ok: boolean; id: number }>("/api/inquiries/partner", payload);
  return data;
}

export async function postGuidedStartRequest(payload: GuidedStartRequestPayload): Promise<{ ok: boolean; id: number }> {
  const { data } = await apiClient.post<{ ok: boolean; id: number }>("/api/inquiries/guided-start", payload);
  return data;
}

export async function postContactInquiry(payload: ContactInquiryPayload): Promise<{ ok: boolean; id: number }> {
  const { data } = await apiClient.post<{ ok: boolean; id: number }>("/api/inquiries/contact", payload);
  return data;
}
