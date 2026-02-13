"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const steps = [
  { id: "clarify", title: "Clarify", desc: "Define the non-negotiables" },
  { id: "locate", title: "Locate", desc: "Identify capability gaps" },
  { id: "enable", title: "Enable", desc: "Build the plan" },
  { id: "anchor", title: "Anchor", desc: "Lock into operating rhythm" },
  { id: "renew", title: "Renew", desc: "Review and iterate" },
];

export function SystemDiagram() {
  return (
    <section
      className="bg-white"
      style={{ paddingTop: "96px", paddingBottom: "80px" }}
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-[32px] font-bold text-[#1F2A37] mb-3 tracking-tight">
            The CLEAR Framework
          </h2>
          <p className="text-[16px] text-[#1F2A37]/65 font-normal">
            A recursive operating system for decision quality.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-4">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center z-10 w-40">
                <h3 className="text-[16px] font-semibold text-[#1F2A37] mb-1">{step.title}</h3>
                <p className="text-[13px] text-[#1F2A37]/55 leading-tight">{step.desc}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="text-[#1D4ED8] hidden lg:block">
                  <ArrowRight className="w-5 h-5 stroke-[2]" />
                </div>
              )}
              {idx < steps.length - 1 && <div className="text-[#1D4ED8] lg:hidden">↓</div>}
            </React.Fragment>
          ))}
          <div className="absolute hidden lg:block bottom-[-40px] left-[10%] right-[10%] h-[40px] pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 800 40" preserveAspectRatio="none">
              <path
                d="M 800 0 Q 400 60 0 0"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#arrowhead-about)"
              />
              <defs>
                <marker
                  id="arrowhead-about"
                  markerWidth="10"
                  markerHeight="7"
                  refX="0"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="10 0, 10 7, 0 3.5" fill="#1D4ED8" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
