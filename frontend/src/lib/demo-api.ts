/** CLEAR demo mode API: read-only fixtures. */
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface DemoEnterprise {
  id: string;
  name: string;
  industry: string;
  size: string;
  country: string;
  summary: string;
  readiness_band: string;
}

export interface DemoDecision {
  id: string;
  enterprise_id: string;
  domain: string;
  situation_summary: string;
  decision_statement: string;
  constraints: string;
  assumptions: string;
  status: "active" | "completed";
}

export interface DemoMilestone {
  id: string;
  decision_id: string;
  milestone_title: string;
  owner_name: string;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed";
  progress_percent: number;
  evidence_link: string | null;
}

export interface DemoOutcome {
  id: string;
  decision_id: string;
  expected_metric: string | null;
  achieved_metric: string | null;
  lessons_learned: string | null;
  review_date: string | null;
  next_review_date: string | null;
}

export interface DemoSharing {
  id: string;
  enterprise_id: string;
  partner_name: string;
  visibility_scope: "decision_only" | "execution" | "outcomes";
  access_expiry: string;
  status: "active" | "revoked";
}

export interface DemoMemorySnippet {
  id: string;
  enterprise_id: string;
  decision_id: string;
  what_we_learned: string;
  what_to_reuse_next_time: string;
  related_decisions: string[];
}

export interface DemoEnterprisePortfolioRow extends DemoEnterprise {
  review_due?: boolean;
  execution_stalled?: boolean;
  shared_scopes?: string[];
}

export interface DemoPortfolio {
  id: string;
  partner_name: string;
  portfolio_name: string;
  enterprises: string[];
  enterprise_details?: DemoEnterprisePortfolioRow[];
}

export interface DemoOverview {
  demo: boolean;
  enterprises: DemoEnterprise[];
  portfolios: DemoPortfolio[];
  message: string;
}

export interface DemoEnterpriseDetail {
  demo: boolean;
  enterprise: DemoEnterprise;
  decisions: DemoDecision[];
  milestones: DemoMilestone[];
  outcomes: DemoOutcome[];
  sharing: DemoSharing[];
  memory_snippets?: DemoMemorySnippet[];
}

export interface DemoPortfolioResponse {
  demo: boolean;
  portfolios: DemoPortfolio[];
}

export async function getDemoOverview(): Promise<DemoOverview> {
  const { data } = await client.get<DemoOverview>("/api/demo");
  return data;
}

export async function getDemoEnterprise(id: string): Promise<DemoEnterpriseDetail> {
  const { data } = await client.get<DemoEnterpriseDetail>(`/api/demo/enterprise/${id}`);
  return data;
}

export interface DemoPortfolioFilters {
  readiness_band?: string;
  review_due?: boolean;
  execution_stalled?: boolean;
}

export async function getDemoPortfolios(filters?: DemoPortfolioFilters): Promise<DemoPortfolioResponse> {
  const params = new URLSearchParams();
  if (filters?.readiness_band != null) params.set("readiness_band", filters.readiness_band);
  if (filters?.review_due != null) params.set("review_due", String(filters.review_due));
  if (filters?.execution_stalled != null) params.set("execution_stalled", String(filters.execution_stalled));
  const url = params.toString() ? `/api/demo/portfolio?${params.toString()}` : "/api/demo/portfolio";
  const { data } = await client.get<DemoPortfolioResponse>(url);
  return data;
}
