"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCmoAnalysis } from "@/lib/api";
import { CMOAnalysisResponse } from "@/lib/types";
import { AnalysisSummary } from "@/components/cmo/AnalysisSummary";
import { RecommendationsList } from "@/components/cmo/RecommendationsList";
import { ActionPlanTimeline } from "@/components/cmo/ActionPlanTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { ConvertToDecisionCTA } from "@/components/clear-blocks/ConvertToDecisionCTA";

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CMOAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const id = parseInt(params.id as string);
        const data = await getCmoAnalysis(id);
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error || "Analysis not found"}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.back()}>Go Back</Button>
              <Link href="/cmo">
                <Button variant="outline">Back to CMO</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        <ConvertToDecisionCTA domain="cmo" analysisId={analysis.id} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Analysis</h1>
            <p className="text-gray-600 mt-1">
              Generated on {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cmo">
              <Button variant="outline">Back to CMO</Button>
            </Link>
            <Link href="/diagnostic">
              <Button variant="outline">Start diagnostic</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <AnalysisSummary analysis={analysis.analysis} />

          {/* Key Risks */}
          {analysis.analysis.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.analysis.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <RecommendationsList recommendations={analysis.analysis.recommendations} />
          <ActionPlanTimeline actionPlan={analysis.analysis.action_plan} />

        </div>
      </div>
    </Shell>
  );
}

