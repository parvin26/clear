"use client";

import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Diagnose your situation",
    desc: "Answer 8 structured questions about your context, data, and stakes.",
  },
  {
    num: "02",
    title: "Get one sharp decision",
    desc: "CLEAR processes your inputs into a single, high-leverage strategic move.",
  },
  {
    num: "03",
    title: "Execute & track",
    desc: "Commit to the plan and track progress through disciplined check-ins.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[#F8F9FB] py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#1F2A37] mb-12 text-center">
          How CLEAR works
        </h2>

        {/* Horizontal Layout Container */}
        <div className="flex flex-col md:flex-row gap-8 relative items-start">
          {/* Blue connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-blue-100 -z-10"
            aria-hidden
          />

          {STEPS.map((step, index) => (
            <div
              key={step.num}
              className="flex-1 flex flex-col items-center text-center relative z-10"
            >
              {/* Yellow Badge */}
              <div className="bg-[#FFCA0A] text-[#1F2A37] font-bold text-xs py-1 px-3 rounded-full mb-6 uppercase tracking-wider shadow-sm border-2 border-white">
                Step {step.num}
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow w-full h-full flex flex-col items-center">
                <h3 className="text-lg font-bold text-[#1F2A37] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
                  {step.desc}
                </p>
              </div>

              {/* Mobile Connector Arrow - hidden on last step */}
              {index < STEPS.length - 1 && (
                <div className="md:hidden mt-4 text-blue-200">
                  <ArrowRight className="w-5 h-5 rotate-90" aria-hidden />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
