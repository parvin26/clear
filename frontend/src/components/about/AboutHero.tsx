"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StakeholderDiagram } from "./StakeholderDiagram";

export function AboutHero() {
  return (
    <section className="bg-[#F8F9FB] min-h-[320px]" style={{ paddingTop: "96px", paddingBottom: "80px" }}>
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <h1 className="text-[48px] font-bold text-[#1F2A37] tracking-tight leading-[1.1] mb-6">
              Decide clearly.
              <br />
              Act with discipline.
            </h1>
            <p className="text-[17px] text-[#1F2A37]/65 font-normal leading-relaxed mb-10 max-w-[480px]">
              We build the decision infrastructure that growing businesses need — so founders stop
              guessing and teams start governing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#flow"
                className="h-[48px] px-6 bg-[#1D4ED8] text-white font-medium text-[16px] rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 group shadow-sm"
              >
                See how it works
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/ecosystem"
                className="h-[48px] px-6 bg-transparent text-[#1F2A37] border border-[#1F2A37]/20 font-medium text-[16px] rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                Meet the ecosystem
              </Link>
            </div>
          </div>
          <div className="relative min-h-[240px]">
            <StakeholderDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}
