"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { ConvertToDecisionCTA } from "@/components/clear-blocks/ConvertToDecisionCTA";
import { getCooAnalysis } from "@/lib/api";
import { AnalysisSummary } from "@/components/coo/AnalysisSummary";
import { RecommendationsList } from "@/components/coo/RecommendationsList";
import { ActionPlanTimeline } from "@/components/coo/ActionPlanTimeline";
import { ChatInterface } from "@/components/coo/ChatInterface";
import { Loader2 } from "lucide-react";

export default function COOAnalysisDetailPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const id = Number(params.id);
        if (Number.isNaN(id)) {
          setError("Invalid analysis ID");
          return;
        }
        const data = await getCooAnalysis(id);
        setAnalysis(data);
      } catch (err) {
        setError("Failed to load analysis");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-red-600">{error || "Analysis not found"}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        <ConvertToDecisionCTA domain="coo" analysisId={analysis.id} />
        <AnalysisSummary analysis={analysis} />
        <div className="grid gap-6 md:grid-cols-2">
          <RecommendationsList title="Key Risks" items={analysis.risks} />
          <RecommendationsList
            title="Recommendations"
            items={analysis.recommendations}
          />
        </div>
        <ActionPlanTimeline actionPlan={analysis.action_plan} />
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">Ask about this analysis</h2>
          <ChatInterface analysisId={analysis.id} />
        </div>
      </div>
    </Shell>
  );
}

