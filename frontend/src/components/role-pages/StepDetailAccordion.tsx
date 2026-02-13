"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDetailStep {
  id: string;
  title: string;
  content: string;
}

interface StepDetailAccordionProps {
  steps: StepDetailStep[];
}

export function StepDetailAccordion({ steps }: StepDetailAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(steps[0]?.id ?? null);

  return (
    <section className="mb-32">
      <div className="mb-10">
        <span className="text-[11px] font-bold text-[#1F2A37]/45 uppercase tracking-[2px] block mb-3">
          Deep dive
        </span>
        <h2 className="text-[28px] font-bold text-[#1F2A37] leading-[1.1]">
          Step detail
        </h2>
      </div>

      <div className="border border-[#1F2A37]/10 rounded-xl overflow-hidden bg-white">
        {steps.map((step) => {
          const isOpen = openId === step.id;
          return (
            <div
              key={step.id}
              className="border-b border-[#1F2A37]/08 last:border-b-0"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-5 px-6 text-left font-semibold text-[#1F2A37] hover:bg-[#F8F9FB] transition-colors"
                onClick={() => setOpenId(isOpen ? null : step.id)}
                aria-expanded={isOpen}
              >
                <span className="text-[16px]">{step.title}</span>
                <ChevronRight
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-[#1F2A37]/65 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-[16px] text-[#1F2A37]/65 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
