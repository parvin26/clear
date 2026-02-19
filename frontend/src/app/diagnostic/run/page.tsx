"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DiagnosticWizard } from "@/components/diagnostic/DiagnosticWizard";
import { Shell } from "@/components/layout/Shell";
import { USE_NEW_DIAGNOSTIC_REDIRECTS } from "@/lib/feature-flags";
import { trackEvent } from "@/lib/analytics";

export default function DiagnosticRunPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!USE_NEW_DIAGNOSTIC_REDIRECTS) return;
    const params = new URLSearchParams();
    params.set("role", "startup_founder");
    const source = searchParams.get("source");
    if (source) params.set("source", source);
    const toPath = `/diagnostic?${params.toString()}`;
    trackEvent("diagnostic_redirect_triggered", {
      from_path: "/diagnostic/run",
      to_path: "/diagnostic",
      role_preselected: "startup_founder",
      intake_version: "conversational_v1",
      source: source ?? undefined,
    });
    router.replace(toPath);
  }, [router, searchParams]);

  if (USE_NEW_DIAGNOSTIC_REDIRECTS) {
    return (
      <Shell>
        <div className="min-h-[40vh] flex items-center justify-center px-4">
          <p className="text-ink-muted">Redirecting to diagnostic…</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <DiagnosticWizard />
    </Shell>
  );
}
