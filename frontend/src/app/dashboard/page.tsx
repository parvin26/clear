"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  listDecisions,
  getDecision,
  getReadiness,
  listMilestones,
  getDecisionVelocity,
  getEnterpriseActivation,
  type DecisionListItem,
  type DecisionOut,
  type ReadinessOut,
  type MilestoneOut,
  type DecisionVelocityOut,
} from "@/lib/clear-api";
import { computeActivationProgress, mapEnterpriseActivationToProgress } from "@/lib/activation";
import { ActivationChecklist, ActivationNudgeBanner, ActivationWidget } from "@/components/activation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, CalendarCheck, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

function getDecisionTitle(decision: DecisionOut | null): string {
  if (!decision?.latest_artifact) return "";
  const art = decision.latest_artifact as Record<string, unknown>;
  const snapshot = art?.decision_snapshot as Record<string, unknown> | undefined;
  const statement = (snapshot?.decision_statement as string) || (art?.problem_statement as string);
  if (statement && typeof statement === "string") return statement.slice(0, 60) + (statement.length > 60 ? "…" : "");
  return "";
}

function getStatusDisplay(status: string): "Active" | "Blocked" | "Completed" {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "done") return "Completed";
  if (s === "blocked" || s === "on_hold") return "Blocked";
  return "Active";
}

type UpcomingItem = {
  decision_id: string;
  milestone_id: number;
  title: string;
  due_date: string;
  status: string;
  statusDisplay: "Active" | "Blocked" | "Completed";
};

const PLACEHOLDER_OWNERS = [
  { name: "Sarah Chen", initials: "SC" },
  { name: "Michael Ross", initials: "MR" },
  { name: "Elena Rodriguez", initials: "ER" },
  { name: "David Kim", initials: "DK" },
];

const PLACEHOLDER_ACTIVITIES = [
  { text: "Sarah Chen updated the status of Q3 Marketing Budget", time: "10m ago" },
  { text: "Michael Ross commented on Enterprise CRM Selection", time: "2h ago" },
  { text: "Elena Rodriguez created a new decision Brand Guidelines 2.0", time: "4h ago" },
  { text: "David Kim completed Q2 Financial Audit", time: "1d ago" },
];

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [decisionsWithDetail, setDecisionsWithDetail] = useState<Record<string, DecisionOut>>({});
  const [readinessScores, setReadinessScores] = useState<ReadinessOut[]>([]);
  const [allMilestones, setAllMilestones] = useState<(MilestoneOut & { decision_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [velocity, setVelocity] = useState<DecisionVelocityOut | null>(null);
  const [enterpriseActivation, setEnterpriseActivation] = useState<ReturnType<typeof mapEnterpriseActivationToProgress> | null>(null);
  const [enterpriseActivationEnterpriseId, setEnterpriseActivationEnterpriseId] = useState<number | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    setEnterpriseActivation(null);
    setEnterpriseActivationEnterpriseId(null);
    listDecisions({ limit: 20 })
      .then((list) => {
        setDecisions(list);
        const firstEnterpriseId = list[0]?.enterprise_id ?? null;
        if (firstEnterpriseId != null) {
          getEnterpriseActivation(firstEnterpriseId)
            .then((a) => {
              setEnterpriseActivationEnterpriseId(firstEnterpriseId);
              setEnterpriseActivation(
                mapEnterpriseActivationToProgress(a, list[0]?.decision_id)
              );
            })
            .catch(() => {
              setEnterpriseActivation(null);
              setEnterpriseActivationEnterpriseId(null);
            });
        }
        if (list.length === 0) {
          getDecisionVelocity().then(setVelocity).catch(() => setVelocity(null));
          setLoading(false);
          return;
        }
        const detailPromises = list.map((d) =>
          getDecision(d.decision_id)
            .then((dec) => ({ id: d.decision_id, dec }))
            .catch(() => null)
        );
        const readinessPromises = list.slice(0, 10).map((d) =>
          getReadiness(d.decision_id).catch(() => null)
        );
        const milestonePromises = list.slice(0, 10).map((d) =>
          listMilestones(d.decision_id)
            .then((ms) => ms.map((m) => ({ ...m, decision_id: d.decision_id })))
            .catch(() => [] as (MilestoneOut & { decision_id: string })[])
        );
        const velocityPromise = getDecisionVelocity().then(setVelocity).catch(() => setVelocity(null));
        return Promise.all([
          ...detailPromises,
          ...readinessPromises,
          ...milestonePromises,
          velocityPromise,
        ]        ).then((result) => {
          const detailCount = list.length;
          const numExtra = Math.min(10, list.length);
          const details = result.slice(0, detailCount) as ({ id: string; dec: DecisionOut } | null)[];
          // result[detailCount + numExtra*2] is velocity promise (no slot; velocity is set via setVelocity)
          const byId: Record<string, DecisionOut> = {};
          details.forEach((item) => {
            if (item) byId[item.id] = item.dec;
          });
          setDecisionsWithDetail(byId);

          const readinessList = result.slice(detailCount, detailCount + numExtra) as (ReadinessOut | null)[];
          setReadinessScores(readinessList.filter((r): r is ReadinessOut => r != null));

          const milestoneChunks = result.slice(detailCount + numExtra, detailCount + numExtra * 2) as (MilestoneOut & { decision_id: string })[][];
          setAllMilestones(milestoneChunks.flat());
        });
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.detail ||
          (err?.response?.status === 0 || !err?.response
            ? "Cannot reach the server. Is the backend running?"
            : "Failed to load dashboard data");
        setError(typeof msg === "string" ? msg : "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const upcomingDueDates = useMemo((): UpcomingItem[] => {
    const open = allMilestones.filter((m) => m.status !== "completed" && m.due_date);
    const withDate = open.map((m) => ({
      decision_id: m.decision_id,
      milestone_id: m.id,
      title: m.milestone_name,
      due_date: m.due_date!,
      status: m.status,
      statusDisplay: getStatusDisplay(m.status),
    }));
    withDate.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return withDate.slice(0, 6);
  }, [allMilestones]);

  const avgReadinessPercent = useMemo(() => {
    if (readinessScores.length === 0) return null;
    const bandToNum: Record<string, number> = {
      nascent: 25,
      emerging: 50,
      developing: 65,
      established: 80,
      advanced: 95,
    };
    const sum = readinessScores.reduce((acc, r) => acc + (bandToNum[r.band?.toLowerCase() ?? ""] ?? 50), 0);
    return Math.round(sum / readinessScores.length);
  }, [readinessScores]);

  const activationProgress = useMemo(() => {
    const firstEntId = decisions[0]?.enterprise_id ?? null;
    if (
      firstEntId != null &&
      enterpriseActivationEnterpriseId === firstEntId &&
      enterpriseActivation != null
    ) {
      return enterpriseActivation;
    }
    return computeActivationProgress(decisions, decisionsWithDetail, allMilestones);
  }, [
    decisions,
    decisionsWithDetail,
    allMilestones,
    enterpriseActivation,
    enterpriseActivationEnterpriseId,
  ]);

  const decisionsReviewDue = useMemo((): { decision_id: string }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due: { decision_id: string }[] = [];
    Object.entries(decisionsWithDetail).forEach(([decisionId, dec]) => {
      const artifact = dec?.latest_artifact as Record<string, unknown> | null | undefined;
      const emr = (artifact?.emr as Record<string, unknown> | undefined) || {};
      const config = (emr.config as { next_review_date?: string | null }) || {};
      const nextReview = config.next_review_date;
      if (nextReview && typeof nextReview === "string") {
        const reviewDate = new Date(nextReview);
        reviewDate.setHours(0, 0, 0, 0);
        if (reviewDate.getTime() <= today.getTime()) due.push({ decision_id: decisionId });
      }
    });
    return due;
  }, [decisionsWithDetail]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  const activeCount = decisions.filter((d) => getStatusDisplay(d.current_status) === "Active").length || decisions.length;

  return (
    <Shell>
      <div className="content-container py-6">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Decision Workspace</h1>
            <p className="text-ink-muted text-sm mt-0.5">
              Overview of active strategic choices and team velocity.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-border">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Filter by Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              <Link href="/diagnostic">
                <Plus className="w-4 h-4 mr-2" />
                Create New Decision
              </Link>
            </Button>
            {decisions.length === 0 && (
              <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
                <Link href="/decisions/new">Or start with first-decision template</Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => loadDashboard()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!activationProgress.allComplete && (
          <>
            <ActivationNudgeBanner progress={activationProgress} />
            <div className="mb-6">
              <ActivationChecklist
                progress={activationProgress}
                firstDecisionId={decisions[0]?.decision_id ?? null}
              />
            </div>
          </>
        )}

        {decisionsReviewDue.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="pt-4 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
                <p className="text-sm font-medium text-ink">
                  {decisionsReviewDue.length === 1
                    ? "1 decision review due"
                    : `${decisionsReviewDue.length} decisions review due`}
                </p>
              </div>
              <Button asChild size="sm" variant="default" className="bg-primary hover:bg-primary/90">
                <Link href={decisionsReviewDue.length === 1 ? `/decisions/${decisionsReviewDue[0].decision_id}` : "/decisions"}>
                  Open decision workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border border-border shadow-sm rounded-lg">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-ink-muted font-medium">Active Decisions</p>
              <p className="text-2xl font-bold text-ink mt-1">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-border shadow-sm rounded-lg">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-ink-muted font-medium">Avg Diagnostic Score</p>
              <p className="text-2xl font-bold text-ink mt-1">{avgReadinessPercent != null ? `${avgReadinessPercent}%` : "-"}</p>
              {avgReadinessPercent != null && (
                <p className="text-xs text-[#10B981] mt-0.5">+5.2%</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white border border-border shadow-sm rounded-lg">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-ink-muted font-medium">Investment Pipeline</p>
              <p className="text-2xl font-bold text-ink mt-1">$4.2M</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-border shadow-sm rounded-lg">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-ink-muted font-medium">Decision Velocity</p>
              <p className="text-2xl font-bold text-ink mt-1">
                {velocity?.avg_cycle_days != null ? `${velocity.avg_cycle_days} days` : "-"}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 capitalize">
                {velocity?.velocity_band ? velocity.velocity_band.replace("_", " ") : "No completed cycles yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {velocity && (velocity.avg_cycle_days != null || velocity.cycle_count === 0) && (
          <Card className="mb-8 border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Decision Velocity</h2>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {velocity.avg_cycle_days != null ? `${velocity.avg_cycle_days} days average` : "No completed cycles yet"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-ink-muted capitalize">
                      Status: {velocity.velocity_band ? velocity.velocity_band.replace("_", " ") : "-"}
                    </span>
                    {velocity.trend_direction && velocity.trend_direction !== "stable" && (
                      <span className="flex items-center gap-0.5 text-sm">
                        {velocity.trend_direction === "improving" && <TrendingDown className="h-4 w-4 text-green-600" aria-hidden />}
                        {velocity.trend_direction === "slowing" && <TrendingUp className="h-4 w-4 text-amber-600" aria-hidden />}
                        <span className="capitalize">{velocity.trend_direction}</span>
                      </span>
                    )}
                  </div>
                  {velocity.avg_cycle_days != null && (
                    <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                      <li>Time to decision: {velocity.avg_time_to_decision != null ? `${velocity.avg_time_to_decision} days` : "-"}</li>
                      <li>Time to execution: {velocity.avg_time_to_execution != null ? `${velocity.avg_time_to_execution} days` : "-"}</li>
                      <li>Time to review: {velocity.avg_time_to_review != null ? `${velocity.avg_time_to_review} days` : "-"}</li>
                    </ul>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/decisions" className="gap-1">
                    View decision cycle details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Upcoming Due Dates */}
            <Card className="bg-white border border-border shadow-sm rounded-lg">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Upcoming Due Dates
                  </h2>
                  <Link href="/decisions" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                </div>
                {upcomingDueDates.length === 0 ? (
                  <p className="text-sm text-ink-muted py-4">No upcoming due dates. Create a decision and add milestones.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {upcomingDueDates.map((item) => {
                      const dec = decisionsWithDetail[item.decision_id];
                      const displayTitle = dec ? getDecisionTitle(dec) || item.title : item.title;
                      return (
                        <li key={`${item.decision_id}-${item.milestone_id}`}>
                          <Link
                            href={`/decisions/${item.decision_id}?tab=execution`}
                            className="flex items-center gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {(displayTitle.slice(0, 2) || "?").toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink truncate">{displayTitle}</p>
                              <p className="text-xs text-ink-muted">
                                {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <span
                              className={`
                                shrink-0 inline-flex items-center gap-1.5 text-xs font-medium
                                ${item.statusDisplay === "Blocked" ? "text-red-600" : "text-amber-600"}
                              `}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${item.statusDisplay === "Blocked" ? "bg-red-500" : "bg-amber-500"}`}
                              />
                              {item.statusDisplay}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Decision Owners */}
            <Card className="bg-white border border-border shadow-sm rounded-lg">
              <CardContent className="pt-5 pb-5">
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">
                  Decision Owners
                </h2>
                <div className="flex flex-wrap items-end gap-6">
                  {PLACEHOLDER_OWNERS.map((owner) => (
                    <div key={owner.name} className="flex flex-col items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-ink-muted text-sm font-medium">
                        {owner.initials}
                      </span>
                      <span className="text-xs text-ink-muted text-center max-w-[80px] truncate">{owner.name}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg bg-muted/50 border-border">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            {!activationProgress.allComplete && (
              <ActivationWidget progress={activationProgress} />
            )}
            <Card className="bg-white border border-border shadow-sm rounded-lg">
              <CardContent className="pt-5 pb-5">
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">
                  Activity Feed
                </h2>
                <ul className="space-y-3">
                  {PLACEHOLDER_ACTIVITIES.map((activity, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-muted/60 shrink-0 mt-1.5" />
                      <div>
                        <p className="text-ink">{activity.text}</p>
                        <p className="text-xs text-ink-muted">{activity.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border border-border shadow-sm rounded-lg">
              <CardContent className="pt-5 pb-5">
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">
                  Quick Links
                </h2>
                <nav className="flex flex-col gap-1">
                  <Link href="/decisions?status=draft" className="text-sm text-primary hover:underline py-1">
                    My Drafts
                  </Link>
                  <Link href="/decisions?status=pending" className="text-sm text-primary hover:underline py-1">
                    Pending Reviews
                  </Link>
                  <Link href="/decisions?status=archived" className="text-sm text-primary hover:underline py-1">
                    Archived Decisions
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
