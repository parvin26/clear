"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listCohorts, getInstitutionalPortfolios, type CohortOut, type PortfolioItem } from "@/lib/api";
import { Loader2, Play } from "lucide-react";

type Scope = "all" | "cohort" | "portfolio";

interface RunResult {
  enterprises_processed: number;
  snapshots_written: { health: number; velocity: number; readiness: number };
  errors: string[];
}

export default function AdminPage() {
  const [scope, setScope] = useState<Scope>("all");
  const [cohortId, setCohortId] = useState<string>("");
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [cohorts, setCohorts] = useState<CohortOut[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scope === "cohort" || scope === "portfolio") {
      setLoadingOptions(true);
      if (scope === "cohort") {
        listCohorts()
          .then(setCohorts)
          .catch(() => setCohorts([]))
          .finally(() => setLoadingOptions(false));
      } else {
        getInstitutionalPortfolios()
          .then(setPortfolios)
          .catch(() => setPortfolios([]))
          .finally(() => setLoadingOptions(false));
      }
    }
  }, [scope]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    const body: { enterprise_id?: number; cohort_id?: number; portfolio_id?: number } = {};
    if (scope === "cohort" && cohortId) body.cohort_id = parseInt(cohortId, 10);
    else if (scope === "portfolio" && portfolioId) body.portfolio_id = parseInt(portfolioId, 10);

    try {
      const res = await fetch("/api/admin/run-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || `Request failed: ${res.status}`);
        return;
      }
      setResult(data as RunResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Admin</h1>
          <p className="text-ink-muted text-sm mt-1">Run monthly snapshots and maintenance tasks.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Snapshots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate Health, Velocity, and ECRI (readiness) snapshots for the current month. Idempotent per month.
            </p>
            <div className="space-y-2">
              <Label>Scope</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
              >
                <option value="all">All enterprises</option>
                <option value="cohort">By cohort</option>
                <option value="portfolio">By portfolio</option>
              </select>
            </div>
            {scope === "cohort" && (
              <div className="space-y-2">
                <Label>Cohort</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">Select cohort</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (id: {c.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {scope === "portfolio" && (
              <div className="space-y-2">
                <Label>Portfolio</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={portfolioId}
                  onChange={(e) => setPortfolioId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">Select portfolio</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (id: {p.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={handleRun} disabled={running || (scope === "cohort" && !cohortId) || (scope === "portfolio" && !portfolioId)}>
              {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Run monthly snapshots
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {result && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                <p><strong>Enterprises processed:</strong> {result.enterprises_processed}</p>
                <p><strong>Snapshots written:</strong> health {result.snapshots_written.health}, velocity {result.snapshots_written.velocity}, readiness {result.snapshots_written.readiness}</p>
                {result.errors.length > 0 && (
                  <div>
                    <strong>Errors:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
