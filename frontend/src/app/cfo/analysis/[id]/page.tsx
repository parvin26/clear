"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AnalysisSummary } from "@/components/cfo/AnalysisSummary";
import { RecommendationsList } from "@/components/cfo/RecommendationsList";
import { ActionPlanTimeline } from "@/components/cfo/ActionPlanTimeline";
import { ConvertToDecisionCTA } from "@/components/clear-blocks/ConvertToDecisionCTA";
import { getCfoAnalysis } from "@/lib/api";
import type { CFOAnalysisOut } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function AnalysisPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [analysis, setAnalysis] = useState<CFOAnalysisOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const data = await getCfoAnalysis(id);
        setAnalysis(data);
      } catch (err) {
        setError("Failed to load analysis");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-destructive">{error || "Analysis not found"}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl">
        <ConvertToDecisionCTA domain="cfo" analysisId={analysis.id} />

        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Analysis</h1>
          <p className="text-muted-foreground">
            Generated on {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>

        <AnalysisSummary analysis={analysis} />
        <RecommendationsList
          risks={analysis.risks}
          recommendations={analysis.recommendations}
        />
        <ActionPlanTimeline actionPlan={analysis.action_plan} />
      </div>
    </Shell>
  );
}

