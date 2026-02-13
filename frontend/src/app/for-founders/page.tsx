"use client";

import { Shell } from "@/components/layout/Shell";
import { RolePageLayout } from "@/components/role-pages/RolePageLayout";
import { ValueStack } from "@/components/role-pages/ValueStack";
import { LifecycleStrip } from "@/components/role-pages/LifecycleStrip";
import { RoleArtifacts } from "@/components/role-pages/RoleArtifacts";
import { NextStepCTA } from "@/components/role-pages/NextStepCTA";
import { DiagramPrioritization, DiagramOrder, DiagramSharing } from "@/components/role-pages/Schematics";

const VALUE_ITEMS = [
  {
    schematic: <DiagramPrioritization />,
    title: "Diagnostic-driven prioritization",
    description:
      "You have limited capacity. CLEAR helps you identify the highest-impact decisions first through a structured diagnostic, so you solve what matters.",
    bullets: ["Capacity Analysis", "Impact Scoring", "Focus Areas"],
  },
  {
    schematic: <DiagramOrder />,
    title: "Move from 'Hero Mode' to System",
    description:
      "Transition from founder-driven decisions to a distributed operating system where your team executes with the same logic you would apply.",
    bullets: ["Delegation Framework", "Decision Logic", "Guardrails"],
  },
  {
    schematic: <DiagramSharing />,
    title: "Capital readiness",
    description:
      "Structured execution improves investor confidence. Show decision records and outcome reviews when raising or reporting, proving you are ready to scale.",
    bullets: ["Due Diligence Ready", "Governance History", "Trust Signals"],
  },
];

const LIFECYCLE_STEPS = [
  "Input Constraints",
  "Define Non-negotiables",
  "Design Plan",
  "Anchor Rhythm",
  "Execute Sprints",
  "Learn & Iterate",
];

export default function ForFoundersPage() {
  return (
    <Shell>
      <RolePageLayout
        title="For Founders"
        subtitle="Founders face decision overload. CLEAR provides structured prioritization, decision discipline, and execution tracking that supports capital readiness and long-term scaling."
      >
        <ValueStack
          title="Get the decisions out of your head."
          description="Growth breaks when the founder is the only source of truth. CLEAR extracts your logic into a system your team can run."
          items={VALUE_ITEMS}
        />
        <LifecycleStrip steps={LIFECYCLE_STEPS} />
        <RoleArtifacts />
      </RolePageLayout>
      <NextStepCTA label="Start founder diagnostic" primaryHref="/diagnostic?role=founder" />
    </Shell>
  );
}
