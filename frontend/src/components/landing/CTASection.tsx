"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-[#1F2A37] py-24 text-center w-full min-w-full m-0 p-0">
      <div className="w-full bg-[#1F2A37] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Build your first{" "}
            <span className="relative inline-block">
              decision record.
              <span className="absolute -bottom-[3px] left-0 w-full h-[3px] bg-[#FFCA0A]" aria-hidden />
            </span>
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            In 10 minutes, you&apos;ll have a written diagnosis, a recommended decision
            and an execution plan with owners. No prior experience needed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
            <Link
              href="/diagnostic"
              className="inline-flex items-center justify-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 w-full"
            >
              Start Diagnostic
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-[#374151] text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-700 transition-colors border border-gray-600 w-full"
            >
              Become a design partner
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            We&apos;re onboarding a small group of early teams to build alongside us.
          </p>
        </div>
      </div>
    </section>
  );
}
