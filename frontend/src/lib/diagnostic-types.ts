/** General diagnostic wizard data (10-step flow; step 1 = operating/revenue gate). */

/** Tie-breaker for primary domain when severity is close. */
export type MostUrgent = "survive_cash" | "fix_ops" | "grow_demand" | "";

/** Optional goal for this decision; biases snapshot/primary domain. */
export type DiagnosticGoal = "improve_cash_flow" | "scale_operations" | "investor_ready" | "";

export interface DiagnosticData {
  /** "yes" = operating, "no" = idea/validation stage (off-ramp). */
  operatingAndRevenue: "" | "yes" | "no";
  businessStage: string;
  situationDescription: string;
  situationClarifiers: string[];
  /** What feels most urgent? Used as tie-breaker for primary domain. */
  mostUrgent: MostUrgent;
  /** Main goal for this decision; optional bias for primary domain / snapshot. */
  diagnosticGoal: DiagnosticGoal;
  decisionHorizon: string;
  clarityLevel: string;
  dataAvailable: string[];
  riskLevel: string;
}

export const INITIAL_DIAGNOSTIC_DATA: DiagnosticData = {
  operatingAndRevenue: "",
  businessStage: "",
  situationDescription: "",
  situationClarifiers: [],
  mostUrgent: "",
  diagnosticGoal: "",
  decisionHorizon: "",
  clarityLevel: "",
  dataAvailable: [],
  riskLevel: "",
};

export type PrimaryDomain = "cfo" | "cmo" | "coo" | "cto";

/** Derive primary domain from wizard answers for Option B (single agent call). */
export function getPrimaryDomain(data: DiagnosticData): PrimaryDomain {
  const clarifiers = data.situationClarifiers.join(" ").toLowerCase();
  const situation = (data.situationDescription || "").toLowerCase();
  const combined = `${clarifiers} ${situation}`;

  if (
    combined.includes("cash") ||
    combined.includes("paying") ||
    combined.includes("revenue") ||
    combined.includes("cost") ||
    data.riskLevel === "Cash stress"
  ) {
    return "cfo";
  }
  if (
    combined.includes("sales") ||
    combined.includes("declining") ||
    combined.includes("growth") ||
    combined.includes("customer")
  ) {
    return "cmo";
  }
  if (
    combined.includes("operation") ||
    combined.includes("messy") ||
    combined.includes("process") ||
    combined.includes("supply")
  ) {
    return "coo";
  }
  if (
    combined.includes("tech") ||
    combined.includes("system") ||
    combined.includes("digital") ||
    combined.includes("infrastructure")
  ) {
    return "cto";
  }
  return "coo";
}
