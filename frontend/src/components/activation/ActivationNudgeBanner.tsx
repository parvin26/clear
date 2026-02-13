"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentNudge, ACTIVATION_CYCLE_DAYS, type ActivationProgress } from "@/lib/activation";

interface ActivationNudgeBannerProps {
  progress: ActivationProgress;
}

export function ActivationNudgeBanner({ progress }: ActivationNudgeBannerProps) {
  if (progress.allComplete) return null;
  const nudge = getCurrentNudge(progress.daysSinceStart, progress);
  if (!nudge) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-ink">
        Day {nudge.day}: {nudge.message}
      </p>
      <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
        <Link href={progress.nextActionHref}>{progress.nextActionLabel}</Link>
      </Button>
    </div>
  );
}

export function ActivationDaysRemaining({ progress }: { progress: ActivationProgress }) {
  if (progress.allComplete) return null;
  const remaining = ACTIVATION_CYCLE_DAYS - progress.daysSinceStart;
  if (remaining <= 0) return null;
  return (
    <span className="text-xs text-ink-muted">
      {remaining} day{remaining !== 1 ? "s" : ""} left in first cycle
    </span>
  );
}
