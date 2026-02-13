"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ACTIVATION_STEP_COUNT, ACTIVATION_CYCLE_DAYS, type ActivationProgress } from "@/lib/activation";

interface ActivationWidgetProps {
  progress: ActivationProgress;
}

export function ActivationWidget({ progress }: ActivationWidgetProps) {
  if (progress.allComplete) return null;

  const percent = Math.round((progress.completedCount / ACTIVATION_STEP_COUNT) * 100);
  const daysRemaining = Math.max(0, ACTIVATION_CYCLE_DAYS - progress.daysSinceStart);

  return (
    <Card className="bg-white border border-border shadow-sm rounded-lg">
      <CardContent className="pt-5 pb-5">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
          Your first CLEAR cycle
        </h2>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-ink shrink-0">{percent}%</span>
        </div>
        <p className="text-sm text-ink mb-1">Next step: {progress.nextActionLabel}</p>
        {daysRemaining > 0 && (
          <p className="text-xs text-ink-muted mb-3">{daysRemaining} days remaining in first cycle</p>
        )}
        <Button size="sm" className="w-full" asChild>
          <Link href={progress.nextActionHref}>Continue activation</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
