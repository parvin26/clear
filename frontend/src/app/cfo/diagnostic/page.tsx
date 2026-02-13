"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { DiagnosticForm } from "@/components/cfo/DiagnosticForm";

export default function CFODiagnosticPage() {
  return (
    <Shell>
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary-soft/30 px-4 py-3 text-sm text-ink">
        For the full multi‑domain experience, use the{" "}
        <Link href="/diagnostic" className="font-medium text-primary hover:underline">CLEAR diagnostic</Link>.
      </div>
      <DiagnosticForm />
    </Shell>
  );
}
