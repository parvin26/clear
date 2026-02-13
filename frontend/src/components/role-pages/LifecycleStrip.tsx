"use client";

import React from "react";

interface LifecycleStripProps {
  steps: string[];
}

export function LifecycleStrip({ steps }: LifecycleStripProps) {
  return (
    <section className="mb-32 bg-[#F8F9FB] border-y border-[#1F2A37]/5 py-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-[#1F2A37]/45 uppercase tracking-[2px]">
            The Lifecycle
          </span>
        </div>

        <div className="relative">
          <div className="absolute top-[15px] left-0 right-0 h-[2px] bg-[#1F2A37]/10 hidden md:block" aria-hidden />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-6 flex-1 text-left md:text-center w-full md:w-auto group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-[#1D4ED8] flex items-center justify-center shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#1F2A37]/40 uppercase tracking-widest hidden md:block">
                    Step 0{idx + 1}
                  </span>
                  <span className="text-[15px] font-semibold text-[#1F2A37] max-w-[140px] md:mx-auto leading-tight">
                    {step}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
