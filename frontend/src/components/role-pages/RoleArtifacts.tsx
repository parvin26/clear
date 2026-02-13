"use client";

import React from "react";
import {
  DiagramDecisionRecord,
  DiagramExecution,
  DiagramOutcomes,
  DiagramMemory,
  DiagramSharing,
} from "./Schematics";

const artifacts = [
  { schematic: DiagramDecisionRecord, title: "Decision Record", desc: "The single source of truth for constraints, mandates, and logic." },
  { schematic: DiagramExecution, title: "Execution Plan", desc: "Owners, dates, and milestones mapped to the decision." },
  { schematic: DiagramOutcomes, title: "Outcome Review", desc: "Structured loop to compare intent vs reality." },
  { schematic: DiagramMemory, title: "Memory Pack", desc: "Institutional knowledge preserved for future leaders." },
  { schematic: DiagramSharing, title: "Trust Layer", desc: "Controlled signal sharing with external partners." },
];

export function RoleArtifacts() {
  return (
    <section className="mb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="text-[11px] font-bold text-[#1F2A37]/45 uppercase tracking-[2px] block mb-3">
            Deliverables
          </span>
          <h2 className="text-[28px] font-bold text-[#1F2A37]">
            What you actually get
          </h2>
        </div>
        <p className="text-[15px] text-[#1F2A37]/65 max-w-md pb-1">
          Tangible assets that replace informal agreements and chat threads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {artifacts.map((item, idx) => (
          <div key={idx} className="group">
            <div className="bg-white border border-[#1F2A37]/10 rounded-xl p-6 h-full hover:border-[#1D4ED8] transition-colors duration-300 flex flex-col">
              <div className="mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                <item.schematic />
              </div>
              <h3 className="text-[15px] font-bold text-[#1F2A37] mb-2">
                {item.title}
              </h3>
              <p className="text-[13px] text-[#1F2A37]/65 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
