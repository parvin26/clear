"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  getEnterpriseSnapshot,
  getDecisionExportUrl,
  getEnterpriseExportUrl,
  triggerExportDownload,
  type EnterpriseSnapshot,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

/**
 * Phase 4: Screen C: Enterprise snapshot (read-only). Renders backend snapshot as-is.
 * Screen D: Export buttons: direct backend download (JSON/CSV).
 */
export default function EnterpriseSnapshotPage() {
  const params = useParams();
  const enterpriseId = Number(params.enterpriseId);
  const [snapshot, setSnapshot] = useState<EnterpriseSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(enterpriseId)) {
      setError("Invalid enterprise ID");
      setLoading(false);
      return;
    }
    getEnterpriseSnapshot(enterpriseId)
      .then(setSnapshot)
      .catch(() => setError("Failed to load snapshot"))
      .finally(() => setLoading(false));
  }, [enterpriseId]);

  const handleExportDecision = (decisionId: string, format: "json" | "csv") => {
    setExporting(`decision-${decisionId}-${format}`);
    const url = getDecisionExportUrl(decisionId, format);
    triggerExportDownload(url, `decision_${decisionId.slice(0, 8)}_export.${format}`)
      .finally(() => setExporting(null));
  };

  const handleExportEnterprise = (format: "json" | "csv") => {
    setExporting(`enterprise-${format}`);
    const url = getEnterpriseExportUrl(enterpriseId, format);
    triggerExportDownload(url, `enterprise_${enterpriseId}_export.${format}`)
      .finally(() => setExporting(null));
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error || !snapshot) {
    return (
      <Shell>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Enterprise Snapshot</h1>
          <p className="text-destructive">{error ?? "No snapshot."}</p>
        </div>
      </Shell>
    );
  }

  const decisionIds = new Set<string>();
  Object.values(snapshot.decisions_by_domain).forEach((arr) => {
    arr.forEach((d) => decisionIds.add(d.decision_id));
  });

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link
            href="/institutional/portfolios"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Portfolios
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enterprise Snapshot</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {snapshot.enterprise_name ?? "Enterprise"} (ID: {snapshot.enterprise_id}) · Read-only
          </p>
        </div>

        {/* Decisions by domain: exact backend structure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisions by domain</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-x-auto bg-gray-50 p-4 rounded border">
              {JSON.stringify(snapshot.decisions_by_domain, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Execution summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-x-auto bg-gray-50 p-4 rounded border">
              {JSON.stringify(snapshot.execution_summary, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Outcomes summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outcomes summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-x-auto bg-gray-50 p-4 rounded border">
              {JSON.stringify(snapshot.outcomes_summary, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Capability trend: table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capability trend</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot.capability_trend.length === 0 ? (
              <p className="text-muted-foreground text-sm">No capability trend data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left font-medium">Capability ID</th>
                      <th className="border border-gray-200 p-2 text-right font-medium">Score</th>
                      <th className="border border-gray-200 p-2 text-left font-medium">Computed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.capability_trend.map((row, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="border border-gray-200 p-2">{row.capability_id}</td>
                        <td className="border border-gray-200 p-2 text-right font-mono">{row.score}</td>
                        <td className="border border-gray-200 p-2">{row.computed_at ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest financing readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest financing readiness</CardTitle>
          </CardHeader>
          <CardContent>
            {!snapshot.financing_readiness_latest ? (
              <p className="text-muted-foreground text-sm">No financing readiness data.</p>
            ) : (
              <pre className="text-sm overflow-x-auto bg-gray-50 p-4 rounded border">
                {JSON.stringify(snapshot.financing_readiness_latest, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Screen D: Export buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exports</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">Direct backend download; no transformation.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Export Enterprise</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!exporting}
                  onClick={() => handleExportEnterprise("json")}
                >
                  {exporting === "enterprise-json" ? "…" : "Export Enterprise (JSON)"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!exporting}
                  onClick={() => handleExportEnterprise("csv")}
                >
                  {exporting === "enterprise-csv" ? "…" : "Export Enterprise (CSV)"}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Export Decision</p>
              {Array.from(decisionIds).length === 0 ? (
                <p className="text-muted-foreground text-sm">No decisions in snapshot.</p>
              ) : (
                <ul className="space-y-2">
                  {Array.from(decisionIds).map((decisionId) => (
                    <li key={decisionId} className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm">{decisionId.slice(0, 8)}…</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!exporting}
                        onClick={() => handleExportDecision(decisionId, "json")}
                      >
                        {exporting === `decision-${decisionId}-json` ? "…" : "JSON"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!exporting}
                        onClick={() => handleExportDecision(decisionId, "csv")}
                      >
                        {exporting === `decision-${decisionId}-csv` ? "…" : "CSV"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
