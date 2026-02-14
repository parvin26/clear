"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  getCapabilityFinancingReadiness,
  getCapabilityScores,
  type FinancingReadinessItem,
  type CapabilityScoreItem,
} from "@/lib/api";
import {
  getEnterprise,
  getEnterpriseHealthScore,
  getEnterpriseReadinessIndex,
  type EnterpriseHealthScore,
  type EnterpriseReadinessIndex,
} from "@/lib/clear-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus, ChevronRight, BarChart3 } from "lucide-react";

/**
 * Phase 3: Enterprise Dashboard (read-only).
 * Data: financing-readiness (latest only) + capability scores (time series table).
 * Rows in capability table: reverse-chronological (newest first, per backend order).
 */
export default function EnterpriseDashboardPage() {
  const params = useParams();
  const enterpriseId = Number(params.enterpriseId);
  const [financing, setFinancing] = useState<FinancingReadinessItem[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityScoreItem[]>([]);
  const [enterpriseName, setEnterpriseName] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<EnterpriseHealthScore | null>(null);
  const [readinessIndex, setReadinessIndex] = useState<EnterpriseReadinessIndex | null>(null);
  const [showReadinessBreakdown, setShowReadinessBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(enterpriseId)) {
      setError("Invalid enterprise ID");
      setLoading(false);
      return;
    }
    Promise.all([
      getCapabilityFinancingReadiness(enterpriseId),
      getCapabilityScores(enterpriseId),
      getEnterprise(enterpriseId).then((e) => e.name ?? null).catch(() => null),
      getEnterpriseHealthScore(enterpriseId).catch(() => null),
      getEnterpriseReadinessIndex(enterpriseId).catch(() => null),
    ])
      .then(([fr, cap, name, health, ecri]) => {
        setFinancing(fr);
        setCapabilities(cap);
        setEnterpriseName(name);
        setHealthScore(health ?? null);
        setReadinessIndex(ecri ?? null);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, [enterpriseId]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Enterprise Dashboard</h1>
          <p className="text-destructive">{error}</p>
        </div>
      </Shell>
    );
  }

  const latestFinancing = financing[0] ?? null;

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enterprise Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enterpriseName ? `${enterpriseName} (ID: ${enterpriseId})` : `Enterprise ID: ${enterpriseId}`} · Read-only
          </p>
        </div>

        {/* Execution Capital Readiness Index (ECRI) */}
        {readinessIndex && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Capital Readiness Index
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReadinessBreakdown((v) => !v)}
                  className="text-sm"
                >
                  {showReadinessBreakdown ? "Hide" : "View readiness breakdown"}
                  <ChevronRight className={`h-4 w-4 inline transition-transform ${showReadinessBreakdown ? "rotate-90" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-ink">{readinessIndex.readiness_index}</span>
                <span className="text-ink-muted">/ 100</span>
                <span className="text-sm font-medium text-ink-muted">· {readinessIndex.readiness_band}</span>
                {readinessIndex.trend_direction === "Improving" && <TrendingUp className="h-5 w-5 text-success" aria-label="Improving" />}
                {readinessIndex.trend_direction === "Declining" && <TrendingDown className="h-5 w-5 text-danger" aria-label="Declining" />}
                {readinessIndex.trend_direction === "Stable" && <Minus className="h-5 w-5 text-ink-muted" aria-label="Stable" />}
                {readinessIndex.trend_direction && readinessIndex.trend_direction !== "Stable" && (
                  <span className="text-xs text-ink-muted">{readinessIndex.trend_direction}</span>
                )}
              </div>
              {showReadinessBreakdown && (
                <div id="readiness-breakdown" className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Sub-breakdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-ink-muted block">Activation</span>
                      <span className="font-medium">{readinessIndex.activation_component} / 20</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block">Health</span>
                      <span className="font-medium">{readinessIndex.health_component} / 35</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block">Velocity</span>
                      <span className="font-medium">{readinessIndex.velocity_component} / 25</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block">Governance maturity</span>
                      <span className="font-medium">{readinessIndex.governance_component} / 20</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enterprise Health Score */}
        {healthScore && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Enterprise Health Score</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/decisions" className="text-sm">
                    View details <ChevronRight className="h-4 w-4 inline" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-ink">{healthScore.total_score}</span>
                <span className="text-ink-muted">/ 100</span>
                {healthScore.trend_direction === "up" && <TrendingUp className="h-5 w-5 text-success" aria-label="Improved" />}
                {healthScore.trend_direction === "down" && <TrendingDown className="h-5 w-5 text-danger" aria-label="Declining" />}
                {healthScore.trend_direction === null && <Minus className="h-5 w-5 text-ink-muted" aria-label="No change" />}
              </div>
              <p className="text-sm font-medium text-ink">{healthScore.status_label}</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-ink-muted">
                <span>Execution: {healthScore.execution_score} / {healthScore.execution_max}</span>
                <span>Governance: {healthScore.governance_score} / {healthScore.governance_max}</span>
                <span>Learning: {healthScore.learning_score} / {healthScore.learning_max}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section A: Financing Readiness (latest only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financing Readiness (Latest)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latestFinancing && (
              <p className="text-muted-foreground text-sm">No financing readiness data.</p>
            )}
            {latestFinancing && (
              <>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">readiness_score</span>
                    <span className="ml-2 font-mono">{String(latestFinancing.readiness_score)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">computed_at</span>
                    <span className="ml-2">{latestFinancing.computed_at ?? "-"}</span>
                  </div>
                </div>
                {latestFinancing.flags_json && latestFinancing.flags_json.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-1">flags_json</span>
                    <ul className="list-disc list-inside text-sm">
                      {latestFinancing.flags_json.map((f, i) => (
                        <li key={i}>{String(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Section B: Capability Scores (time series table, reverse-chronological) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capability Scores (Time Series)</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">Reverse-chronological (newest first).</p>
          </CardHeader>
          <CardContent>
            {capabilities.length === 0 && (
              <p className="text-muted-foreground text-sm">No capability scores.</p>
            )}
            {capabilities.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left font-medium">Capability name</th>
                      <th className="border border-gray-200 p-2 text-left font-medium">Domain</th>
                      <th className="border border-gray-200 p-2 text-right font-medium">Score</th>
                      <th className="border border-gray-200 p-2 text-right font-medium">Confidence</th>
                      <th className="border border-gray-200 p-2 text-left font-medium">Computed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capabilities.map((row) => (
                      <tr key={row.id} className="border-b border-gray-200">
                        <td className="border border-gray-200 p-2">{row.capability_name ?? row.capability_code ?? row.capability_id}</td>
                        <td className="border border-gray-200 p-2">{row.domain ?? "-"}</td>
                        <td className="border border-gray-200 p-2 text-right font-mono">{row.score}</td>
                        <td className="border border-gray-200 p-2 text-right font-mono">{row.confidence ?? "-"}</td>
                        <td className="border border-gray-200 p-2">{row.computed_at ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
