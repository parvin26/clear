"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { getOrgPortfolio, type PortfolioEnrichedItem } from "@/lib/clear-api";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Portfolio detail (org = portfolio). Enriched view: enterprises with last decision, readiness, review date.
 * Filters: readiness_band, primary_domain, country, industry, no_review_days.
 */
export default function PortfolioDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const portfolioId = Number(params.portfolioId);
  const [enterprises, setEnterprises] = useState<PortfolioEnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readinessFilter, setReadinessFilter] = useState<string>(searchParams.get("readiness") ?? "");
  const [domainFilter, setDomainFilter] = useState<string>(searchParams.get("domain") ?? "");
  const [noReviewDays, setNoReviewDays] = useState<string>(searchParams.get("no_review_days") ?? "");
  const [healthScoreMin, setHealthScoreMin] = useState<string>(searchParams.get("health_score_min") ?? "");
  const [healthScoreMax, setHealthScoreMax] = useState<string>(searchParams.get("health_score_max") ?? "");
  const [velocityBandFilter, setVelocityBandFilter] = useState<string>(searchParams.get("velocity_band") ?? "");
  const [ecriBandFilter, setEcriBandFilter] = useState<string>(searchParams.get("ecri_readiness_band") ?? "");

  useEffect(() => {
    if (Number.isNaN(portfolioId)) {
      setError("Invalid portfolio ID");
      setLoading(false);
      return;
    }
    const params: {
      readiness_band?: string;
      primary_domain?: string;
      no_review_days?: number;
      health_score_min?: number;
      health_score_max?: number;
      velocity_band?: string;
      ecri_readiness_band?: string;
    } = {};
    if (readinessFilter) params.readiness_band = readinessFilter;
    if (domainFilter) params.primary_domain = domainFilter;
    if (noReviewDays) params.no_review_days = parseInt(noReviewDays, 10);
    const min = healthScoreMin !== "" ? parseInt(healthScoreMin, 10) : undefined;
    const max = healthScoreMax !== "" ? parseInt(healthScoreMax, 10) : undefined;
    if (min !== undefined && !Number.isNaN(min)) params.health_score_min = min;
    if (max !== undefined && !Number.isNaN(max)) params.health_score_max = max;
    if (velocityBandFilter) params.velocity_band = velocityBandFilter;
    if (ecriBandFilter) params.ecri_readiness_band = ecriBandFilter;
    getOrgPortfolio(portfolioId, params)
      .then(setEnterprises)
      .catch(() => setError("Failed to load portfolio"))
      .finally(() => setLoading(false));
  }, [portfolioId, readinessFilter, domainFilter, noReviewDays, healthScoreMin, healthScoreMax, velocityBandFilter, ecriBandFilter]);

  if (loading) {
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
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Link
            href="/institutional/portfolios"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Portfolios
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Portfolio</h1>
          <p className="text-ink-muted text-sm mt-1">See where capability is building and where support is needed.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={readinessFilter || "all"} onValueChange={(v) => setReadinessFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Readiness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All readiness</SelectItem>
              <SelectItem value="Nascent">Nascent</SelectItem>
              <SelectItem value="Emerging">Emerging</SelectItem>
              <SelectItem value="Institutionalizing">Institutionalizing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domainFilter || "all"} onValueChange={(v) => setDomainFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Primary domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              <SelectItem value="cfo">Finance</SelectItem>
              <SelectItem value="cmo">Growth</SelectItem>
              <SelectItem value="coo">Operations</SelectItem>
              <SelectItem value="cto">Technology</SelectItem>
            </SelectContent>
          </Select>
          <Select value={noReviewDays || "all"} onValueChange={(v) => setNoReviewDays(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Review status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any last review</SelectItem>
              <SelectItem value="60">No review in &gt; 60 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthScoreMin || "any"} onValueChange={(v) => setHealthScoreMin(v === "any" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Health score min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any score</SelectItem>
              <SelectItem value="0">0+</SelectItem>
              <SelectItem value="25">25+</SelectItem>
              <SelectItem value="50">50+</SelectItem>
              <SelectItem value="75">75+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthScoreMax || "any"} onValueChange={(v) => setHealthScoreMax(v === "any" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Health score max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="25">≤25</SelectItem>
              <SelectItem value="50">≤50</SelectItem>
              <SelectItem value="75">≤75</SelectItem>
              <SelectItem value="100">≤100</SelectItem>
            </SelectContent>
          </Select>
          <Select value={velocityBandFilter || "all"} onValueChange={(v) => setVelocityBandFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Velocity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All velocity</SelectItem>
              <SelectItem value="fast">Fast (&lt;30d)</SelectItem>
              <SelectItem value="healthy">Healthy (30–60d)</SelectItem>
              <SelectItem value="slow">Slow (60–90d)</SelectItem>
              <SelectItem value="at_risk">At risk (90d+)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ecriBandFilter || "all"} onValueChange={(v) => setEcriBandFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="ECRI band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ECRI bands</SelectItem>
              <SelectItem value="Capital-ready">Capital-ready</SelectItem>
              <SelectItem value="Developing">Developing</SelectItem>
              <SelectItem value="Early">Early</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {enterprises.length > 0 && (
          <div className="flex flex-wrap gap-6 text-sm text-ink-muted">
            <p>
              Portfolio average readiness (ECRI):{" "}
              <strong className="text-ink">
                {(() => {
                  const withEcri = enterprises.filter((e) => e.readiness_index != null);
                  if (withEcri.length === 0) return "-";
                  const avg = withEcri.reduce((s, e) => s + (e.readiness_index ?? 0), 0) / withEcri.length;
                  return `${Math.round(avg)} / 100`;
                })()}
              </strong>
              {" "}({enterprises.length} enterprises)
            </p>
            <p>
              Portfolio average health score:{" "}
              <strong className="text-ink">
                {(
                  enterprises.reduce((sum, e) => sum + (e.health_score ?? 0), 0) / enterprises.length
                ).toFixed(0)}
              </strong>
            </p>
            <p>
              Portfolio average velocity:{" "}
              <strong className="text-ink">
                {(() => {
                  const withVel = enterprises.filter((e) => e.avg_cycle_days != null);
                  if (withVel.length === 0) return "-";
                  const avg = withVel.reduce((s, e) => s + (e.avg_cycle_days ?? 0), 0) / withVel.length;
                  return `${Math.round(avg)} days`;
                })()}
              </strong>
            </p>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!error && enterprises.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No enterprises in this portfolio (or none match filters).</p>
            </CardContent>
          </Card>
        )}
        {!error && enterprises.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
<thead>
              <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left font-medium">Enterprise</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">ECRI</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Velocity</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Country</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Industry</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Readiness</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Health score</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Domain</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Last review</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Plan committed</th>
                  <th className="border border-gray-200 p-2 text-left font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {enterprises.map((e) => (
                  <tr key={e.enterprise_id} className="border-b border-gray-200">
                    <td className="border border-gray-200 p-2">
                      <Link
                        href={`/institutional/enterprises/${e.enterprise_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {e.enterprise_name ?? `Enterprise ${e.enterprise_id}`}
                      </Link>
                    </td>
                    <td className="border border-gray-200 p-2">
                      {e.readiness_index != null ? (
                        <span title={e.ecri_readiness_band ?? undefined}>
                          {e.readiness_index}
                          {e.ecri_readiness_band ? ` · ${e.ecri_readiness_band}` : ""}
                          {e.ecri_trend_direction && e.ecri_trend_direction !== "Stable" ? ` · ${e.ecri_trend_direction}` : ""}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {e.avg_cycle_days != null ? (
                        <span className="capitalize">
                          {e.avg_cycle_days} days{e.velocity_band ? ` · ${e.velocity_band.replace("_", " ")}` : ""}
                          {e.trend_direction && e.trend_direction !== "stable" ? ` · ${e.trend_direction}` : ""}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">{e.country ?? "-"}</td>
                    <td className="border border-gray-200 p-2">{e.industry ?? "-"}</td>
                    <td className="border border-gray-200 p-2">{e.readiness_band ?? "-"}</td>
                    <td className="border border-gray-200 p-2">
                      {e.health_score != null ? (
                        <span title={e.health_status_label ?? undefined}>
                          {e.health_score}
                          {e.health_trend_direction === "up" && " ↑"}
                          {e.health_trend_direction === "down" && " ↓"}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="border border-gray-200 p-2">{e.last_primary_domain ?? "-"}</td>
                    <td className="border border-gray-200 p-2">{e.last_review_date ?? "-"}</td>
                    <td className="border border-gray-200 p-2">{e.has_committed_plan ? "Yes" : "-"}</td>
                    <td className="border border-gray-200 p-2">
                      {e.last_decision_id ? (
                        <Link href={`/decisions/${e.last_decision_id}`} className="text-blue-600 hover:underline">
                          View
                        </Link>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
