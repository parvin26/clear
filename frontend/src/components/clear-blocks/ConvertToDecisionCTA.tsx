"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Loader2, ClipboardList } from "lucide-react";
import { bootstrapDraftFromAnalysis } from "@/lib/clear-api";

type Domain = "cfo" | "cmo" | "coo" | "cto";

interface ConvertToDecisionCTAProps {
  domain: Domain;
  analysisId: number;
  enterpriseId?: number;
}

export function ConvertToDecisionCTA({
  domain,
  analysisId,
  enterpriseId,
}: ConvertToDecisionCTAProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setError(null);
    setSubmitting(true);
    try {
      const decision = await bootstrapDraftFromAnalysis({
        domain,
        analysis_id: analysisId,
        enterprise_id: enterpriseId,
      });
      router.push(`/decisions/${decision.decision_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create decision workspace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-ink">Convert to decision workspace</h2>
              <p className="text-sm text-ink-muted">
                Turn this analysis into a governed CLEAR decision and track execution.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleConvert}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ClipboardList className="h-4 w-4" aria-hidden />
              )}
              Convert to decision workspace
            </Button>
            <Button variant="outline" size="default" asChild>
              <Link href="/diagnostic">Start diagnostic</Link>
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
