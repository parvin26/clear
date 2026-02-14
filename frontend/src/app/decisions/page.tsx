"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { listDecisions, type DecisionListItem } from "@/lib/clear-api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";

type Row = DecisionListItem & {
  statement?: string;
  primaryDomain?: string;
  readiness?: string;
  lastReviewDate?: string | null;
};

export default function DecisionsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDecisions({ limit: 50 })
      .then((list) => {
        setRows(
          list.map((d) => ({
            ...d,
            statement: d.decision_id.slice(0, 12) + "…",
            primaryDomain: undefined,
            readiness: undefined,
            lastReviewDate: null,
          }))
        );
      })
      .catch(() => setError("Failed to load decisions"))
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

  const domainLabel: Record<string, string> = {
    cfo: "Finance",
    cmo: "Growth",
    coo: "Operations",
    cto: "Technology",
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Decisions</h1>
            <p className="text-ink-muted text-sm mt-1">
              Each decision records a situation, a chosen path, and how execution is going.
            </p>
          </div>
          <Button asChild>
            <Link href="/diagnostic">
              <Plus className="w-4 h-4 mr-2" />
              New decision
            </Link>
          </Button>
        </div>

        {error && (
          <p className="text-danger text-sm">{error}</p>
        )}

        {!error && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-ink-muted mb-4">No decisions yet. Run a diagnostic to create one.</p>
            <Button asChild>
              <Link href="/diagnostic">New decision</Link>
            </Button>
          </div>
        )}

        {!error && rows.length > 0 && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden premium-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead>Enterprise</TableHead>
                  <TableHead>Primary domain</TableHead>
                  <TableHead>Created date</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Last review date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.decision_id}>
                    <TableCell>
                      <Link
                        href={`/decisions/${d.decision_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {d.statement}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-muted">{d.enterprise_id ?? "-"}</TableCell>
                    <TableCell>{d.primaryDomain ? domainLabel[d.primaryDomain] ?? d.primaryDomain : "-"}</TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{d.readiness ?? "-"}</TableCell>
                    <TableCell>{d.lastReviewDate ?? "-"}</TableCell>
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
