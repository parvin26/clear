"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  ACTIVATION_STEPS,
  ACTIVATION_STEP_COUNT,
  type ActivationProgress,
} from "@/lib/activation";

interface ActivationChecklistProps {
  progress: ActivationProgress;
  /** Optional: pass first decision id for contextual links */
  firstDecisionId?: string | null;
}

export function ActivationChecklist({ progress, firstDecisionId }: ActivationChecklistProps) {
  if (progress.allComplete) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 pb-6">
          <p className="font-semibold text-ink mb-1">First CLEAR cycle completed. Start next decision</p>
          <p className="text-sm text-ink-muted mb-4">
            You’ve run a diagnostic, finalized a decision, set milestones, and scheduled a review.
          </p>
          <Button asChild>
            <Link href="/diagnostic">Start next decision</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const baseHref = (stepKey: string) => {
    if (stepKey === "finalize" && firstDecisionId) return `/decisions/${firstDecisionId}`;
    if (stepKey === "milestones" && firstDecisionId) return `/decisions/${firstDecisionId}?tab=execution`;
    if (stepKey === "review" && firstDecisionId) return `/decisions/${firstDecisionId}?tab=execution`;
    const step = ACTIVATION_STEPS.find((s) => s.key === stepKey);
    return step?.href ?? "/diagnostic";
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6 pb-6">
        <p className="text-sm font-medium text-ink-muted mb-3">
          Activation progress: {progress.completedCount} / {ACTIVATION_STEP_COUNT} completed
        </p>
        <ul className="space-y-2 mb-4">
          {ACTIVATION_STEPS.map((step) => {
            const done = progress.completedSteps.includes(step.key);
            return (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-ink-muted"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : ACTIVATION_STEPS.indexOf(step) + 1}
                </span>
                <span className={done ? "text-ink-muted line-through" : "text-ink"}>{step.label}</span>
                {!done && (
                  <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-primary" asChild>
                    <Link href={baseHref(step.key)}>Do this</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {progress.nextStep && (
          <Button asChild>
            <Link href={progress.nextActionHref}>{progress.nextActionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
