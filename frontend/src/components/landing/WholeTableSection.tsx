"use client";

import { useState } from "react";

const FOUNDER_QUOTE = "I need these decisions out of my head. With a clear owner and a plan attached.";
const FOUNDER_BULLETS = [
  "Structured diagnostic to find the real bottleneck",
  "Decision record with options, tradeoffs and rationale",
  "Execution board with milestones and owners",
  "Review cycle to capture what worked",
  "Controlled sharing when you choose to bring in investors",
];

const INVESTOR_QUOTE = "I need execution visibility. Not just financials and quarterly updates.";
const INVESTOR_BULLETS = [
  "See structured decision records across portfolio (when shared)",
  "Track execution progress against commitments",
  "Review outcome records at close of each cycle",
  "Audit trail of decisions and changes. No chasing updates.",
];

export function WholeTableSection() {
  const [activeTab, setActiveTab] = useState<"founders" | "investors">("founders");

  return (
    <section className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#1F2A37] text-center mb-4">
          Built for the whole table
        </h2>
        <p className="text-center text-[#1F2A37]/65 max-w-2xl mx-auto mb-12">
          One system. Shared visibility. Each stakeholder sees what&apos;s relevant to them.
        </p>

        <div className="flex justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setActiveTab("founders")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "founders"
                ? "bg-[#1D4ED8] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Founders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("investors")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "investors"
                ? "bg-[#1D4ED8] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Investors
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {activeTab === "founders" ? (
            <>
              <blockquote className="text-lg font-medium text-[#1F2A37] mb-6 pl-4 border-l-4 border-[#1D4ED8]">
                {FOUNDER_QUOTE}
              </blockquote>
              <ul className="space-y-3 text-[#1F2A37]/80">
                {FOUNDER_BULLETS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#1D4ED8] mt-1.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <blockquote className="text-lg font-medium text-[#1F2A37] mb-6 pl-4 border-l-4 border-[#1D4ED8]">
                {INVESTOR_QUOTE}
              </blockquote>
              <ul className="space-y-3 text-[#1F2A37]/80">
                {INVESTOR_BULLETS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#1D4ED8] mt-1.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
