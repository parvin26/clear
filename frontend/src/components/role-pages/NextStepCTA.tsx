"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

interface NextStepCTAProps {
  label: string;
  primaryHref?: string;
  onClick?: () => void;
}

export function NextStepCTA({ label, primaryHref, onClick }: NextStepCTAProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <h2 className="text-[40px] font-bold text-white mb-6 tracking-tight">
        Build your{" "}
        <span className="relative inline-block">
          first decision record
          <span className="absolute -bottom-[6px] left-0 w-full h-[3px] bg-[#FFCA0A]" aria-hidden />
        </span>
        .
      </h2>
      <p className="text-[17px] text-white/70 mb-10 font-normal leading-relaxed max-w-2xl mx-auto">
        In 10 minutes, you&apos;ll have a written diagnosis, a recommended decision
        and an execution plan with owners. No prior experience needed.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
        {primaryHref ? (
          <Link
            href={primaryHref}
            className="h-[52px] px-8 bg-[#1D4ED8] text-white text-[16px] font-bold rounded-lg hover:bg-[#1E40AF] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl w-full"
          >
            Start Diagnostic
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="h-[52px] px-8 bg-[#1D4ED8] text-white text-[16px] font-bold rounded-lg hover:bg-[#1E40AF] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl w-full"
          >
            Start Diagnostic
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        )}
        <Link
          href="/contact"
          className="h-[52px] px-8 bg-transparent border border-white/20 text-white text-[16px] font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center w-full"
        >
          Become a design partner
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2">
      <section className="bg-[#1F2A37] py-24 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          {content}
        </div>
      </section>
    </div>
  );
}
