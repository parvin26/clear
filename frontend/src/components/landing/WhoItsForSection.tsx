"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GROUPS = [
  {
    id: "01",
    title: "Owner-Led SMEs",
    desc: "Run your business with written decisions, clear owners and structured reviews without everything living in your head or in chat threads.",
    cta: "Start a diagnostic",
    href: "/diagnostic",
  },
  {
    id: "02",
    title: "Founders",
    desc: "Make fewer, sharper decisions. Turn your biggest strategic call into a decision record with options, tradeoffs and an execution plan your team can follow.",
    cta: "Build your first decision record",
    href: "/diagnostic",
  },
  {
    id: "03",
    title: "Capital Partners",
    desc: "See execution signals beyond financials. When enterprises choose to share, you get structured decision records and progress visibility. Not just reports.",
    cta: "Explore the capital view",
    href: "/for-partners",
  },
];

export function WhoItsForSection() {
  return (
    <section className="bg-[#1F2A37] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          Who we help
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {GROUPS.map((group) => (
            <div
              key={group.id}
              className="bg-[#2D3748] p-8 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors relative overflow-hidden group flex flex-col"
            >
              <span className="text-4xl font-bold text-white/[0.08] block mb-4 select-none group-hover:text-white/[0.12] transition-colors">
                {group.id}
              </span>
              <h3 className="text-lg font-bold text-white mb-3 leading-tight">
                {group.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                {group.desc}
              </p>
              <Link
                href={group.href}
                className="mt-6 inline-flex items-center text-[#1D4ED8] text-sm font-semibold hover:text-blue-400 transition-colors group/link"
              >
                {group.cta}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
