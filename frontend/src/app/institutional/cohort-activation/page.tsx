"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { listCohortModeEnterprises, type CohortModeEnterpriseRow } from "@/lib/clear-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Users, AlertTriangle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  describe: "Describe",
  diagnostic: "Diagnostic",
  finalize: "Finalize",
  milestones: "Milestones",
  review: "Review",
};

export default function CohortActivationPage() {
  const [rows, setRows] = useState<CohortModeEnterpriseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listCohortModeEnterprises()
      .then(setRows)
      .catch(() => setError("Failed to load cohort-mode enterprises"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
          <h1 className="text-2xl font-semibold text-ink">Cohort activation</h1>
          <p className="text-ink-muted text-sm mt-1">
            Enterprises in cohort mode and their activation progress (first CLEAR cycle).
          </p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!error && rows.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <Users className="w-12 h-12 mx-auto text-ink-muted mb-4" />
              <h2 className="text-xl font-semibold text-ink mb-2">No enterprises in cohort mode</h2>
              <p className="text-muted-foreground text-sm">
                Enterprises with activation_mode=cohort will appear here. Use the enterprise update API or admin to set activation_mode to &quot;cohort&quot;.
              </p>
            </CardContent>
          </Card>
        )}

        {!error && rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Enterprises (activation_mode=cohort)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enterprise</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Next step</TableHead>
                      <TableHead>Days since start</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ enterprise, activation }) => (
                      <TableRow key={enterprise.id}>
                        <TableCell>
                          <span className="font-medium">{enterprise.name ?? `Enterprise ${enterprise.id}`}</span>
                          {!activation.all_complete && (
                            <AlertTriangle className="inline-block w-4 h-4 ml-1 text-amber-600" aria-hidden />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{activation.completed_count} / 5</span>
                          {activation.all_complete && (
                            <Badge variant="secondary" className="ml-1 text-xs">Complete</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {activation.next_step_key ? STEP_LABELS[activation.next_step_key] ?? activation.next_step_key : "-"}
                        </TableCell>
                        <TableCell>{activation.days_since_start}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/institutional/enterprises/${enterprise.id}`}>Snapshot</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
