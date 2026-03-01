"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ROLES = [
  {
    label: "Owner-Led SMEs",
    title: "I run a business and I need better control.",
    desc: "Run your business with written decisions, clear owners and structured reviews without everything living in your head or in chat threads.",
    action: "Start a diagnostic",
    href: "/diagnostic",
  },
  {
    label: "Founders",
    title: "I'm a founder and need to prioritize.",
    desc: "Make fewer, sharper decisions. Turn your biggest strategic call into a decision record with options, tradeoffs and an execution plan your team can follow.",
    action: "Build your first decision record",
    href: "/diagnostic",
  },
  {
    label: "Capital Partners",
    title: "I invest in or support many businesses.",
    desc: "See execution signals beyond financials. When enterprises choose to share, you get structured decision records and progress visibility. Not just reports.",
    action: "Explore the capital view",
    href: "/for-partners",
  },
];

export function RoleSelectorSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#1F2A37] text-center mb-12">
          Who it&apos;s for
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ROLES.map((role, i) => (
            <Link
              key={i}
              href={role.href}
              className="border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow flex flex-col items-start h-full bg-white group cursor-pointer"
            >
              <span className="inline-block px-3 py-1 bg-[#FFCA0A] text-[#1F2A37] text-xs font-bold uppercase rounded mb-4">
                {role.label}
              </span>
              <h3 className="text-lg font-bold text-[#1F2A37] mb-4">
                {role.title}
              </h3>
              <p className="text-sm text-gray-500 mb-8 flex-grow leading-relaxed">
                {role.desc}
              </p>

              {/* Text Link CTA */}
              <span className="inline-flex items-center text-[#1D4ED8] text-sm font-semibold group-hover:text-blue-700 transition-colors">
                {role.action}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
