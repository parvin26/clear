"use client";

import React from "react";

interface ValueCardItem {
  schematic?: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
}

interface ValueStackProps {
  title: string;
  description: string;
  items: ValueCardItem[];
}

export function ValueStack({ title, description, items }: ValueStackProps) {
  return (
    <section className="mb-32 relative">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-4">
          <div className="sticky top-32">
            <span className="text-[11px] font-bold text-[#1F2A37]/45 uppercase tracking-[2px] block mb-6">
              The Challenge
            </span>
            <h2 className="text-[32px] font-bold text-[#1F2A37] mb-6 leading-[1.1]">
              {title}
            </h2>
            <p className="text-[16px] text-[#1F2A37]/65 font-normal leading-relaxed mb-8">
              {description}
            </p>
            <div className="h-[1px] w-12 bg-[#1D4ED8]" />
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-12">
          {items.map((item, idx) => (
            <div key={idx} className="group">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                <div className="flex-shrink-0 mt-1">
                  {item.schematic ? (
                    <div className="w-16 h-16 rounded-lg bg-[#F9FAFB] border border-[#1F2A37]/10 flex items-center justify-center">
                      {item.schematic}
                    </div>
                  ) : (
                    <div className="w-[3px] h-[32px] bg-[#1D4ED8]" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[20px] font-bold text-[#1F2A37] mb-3 group-hover:text-[#1D4ED8] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[16px] text-[#1F2A37]/65 leading-relaxed mb-4 max-w-xl">
                    {item.description}
                  </p>
                  {item.bullets && (
                    <ul className="grid sm:grid-cols-2 gap-3 mt-4">
                      {item.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-3 text-[14px] text-[#1F2A37]/65">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] mt-2 flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {idx < items.length - 1 && (
                <div className="h-[1px] w-full bg-[#1F2A37]/[0.08] mt-12 ml-0 sm:ml-24" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
