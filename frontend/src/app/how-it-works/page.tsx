"use client";

import { Shell } from "@/components/layout/Shell";
import { RolePageLayout } from "@/components/role-pages/RolePageLayout";
import { ValueStack } from "@/components/role-pages/ValueStack";
import { LifecycleStrip } from "@/components/role-pages/LifecycleStrip";
import { RoleArtifacts } from "@/components/role-pages/RoleArtifacts";
import { NextStepCTA } from "@/components/role-pages/NextStepCTA";
import { StepDetailAccordion } from "@/components/role-pages/StepDetailAccordion";
import { TrustSection } from "@/components/about/TrustSection";
import { DiagramChaos } from "@/components/role-pages/Schematics";

const PROBLEM_ITEMS = [
  {
    schematic: <DiagramChaos />,
    title: "The business reality problem",
    description:
      "Most enterprises operate without structured decision systems. Decisions live in conversations, execution responsibility is unclear, and outcomes are rarely reviewed in a structured way.",
    bullets: [
      "Decisions lost in chat threads",
      "Unclear execution ownership",
      "No structured outcome review",
    ],
  },
];

const LIFECYCLE_STEPS = [
  "Diagnose Situation",
  "Clarify Priorities",
  "Commit Decision",
  "Assign Milestones",
  "Track Progress",
  "Capture Outcomes",
];

const ACCORDION_STEPS = [
  {
    id: "1",
    title: "1. Describe the situation",
    content:
      "Intake creates a situation record. You describe your business context, the tension you are facing, and the decision you face. This anchors the process in reality, not theory.",
  },
  {
    id: "2",
    title: "2. Clarify priorities",
    content:
      "Identify the non-negotiables and trade-offs. What are we optimizing for? Speed, quality, or cost? This step forces alignment before a decision is made.",
  },
  {
    id: "3",
    title: "3. Commit decision",
    content:
      "The decision is formally recorded. Not just 'we talked about it', but a structured commitment with a rationale, specific constraints, and assigned approvers.",
  },
  {
    id: "4",
    title: "4. Assign milestones",
    content:
      "Execution is broken down into clear milestones. Each milestone has a single owner and a due date. This creates a direct link between the decision and the work required to achieve it.",
  },
  {
    id: "5",
    title: "5. Track progress",
    content:
      "Milestone owners update status. The system provides visibility into what is on track and what is at risk, allowing for proactive intervention rather than reactive fire-fighting.",
  },
  {
    id: "6",
    title: "6. Capture outcomes",
    content:
      "Once the execution is complete, the team reviews the actual outcome against the expected result. This learning loop feeds back into institutional memory to improve future decisions.",
  },
];

export default function HowItWorksPage() {
  return (
    <Shell>
      <RolePageLayout
        title="How CLEAR Works"
        subtitle="A repeatable lifecycle that converts real business situations into governed decisions, tracked execution, and measurable outcomes."
      >
        <div className="mb-24">
          <TrustSection />
        </div>

        <ValueStack
          title="The Reality Gap"
          description="Why traditional management fails to capture decision value."
          items={PROBLEM_ITEMS}
        />

        <LifecycleStrip steps={LIFECYCLE_STEPS} />

        <StepDetailAccordion steps={ACCORDION_STEPS} />

        <RoleArtifacts />
      </RolePageLayout>
      <NextStepCTA label="Start Diagnostic" primaryHref="/diagnostic" />
    </Shell>
  );
}
