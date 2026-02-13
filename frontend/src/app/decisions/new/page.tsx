"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { createDecision, createMilestone, listEnterprises, listDecisions, type EnterpriseOut } from "@/lib/clear-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const FIRST_DECISION_TEMPLATE = {
  decision_snapshot: {
    decision_statement: "e.g. We will [define your key decision] by [timeframe]. Edit this statement to reflect your actual decision.",
    success_metric: "How we'll measure success.",
    timeframe: "30 days",
  },
  emr: {
    config: {
      next_review_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
      })(),
    },
  },
} as Record<string, unknown>;

const TEMPLATE_MILESTONES = [
  { milestone_name: "Define", description: "Define scope and success criteria", status: "pending" as const },
  { milestone_name: "Execute", description: "Execute key actions", status: "pending" as const },
  { milestone_name: "Review", description: "Review outcomes and learnings", status: "pending" as const },
];

export default function NewDecisionPage() {
  const router = useRouter();
  const [enterprises, setEnterprises] = useState<EnterpriseOut[]>([]);
  const [enterpriseId, setEnterpriseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstDecision, setIsFirstDecision] = useState<boolean | null>(null);

  useEffect(() => {
    listEnterprises().then(setEnterprises).catch(() => {});
    listDecisions({ limit: 1 }).then((list) => setIsFirstDecision(list.length === 0)).catch(() => setIsFirstDecision(false));
  }, []);

  async function handleCreate() {
    setError(null);
    setSubmitting(true);
    try {
      const body: { enterprise_id?: number; actor_id?: string; actor_role?: string } = {};
      if (enterpriseId.trim()) {
        const id = parseInt(enterpriseId.trim(), 10);
        if (!Number.isNaN(id)) body.enterprise_id = id;
      }
      const decision = await createDecision(body);
      router.push(`/decisions/${decision.decision_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create decision");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateWithTemplate() {
    setError(null);
    setTemplateSubmitting(true);
    try {
      const body: {
        enterprise_id?: number;
        initial_artifact?: Record<string, unknown>;
        actor_id?: string;
        actor_role?: string;
      } = { initial_artifact: FIRST_DECISION_TEMPLATE };
      if (enterpriseId.trim()) {
        const id = parseInt(enterpriseId.trim(), 10);
        if (!Number.isNaN(id)) body.enterprise_id = id;
      }
      const decision = await createDecision(body);
      for (const m of TEMPLATE_MILESTONES) {
        await createMilestone(decision.decision_id, m);
      }
      router.push(`/decisions/${decision.decision_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create decision");
    } finally {
      setTemplateSubmitting(false);
    }
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">New decision</h1>
        <p className="text-ink-muted text-sm">
          Create a blank draft decision and add the artifact and evidence next. Or start from a capability diagnostic to get a decision record with evidence linked.
        </p>
        <p className="text-ink-muted text-sm">
          <Link href="/diagnostic" className="text-primary underline hover:no-underline">Create from diagnostic</Link>
        </p>

        {isFirstDecision === true && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Convert to decision workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink-muted">
                Use the first-decision template: decision statement placeholder, default milestones (Define → Execute → Review), and a 30-day review timeline.
              </p>
              <Button onClick={handleCreateWithTemplate} disabled={templateSubmitting} className="w-full sm:w-auto">
                {templateSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create first decision with template
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="enterprise_id">Enterprise (optional)</Label>
              <select
                id="enterprise_id"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
              >
                <option value="">— None —</option>
                {enterprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || `Enterprise ${e.id}`} {e.sector ? `(${e.sector})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create draft decision
              </Button>
              <Button variant="outline" onClick={() => router.push("/decisions")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
