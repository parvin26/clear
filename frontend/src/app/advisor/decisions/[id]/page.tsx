"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getAdvisorDecision,
  listAdvisorReviews,
  submitAdvisorReview,
  getEnterprise,
  getReadiness,
  listLedgerEvents,
  type DecisionOut,
  type AdvisorReviewOut,
  type LedgerEventOut,
} from "@/lib/clear-api";
import { Loader2 } from "lucide-react";

function getApiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { detail?: string | unknown } } };
  if (err?.response?.data?.detail != null) {
    const d = err.response.data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x: { msg?: string }) => x?.msg ?? String(x)).join(", ");
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export default function AdvisorDecisionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const decisionId = params.id as string;
  const token = searchParams.get("token");
  const [decision, setDecision] = useState<DecisionOut | null>(null);
  const [enterpriseName, setEnterpriseName] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<{ band: string } | null>(null);
  const [ledger, setLedger] = useState<LedgerEventOut[]>([]);
  const [reviews, setReviews] = useState<AdvisorReviewOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    headline_assessment: "",
    what_looks_strong: "",
    what_worries_most: "",
    next_4_6_weeks: "",
    confidence: "" as string,
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!decisionId || !token) return;
    setLoading(true);
    setError(null);
    getAdvisorDecision(decisionId, token)
      .then((d) => {
        setDecision(d);
        if (d.enterprise_id) {
          getEnterprise(d.enterprise_id).then((e) => setEnterpriseName(e.name ?? null)).catch(() => {});
          getReadiness(decisionId).then(setReadiness).catch(() => null);
        }
        listLedgerEvents(decisionId).then((l) => setLedger(l)).catch(() => []);
      })
      .catch(() => setError("Failed to load decision or access denied"))
      .finally(() => setLoading(false));
  }, [decisionId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!decisionId || !token) return;
    listAdvisorReviews(decisionId, token).then(setReviews).catch(() => []);
  }, [decisionId, token]);

  async function handleSubmitReview() {
    if (!decisionId || !token) return;
    setReviewSubmitting(true);
    setActionError(null);
    try {
      await submitAdvisorReview(decisionId, {
        headline_assessment: reviewForm.headline_assessment.trim() || null,
        what_looks_strong: reviewForm.what_looks_strong.trim() || null,
        what_worries_most: reviewForm.what_worries_most.trim() || null,
        next_4_6_weeks: reviewForm.next_4_6_weeks.trim() || null,
        confidence: reviewForm.confidence.trim() || null,
      }, token);
      setReviewForm({ headline_assessment: "", what_looks_strong: "", what_worries_most: "", next_4_6_weeks: "", confidence: "" });
      const list = await listAdvisorReviews(decisionId, token);
      setReviews(list);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to submit review"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading && !decision) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error || !decision) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-destructive">{error || "Decision not found"}</p>
          <Link href={token ? `/advisor?token=${encodeURIComponent(token)}` : "/advisor"}>
            <Button variant="outline" className="mt-4">Back to advisor workspace</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const artifactData = decision.latest_artifact as Record<string, unknown> | null | undefined;
  const snapshot = (artifactData?.decision_snapshot as Record<string, unknown>) || {};
  const contextFromFounder = (artifactData?.decision_context as Record<string, unknown>) || {};
  const emr = (artifactData?.emr as Record<string, unknown>) || {};
  const emrMilestones = (emr.milestones as { id?: string; title?: string; description?: string; owner?: string; due_date?: string; status?: string }[]) || [];
  const outcomeReviews = (artifactData ? [] : []); // Outcome reviews are founder-side; we could add a read-only list from API if needed
  const latestReview = reviews[0];

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link href={token ? `/advisor?token=${encodeURIComponent(token)}` : "/advisor"} className="text-sm text-muted-foreground hover:underline">← Advisor workspace</Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1 truncate">
              {enterpriseName ?? "Enterprise"} · Decision
            </h1>
            <p className="text-sm text-ink-muted truncate mt-0.5">
              {(snapshot.decision_statement as string)?.slice(0, 80) ?? decision.decision_id}
              {(snapshot.decision_statement as string)?.length > 80 ? "…" : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {artifactData?.decision_context != null ? (
                <Badge variant="outline">
                  {String(contextFromFounder.primary_domain ?? "—")}
                </Badge>
              ) : null}
              {readiness != null ? <Badge variant="secondary">{String(readiness.band)}</Badge> : null}
              <Badge variant="outline">Advisor view</Badge>
            </div>
          </div>
        </div>

        {actionError && <p className="text-destructive text-sm">{actionError}</p>}

        <Tabs
          value={searchParams.get("tab") ?? "snapshot"}
          onValueChange={(v) => router.replace(`/advisor/decisions/${decisionId}?token=${encodeURIComponent(token || "")}&tab=${v}`)}
        >
          <TabsList className="sticky top-[57px] z-10 bg-background/95 backdrop-blur border-b border-border rounded-b-none w-full justify-start overflow-x-auto">
            <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="advisor-notes">Advisor notes</TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {snapshot.decision_statement != null && snapshot.decision_statement !== "" ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Decision</p>
                    <p className="text-ink">{String(snapshot.decision_statement)}</p>
                  </div>
                ) : null}
                {(snapshot.why_now as string[])?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Why now</p>
                    <ul className="list-disc pl-4">{(snapshot.why_now as string[]).map((w, i) => <li key={i}>{w}</li>)}</ul>
                  </div>
                ) : null}
                {(snapshot.key_constraints as string[])?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Key constraints</p>
                    <ul className="list-disc pl-4">{(snapshot.key_constraints as string[]).map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                ) : null}
                {snapshot.success_metric != null && snapshot.success_metric !== "" ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">How success looks</p>
                    <p className="text-ink">{String(snapshot.success_metric)}</p>
                  </div>
                ) : null}
                {snapshot.timeframe != null && snapshot.timeframe !== "" ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Timeframe</p>
                    <p className="text-ink">{String(snapshot.timeframe)}</p>
                  </div>
                ) : null}
                {(contextFromFounder.main_risk || contextFromFounder.support_asked) ? (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Context from founder</p>
                    {contextFromFounder.main_risk != null ? <p><span className="text-muted-foreground">What they think the main risk is:</span> {String(contextFromFounder.main_risk)}</p> : null}
                    {contextFromFounder.support_asked != null ? <p><span className="text-muted-foreground">What support they are asking for:</span> {String(contextFromFounder.support_asked)}</p> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">EMR plan</CardTitle>
                <p className="text-xs text-muted-foreground">Read-only list of milestones.</p>
              </CardHeader>
              <CardContent>
                {emrMilestones.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No milestones yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {emrMilestones.map((m) => (
                      <li key={m.id || ""} className="border rounded-md p-2 text-sm">
                        <span className="font-medium">{m.title ?? "—"}</span>
                        <span className="text-muted-foreground ml-2">{m.owner ?? ""}</span>
                        <span className="text-muted-foreground ml-2">{m.due_date ? new Date(m.due_date).toLocaleDateString() : ""}</span>
                        <span className="ml-2 text-muted-foreground">({m.status ?? "pending"})</span>
                        {m.description && <p className="mt-1 text-muted-foreground">{m.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outcome reviews</CardTitle>
                <p className="text-xs text-muted-foreground">Past outcome reviews (read-only).</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Outcome reviews are recorded by the founder. Your structured review is in the Advisor notes tab.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision history</CardTitle>
                <p className="text-xs text-muted-foreground">Timeline of decision versions and past reviews.</p>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No events yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {ledger.map((ev, i) => (
                      <li key={i} className="flex flex-wrap gap-2 items-center border-b border-border pb-2">
                        <span className="font-mono text-xs">{ev.event_type}</span>
                        {ev.actor_id && <span>{ev.actor_id}</span>}
                        <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advisor-notes" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your review for this decision</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Leave a structured review for this decision. The founder and capital partners will see it in their workspace.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestReview ? (
                  <>
                    <div className="rounded-md border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Your latest review</p>
                      <p className="text-sm">{latestReview.created_at ? new Date(latestReview.created_at).toLocaleDateString() : ""} · {latestReview.headline_assessment ?? "—"}</p>
                      {latestReview.confidence && <Badge variant="secondary" className="mt-1">{latestReview.confidence}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">You can add another review below; past versions remain in history.</p>
                  </>
                ) : null}
                <div className="space-y-3">
                  <div>
                    <Label>Headline assessment</Label>
                    <Input
                      placeholder="e.g. On track but sequencing risk"
                      value={reviewForm.headline_assessment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, headline_assessment: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>What looks strong?</Label>
                    <Textarea
                      placeholder="What looks strong?"
                      value={reviewForm.what_looks_strong}
                      onChange={(e) => setReviewForm((f) => ({ ...f, what_looks_strong: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>What worries you most?</Label>
                    <Textarea
                      placeholder="What worries you most?"
                      value={reviewForm.what_worries_most}
                      onChange={(e) => setReviewForm((f) => ({ ...f, what_worries_most: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>What would you do in the next 4–6 weeks?</Label>
                    <Textarea
                      placeholder="What would you do in the next 4–6 weeks?"
                      value={reviewForm.next_4_6_weeks}
                      onChange={(e) => setReviewForm((f) => ({ ...f, next_4_6_weeks: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confidence in this plan</Label>
                    <select
                      className="mt-1 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={reviewForm.confidence}
                      onChange={(e) => setReviewForm((f) => ({ ...f, confidence: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <Button onClick={handleSubmitReview} disabled={reviewSubmitting}>
                    {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {latestReview ? "Update review" : "Submit review"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
