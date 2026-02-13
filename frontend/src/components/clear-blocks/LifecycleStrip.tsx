"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const STEPS = [
  { label: "Describe the situation", key: "intake" },
  { label: "Clarify priorities", key: "diagnose" },
  { label: "Commit decision", key: "decide" },
  { label: "Assign milestones", key: "execute" },
  { label: "Track progress", key: "review" },
  { label: "Capture outcomes", key: "learn" },
];

export interface LifecycleStripProps {
  /** Show as compact horizontal strip (e.g. homepage) or with more spacing */
  variant?: "compact" | "default";
  /** Optional CTA at the end */
  showCta?: boolean;
  className?: string;
}

export function LifecycleStrip({ variant = "default", showCta = false, className = "" }: LifecycleStripProps) {
  const isCompact = variant === "compact";

  return (
    <div className={className}>
      <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 ${isCompact ? "justify-center" : ""}`}>
        {STEPS.map((step, i) => (
          <span key={step.key} className="flex items-center gap-x-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary md:px-3 md:py-1.5 md:text-sm">
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
            )}
          </span>
        ))}
      </div>
      {showCta && (
        <div className="mt-4 flex justify-center">
          <Link
            href="/start"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Start diagnostic
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
