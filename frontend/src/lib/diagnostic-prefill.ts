import type { PrimaryDomain } from "./diagnostic-types";
import type { DiagnosticData } from "./diagnostic-types";

export const PREFILL_KEY = "clear_diagnostic_prefill";

export interface DiagnosticPrefill {
  fromCapabilityDiagnostic: true;
  domain: PrimaryDomain;
  diagnosticData: DiagnosticData;
}

export function getDiagnosticPrefill(): DiagnosticPrefill | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiagnosticPrefill;
    return parsed.fromCapabilityDiagnostic ? parsed : null;
  } catch {
    return null;
  }
}

export function setDiagnosticPrefill(domain: PrimaryDomain, diagnosticData: DiagnosticData) {
  try {
    localStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({ fromCapabilityDiagnostic: true as const, domain, diagnosticData })
    );
  } catch (_) {}
}

export function clearDiagnosticPrefill() {
  try {
    localStorage.removeItem(PREFILL_KEY);
  } catch (_) {}
}
