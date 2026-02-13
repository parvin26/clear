"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdvisorMe, type AdvisorMeOut } from "@/lib/clear-api";
import { Loader2, FileText, Building2, History } from "lucide-react";

function AdvisorHomeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<AdvisorMeOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Advisor identity required. Use the link from your invitation email.");
      setLoading(false);
      return;
    }
    getAdvisorMe(token)
      .then(setData)
      .catch(() => setError("Failed to load advisor workspace"))
      .finally(() => setLoading(false));
  }, [token]);

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
        <div className="max-w-lg mx-auto py-12 text-center">
          <p className="text-destructive mb-4">{error || "Unable to load workspace"}</p>
          <p className="text-sm text-muted-foreground mb-4">
            You don&apos;t have any review requests yet. Once a founder or capital partner invites you to CLEAR, you&apos;ll see their decisions here.
          </p>
          <Link href="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const pending = data.pending_review_requests || [];
  const enterprises = data.enterprises || [];
  const recent = data.recent_reviews || [];

  return (
    <Shell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Advisor workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">{data.email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reviews waiting for you
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                You don&apos;t have any review requests yet. Once a founder or capital partner invites you to CLEAR, you&apos;ll see their decisions here.
              </p>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{r.enterprise_name ?? "Enterprise"}</span>
                      <span className="text-muted-foreground mx-2">·</span>
                      <span>Decision {r.decision_id.slice(0, 8)}…</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {r.requested_by && `Requested by ${r.requested_by}`}
                      {r.requested_at && ` · ${new Date(r.requested_at).toLocaleDateString()}`}
                      {r.due_date && ` · Due ${new Date(r.due_date).toLocaleDateString()}`}
                    </div>
                    <Link href={`/advisor/decisions/${r.decision_id}?token=${encodeURIComponent(token || "")}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Your enterprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enterprises.length === 0 ? (
              <p className="text-muted-foreground text-sm">No enterprises linked yet.</p>
            ) : (
              <div className="space-y-2">
                {enterprises.map((e) => (
                  <Link
                    key={e.id}
                    href={`/advisor/enterprises/${e.id}?token=${encodeURIComponent(token || "")}`}
                    className="block border rounded-md p-3 text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{e.name ?? `Enterprise ${e.id}`}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="truncate">{r.headline_assessment ?? "Review"}</span>
                    <Link href={`/advisor/decisions/${r.decision_id}?token=${encodeURIComponent(token || "")}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

export default function AdvisorHomePage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    }>
      <AdvisorHomeContent />
    </Suspense>
  );
}
