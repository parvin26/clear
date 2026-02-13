"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check } from "lucide-react";
import { submitHumanReviewRequest } from "@/lib/clear-api";

function HumanReviewContent() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decision_id") ?? "";
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    country: "",
    company: "",
    role: "",
    focus: "",
    consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionId) {
      setError("Missing decision. Go back to your result and use “Request human review”.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.consent) {
      setError("Please agree to share your decision snapshot and EMR plan with a human advisor.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitHumanReviewRequest({
        decision_id: decisionId,
        name: form.name.trim() || undefined,
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        country: form.country.trim() || undefined,
        company: form.company.trim() || undefined,
        role: form.role.trim() || undefined,
        consent: form.consent,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Shell>
        <div className="min-h-screen flex flex-col px-4 py-12 bg-background">
          <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
            <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-3 premium-shadow">
              <Check className="h-8 w-8 text-success flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-ink">Request received</h2>
                <p className="text-ink-muted text-sm mt-1">
                  We&apos;ve captured your request. A human advisor will review your decision and plan, and contact you using the details you provided.
                </p>
              </div>
            </div>
            {decisionId && (
              <Button asChild>
                <Link href={`/decisions/${decisionId}`}>Back to my decision workspace</Link>
              </Button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="min-h-screen flex flex-col px-4 py-12 bg-background">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col space-y-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={decisionId ? `/diagnostic/result/${decisionId}` : "/diagnostic"}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-ink">
            Request a human review of this decision
          </h1>
          <p className="text-ink-muted text-sm">
            We&apos;ll route this decision snapshot and plan to a human advisor. They&apos;ll respond by email or WhatsApp.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 p-3 rounded">{error}</p>
            )}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (required)</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp (optional, but encouraged)</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+65 1234 5678"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="e.g. Singapore"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Company name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Founder, CFO"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="focus">What would you like the human to focus on?</Label>
              <Textarea
                id="focus"
                value={form.focus}
                onChange={(e) => setForm((f) => ({ ...f, focus: e.target.value }))}
                placeholder="e.g. cash flow assumptions, sequencing of milestones"
                className="mt-1 min-h-[80px] resize-none"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="consent"
                checked={form.consent}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, consent: !!checked }))}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm leading-tight cursor-pointer">
                I agree to share my decision snapshot and EMR plan with a human advisor.
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </div>
      </div>
    </Shell>
  );
}

export default function HumanReviewPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading…</div>
        </div>
      </Shell>
    }>
      <HumanReviewContent />
    </Suspense>
  );
}
