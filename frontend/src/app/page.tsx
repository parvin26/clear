"use client";

import { Shell } from "@/components/layout/Shell";
import { HeroSection } from "@/components/landing/HeroSection";
import { RoleSelectorSection } from "@/components/landing/RoleSelectorSection";
import { ArtifactsSection } from "@/components/landing/ArtifactsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
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
        <ArtifactsSection />
        <HowItWorksSection />
        <WhoItsForSection />
        <TrustSection />
        <CTASection />
        <PartnersSection />
      </>
    </Shell>
  );
}
