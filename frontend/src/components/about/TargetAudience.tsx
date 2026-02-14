"use client";

import { Check } from "lucide-react";

function Card({
  title,
  pain,
  users,
}: {
  title: string;
  pain: string;
  users: string;
}) {
  return (
    <div className="p-6 bg-white border-l-[3px] border-[#1D4ED8]">
      <h3 className="text-[18px] font-semibold text-[#1F2A37] mb-3">{title}</h3>
      <p className="text-[#1F2A37]/65 mb-6 font-normal text-[14px] leading-relaxed">{pain}</p>
      <div className="flex items-center gap-2 text-[13px] font-normal text-[#1D4ED8]">
        <Check className="w-4 h-4 stroke-[2]" /> {users}
      </div>
    </div>
  );
}

export function TargetAudience() {
  return (
    <section className="bg-white" style={{ paddingTop: "96px", paddingBottom: "80px" }}>
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-[11px] font-bold text-[#1F2A37]/45 uppercase tracking-[2px] text-center md:text-left">
            WHO CLEAR IS FOR
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card
            title="Owner-Led SMEs"
            pain="Too many decisions stuck in the founder's head, and everyone waiting."
            users="200+ SME founders"
          />
          <Card
            title="Seed to Series A"
            pain="Teams moving from 'founder does everything' to a repeatable operating cadence."
            users="Growth-stage teams"
          />
          <Card
            title="Capital Providers"
            pain="Investors who want governance clarity and execution signals, without asking for another deck."
            users="VCs & Family Offices"
          />
        </div>
      </div>
    </section>
  );
}
