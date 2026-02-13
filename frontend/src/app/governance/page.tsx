"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { NextStepCTA } from "@/components/role-pages/NextStepCTA";
import {
  DiagramDecisionRecord,
  DiagramMemory,
  DiagramPrioritization,
  DiagramSharing,
  DiagramVisibility,
} from "@/components/role-pages/Schematics";

const TOP_FEATURES = [
  {
    schematic: <DiagramDecisionRecord />,
    title: "Finalization and sign-off",
    description:
      "Decisions are committed as structured artifacts so execution paths are clear and auditable.",
  },
  {
    schematic: <DiagramMemory />,
    title: "Audit trail of changes",
    description: "Every change is recorded. You can see who did what and when.",
  },
  {
    schematic: <DiagramPrioritization />,
    title: "Evidence attached to milestones",
    description:
      "Attach documents and metrics to milestones so decisions are backed by evidence.",
  },
  {
    schematic: <DiagramSharing />,
    title: "Enterprise-controlled sharing",
    description:
      "You choose what to share and with whom. Portfolio partners see only what you allow.",
  },
];

const ACTIVITY_ITEMS = [
  "Decision created",
  "Artifact updated",
  "Plan committed",
  "Outcome review added",
];

const SHARING_BULLETS = [
  "Enterprise chooses what to share",
  "Enterprise chooses who sees it",
  "Access revocable anytime",
  "Activity logged",
];

export default function GovernancePage() {
  return (
    <Shell>
      <div className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-[40px] font-bold text-[#1F2A37] mb-6 tracking-tight">
            Governance and Trust
          </h1>
          <p className="text-[17px] text-[#1F2A37]/70 font-normal leading-relaxed max-w-3xl">
            CLEAR is designed as execution governance infrastructure. Every decision, milestone, and
            outcome is recorded with traceable change history. Enterprises control what information
            is shared and with whom.
          </p>
        </div>

        <section className="mb-24">
          <h2 className="text-[18px] font-bold text-[#1F2A37] mb-8">
            How we protect your decisions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TOP_FEATURES.map((f, i) => (
              <div key={i}>
                <div className="mb-4 scale-75 origin-top-left opacity-90">{f.schematic}</div>
                <h3 className="text-[15px] font-bold text-[#1F2A37] mb-3 leading-snug">
                  {f.title}
                </h3>
                <p className="text-[13px] text-[#1F2A37]/60 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="text-[18px] font-bold text-[#1F2A37] mb-6">Governance overview</h2>
            <p className="text-[14px] text-[#1F2A37]/60 mb-8 max-w-3xl">
              Decisions are stored as structured artifacts. Finalized decisions represent committed
              execution paths. Every change is recorded; execution updates are traceable over time.
            </p>
            <div className="bg-white border border-[#1F2A37]/10 rounded-xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="scale-75 origin-top-left mt-1">
                  <DiagramDecisionRecord />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F2A37]">
                    Decision records and finalization
                  </h3>
                </div>
              </div>
              <p className="text-[14px] text-[#1F2A37]/60 mb-6 pl-14">
                Decisions are stored as structured artifacts. Finalized decisions represent
                committed execution paths.
              </p>
              <div className="pl-14">
                <Link
                  href="/how-it-works"
                  className="inline-block px-4 py-2 bg-white border border-[#1D4ED8] text-[#1D4ED8] text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8]/5 transition-colors"
                >
                  See a finalized decision example
                </Link>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-[#1F2A37] mb-6">
              Audit trail and change history
            </h2>
            <p className="text-[14px] text-[#1F2A37]/60 mb-8">
              Every change is recorded. Execution updates are traceable over time.
            </p>
            <div className="bg-[#F9FAFB] border border-[#1F2A37]/10 rounded-xl p-8">
              <h4 className="text-[11px] font-bold text-[#1F2A37]/40 uppercase tracking-widest mb-4">
                Activity History
              </h4>
              <ul className="space-y-3">
                {ACTIVITY_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-[#1F2A37]/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="bg-white border border-[#1F2A37]/10 rounded-xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="scale-75 origin-top-left mt-1">
                  <DiagramPrioritization />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F2A37]">
                    Evidence attached to milestones
                  </h3>
                </div>
              </div>
              <p className="text-[14px] text-[#1F2A37]/60 mb-6 pl-14">
                Milestones can include documents, metrics, and notes. Evidence supports execution
                credibility.
              </p>
              <div className="pl-14">
                <Link
                  href="/how-it-works"
                  className="inline-block px-4 py-2 bg-white border border-[#1D4ED8] text-[#1D4ED8] text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8]/5 transition-colors"
                >
                  Attach execution evidence
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="bg-white border border-[#1F2A37]/10 rounded-xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="scale-75 origin-top-left mt-1">
                  <DiagramSharing />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F2A37]">
                    Enterprise-controlled sharing
                  </h3>
                </div>
              </div>
              <div className="pl-14 space-y-2 mb-6">
                {SHARING_BULLETS.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[14px] text-[#1F2A37]/70"
                  >
                    <div className="w-1 h-1 bg-[#1D4ED8] rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="pl-14">
                <Link
                  href="/how-it-works"
                  className="inline-block px-4 py-2 bg-[#1D4ED8] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1E40AF] transition-colors shadow-sm"
                >
                  See how sharing works
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="bg-white border border-[#1F2A37]/10 rounded-xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="scale-75 origin-top-left mt-1">
                  <DiagramVisibility />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F2A37]">
                    Data visibility rules
                  </h3>
                </div>
              </div>
              <p className="text-[14px] text-[#1F2A37]/60 pl-14">
                Data is visible only through enterprise permission. Portfolio partners see only
                shared artifacts.
              </p>
            </div>
          </section>
        </div>
      </div>

      <NextStepCTA label="Start diagnostic" primaryHref="/diagnostic" />
    </Shell>
  );
}
