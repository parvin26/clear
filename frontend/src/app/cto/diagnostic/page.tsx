"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { DiagnosticForm } from "@/components/cto/DiagnosticForm";

export default function CTODiagnosticPage() {
  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <div className="rounded-lg border border-primary/30 bg-primary-soft/30 px-4 py-3 text-sm text-ink">
          For the full multi‑domain experience, use the{" "}
          <Link href="/diagnostic" className="font-medium text-primary hover:underline">CLEAR diagnostic</Link>.
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-ink">
            CTO Diagnostic
          </h2>
          <p className="mt-2 text-ink-muted">
            Assess your technology infrastructure and engineering capabilities.
          </p>
        </div>
        <DiagnosticForm />
      </div>
    </Shell>
  );
}
