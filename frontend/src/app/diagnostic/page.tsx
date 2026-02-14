"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shell } from "@/components/layout/Shell";
import { getOnboardingContext } from "@/lib/onboarding-context";
import { ArrowRight, Sparkles, Building2 } from "lucide-react";

export default function DiagnosticEntryPage() {
  const onboarding = getOnboardingContext();
  const hasProfile = Boolean(
    onboarding && (onboarding.name || onboarding.industry || onboarding.country)
  );

  return (
    <Shell>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-xl md:text-2xl font-semibold text-ink mb-2">
              Who are you?
            </h1>
            <p className="text-sm text-ink-muted">
              Choose the path that fits you. We&apos;ll tailor the diagnostic accordingly.
            </p>
            {hasProfile && (
              <p className="text-xs text-ink-muted mt-2">
                We have your profile (name, industry, or region). You can still pick either path.
              </p>
            )}
          </div>

          <div className="grid gap-4">
            <Card className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
              <Link href="/diagnostic/run" className="block group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                    <CardTitle className="text-lg">Startup founder</CardTitle>
                  </div>
                  <p className="text-sm text-ink-muted font-normal">
                    I&apos;m building or running an early-stage company. I want to clarify my situation and get a decision snapshot.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:underline">
                    Start 8-step diagnostic
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardContent>
              </Link>
            </Card>

            <Card className="overflow-hidden border hover:border-primary/20 transition-colors">
              <Link href="/diagnostic/msme" className="block group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-ink-muted" aria-hidden />
                    <CardTitle className="text-lg">SME / MSME</CardTitle>
                  </div>
                  <p className="text-sm text-ink-muted font-normal">
                    I run an SME. I want an assessment with &quot;which of these feel most true&quot; then AI advisor and CXO agents.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:underline">
                    Start MSME diagnostic
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardContent>
              </Link>
            </Card>
          </div>

          <p className="text-xs text-ink-muted text-center">
            Prefer a single area?{" "}
            <Link href="/book-diagnostic" className="font-medium text-primary hover:underline">
              Choose Finance, Growth, Ops, or Tech
            </Link>
            .
          </p>
          <p className="text-xs text-ink-muted text-center">
            For idea‑stage founders, CLEAR is focused on operating businesses. We&apos;ll tell you early if you&apos;re not a fit yet.
          </p>
        </div>
      </div>
    </Shell>
  );
}
