"use client";

import { DiagnosticWizard } from "@/components/diagnostic/DiagnosticWizard";
import { Shell } from "@/components/layout/Shell";

export default function DiagnosticRunPage() {
  return (
    <Shell>
      <DiagnosticWizard />
    </Shell>
  );
}
