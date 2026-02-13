"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAdvisorEnterprises } from "@/lib/clear-api";
import { Loader2, Building2 } from "lucide-react";

function AdvisorEnterprisesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [list, setList] = useState<{ id: number; name: string | null; sector?: string | null; geography?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Advisor identity required. Use the link from your invitation email.");
      setLoading(false);
      return;
    }
    listAdvisorEnterprises(token)
      .then(setList)
      .catch(() => setError("Failed to load enterprises"))
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

  if (error) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/advisor">
            <Button variant="outline">Back to advisor home</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href={token ? `/advisor?token=${encodeURIComponent(token)}` : "/advisor"} className="text-sm text-muted-foreground hover:underline">
            ← Advisor workspace
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Your enterprises</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Enterprises you&apos;re attached to
            </CardTitle>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <p className="text-muted-foreground text-sm">No enterprises linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/advisor/enterprises/${e.id}?token=${encodeURIComponent(token || "")}`}
                      className="block border rounded-md p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{e.name ?? `Enterprise ${e.id}`}</span>
                      {(e.sector || e.geography) && (
                        <span className="text-muted-foreground text-sm ml-2">
                          {[e.sector, e.geography].filter(Boolean).join(" · ")}
                        </span>
                      )}
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

export default function AdvisorEnterprisesPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    }>
      <AdvisorEnterprisesContent />
    </Suspense>
  );
}
