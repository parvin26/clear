"use client";

import Link from "next/link";
import { DiagramDocument } from "@/components/role-pages/Schematics";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  onBack?: () => void;
}

export function LegalLayout({ title, lastUpdated, children, onBack }: LegalLayoutProps) {
  return (
    <div className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-16">
        <div className="mb-6 scale-75 origin-top-left opacity-80">
          <DiagramDocument />
        </div>
        <h1 className="text-[40px] font-bold text-[#1F2A37] mb-4 tracking-tight">{title}</h1>
        <p className="text-[15px] text-[#1F2A37]/50 font-medium">Last updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-[#1F2A37] prose-p:text-[#1F2A37]/70 prose-li:text-[#1F2A37]/70 prose-strong:text-[#1F2A37]">
        {children}
      </div>

      <div className="mt-16 pt-8 border-t border-[#1F2A37]/10">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-[#1D4ED8] font-medium hover:text-[#1E40AF] text-[15px] transition-colors"
          >
            Back to home
          </button>
        ) : (
          <Link
            href="/"
            className="text-[#1D4ED8] font-medium hover:text-[#1E40AF] text-[15px] transition-colors"
          >
            Back to home
          </Link>
        )}
      </div>
    </div>
  );
}
