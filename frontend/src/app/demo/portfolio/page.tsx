"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoPortfolios, type DemoPortfolioFilters, type DemoEnterprisePortfolioRow } from "@/lib/demo-api";
import { Briefcase, Building2, Loader2, ArrowLeft, Filter, Eye } from "lucide-react";

export default function DemoPortfolioPage() {
  const [portfolios, setPortfolios] = useState<Awaited<ReturnType<typeof getDemoPortfolios>>["portfolios"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DemoPortfolioFilters>({});

  useEffect(() => {
    getDemoPortfolios(filters)
      .then((res) => setPortfolios(res.portfolios))
      .catch(() => setError("Failed to load demo portfolios"))
      .finally(() => setLoading(false));
  }, [filters.readiness_band, filters.review_due, filters.execution_stalled]);

  const applyFilter = (key: keyof DemoPortfolioFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setLoading(true);
  };

  if (loading && portfolios.length === 0) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/demo" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Demo
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-ink">Portfolios</h1>
            <Badge variant="accent" className="text-xs font-semibold">
              DEMO
            </Badge>
          </div>
          <p className="text-ink-muted">
            Partner view: who needs support and why. Filter by readiness, review due, and stalled execution.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary-soft p-4 text-sm">
            <p className="font-medium text-ink mb-2">Want visibility like this?</p>
            <p className="text-ink-muted mb-3">Request partner onboarding.</p>
            <Button size="sm" asChild variant="secondary">
              <Link href="/for-partners">For capital partners</Link>
            </Button>
          </div>

          {/* Filters */}
          <Card className="premium-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-ink-muted">Readiness:</span>
                <select
                  value={filters.readiness_band ?? ""}
                  onChange={(e) => applyFilter("readiness_band", e.target.value || undefined)}
                  className="rounded border border-border bg-surface px-2 py-1"
                >
                  <option value="">All</option>
                  <option value="Developing">Developing</option>
                  <option value="Established">Established</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.review_due === true}
                  onChange={(e) => applyFilter("review_due", e.target.checked ? true : undefined)}
                />
                <span className="text-ink-muted">Review due</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.execution_stalled === true}
                  onChange={(e) => applyFilter("execution_stalled", e.target.checked ? true : undefined)}
                />
                <span className="text-ink-muted">Stalled milestone</span>
              </label>
            </CardContent>
          </Card>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}

          <div className="grid gap-6">
            {portfolios.map((pf) => (
              <Card key={pf.id} className="premium-shadow">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{pf.portfolio_name}</CardTitle>
                  </div>
                  <p className="text-sm text-ink-muted">{pf.partner_name}</p>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-medium text-ink mb-3 flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Enterprises in this portfolio
                  </h3>
                  <ul className="space-y-3">
                    {(pf.enterprise_details ?? []).map((ent: DemoEnterprisePortfolioRow) => (
                      <li
                        key={ent.id}
                        className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/20 p-3"
                      >
                        <Link
                          href={`/demo/enterprise/${ent.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {ent.name}
                        </Link>
                        <span className="text-ink-muted text-sm">{ent.industry}</span>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {ent.readiness_band}
                          </Badge>
                          {ent.review_due && (
                            <Badge variant="yellow" className="text-xs">Review due</Badge>
                          )}
                          {ent.execution_stalled && (
                            <Badge variant="red" className="text-xs">Stalled milestone</Badge>
                          )}
                        </div>
                        {(ent.shared_scopes?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-xs text-ink-muted ml-auto">
                            <Eye className="h-3 w-3" />
                            Shared: {ent.shared_scopes!.join(", ").replace(/_/g, " ")}
                          </span>
                        )}
                      </li>
                    ))}
                    {(!pf.enterprise_details || pf.enterprise_details.length === 0) &&
                      (pf.enterprises ?? []).map((eid) => (
                        <li key={eid}>
                          <Link
                            href={`/demo/enterprise/${eid}`}
                            className="text-primary hover:underline"
                          >
                            Enterprise {eid}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" asChild>
            <Link href="/demo">Back to demo</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
