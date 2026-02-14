"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, X, ChevronRight } from "lucide-react";

export type DemoTourStep = {
  section: string | null;
  title: string;
  body: string;
};

const LANDING_STEPS: DemoTourStep[] = [
  { section: "enterprises", title: "Three scenarios", body: "Manufacturing SME, professional services, and a founder-led startup. Pick one to see the full lifecycle." },
  { section: "portfolios", title: "Portfolio view", body: "Partners see readiness, review due, and stalled execution. Try the portfolio page to see what capital partners see." },
  { section: null, title: "Next step", body: "Open an enterprise to see: situation → decision → milestones → outcome → institutional memory → sharing." },
];

const ENTERPRISE_STEPS: DemoTourStep[] = [
  { section: "situation", title: "Situation record", body: "The context and problem that led to this decision." },
  { section: "decision", title: "Decision artifact", body: "The committed path: what we decided to do, with constraints and assumptions." },
  { section: "milestones", title: "Milestones and owners", body: "Execution broken into trackable steps with due dates and evidence." },
  { section: "outcome", title: "Outcome review", body: "What we expected vs achieved, and lessons learned." },
  { section: "institutional-memory", title: "Institutional memory", body: "What we learned and what to reuse next time. So it sticks." },
  { section: "sharing", title: "Controlled sharing", body: "Who can see what: decision only, execution, or outcomes. Enterprise-controlled." },
  { section: "portfolio-link", title: "Portfolio view", body: "Partners see all of this through the portfolio page. See how readiness and support signals work." },
];

type Variant = "landing" | "enterprise";

interface DemoTourProps {
  variant: Variant;
}

export function DemoTour({ variant }: DemoTourProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const steps = variant === "landing" ? LANDING_STEPS : ENTERPRISE_STEPS;

  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (step?.section) {
      const el = document.querySelector(`[data-demo-section="${step.section}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active, stepIndex, steps]);

  const current = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const startTour = () => {
    setActive(true);
    setStepIndex(0);
  };

  const closeTour = () => {
    setActive(false);
  };

  const finishTour = () => {
    setActive(false);
    setCompleted(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="fixed bottom-24 right-6 z-40 shadow-lg flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={startTour}
        style={{ display: active ? "none" : undefined }}
      >
        <Play className="h-4 w-4" />
        {completed ? "Restart tour" : "Start demo tour"}
      </Button>

      {active && current && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 md:items-center md:pb-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeTour} aria-hidden />
          <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-ink-muted">
                Step {stepIndex + 1} of {steps.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTour}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  Skip tour
                </button>
                <Button variant="ghost" size="sm" onClick={closeTour} aria-label="Close tour">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-ink mb-2">{current.title}</h3>
            <p className="text-sm text-ink-muted mb-4">{current.body}</p>
            <div className="flex justify-end gap-2">
              {isLast ? (
                <Button size="sm" onClick={finishTour}>
                  Done
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStepIndex((i) => i + 1)} className="flex items-center gap-1">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
