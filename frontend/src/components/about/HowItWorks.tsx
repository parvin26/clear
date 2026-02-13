"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Diagnose",
    desc: "Map what's actually happening before deciding what to change.",
    tags: [
      "Stakeholder interviews captured",
      "Constraints and dependencies surfaced",
      "Decision landscape mapped",
    ],
  },
  {
    number: "02",
    title: "Design & Plan",
    desc: "Define who owns what, when it's reviewed, and how success is measured.",
    tags: [
      "Operating cadence defined",
      "Ownership model assigned",
      "Success metrics locked",
    ],
  },
  {
    number: "03",
    title: "Run & Learn",
    desc: "Execute the plan, capture what happens, improve with every cycle.",
    tags: [
      "Rituals and dashboards live",
      "Review cycles running",
      "Outcomes logged and fed back",
    ],
  },
];

export function HowItWorks() {
  return (
    <section
      className="bg-[#F8F9FB]"
      style={{ paddingTop: "96px", paddingBottom: "80px" }}
    >
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="text-center mb-[56px] max-w-2xl mx-auto">
          <h2 className="text-[32px] font-bold text-[#1F2A37] mb-3 leading-tight">
            How it flows
          </h2>
          <p className="text-[16px] text-[#1F2A37]/65 font-normal">
            From chaotic inputs to structured learning.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute -top-8 left-0 text-[11px] font-bold text-[#1F2A37]/35 tracking-[1.5px] uppercase">
            Inputs: People, Data, Existing Processes
          </div>
          <div className="flex flex-col lg:flex-row items-stretch gap-0">
            {steps.map((step) => (
              <React.Fragment key={step.number}>
                <div className="flex-1 min-w-0 rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-5">
                  <div className="inline-flex items-center justify-center px-3 py-1 bg-[#FFCA0A] text-[#1F2A37] text-[11px] font-bold uppercase tracking-[1.5px] rounded self-start">
                    Step {step.number}
                  </div>
                  <div>
                    <h3 className="text-[24px] font-bold text-[#1F2A37] mb-2">{step.title}</h3>
                    <p className="text-[15px] text-[#1F2A37]/60 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="flex flex-col gap-3 mt-auto pt-4">
                    {step.tags.map((tag, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-3">
                        <div className="w-[6px] h-[6px] rounded-full bg-[#1D4ED8] mt-2 flex-shrink-0" />
                        <span className="text-[14px] text-[#1F2A37] leading-snug">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {steps.indexOf(step) < steps.length - 1 && (
                  <div className="flex flex-col lg:flex-row items-center justify-center flex-shrink-0">
                    <div className="hidden lg:flex items-center w-[32px]">
                      <div className="w-full h-[2px] bg-[#1D4ED8]" />
                      <ChevronRight className="w-4 h-4 text-[#1D4ED8] -ml-2.5 relative z-10" strokeWidth={2} />
                    </div>
                    <div className="flex lg:hidden flex-col items-center py-4">
                      <div className="h-[20px] w-[2px] bg-[#1D4ED8]" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="hidden lg:block absolute -bottom-8 right-0 text-[11px] font-bold text-[#1F2A37]/35 tracking-[1.5px] uppercase">
            Outputs: Decisions Owned, Tracked, Improving
          </div>
        </div>
      </div>
    </section>
  );
}
