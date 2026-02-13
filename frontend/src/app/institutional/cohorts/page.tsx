"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import {
  listCohorts,
  createCohort,
  type CohortOut,
  type CohortCreateBody,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Users } from "lucide-react";

export default function CohortsListPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<CohortOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    listCohorts()
      .then(setCohorts)
      .catch(() => setError("Failed to load cohorts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateSubmitting(true);
    setError(null);
    try {
      const body: CohortCreateBody = { name: createName.trim(), activation_window_days: 14 };
      const c = await createCohort(body);
      setCreateName("");
      setShowCreate(false);
      load();
      router.push(`/institutional/cohorts/${c.id}`);
    } catch {
      setError("Failed to create cohort");
    } finally {
      setCreateSubmitting(false);
    }
  }

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Cohorts</h1>
            <p className="text-ink-muted text-sm mt-1">
              Run 14-day CLEAR execution cohorts and monitor activation, health, and velocity.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Launch a cohort
          </Button>
        </div>

        {showCreate && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="cohort_name">Cohort name</Label>
                  <Input
                    id="cohort_name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Q1 Accelerator 2025"
                    className="mt-1 max-w-md"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createSubmitting || !createName.trim()}>
                    {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create cohort
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!error && cohorts.length === 0 && !showCreate && (
          <Card>
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <Users className="w-12 h-12 mx-auto text-ink-muted mb-4" />
              <h2 className="text-xl font-semibold text-ink mb-2">No cohorts yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Create a cohort to onboard and monitor multiple enterprises in a 14-day activation window.
              </p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Launch a CLEAR cohort
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && cohorts.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Activation window</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.activation_window_days} days</TableCell>
                    <TableCell>{c.start_date ?? "—"}</TableCell>
                    <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/institutional/cohorts/${c.id}`}>View</Link>
                      </Button>
                    </TableCell>
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
