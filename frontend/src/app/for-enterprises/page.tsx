"use client";

import { Shell } from "@/components/layout/Shell";
import { RolePageLayout } from "@/components/role-pages/RolePageLayout";
import { ValueStack } from "@/components/role-pages/ValueStack";
import { LifecycleStrip } from "@/components/role-pages/LifecycleStrip";
import { RoleArtifacts } from "@/components/role-pages/RoleArtifacts";
import { NextStepCTA } from "@/components/role-pages/NextStepCTA";
import {
  DiagramChaos,
  DiagramExecution,
  DiagramMemory,
  DiagramSharing,
} from "@/components/role-pages/Schematics";

const VALUE_ITEMS = [
  {
    schematic: <DiagramChaos />,
    title: "Turning operational chaos into governed decisions",
    description:
      "Without a system, problems spiral into emergencies. CLEAR transforms complexity into structured decision artifacts with clear constraints and success criteria.",
    bullets: ["Structured Intake", "Constraint Mapping", "Stakeholder Alignment"],
  },
  {
    schematic: <DiagramExecution />,
    title: "Execution accountability",
    description:
      "Ownership, milestones, and timelines ensure execution clarity. Track progress and commit to plans without micromanagement.",
    bullets: ["Milestone Tracking", "Owner Assignment", "Status Visibility"],
  },
  {
    schematic: <DiagramMemory />,
    title: "Institutional memory",
    description:
      "Decisions and outcomes accumulate, creating a long-term execution history that improves future planning.",
    bullets: ["Outcome Logging", "Retrospective Data", "Pattern Recognition"],
  },
  {
    schematic: <DiagramSharing />,
    title: "Controlled capital sharing",
    description:
      "Enterprises can selectively share execution signals with partners without exposing raw data.",
    bullets: ["Granular Permissions", "Audit Log", "Partner Views"],
  },
];

const LIFECYCLE_STEPS = [
  "Identify Tension",
  "Run Diagnostic",
  "Commit Decision",
  "Assign Owners",
  "Track Milestones",
  "Review Outcomes",
];

export default function ForEnterprisesPage() {
  return (
    <Shell>
      <RolePageLayout
        title="For Enterprises"
        subtitle="Operational growth requires disciplined execution. CLEAR helps enterprises convert operational complexity into governed decisions, accountable execution, and continuous performance learning."
      >
        <ValueStack
          title="Stop solving the same problems twice."
          description="Many organizations operate without decision accountability. Decisions live in conversations, execution responsibility is unclear, and outcomes are rarely reviewed."
          items={VALUE_ITEMS}
        />
        <LifecycleStrip steps={LIFECYCLE_STEPS} />
        <RoleArtifacts />
      </RolePageLayout>
      <NextStepCTA label="Run enterprise diagnostic" primaryHref="/diagnostic?role=enterprise" />
    </Shell>
  );
}
