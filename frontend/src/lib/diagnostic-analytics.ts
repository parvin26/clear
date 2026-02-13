/**
 * Lightweight event tracking for diagnostic and decision flows.
 * Replace with your analytics provider (e.g. segment, mixpanel) by swapping the implementation.
 */

export type DiagnosticEvent =
  | "diagnostic_started"
  | "diagnostic_completed"
  | "agent_diagnose_success"
  | "agent_diagnose_failure"
  | "bootstrap_success"
  | "opened_decision_workspace"
  | "returned_to_previous_decision";

export type EventPayload = {
  diagnostic_started?: {};
  diagnostic_completed?: { decision_id: string };
  agent_diagnose_success?: { domain: string; analysis_id: number };
  agent_diagnose_failure?: { domain: string; error?: string };
  bootstrap_success?: { decision_id: string; domain: string };
  opened_decision_workspace?: { decision_id: string };
  returned_to_previous_decision?: { decision_id: string };
};

function emit(event: DiagnosticEvent, payload?: EventPayload[DiagnosticEvent]) {
  try {
    if (typeof window === "undefined") return;
    const detail = { event, payload, ts: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent("clear_analytics", { detail }));
    if (process.env.NODE_ENV === "development") {
      console.debug("[CLEAR analytics]", event, payload);
    }
  } catch (_) {}
}

export function trackDiagnosticStarted() {
  emit("diagnostic_started");
}

export function trackDiagnosticCompleted(decisionId: string) {
  emit("diagnostic_completed", { decision_id: decisionId });
}

export function trackAgentDiagnoseSuccess(domain: string, analysisId: number) {
  emit("agent_diagnose_success", { domain, analysis_id: analysisId });
}

export function trackAgentDiagnoseFailure(domain: string, error?: string) {
  emit("agent_diagnose_failure", { domain, error });
}

export function trackBootstrapSuccess(decisionId: string, domain: string) {
  emit("bootstrap_success", { decision_id: decisionId, domain });
}

export function trackOpenedDecisionWorkspace(decisionId: string) {
  emit("opened_decision_workspace", { decision_id: decisionId });
}

export function trackReturnedToPreviousDecision(decisionId: string) {
  emit("returned_to_previous_decision", { decision_id: decisionId });
}
