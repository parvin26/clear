"use client";

import React from "react";

export type UseCasesTabId = "founders" | "leadership" | "investors";

const ROLES: Record<
  UseCasesTabId,
  {
    id: string;
    label: string;
    quote: React.ReactNode;
    delivers: string;
    flow: string[];
  }
> = {
  founders: {
    id: "founders",
    label: "Founders",
    quote: (
      <>
        I need to get these <span className="font-bold">decisions</span> out of my head without losing control.
      </>
    ),
    delivers:
      "One place per decision, from first question to final call, with a single record, workspace, and optional advisor support.",
    flow: [
      "Tell CLEAR who you are",
      "8‑step diagnostic",
      "Decision Record created",
      "Decision Workspace",
      "AI / advisor support",
    ],
  },
  leadership: {
    id: "leadership",
    label: "Leadership",
    quote: (
      <>
        We need to know what we&apos;re actually <span className="font-bold">committing</span> to.
      </>
    ),
    delivers:
      "Clear mandates, shared language for trade‑offs, and a living workspace so commitments are explicit and trackable.",
    flow: [
      "Choose role & domain",
      "Domain diagnostic",
      "Analysis view",
      "Decision Workspace",
      "Run & Review",
    ],
  },
  investors: {
    id: "investors",
    label: "Investors",
    quote: (
      <>
        I need to know if this team is <span className="font-bold">execution‑ready</span>.
      </>
    ),
    delivers:
      "Light‑touch portfolio visibility into execution readiness and governance maturity, powered by decision data, not long decks.",
    flow: [
      "View portfolios",
      "Scan readiness signals",
      "Filter & focus",
      "Drill into company",
      "Give structured feedback",
    ],
  },
};

const TAB_IDS: UseCasesTabId[] = ["founders", "leadership", "investors"];

interface UseCasesProps {
  activeTab: UseCasesTabId;
  onTabChange: (tab: UseCasesTabId) => void;
}

export function UseCases({ activeTab, onTabChange }: UseCasesProps) {
  const activeRole = ROLES[activeTab];

  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const tabButton = target.closest("[data-use-cases-tab]");
    if (tabButton instanceof HTMLElement) {
      const tab = tabButton.getAttribute("data-use-cases-tab") as UseCasesTabId | null;
      if (tab && (TAB_IDS as string[]).includes(tab)) {
        e.preventDefault();
        onTabChange(tab);
      }
    }
  };

  return (
    <section
      className="bg-white relative"
      style={{ paddingTop: "96px", paddingBottom: "80px" }}
      id="use-cases"
      onClick={handleSectionClick}
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <h2 className="text-[32px] font-bold text-[#1F2A37] mb-3 tracking-tight">
            Built for the whole table
          </h2>
          <p className="text-[16px] text-[#1F2A37]/65 font-normal">
            Select your role to see the value.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12 relative z-[100]">
          {TAB_IDS.map((tabId) => {
            const role = ROLES[tabId];
            const isActive = activeTab === tabId;
            return (
              <button
                key={role.id}
                type="button"
                data-use-cases-tab={tabId}
                className={`px-8 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm"
                    : "bg-white text-[#1F2A37] border-[#1F2A37]/14 hover:border-[#1F2A37]/30 hover:bg-gray-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabChange(tabId);
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        <div id="use-cases-content" className="min-h-[300px] relative z-0">
          <div key={activeTab} className="space-y-8">
            <div className="bg-[#1D4ED8]/[0.04] rounded-xl border-none p-10">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="space-y-4 w-full">
                  <span className="inline-block text-[#1D4ED8] text-sm font-bold uppercase tracking-wider mb-2">
                    {activeRole.label} View
                  </span>
                  <h3 className="text-[20px] font-medium text-[#1F2A37] leading-relaxed max-w-3xl">
                    &ldquo;{activeRole.quote}&rdquo;
                  </h3>
                  <div className="pt-2">
                    <p className="text-[#1F2A37]/65 text-[14px] leading-relaxed">
                      <span className="font-bold text-[#1F2A37]">CLEAR delivers:</span>{" "}
                      {activeRole.delivers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 px-4 overflow-x-auto">
              {activeRole.flow.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#1D4ED8]" />
                    <span className="text-[13px] text-[#1F2A37] font-normal">{step}</span>
                  </div>
                  {idx < activeRole.flow.length - 1 && (
                    <div className="hidden md:block w-12 h-[1px] bg-[#CBD5E1] mx-2 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-l-[4px] border-l-[#CBD5E1] border-b-[3px] border-b-transparent" />
                    </div>
                  )}
                  {idx < activeRole.flow.length - 1 && (
                    <div className="md:hidden h-4 w-[1px] bg-[#CBD5E1] ml-[2.5px] my-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
