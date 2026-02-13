"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Hero } from "@/components/about/Hero";
import { TargetAudience } from "@/components/about/TargetAudience";
import { BeforeAfter } from "@/components/about/BeforeAfter";
import { HowItWorks } from "@/components/about/HowItWorks";
import { SystemDiagram } from "@/components/about/SystemDiagram";
import { Artifacts } from "@/components/about/Artifacts";
import { TrustSection } from "@/components/about/TrustSection";
import { UseCases, type UseCasesTabId } from "@/components/about/UseCases";
import { AboutCTA } from "@/components/about/AboutCTA";

export default function AboutPage() {
  const [activeUseCasesTab, setActiveUseCasesTab] = useState<UseCasesTabId>("founders");

  return (
    <Shell>
      <div className="font-sans antialiased text-[#1F2A37] bg-white">
        <Hero />
        <TargetAudience />
        <BeforeAfter />
        <div id="flow">
          <HowItWorks />
        </div>
        <div id="framework">
          <SystemDiagram />
        </div>
        <div id="outcomes">
          <Artifacts />
        </div>
        <TrustSection />
        <UseCases
          activeTab={activeUseCasesTab}
          onTabChange={setActiveUseCasesTab}
        />
        <AboutCTA />
      </div>
    </Shell>
  );
}
