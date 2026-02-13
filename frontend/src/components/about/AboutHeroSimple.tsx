"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Simple dark hero for About page: "Stop guessing. Start knowing."
 * Matches the CLEAR Commons about layout (single hero block, no diagram).
 */
export function AboutHeroSimple() {
  return (
    <section
      className="w-full bg-[#1F2A37]"
      style={{ paddingTop: "96px", paddingBottom: "96px" }}
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-[36px] md:text-[44px] font-bold text-white tracking-tight mb-6">
          Stop guessing. Start knowing.
        </h1>
        <p className="text-[16px] text-white/70 font-normal leading-relaxed max-w-2xl mx-auto mb-10">
          Most businesses operate on invisible logic and informal agreements.
          CLEAR makes decisions explicit, owned, and now routine.
        </p>
        <Link
          href="#flow"
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors shadow-lg"
          aria-label="See how it flows"
        >
          <ArrowRight className="w-6 h-6 stroke-[2.5]" />
        </Link>
      </div>
    </section>
  );
}
