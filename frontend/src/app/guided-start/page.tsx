"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NextStepCTA } from "@/components/clear-blocks";
import { ListOrdered, Clock, CheckCircle2 } from "lucide-react";
import { postGuidedStartRequest } from "@/lib/api";

const ONBOARDING_TYPES = [
  "Guided walkthrough (live session)",
  "Self-serve with email support",
  "Demo + Q&A first",
  "Other",
];

const TEAM_SIZE_OPTIONS = [
  "1–5",
  "6–15",
  "16–50",
  "51–200",
  "200+",
];

export default function GuidedStartPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    organization: "",
    team_size: "",
    primary_challenge: "",
    email: "",
    preferred_onboarding_type: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await postGuidedStartRequest({
        organization: formData.organization.trim() || undefined,
        team_size: formData.team_size || undefined,
        primary_challenge: formData.primary_challenge.trim() || undefined,
        email: formData.email.trim(),
        preferred_onboarding_type: formData.preferred_onboarding_type || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Shell>
        <div className="content-container py-10 md:py-14">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Request received</h1>
            <p className="text-ink-muted">
              We will respond within 24–48 hours to schedule your guided start or next steps.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/guided-start">Back to Guided Start</Link>
              </Button>
              <Button asChild>
                <Link href="/start">Go to Start</Link>
              </Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-4">Guided Start</h1>
            <p className="text-ink-muted">
              Some organizations prefer guided onboarding before using the full system. Guided Start provides
              structured assistance to help teams begin their first decision lifecycle quickly.
            </p>
          </div>

          {/* Guided start intake form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request a guided start</CardTitle>
              <p className="text-sm text-ink-muted">
                Submit your details and we will get back to you within 24–48 hours to schedule.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Company or organization name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="team_size">Team size</Label>
                  <Select
                    value={formData.team_size || undefined}
                    onValueChange={(v) => setFormData({ ...formData, team_size: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="primary_challenge">Primary challenge</Label>
                  <Input
                    id="primary_challenge"
                    value={formData.primary_challenge}
                    onChange={(e) => setFormData({ ...formData, primary_challenge: e.target.value })}
                    placeholder="e.g. aligning on execution priorities, first decision cycle"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="you@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_onboarding_type">Preferred onboarding type</Label>
                  <Select
                    value={formData.preferred_onboarding_type || undefined}
                    onValueChange={(v) => setFormData({ ...formData, preferred_onboarding_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {ONBOARDING_TYPES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Submitting…" : "Submit request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Who should use guided start */}
          <section>
            <h2 className="text-xl font-semibold text-ink mb-4">Who should use Guided Start</h2>
            <p className="text-ink-muted">
              Organizations launching CLEAR for the first time. Teams that want a structured walkthrough before
              running diagnostics on their own.
            </p>
          </section>

          {/* What happens during onboarding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">What happens during onboarding</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-ink-muted space-y-2">
              <p>Guided intake, diagnostic setup, and first decision creation with a CLEAR team member.</p>
            </CardContent>
          </Card>

          {/* Time to first decision workspace */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Time to first decision workspace</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-ink-muted">
              <p>Typical activation timeline: one guided session to first decision workspace.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="content-container pb-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/diagnostic">Start diagnostic</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/start">Get started</Link>
          </Button>
        </div>
      </div>

      <NextStepCTA
        primaryLabel="Get started"
        primaryHref="/start"
        secondaryLabel="Start diagnostic"
        secondaryHref="/diagnostic"
        heading="Next step"
      />
    </Shell>
  );
}
