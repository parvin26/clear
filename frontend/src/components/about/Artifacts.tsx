"use client";

import React from "react";
import { ArrowRight, ArrowDown } from "lucide-react";

function DecisionMapThumbnail() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18H24" stroke="#1D4ED8" strokeWidth="1.25" />
      <path d="M24 18L32 12" stroke="#1D4ED8" strokeWidth="1.25" />
      <path d="M24 18L32 24" stroke="#1D4ED8" strokeWidth="1.25" />
      <circle cx="14" cy="18" r="3" stroke="#1D4ED8" strokeWidth="1.25" fill="white" />
      <circle cx="24" cy="18" r="3" stroke="#1D4ED8" strokeWidth="1.25" fill="white" />
      <circle cx="32" cy="12" r="3" stroke="#1D4ED8" strokeWidth="1.25" fill="white" />
      <circle cx="32" cy="24" r="3" stroke="#1D4ED8" strokeWidth="1.25" fill="white" />
    </svg>
  );
}

function RhythmThumbnail() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.5" y="4.5" width="39" height="27" rx="2" stroke="#CBD5E1" strokeWidth="1.25" fill="white" />
      <line x1="4.5" y1="12" x2="43.5" y2="12" stroke="#CBD5E1" strokeWidth="1.25" />
      <line x1="17.5" y1="12" x2="17.5" y2="31.5" stroke="#CBD5E1" strokeWidth="1.25" />
      <line x1="30.5" y1="12" x2="30.5" y2="31.5" stroke="#CBD5E1" strokeWidth="1.25" />
      <circle cx="11" cy="22" r="2" fill="#1D4ED8" />
      <circle cx="24" cy="18" r="2" fill="#1D4ED8" />
      <circle cx="37" cy="26" r="2" fill="#1D4ED8" />
    </svg>
  );
}

function BoardThumbnail() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="8" height="28" rx="1" stroke="#CBD5E1" strokeWidth="1.25" fill="none" />
      <rect x="20" y="4" width="8" height="28" rx="1" stroke="#CBD5E1" strokeWidth="1.25" fill="none" />
      <rect x="32" y="4" width="8" height="28" rx="1" stroke="#CBD5E1" strokeWidth="1.25" fill="none" />
      <rect x="9.5" y="8" width="5" height="4" fill="#1D4ED8" />
      <rect x="9.5" y="14" width="5" height="4" fill="#CBD5E1" />
      <rect x="21.5" y="10" width="5" height="4" fill="#1D4ED8" />
      <rect x="33.5" y="6" width="5" height="4" fill="#1D4ED8" />
      <rect x="33.5" y="12" width="5" height="4" fill="#CBD5E1" />
    </svg>
  );
}

function MemoryThumbnail() {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8H32V30H12V8Z" stroke="#CBD5E1" strokeWidth="1.25" fill="white" />
      <path d="M16 4H36V26" stroke="#CBD5E1" strokeWidth="1.25" fill="none" />
      <path d="M16 14H28" stroke="#1D4ED8" strokeWidth="1.25" strokeOpacity="0.5" />
      <path d="M16 18H28" stroke="#1D4ED8" strokeWidth="1.25" strokeOpacity="0.5" />
      <path d="M26 24L27 25L30 22" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const artifacts = [
  { id: "map", title: "Decision Map", desc: "A living map of who decides what, when, and on what basis.", Thumbnail: DecisionMapThumbnail },
  { id: "rhythm", title: "Operating Rhythm", desc: "Calendar-based rituals so nothing slips between cycles.", Thumbnail: RhythmThumbnail },
  { id: "board", title: "Execution Board", desc: "Kanban-style tracking of commitments vs reality.", Thumbnail: BoardThumbnail },
  { id: "memory", title: "Memory Pack", desc: "The institutional memory your next leader inherits.", Thumbnail: MemoryThumbnail },
];

export function Artifacts() {
  return (
    <section
      className="bg-white"
      style={{ paddingTop: "96px", paddingBottom: "80px" }}
    >
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-[32px] font-bold text-[#1F2A37] mb-3 tracking-tight">
            What you actually get
          </h2>
          <p className="text-[16px] text-[#1F2A37]/65 font-normal">
            Tangible assets that replace informal agreements.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 items-stretch justify-center">
          {artifacts.map((item) => (
            <React.Fragment key={item.id}>
              <div className="flex-1 min-w-0 bg-[#F9FAFB] border border-[#1F2A37]/[0.08] rounded-xl p-6 flex flex-col gap-5">
                <div className="flex-shrink-0">
                  <item.Thumbnail />
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1F2A37] mb-2 truncate">{item.title}</h3>
                  <p className="text-[14px] text-[#1F2A37]/65 leading-relaxed">{item.desc}</p>
                </div>
              </div>
              {artifacts.indexOf(item) < artifacts.length - 1 && (
                <div className="flex items-center justify-center text-[#CBD5E1] lg:w-[24px] py-2 lg:py-0 flex-shrink-0">
                  <ArrowRight className="hidden lg:block w-4 h-4" />
                  <ArrowDown className="lg:hidden w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
