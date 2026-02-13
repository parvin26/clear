"use client";

import { Shell } from "@/components/layout/Shell";
import { RolePageLayout } from "@/components/role-pages/RolePageLayout";
import { ValueStack } from "@/components/role-pages/ValueStack";
import { NextStepCTA } from "@/components/role-pages/NextStepCTA";
import { PartnerForm } from "@/components/role-pages/PartnerForm";
import { DiagramVisibility, DiagramSharing, DiagramOutcomes } from "@/components/role-pages/Schematics";

const VALUE_ITEMS = [
  {
    schematic: <DiagramVisibility />,
    title: "The Visibility Gap",
    description:
      "Financial reports describe history, not execution capability. CLEAR gives you a live pulse on decision governance and execution readiness across your portfolio.",
    bullets: ["Readiness Signals", "Governance Health", "Execution Velocity"],
  },
  {
    schematic: <DiagramSharing />,
    title: "Enterprise-Controlled Sharing",
    description:
      "Enterprises can selectively share execution signals with partners without exposing raw data.",
    bullets: ["Permissioned Views", "Revocable Access", "Trust-First Model"],
  },
  {
    schematic: <DiagramOutcomes />,
    title: "Evidence, not decks",
    description:
      "Stop relying on polished board decks. See the actual decision records, execution milestones, and outcome reviews that drive the business.",
    bullets: ["Raw Decision Data", "Milestone Truth", "Outcome Reality"],
  },
];

export default function ForPartnersPage() {
  return (
    <Shell>
      <RolePageLayout
        title="For Capital Partners"
        subtitle="Capital providers need true signals of execution capability. CLEAR enables portfolio-level governance visibility while respecting enterprise data sovereignty."
      >
        <ValueStack
          title="See how they actually execute."
          description="Move beyond the board deck. Access structured signals on decision quality and execution discipline."
          items={VALUE_ITEMS}
        />
        <PartnerForm />
      </RolePageLayout>
      <NextStepCTA label="Join partner ecosystem" primaryHref="/start" />
    </Shell>
  );
}
