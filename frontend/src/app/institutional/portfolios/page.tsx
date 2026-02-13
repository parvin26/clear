"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { getInstitutionalPortfolios, type PortfolioItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

/**
 * Phase 4 — Screen A: Portfolios list (read-only).
 * Columns: name, institution (id), created_at. Row click → portfolio detail.
 */
export default function PortfoliosListPage() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstitutionalPortfolios()
      .then(setPortfolios)
      .catch(() => setError("Failed to load portfolios"))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Portfolios</h1>
          <p className="text-ink-muted text-sm mt-1">View readiness and decisions across groups of enterprises.</p>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!error && portfolios.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <h2 className="text-xl font-semibold text-ink mb-2">No portfolios yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Access is granted when an enterprise shares a decision workspace or portfolio with you.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/for-partners"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Request partner onboarding
                </Link>
                <Link
                  href="/demo/portfolio"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  View demo portfolio
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        {!error && portfolios.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portfolio name</TableHead>
                  <TableHead># of enterprises</TableHead>
                  <TableHead>Average readiness</TableHead>
                  <TableHead>Last activity date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/institutional/portfolios/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{p.created_at ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Shell>
  );
}
