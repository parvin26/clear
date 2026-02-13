import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import PainValidationSection from "@/components/landing/PainValidationSection";
import DifferentiationSection from "@/components/landing/DifferentiationSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AdvisorsSection from "@/components/landing/AdvisorsSection";
import PlaybooksSection from "@/components/landing/PlaybooksSection";
import EcosystemSection from "@/components/landing/EcosystemSection";
import DiagnosticCTASection from "@/components/landing/DiagnosticCTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PainValidationSection />
        <DifferentiationSection />
        <HowItWorksSection />
        <AdvisorsSection />
        <PlaybooksSection />
        <EcosystemSection />
        <DiagnosticCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
