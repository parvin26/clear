"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NextStepCTA } from "@/components/clear-blocks";
import { Users, LayoutDashboard, TrendingUp, BookOpen } from "lucide-react";

export default function ForInstitutionsPage() {
  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-4">For Institutions</h1>
            <p className="text-ink-muted">
              Run CLEAR execution cohorts for accelerators, banks, SME associations, development agencies, and VCs.
              Onboard multiple enterprises at once and track activation, execution discipline, and readiness at cohort level.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-4">Run a 14-day CLEAR execution cohort</h2>
            <p className="text-ink-muted">
              Group enterprises under a program with a defined activation window. Each cohort gets a dashboard where you
              see who has completed the first decision cycle and who needs a nudge.
            </p>
          </section>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Portfolio-level execution visibility</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">
                See activation progress, health score, and decision velocity per enterprise. Filter by activation
                incomplete, health below threshold, or velocity band (fast, healthy, slow, at risk). At-risk flags
                surface enterprises that need attention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Activation and readiness analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">
                Cohort-level summary: enterprises enrolled, activation complete count, average activation %, average
                health score, average decision velocity, and at-risk count. Use this for program reporting and
                cohort manager dashboards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Guided cohort onboarding</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">
                Create a cohort, add enterprises, and monitor progress. Each enterprise follows the same activation
                checklist (diagnostic → finalize decision → milestones → review). Cohort managers can trigger
                activation and review reminders (batch messaging and email coming later).
              </p>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-4">Who this is for</h2>
            <ul className="list-disc pl-5 text-ink-muted space-y-1">
              <li>Accelerators running batches of startups</li>
              <li>Banks and development agencies with SME programs</li>
              <li>VCs and impact investors tracking portfolio execution</li>
              <li>SME associations and chambers running digital transformation programs</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="content-container pb-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login?next=/institutional/cohorts">
              <Users className="h-5 w-5" />
              Launch a CLEAR cohort
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/for-partners">Capital partners (portfolios)</Link>
          </Button>
        </div>
      </div>

      <NextStepCTA
        primaryLabel="Launch a CLEAR cohort"
        primaryHref="/login?next=/institutional/cohorts"
        secondaryLabel="Learn about capital partners"
        secondaryHref="/for-partners"
        heading="Next step"
      />
    </Shell>
  );
}
