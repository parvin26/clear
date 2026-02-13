"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  DiagramDecisionRecord,
  DiagramSharing,
  DiagramVisibility,
  DiagramMemory,
} from "@/components/role-pages/Schematics";

const CARDS = [
  {
    schematic: <DiagramDecisionRecord />,
    title: "Execution governance security",
    content: [
      "Decision records, milestones, and outcome reviews are stored with append-only change history. Finalized decisions are immutable; updates create new versions so audit trails are preserved.",
      "Access to workspaces and shared views is controlled by roles and invitations. Enterprises decide what to share and with whom.",
    ],
  },
  {
    schematic: <DiagramSharing />,
    title: "Data in transit and at rest",
    content: [
      "All traffic between your browser and our services uses TLS. Data at rest is stored in secure, access-controlled environments. Credentials are hashed; we do not store plain-text passwords.",
    ],
  },
  {
    schematic: <DiagramVisibility />,
    title: "Data visibility and control",
    content: [
      "You own your data. Diagnostic inputs, decisions, and execution artifacts are yours. Sharing with partners (e.g. portfolio view) is opt-in and scoped. We do not use your decision or execution content for marketing.",
      "For capital partners: visibility is granted only when an enterprise invites you; you see only what they choose to share.",
    ],
  },
  {
    schematic: <DiagramMemory />,
    title: "Operational security",
    content: [
      "We use industry-standard hosting and access controls. Access to production systems is limited and logged. We respond to security issues in line with our incident response practices.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <Shell>
      <div className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-[40px] font-bold text-[#1F2A37] mb-6 tracking-tight">Security</h1>
          <p className="text-[17px] text-[#1F2A37]/70 font-normal leading-relaxed max-w-3xl">
            How we protect your data and execution governance artifacts. CLEAR is built for
            institutional use; security and data visibility controls are core to the product.
          </p>
        </div>

        <div className="space-y-6">
          {CARDS.map((card, index) => (
            <div
              key={index}
              className="bg-white border border-[#1F2A37]/10 rounded-xl p-8 hover:border-[#1D4ED8]/30 transition-colors shadow-sm"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 mt-1 scale-75 origin-top-left opacity-80">
                  {card.schematic}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#1F2A37] mb-4">{card.title}</h3>
                  <div className="space-y-4">
                    {card.content.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-[15px] text-[#1F2A37]/70 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[#1F2A37]/10">
          <p className="text-[15px] text-[#1F2A37]/60 mb-8">
            For governance and trust overview, see{" "}
            <Link href="/governance" className="text-[#1D4ED8] hover:underline">
              Governance
            </Link>
            . For privacy, see our{" "}
            <Link href="/privacy" className="text-[#1D4ED8] hover:underline">
              Privacy Policy
            </Link>
            . Questions?{" "}
            <Link href="/contact" className="text-[#1D4ED8] hover:underline">
              Contact us
            </Link>
            .
          </p>
          <Link
            href="/"
            className="text-[#1D4ED8] font-medium hover:text-[#1E40AF] text-[15px] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </Shell>
  );
}
