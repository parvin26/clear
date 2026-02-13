"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-[#1F2A37] py-24 text-center w-full min-w-full m-0 p-0">
      <div className="w-full bg-[#1F2A37] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get CLEAR across your ecosystem?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Join the network of operators and capital partners building disciplined, resilient businesses.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 bg-[#1D4ED8] text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
            >
              Get started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/guided-start"
              className="inline-flex items-center justify-center bg-[#374151] text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-700 transition-colors border border-gray-600"
            >
              Guided start
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
