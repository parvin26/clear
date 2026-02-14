"use client";

import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden bg-white min-h-[480px]">
      {/* Background Decor - Subtle Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-gray-50/80 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 lg:pt-16 pb-10 md:pb-16 lg:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Column: Text Content */}
          <div className="max-w-4xl relative">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-[2.5rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-8">
                Turn messy business problems <br className="hidden lg:block" />
                into a{" "}
                <span className="text-blue-600 relative inline-block">
                  disciplined plan
                  <svg
                    className="absolute w-full h-3 -bottom-3 left-0 text-[#FFCA0A] -z-10"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M0 5 Q 50 10 100 5"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                A repeatable way to diagnose, plan, and track execution, for
                founders and the people who back them.
              </p>

              <p className="text-sm text-slate-500 mb-10 flex items-center gap-2 flex-wrap">
                <span>Speak your business problem. CLEAR converts it into a structured decision.</span>
                <Link
                  href="/diagnostic"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                  aria-label="Start diagnostic with voice intake"
                >
                  <Mic className="h-4 w-4" aria-hidden />
                  Try voice intake
                </Link>
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/start"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-blue-200 transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 group"
                >
                  Get started in 10 minutes
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-full border border-slate-200 transition-colors text-center hover:shadow-sm"
                >
                  See how it works
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 font-medium">
                <p>
                  Built for{" "}
                  <span className="text-slate-900 font-bold">founders</span> and{" "}
                  <span className="text-slate-900 font-bold">capital providers</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual/Card */}
          <div className="relative w-full h-full flex items-center justify-center lg:justify-end min-h-[320px]">
            <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-[#1F2A37]/14 overflow-hidden lg:-mt-8 lg:translate-x-8">
              {/* Header of the card */}
              <div className="px-8 py-6 border-b border-[#1F2A37]/14 flex justify-between items-center bg-gray-50/80">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#1F2A37]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#1F2A37]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#1F2A37]/20" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#1F2A37]/60">
                  Workflow System
                </div>
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col gap-8">
                {/* Step 1: Diagnose */}
                <div className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#1D4ED8] flex items-center justify-center bg-white z-10 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                    </div>
                    <div className="w-0.5 flex-1 bg-[#1F2A37]/25 my-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-[#1F2A37]">Diagnose</h3>
                      <span className="bg-[#16A34A] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Complete
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2.5 w-[85%] bg-slate-200 rounded" />
                      <div className="h-2.5 w-[65%] bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>

                {/* Step 2: Plan */}
                <div className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#1F2A37]/30 flex items-center justify-center bg-white z-10 group-hover:border-[#1D4ED8] transition-colors shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1F2A37]/30 group-hover:bg-[#1D4ED8] transition-colors" />
                    </div>
                    <div className="w-0.5 flex-1 bg-[#1F2A37]/25 my-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-[#1F2A37]">Plan</h3>
                      <span className="bg-[#FFCA0A] text-[#1F2A37] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        In Progress
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2.5 w-[90%] bg-slate-200 rounded" />
                      <div className="h-2.5 w-[75%] bg-slate-200 rounded" />
                      <div className="h-2.5 w-[55%] bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>

                {/* Step 3: Execute */}
                <div className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#1F2A37]/10 flex items-center justify-center bg-white z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1F2A37]/10" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-[#1F2A37]/40">Execute</h3>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Pending
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2.5 w-[40%] bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer decorative element */}
              <div className="h-1.5 w-full bg-[#1F2A37]/5">
                <div className="h-full w-1/3 bg-[#1D4ED8]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
