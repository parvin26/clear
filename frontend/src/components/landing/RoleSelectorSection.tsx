"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ROLES = [
  {
    label: "Enterprise",
    title: "I run a business and I need better control.",
    desc: "CLEAR helps you structure key decisions, track execution, and show capital readiness.",
    action: "For enterprise",
    href: "/for-enterprises",
  },
  {
    label: "Founder",
    title: "I'm a founder and need to prioritize.",
    desc: "CLEAR helps you get decisions out of your head into a system your team can follow.",
    action: "For founders",
    href: "/for-founders",
  },
  {
    label: "Capital Partner",
    title: "I invest in or support many businesses.",
    desc: "CLEAR gives you portfolio-level visibility into governance and execution readiness.",
    action: "For partners",
    href: "/for-partners",
  },
];

export function RoleSelectorSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#1F2A37] text-center mb-12">
          Who are you?
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
