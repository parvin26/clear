"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDecision } from "@/lib/clear-api";
import type { DecisionOut } from "@/lib/clear-api";
import { Loader2 } from "lucide-react";

interface DecisionSnapshot {
  decision_statement?: string;
  why_now?: string[];
  key_constraints?: string[];
  success_metric?: string;
  timeframe?: string;
}

function SnapshotBlock({ snapshot }: { snapshot: DecisionSnapshot }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4 premium-shadow">
      <h3 className="text-lg font-semibold text-ink">Your decision snapshot</h3>
      {snapshot.decision_statement && (
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Decision</p>
          <p className="text-ink leading-relaxed">{snapshot.decision_statement}</p>
        </div>
      )}
      {snapshot.why_now && snapshot.why_now.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Why now</p>
          <ul className="list-disc pl-4 text-ink text-sm space-y-0.5">
            {snapshot.why_now.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.key_constraints && snapshot.key_constraints.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Key constraints</p>
          <ul className="list-disc pl-4 text-ink text-sm space-y-0.5">
            {snapshot.key_constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.success_metric && (
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">How success looks</p>
          <p className="text-ink text-sm">{snapshot.success_metric}</p>
        </div>
      )}
      {snapshot.timeframe && (
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Timeframe</p>
          <p className="text-ink text-sm">{snapshot.timeframe}</p>
        </div>
      )}
    </div>
  );
}

export default function DiagnosticResultPage() {
  const params = useParams();
  const runId = params.run_id as string;
  const [decision, setDecision] = useState<DecisionOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    getDecision(runId)
      .then(setDecision)
      .catch(() => setError("Could not load decision record."))
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </Shell>
    );
  }

  if (error || !decision) {
    return (
      <Shell>
        <div className="min-h-screen flex flex-col px-6 py-12 bg-background">
          <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
            <p className="text-ink-muted">{error || "Decision not found."}</p>
            <Button variant="outline" asChild>
              <Link href="/diagnostic">Run diagnostic</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const artifact = decision.latest_artifact as Record<string, unknown> | null | undefined;
  const decisionSnapshot = artifact?.decision_snapshot as DecisionSnapshot | undefined;
  const decisionContext = artifact?.decision_context as Record<string, unknown> | undefined;
  const primaryDomain = (decisionContext?.primary_domain as string) ?? "coo";

  return (
    <Shell>
      <div className="min-h-screen flex flex-col px-4 py-12 bg-background">
        <div className="w-full max-w-4xl mx-auto flex-1">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Decision snapshot */}
            <div>
              {decisionSnapshot && Object.keys(decisionSnapshot).length > 0 ? (
                <SnapshotBlock snapshot={decisionSnapshot} />
              ) : (
                <div className="bg-surface border border-border rounded-lg p-6 premium-shadow">
                  <h3 className="text-lg font-semibold text-ink mb-2">Your decision snapshot</h3>
                  <p className="text-sm text-ink-muted">
                    Your situation has been recorded. Open the Decision Workspace to see the full snapshot and plan.
                  </p>
                </div>
              )}
            </div>

            {/* Right: What happens next */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-ink">What would you like to do next?</h2>

              <div className="space-y-4">
                <Card className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Explore playbooks and examples</CardTitle>
                    <p className="text-sm text-ink-muted font-normal">
                      See curated playbooks and resources for decisions like yours.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm">
                      <Link href={`/resources?decision_id=${runId}&primary_domain=${primaryDomain}`}>
                        Open playbooks
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Ask an AI advisor</CardTitle>
                    <p className="text-sm text-ink-muted font-normal">
                      Chat with a CFO/COO‑style advisor that knows this decision and your plan.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm">
                      <Link href={`/decisions/${runId}?tab=chat&from_diagnostic=1`}>
                        Open advisor chat
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Get a human review</CardTitle>
                    <p className="text-sm text-ink-muted font-normal">
                      Share this decision with a human advisor for a second opinion.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm">
                      <Link href={`/human-review?decision_id=${runId}`}>
                        Request human review
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/decisions/${runId}`}>Open Decision Workspace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
