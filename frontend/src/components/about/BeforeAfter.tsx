"use client";

import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

function ListItem({
  children,
  negative,
}: {
  children: React.ReactNode;
  negative?: boolean;
}) {
  if (negative) {
    return (
      <li className="flex items-start gap-4 text-lg leading-snug text-white/50 font-normal">
        <span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/20" />
        <span>{children}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-4 text-lg leading-snug text-white font-bold">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#1D4ED8]" />
      <span>{children}</span>
    </li>
  );
}

export function BeforeAfter() {
  return (
    <section
      className="bg-[#1F2A37] relative overflow-hidden"
      style={{ paddingTop: "96px", paddingBottom: "96px" }}
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[36px] font-bold text-white mb-4 tracking-tight">
            Stop guessing. Start knowing.
          </h2>
          <p className="text-[16px] text-white/70 font-normal leading-relaxed">
            Most businesses operate on invisible logic and informal agreements.
            <br className="hidden md:block" />
            CLEAR makes decisions explicit, owned, and reviewable.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center relative z-10">
            <div className="space-y-6 px-6 py-8 md:pr-12">
              <div className="flex items-center gap-4 mb-2 opacity-50">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-bold text-white/70">Before CLEAR</h3>
              </div>
              <ul className="space-y-5">
                <ListItem negative>Decisions buried in chat threads</ListItem>
                <ListItem negative>Context locked in founder&apos;s head</ListItem>
                <ListItem negative>Outcomes tracked loosely or not at all</ListItem>
                <ListItem negative>Recurring fires treated as new emergencies</ListItem>
              </ul>
            </div>

            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20">
              <div className="bg-[#1D4ED8] w-[36px] h-[36px] rounded-full flex items-center justify-center shadow-lg ring-4 ring-[#1F2A37]">
                <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
            </div>

            <div className="relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-2xl backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white shadow-md">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-bold text-white">With CLEAR</h3>
              </div>
              <ul className="space-y-5">
                <ListItem>Single source of truth for all decisions</ListItem>
                <ListItem>Context documented and accessible</ListItem>
                <ListItem>Outcomes linked to specific owners</ListItem>
                <ListItem>Operating memory improves with every cycle</ListItem>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="#flow"
            className="inline-flex items-center gap-2 text-[#1D4ED8] text-[14px] font-medium hover:text-[#1E40AF] transition-colors group"
          >
            See how the system works{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
