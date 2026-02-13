"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEnterprise } from "@/lib/clear-api";
import { listAdvisorEnterpriseDecisions } from "@/lib/clear-api";
import { Loader2, FileText } from "lucide-react";

export default function AdvisorEnterpriseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const token = searchParams.get("token");
  const [enterpriseName, setEnterpriseName] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<{ decision_id: string; current_status: string; created_at: string | null; decision_statement?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || Number.isNaN(id)) {
      setError("Invalid access");
      setLoading(false);
      return;
    }
    Promise.all([
      getEnterprise(id).then((e) => setEnterpriseName(e.name ?? null)).catch(() => setEnterpriseName(`Enterprise ${id}`)),
      listAdvisorEnterpriseDecisions(id, token).then(setDecisions).catch(() => setDecisions([])),
    ])
      .finally(() => setLoading(false));
  }, [id, token]);

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
        <div className="max-w-lg mx-auto py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href={token ? `/advisor?token=${encodeURIComponent(token)}` : "/advisor"}>
            <span className="text-sm text-primary hover:underline">Back to advisor home</span>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href={token ? `/advisor/enterprises?token=${encodeURIComponent(token)}` : "/advisor/enterprises"} className="text-sm text-muted-foreground hover:underline">
            ← Your enterprises
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{enterpriseName ?? `Enterprise ${id}`} – Advisor view</h1>
        <p className="text-muted-foreground text-sm">
          This view helps you see where your input is most needed and how this enterprise is progressing.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Decisions you&apos;re helping with
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decisions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No decisions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Decision</th>
                      <th className="text-left py-2 font-medium">Readiness</th>
                      <th className="text-left py-2 font-medium">Last update</th>
                      <th className="text-left py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((d) => (
                      <tr key={d.decision_id} className="border-b">
                        <td className="py-2 max-w-[280px] truncate">{d.decision_statement || d.decision_id.slice(0, 8) + "…"}</td>
                        <td className="py-2">{d.current_status}</td>
                        <td className="py-2 text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                        <td className="py-2">
                          <Link href={`/advisor/decisions/${d.decision_id}?token=${encodeURIComponent(token || "")}`} className="text-primary hover:underline">
                            View
                          </Link>
                        </td>
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
