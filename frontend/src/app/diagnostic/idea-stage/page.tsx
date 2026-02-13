"use client";

import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitIdeaStageSignup } from "@/lib/clear-api";
import { Check } from "lucide-react";

export default function IdeaStagePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitIdeaStageSignup({ email: email.trim() || undefined });
      setSubmitted(true);
    } catch (_) {
      setSubmitting(false);
    }
    setSubmitting(false);
  };

  return (
    <Shell>
      <div className="min-h-screen flex flex-col px-4 py-12 bg-background">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-semibold text-ink mb-4">
            CLEAR is currently for operating businesses.
          </h1>
          <p className="text-ink-muted mb-6 leading-relaxed">
            Right now, CLEAR is designed for founders who are already running a business with revenue or operations.
          </p>
          <p className="text-ink-muted mb-6 leading-relaxed">
            You told us you&apos;re at the idea or validation stage, so the full diagnostic and execution plan would not be helpful yet.
          </p>

          <h2 className="text-lg font-semibold text-ink mb-2">What you can do instead</h2>
          <ul className="list-disc pl-5 text-ink-muted text-sm space-y-1 mb-6">
            <li>Use our simple checklist for idea‑stage validation.</li>
            <li>Leave your email and we&apos;ll invite you when our idea‑stage path is ready.</li>
          </ul>

          {submitted ? (
            <div className="rounded-lg border border-border bg-primary-soft/30 p-4 text-ink flex items-center gap-3">
              <Check className="h-6 w-6 text-primary shrink-0" />
              <p className="text-sm">We&apos;ve received your details. We&apos;ll send you the idea‑stage checklist and notify you when the path is ready.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="idea-email">Email</Label>
                <Input
                  id="idea-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 max-w-sm"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send me the idea‑stage checklist"}
              </Button>
            </form>
          )}

          <div className="mt-8">
            <Button variant="ghost" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
