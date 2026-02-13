"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoEnterprise } from "@/lib/demo-api";
import { formatDueRelative, formatReviewRelative, formatPastReviewRelative } from "@/lib/demo-relative-dates";
import { DemoTour } from "@/components/demo/DemoTour";
import {
  Building2,
  Flag,
  Target,
  Share2,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Brain,
} from "lucide-react";

const DOMAIN_LABEL: Record<string, string> = {
  finance: "Finance",
  operations: "Operations",
  marketing: "Marketing",
  technology: "Technology",
};

export default function DemoEnterprisePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<Awaited<ReturnType<typeof getDemoEnterprise>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDemoEnterprise(id)
      .then(setData)
      .catch(() => setError("Failed to load demo enterprise"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="content-container py-10">
          <p className="text-danger">{error ?? "Not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/demo">Back to demo</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const { enterprise, decisions, milestones, outcomes, sharing, memory_snippets = [] } = data;
  const [evidenceModal, setEvidenceModal] = useState<{ title: string } | null>(null);

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
            <Badge variant="accent" className="text-xs font-semibold">
              DEMO
            </Badge>
          </div>

          {/* Enterprise */}
          <Card className="premium-shadow">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">{enterprise.name}</CardTitle>
                <Badge variant="secondary">{enterprise.readiness_band}</Badge>
              </div>
              <p className="text-sm text-ink-muted">
                {enterprise.industry} · {enterprise.size} · {enterprise.country}
              </p>
              <p className="text-ink-muted">{enterprise.summary}</p>
            </CardHeader>
          </Card>

          {/* Lifecycle: Situation → Decision → Milestones → Outcome → Sharing */}
          <section>
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-primary" />
              Lifecycle
            </h2>
            <p className="text-sm text-ink-muted mb-6">
              Situation → Decision → Milestones → Outcome → Sharing
            </p>

            {decisions.map((dec) => {
              const decMilestones = milestones.filter((m) => m.decision_id === dec.id);
              const decOutcomes = outcomes.filter((o) => o.decision_id === dec.id);
              return (
                <Card key={dec.id} className="mb-6 premium-shadow" data-demo-section="decision">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{dec.decision_statement}</CardTitle>
                      <Badge variant="outline">{DOMAIN_LABEL[dec.domain] ?? dec.domain}</Badge>
                      <Badge variant={dec.status === "completed" ? "green" : "secondary"}>
                        {dec.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div data-demo-section="situation">
                      <h3 className="font-medium text-ink mb-1">Situation</h3>
                      <p className="text-ink-muted">{dec.situation_summary}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-1">Constraints</h3>
                      <p className="text-ink-muted">{dec.constraints}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-1">Assumptions</h3>
                      <p className="text-ink-muted">{dec.assumptions}</p>
                    </div>

                    {decMilestones.length > 0 && (
                      <div data-demo-section="milestones">
                        <h3 className="font-medium text-ink mb-2 flex items-center gap-1">
                          <Flag className="h-4 w-4" /> Milestones
                        </h3>
                        <ul className="space-y-2">
                          {decMilestones.map((m) => (
                            <li
                              key={m.id}
                              className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/20 p-2"
                            >
                              <span className="font-medium">{m.milestone_title}</span>
                              <Badge variant="outline" className="text-xs">
                                {m.status}
                              </Badge>
                              <span className="text-ink-muted">{m.progress_percent}%</span>
                              {m.due_date && (
                                <span className="text-ink-muted">{formatDueRelative(m.due_date)}</span>
                              )}
                              {m.owner_name && (
                                <span className="text-ink-muted">· {m.owner_name}</span>
                              )}
                              {m.evidence_link && (
                                <button
                                  type="button"
                                  onClick={() => setEvidenceModal({ title: m.milestone_title })}
                                  className="text-primary text-xs hover:underline"
                                >
                                  Evidence
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {decOutcomes.length > 0 && (
                      <div data-demo-section="outcome">
                        <h3 className="font-medium text-ink mb-2 flex items-center gap-1">
                          <Target className="h-4 w-4" /> Outcomes
                        </h3>
                        <ul className="space-y-2">
                          {decOutcomes.map((o) => (
                            <li
                              key={o.id}
                              className="rounded border border-border bg-muted/20 p-3 text-ink-muted"
                            >
                              {o.expected_metric && (
                                <p><strong className="text-ink">Expected:</strong> {o.expected_metric}</p>
                              )}
                              {o.achieved_metric && (
                                <p><strong className="text-ink">Achieved:</strong> {o.achieved_metric}</p>
                              )}
                              {o.lessons_learned && (
                                <p><strong className="text-ink">Lessons:</strong> {o.lessons_learned}</p>
                              )}
                              {o.review_date && (
                                <p className="text-xs mt-1">{formatPastReviewRelative(o.review_date)}</p>
                              )}
                              {o.next_review_date && (
                                <p className="text-xs mt-1">{formatReviewRelative(o.next_review_date)}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {/* Micro conversion */}
          <div className="rounded-lg border border-primary/30 bg-primary-soft p-4 text-sm">
            <p className="font-medium text-ink mb-2">Want this for your business?</p>
            <p className="text-ink-muted mb-3">Run your diagnostic in 3 minutes.</p>
            <Button size="sm" asChild>
              <Link href="/diagnostic">Start diagnostic</Link>
            </Button>
          </div>

          {/* Institutional memory */}
          {memory_snippets.length > 0 && (
            <Card className="premium-shadow" data-demo-section="institutional-memory">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Institutional memory
                </CardTitle>
                <p className="text-sm text-ink-muted">
                  What was learned and what to reuse next time.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  {memory_snippets.map((mem) => (
                    <li key={mem.id} className="rounded border border-border bg-muted/20 p-3">
                      <p className="font-medium text-ink mb-1">What we learned</p>
                      <p className="text-ink-muted mb-2">{mem.what_we_learned}</p>
                      <p className="font-medium text-ink mb-1">Reusable next time</p>
                      <p className="text-ink-muted">{mem.what_to_reuse_next_time}</p>
                      {mem.related_decisions?.length > 0 && (
                        <p className="text-xs text-ink-muted mt-2">
                          Related decisions: {mem.related_decisions.join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sharing */}
          {sharing.length > 0 && (
            <Card className="premium-shadow" data-demo-section="sharing">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Sharing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {sharing.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/20 p-2"
                    >
                      <span className="font-medium">{s.partner_name}</span>
                      <Badge variant="outline">{s.visibility_scope}</Badge>
                      <Badge variant={s.status === "revoked" ? "destructive" : "green"}>
                        {s.status}
                      </Badge>
                      <span className="text-ink-muted">Expires {s.access_expiry}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2" data-demo-section="portfolio-link">
            <Button variant="outline" asChild>
              <Link href="/demo">Back to demo</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/demo/portfolio">See portfolio view</Link>
            </Button>
          </div>

          <DemoTour variant="enterprise" />
          {evidenceModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setEvidenceModal(null)}
            >
              <div
                className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-ink mb-2">Sample evidence</h3>
                <p className="text-sm text-ink-muted mb-2">{evidenceModal.title}</p>
                <div className="rounded border border-border bg-muted/30 p-4 text-center text-ink-muted text-sm">
                  [Demo: document or screenshot would appear here]
                </div>
                <Button className="mt-4 w-full" onClick={() => setEvidenceModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
