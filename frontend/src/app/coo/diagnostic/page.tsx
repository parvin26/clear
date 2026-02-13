"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { DiagnosticForm } from "@/components/coo/DiagnosticForm";

export default function COODiagnosticPage() {
  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <div className="rounded-lg border border-primary/30 bg-primary-soft/30 px-4 py-3 text-sm text-ink">
          For the full multi‑domain experience, use the{" "}
          <Link href="/diagnostic" className="font-medium text-primary hover:underline">CLEAR diagnostic</Link>.
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Ops Diagnostic
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900">
            Capture your operational reality
          </h2>
          <p className="mt-2 text-gray-600">
            Share recent throughput, cost, reliability and process signals. The diagnostic will
            combine them with tailored heuristics and best practices for SMEs.
          </p>
        </div>
        <DiagnosticForm />
      </div>
    </Shell>
  );
}

