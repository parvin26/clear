"use client";

import { Suspense } from "react";
import { DiagnosticIntakePage } from "@/components/intake";

export default function DiagnosticEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <DiagnosticIntakePage />
    </Suspense>
  );
}
