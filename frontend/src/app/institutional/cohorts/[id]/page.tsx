"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  getCohort,
  getCohortSummary,
  listCohortEnterprises,
  type CohortOut,
  type CohortSummary,
  type CohortEnterpriseRow,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, AlertTriangle, Users } from "lucide-react";

export default function CohortDetailPage() {
  const params = useParams();
  const cohortId = parseInt(params.id as string, 10);
  const [cohort, setCohort] = useState<CohortOut | null>(null);
  const [summary, setSummary] = useState<CohortSummary | null>(null);
  const [enterprises, setEnterprises] = useState<CohortEnterpriseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActivation, setFilterActivation] = useState<string>("all");
  const [filterVelocity, setFilterVelocity] = useState<string>("all");

  useEffect(() => {
    if (Number.isNaN(cohortId)) {
      setError("Invalid cohort");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = {
      activation_incomplete: filterActivation === "incomplete" ? true as const : filterActivation === "complete" ? false as const : undefined,
      velocity_band: filterVelocity !== "all" ? filterVelocity : undefined,
    };
    Promise.all([
      getCohort(cohortId).then(setCohort).catch(() => setCohort(null)),
      getCohortSummary(cohortId).then(setSummary).catch(() => setSummary(null)),
      listCohortEnterprises(cohortId, params).then(setEnterprises).catch(() => setEnterprises([])),
    ]).finally(() => setLoading(false));
  }, [cohortId, filterActivation, filterVelocity]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error || !cohort) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-12 text-center">
          <p className="text-destructive mb-4">{error || "Cohort not found"}</p>
          <Button variant="outline" asChild>
            <Link href="/institutional/cohorts">Back to cohorts</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/institutional/cohorts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cohorts
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">{cohort.name}</h1>
          <p className="text-ink-muted text-sm mt-1">
            Activation window: {cohort.activation_window_days} days
            {cohort.start_date && ` · Started ${new Date(cohort.start_date).toLocaleDateString()}`}
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-ink-muted font-medium">Enterprises enrolled</p>
                <p className="text-2xl font-bold text-ink mt-1">{summary.enterprises_enrolled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-ink-muted font-medium">Activation complete</p>
                <p className="text-2xl font-bold text-ink mt-1">
                  {summary.activation_complete_count} / {summary.enterprises_enrolled}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">Avg {summary.average_activation_pct}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-ink-muted font-medium">Avg health score</p>
                <p className="text-2xl font-bold text-ink mt-1">
                  {summary.average_health_score != null ? summary.average_health_score : "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-ink-muted font-medium">At risk</p>
                <p className="text-2xl font-bold text-ink mt-1">{summary.at_risk_count}</p>
                <p className="text-xs text-ink-muted mt-0.5">Low activation, health, or velocity</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Enterprises in cohort
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={filterActivation} onValueChange={setFilterActivation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Activation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="incomplete">Activation incomplete</SelectItem>
                    <SelectItem value="complete">Activation complete</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterVelocity} onValueChange={setFilterVelocity}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Velocity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All velocity</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="at_risk">At risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enterprises.length === 0 ? (
              <p className="text-sm text-ink-muted py-6 text-center">
                No enterprises in this cohort yet, or no matches for the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enterprise</TableHead>
                      <TableHead>Activation</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Velocity</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enterprises.map((row) => (
                      <TableRow key={row.cohort_enterprise_id}>
                        <TableCell>
                          <span className="font-medium">{row.enterprise_name ?? `Enterprise ${row.enterprise_id}`}</span>
                          {!row.activation_complete && (
                            <AlertTriangle className="inline-block w-4 h-4 ml-1 text-amber-600" aria-hidden />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{row.activation_completed_count} / 5</span>
                          {row.activation_complete && (
                            <Badge variant="secondary" className="ml-1 text-xs">Complete</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.health_score != null ? row.health_score : "-"}
                        </TableCell>
                        <TableCell>
                          {row.decision_velocity?.velocity_band ? (
                            <Badge
                              variant={
                                row.decision_velocity.velocity_band === "at_risk"
                                  ? "destructive"
                                  : row.decision_velocity.velocity_band === "slow"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {row.decision_velocity.velocity_band}
                            </Badge>
                          ) : (
                            "-"
                          )}
                          {row.decision_velocity?.avg_cycle_days != null && (
                            <span className="text-xs text-ink-muted ml-1">
                              {row.decision_velocity.avg_cycle_days}d
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/institutional/enterprises/${row.enterprise_id}`}>
                              Snapshot
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
