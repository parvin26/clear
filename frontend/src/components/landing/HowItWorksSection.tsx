"use client";

import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Diagnose",
    desc: "Run a structured diagnostic to identify what's actually causing drag in your business. Map constraints across operations, finance, sales and people.",
    bullets: ["Situation captured and structured", "Root constraint identified", "Decision framing clarified"],
  },
  {
    num: "02",
    title: "Decide & Plan",
    desc: "Turn your diagnosis into one clear, written decision with options, tradeoffs, owners and milestones. No unwritten decisions.",
    bullets: ["Decision record created", "Alternatives and tradeoffs documented", "Execution plan with assigned owners"],
  },
  {
    num: "03",
    title: "Run & Learn",
    desc: "Execute against the plan. Track progress. Run a structured review when complete. Build a repeatable record of what worked.",
    bullets: ["Milestones tracked live", "Review cycle triggered automatically", "Outcomes captured for future decisions"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="flow" className="bg-[#F8F9FB] py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#1F2A37] mb-4 text-center">
          How it flows
        </h2>
        <p className="text-center text-[#1F2A37]/65 max-w-2xl mx-auto mb-12">
          From problem to diagnosis to execution. The same discipline every time.
        </p>

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
              <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow w-full h-full flex flex-col items-center text-left">
                <h3 className="text-lg font-bold text-[#1F2A37] mb-3 w-full">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed w-full mb-4">
                  {step.desc}
                </p>
                {step.bullets && (
                  <ul className="text-xs text-gray-500 space-y-1 w-full list-disc list-inside">
                    {step.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
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
