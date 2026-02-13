"use client";

import { MSMEDiagnosticWizard } from "@/components/diagnostic/MSMEDiagnosticWizard";
import { Shell } from "@/components/layout/Shell";

export default function MSMEDiagnosticPage() {
  return (
    <Shell>
      <MSMEDiagnosticWizard />
    </Shell>
  );
}
