"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { ConvertToDecisionCTA } from "@/components/clear-blocks/ConvertToDecisionCTA";
import { AnalysisSummary } from "@/components/cto/AnalysisSummary";
import { RisksList } from "@/components/cto/RisksList";
import { RecommendationsList } from "@/components/cto/RecommendationsList";
import { ActionPlanTimeline } from "@/components/cto/ActionPlanTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ctoApi } from "@/lib/api";
import type { CTOAnalysisResponse } from "@/lib/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CTOAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const id = parseInt(params.id as string);
        const data = await ctoApi.getAnalysis(id);
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Analysis not found"}</p>
            <Button onClick={() => router.push("/cto")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to CTO
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-6">
        <ConvertToDecisionCTA domain="cto" analysisId={analysis.id} />

        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.push("/cto")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to CTO
            </Button>
            <h1 className="text-3xl font-bold mt-4">Analysis Report</h1>
            <p className="text-muted-foreground mt-2">
              Generated on {format(new Date(analysis.created_at), "PPp")}
            </p>
          </div>
        </div>

        <AnalysisSummary analysis={analysis.analysis} />
        <RisksList risks={analysis.analysis.risks} />
        <RecommendationsList recommendations={analysis.analysis.recommendations} />
        <ActionPlanTimeline actionPlan={analysis.analysis.action_plan} />
      </div>
    </Shell>
  );
}

