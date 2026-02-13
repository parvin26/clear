/**
 * Minimal analytics: send events to backend /api/telemetry/events (stored in DB).
 * Use for conversion and activation tracking without external tooling at launch.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const ANALYTICS_EVENTS = {
  marketing_get_started_clicked: "marketing_get_started_clicked",
  diagnostic_started: "diagnostic_started",
  diagnostic_completed: "diagnostic_completed",
  decision_finalized: "decision_finalized",
  milestone_progress_updated: "milestone_progress_updated",
  review_scheduled: "review_scheduled",
  partner_inquiry_submitted: "partner_inquiry_submitted",
  guided_start_submitted: "guided_start_submitted",
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Fire an event to the backend. Non-blocking; failures are ignored.
 * Call from /start and homepage CTA, diagnostic flows, decision finalize, etc.
 */
export function trackEvent(
  eventName: AnalyticsEventName | string,
  properties?: AnalyticsProperties
): void {
  if (typeof window === "undefined") return;
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("clear_access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  fetch(`${API_BASE}/api/telemetry/events`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event_name: eventName,
      properties: properties ?? {},
    }),
    keepalive: true,
  }).catch(() => {
    // Ignore network/backend errors for analytics
  });
}

/**
 * Report a frontend error to the backend for monitoring.
 */
export function reportError(payload: {
  message?: string;
  stack?: string;
  path?: string;
}): void {
  if (typeof window === "undefined") return;
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("clear_access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  fetch(`${API_BASE}/api/telemetry/errors`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: payload.message,
      stack: payload.stack,
      path: payload.path ?? (typeof window !== "undefined" ? window.location?.pathname : undefined),
    }),
    keepalive: true,
  }).catch(() => {});
}
