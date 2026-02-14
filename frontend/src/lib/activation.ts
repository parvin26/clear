/**
 * CLEAR Activation Engine: progress and nudges for first decision cycle.
 * Success state: one diagnostic, one finalized decision, milestones, progress update, review scheduled.
 */

import type {
  DecisionListItem,
  DecisionOut,
  MilestoneOut,
  EnterpriseActivationOut,
} from "@/lib/clear-api";

export const ACTIVATION_STEP_COUNT = 5;

export const ACTIVATION_STEPS = [
  { key: "describe", label: "Describe your situation", href: "/diagnostic" },
  { key: "diagnostic", label: "Run diagnostic", href: "/diagnostic" },
  { key: "finalize", label: "Finalize first decision", href: "/decisions" },
  { key: "milestones", label: "Assign execution milestones", href: "/decisions" },
  { key: "review", label: "Schedule review", href: "/decisions" },
] as const;

export type ActivationStepKey = (typeof ACTIVATION_STEPS)[number]["key"];

export interface ActivationProgress {
  completedSteps: ActivationStepKey[];
  completedCount: number;
  nextStep: (typeof ACTIVATION_STEPS)[number] | null;
  nextActionHref: string;
  nextActionLabel: string;
  allComplete: boolean;
  workspaceCreatedAt: Date | null;
  daysSinceStart: number;
}

function isFinalized(status: string): boolean {
  const s = (status || "").toLowerCase();
  return s === "finalized" || s === "signed_off" || s === "approved";
}

function hasReviewScheduled(
  artifact: Record<string, unknown> | null | undefined,
  outcomeReviewReminder?: boolean
): boolean {
  if (outcomeReviewReminder === true) return true;
  if (!artifact) return false;
  const emr = (artifact.emr as Record<string, unknown> | undefined) || {};
  const config = (emr.config as { next_review_date?: string | null }) || {};
  const next = config.next_review_date;
  return typeof next === "string" && next.trim() !== "";
}

/**
 * Compute activation progress from decisions, their details, and milestones.
 */
export function computeActivationProgress(
  decisions: DecisionListItem[],
  decisionsWithDetail: Record<string, DecisionOut>,
  allMilestones: { decision_id: string; id: number }[]
): ActivationProgress {
  const completedSteps: ActivationStepKey[] = [];
  const hasAnyDecision = decisions.length > 0;

  // Step 1 & 2: Describe situation / Run diagnostic; has at least one decision (from diagnostic or created)
  if (hasAnyDecision) {
    completedSteps.push("describe", "diagnostic");
  }

  let hasFinalized = false;
  let hasMilestones = false;
  let hasReview = false;
  let firstCreatedAt: string | null = null;

  decisions.forEach((d) => {
    const dec = decisionsWithDetail[d.decision_id];
    if (dec?.current_status && isFinalized(dec.current_status)) hasFinalized = true;
    const artifact = dec?.latest_artifact as Record<string, unknown> | undefined;
    const reminder = (dec as { outcome_review_reminder?: boolean } | undefined)?.outcome_review_reminder;
    if (hasReviewScheduled(artifact, reminder)) hasReview = true;
    if (!firstCreatedAt || (d.created_at && d.created_at < firstCreatedAt)) firstCreatedAt = d.created_at || null;
  });
  const milestoneCountByDecision = new Map<string, number>();
  allMilestones.forEach((m) => {
    milestoneCountByDecision.set(m.decision_id, (milestoneCountByDecision.get(m.decision_id) || 0) + 1);
  });
  milestoneCountByDecision.forEach((count) => {
    if (count >= 1) hasMilestones = true;
  });

  if (hasFinalized) completedSteps.push("finalize");
  if (hasMilestones) completedSteps.push("milestones");
  if (hasReview) completedSteps.push("review");

  const completedCount = completedSteps.length;
  const nextStep = ACTIVATION_STEPS[completedCount] ?? null;
  const allComplete = completedCount >= ACTIVATION_STEP_COUNT;

  const workspaceCreatedAt = firstCreatedAt ? new Date(firstCreatedAt) : null;
  const daysSinceStart = workspaceCreatedAt
    ? Math.floor((Date.now() - workspaceCreatedAt.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  let nextActionHref: string = "/diagnostic";
  let nextActionLabel: string = "Run diagnostic";
  if (nextStep) {
    nextActionHref = nextStep.href;
    nextActionLabel = nextStep.label;
    if (nextStep.key === "finalize" && decisions[0]) {
      nextActionHref = `/decisions/${decisions[0].decision_id}`;
      nextActionLabel = "Finalize first decision";
    } else if (nextStep.key === "milestones" && decisions[0]) {
      nextActionHref = `/decisions/${decisions[0].decision_id}?tab=execution`;
      nextActionLabel = "Assign execution milestones";
    } else if (nextStep.key === "review" && decisions[0]) {
      nextActionHref = `/decisions/${decisions[0].decision_id}?tab=execution`;
      nextActionLabel = "Schedule review";
    }
  }

  return {
    completedSteps,
    completedCount,
    nextStep,
    nextActionHref,
    nextActionLabel,
    allComplete,
    workspaceCreatedAt,
    daysSinceStart,
  };
}

const NUDGE_DAYS = [2, 4, 7, 10, 12] as const;
const NUDGE_MESSAGES: Record<number, string> = {
  2: "Run your first diagnostic",
  4: "Finalize your first decision",
  7: "Assign milestones to begin execution",
  10: "Update progress on at least one milestone",
  12: "Schedule your first review",
};

/**
 * Get nudge message for a given day (1-based). Returns message if this day has a nudge.
 */
export function getNudgeForDay(day: number): string | null {
  return NUDGE_DAYS.includes(day as (typeof NUDGE_DAYS)[number]) ? NUDGE_MESSAGES[day] ?? null : null;
}

/** Which step each nudge day corresponds to (so we skip if already complete). */
const NUDGE_DAY_TO_STEP: Partial<Record<number, ActivationStepKey>> = {
  2: "diagnostic",
  4: "finalize",
  7: "milestones",
  10: "milestones", // progress update - we don't have a separate step; show milestones nudge
  12: "review",
};

/**
 * Get the nudge for the current day index (daysSinceStart). If today is a nudge day and the user
 * hasn't completed the corresponding step, return the message.
 */
export function getCurrentNudge(
  daysSinceStart: number,
  progress: ActivationProgress
): { message: string; day: number } | null {
  const message = getNudgeForDay(daysSinceStart);
  if (!message) return null;
  const stepForDay = NUDGE_DAY_TO_STEP[daysSinceStart];
  if (stepForDay && progress.completedSteps.includes(stepForDay)) return null;
  return { message, day: daysSinceStart };
}

export const ACTIVATION_CYCLE_DAYS = 14;

/**
 * Map server activation (enterprise created_at–based) to ActivationProgress for checklist/nudge/widget.
 * Use when the app has a current enterprise (e.g. dashboard with decisions[0].enterprise_id).
 */
export function mapEnterpriseActivationToProgress(
  server: EnterpriseActivationOut,
  firstDecisionId?: string | null
): ActivationProgress {
  const completedSteps = (server.completed_steps || []) as ActivationStepKey[];
  const completedCount = server.completed_count ?? completedSteps.length;
  const nextStepKey = server.next_step_key ?? null;
  const nextStep = nextStepKey
    ? ACTIVATION_STEPS.find((s) => s.key === nextStepKey) ?? null
    : (ACTIVATION_STEPS[completedCount] ?? null);
  let nextActionHref: string = nextStep?.href ?? "/diagnostic";
  let nextActionLabel: string = nextStep?.label ?? "Run diagnostic";
  if (nextStep && firstDecisionId) {
    if (nextStep.key === "finalize") {
      nextActionHref = `/decisions/${firstDecisionId}`;
      nextActionLabel = "Finalize first decision";
    } else if (nextStep.key === "milestones") {
      nextActionHref = `/decisions/${firstDecisionId}?tab=execution`;
      nextActionLabel = "Assign execution milestones";
    } else if (nextStep.key === "review") {
      nextActionHref = `/decisions/${firstDecisionId}?tab=execution`;
      nextActionLabel = "Schedule review";
    }
  }
  const workspaceCreatedAt = server.workspace_created_at
    ? new Date(server.workspace_created_at)
    : null;
  const daysSinceStart = server.days_since_start ?? 0;
  return {
    completedSteps,
    completedCount,
    nextStep,
    nextActionHref,
    nextActionLabel,
    allComplete: server.all_complete ?? completedCount >= ACTIVATION_STEP_COUNT,
    workspaceCreatedAt,
    daysSinceStart,
  };
}
