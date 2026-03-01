"use client";

import { Shell } from "@/components/layout/Shell";
import { HeroSection } from "@/components/landing/HeroSection";
import { RoleSelectorSection } from "@/components/landing/RoleSelectorSection";
import { BeforeAfter } from "@/components/about/BeforeAfter";
import { ArtifactsSection } from "@/components/landing/ArtifactsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ClearFrameworkSection } from "@/components/landing/ClearFrameworkSection";
import { WhoItsForSection } from "@/components/landing/WhoItsForSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { CTASection } from "@/components/landing/CTASection";
import { PartnersSection } from "@/components/landing/PartnersSection";

export default function Home() {
  return (
    <Shell>
      <>
        <HeroSection />
        <RoleSelectorSection />
        <BeforeAfter />
        <ArtifactsSection />
        <HowItWorksSection />
        <ClearFrameworkSection />
        <WhoItsForSection />
        <TrustSection />
        <CTASection />
        <PartnersSection />
      </>
    </Shell>
  );
}
