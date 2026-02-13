"use client";

import React from "react";

export function TrustSection() {
  const features = [
    {
      title: "Finalization & sign-off",
      desc: "Decisions are committed as structured artifacts with clear execution paths.",
    },
    {
      title: "Full audit trail",
      desc: "Every change is recorded. See who decided what and when.",
    },
    {
      title: "Evidence-linked milestones",
      desc: "Documents and metrics attach directly to milestones — decisions backed by data.",
    },
    {
      title: "Enterprise-controlled sharing",
      desc: "You choose what to share. Portfolio partners see only what you allow.",
    },
  ];

  return (
    <section
      className="border-t border-[#1F2A37]/[0.08] bg-[#F8F9FB]"
      style={{ paddingTop: "80px", paddingBottom: "72px" }}
    >
      <div className="mx-auto max-w-[1120px] px-6">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start">
          <span className="mb-4 text-[11px] font-bold uppercase tracking-[2px] text-[#1F2A37]/45">
            HOW WE PROTECT YOUR DECISIONS
          </span>
          <h2 className="mb-3 max-w-[600px] text-[28px] font-bold leading-tight text-[#1F2A37]">
            Your decisions are structured, auditable, and yours.
          </h2>
          <p className="max-w-[560px] text-[16px] font-normal text-[#1F2A37]/65">
            CLEAR treats every decision as a governed artifact — not a note in a
            chat thread.
          </p>
        </div>

        {/* Feature Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              {/* Title Block with Accent */}
              <div className="flex items-center">
                <div className="mr-4 h-[32px] w-[3px] flex-shrink-0 bg-[#1D4ED8]" />
                <h3 className="text-[17px] font-semibold leading-tight text-[#1F2A37]">
                  {feature.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[14px] leading-relaxed text-[#1F2A37]/65">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
