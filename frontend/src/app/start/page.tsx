"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, FileText, ClipboardList, Compass } from "lucide-react";

export default function StartPage() {
  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-4">How to start with CLEAR</h1>
            <p className="text-ink-muted">
              Choose how you want to begin. Every path leads to a governed decision and execution workspace.
            </p>
          </div>

          {/* 1. Start by describing your problem */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Start by describing your problem</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-ink-muted">
                Turn your current situation into a governed decision. Run a diagnostic, get a structured snapshot, then create a decision workspace.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/diagnostic">Turn your situation into a governed decision</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 2. Start from an analysis */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Start from an analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-ink-muted">
                Already have a capability or domain analysis? Use it to bootstrap a decision workspace.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
                  <Link href="/diagnostic">Use existing diagnostic</Link>
                </Button>
                <Button asChild variant="outline" disabled>
                  <span>Upload or paste analysis (coming soon)</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Start from an existing decision */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Start from an existing decision</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-ink-muted">
                Already know the decision? Create a governed execution workspace and add milestones, evidence, and outcome reviews.
              </p>
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
                <Link href="/decisions/new">Create a governed execution workspace</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">Not sure where to begin?</p>
                    <p className="text-sm text-ink-muted">Book a guided start with the CLEAR team.</p>
                  </div>
                </div>
                <Button asChild size="default" variant="outline" className="shrink-0 border-primary text-primary hover:bg-primary/10">
                  <Link href="/guided-start">Book guided start</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
