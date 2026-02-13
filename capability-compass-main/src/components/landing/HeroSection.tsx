import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance">
                See Your Real Capability Gaps Clearly.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                A diagnostic-first capability system that helps MSMEs move from uncertainty to disciplined execution. Human support only when needed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base px-8 py-6" asChild>
                <Link to="/diagnostic">
                  Start Capability Diagnostic
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="text-base text-muted-foreground" asChild>
                <a href="#how-it-works">See How CLEAR Works</a>
              </Button>
            </div>
          </div>

          {/* Capability Map Visual */}
          <div className="relative">
            <CapabilityMapVisual />
          </div>
        </div>
      </div>
    </section>
  );
};

const CapabilityMapVisual = () => {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square max-w-lg mx-auto">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="0.3" fill="hsl(var(--border))" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" opacity="0.5" />

          {/* Main flow lines */}
          <path
            d="M 15 50 L 35 50 L 50 50 L 65 50 L 85 50"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.8"
          />

          {/* Nodes - Diagnose */}
          <circle cx="15" cy="50" r="8" fill="hsl(var(--primary))" />
          <text x="15" y="68" textAnchor="middle" className="text-[4px] fill-muted-foreground font-medium">Diagnose</text>
          
          {/* Nodes - Translate (center, emphasized) */}
          <circle cx="50" cy="50" r="10" fill="hsl(var(--insight))" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="hsl(var(--insight))" strokeWidth="0.5" opacity="0.4" />
          <text x="50" y="72" textAnchor="middle" className="text-[4px] fill-foreground font-semibold">Translate</text>
          
          {/* Nodes - Activate (smaller) */}
          <circle cx="85" cy="50" r="6" fill="hsl(var(--growth))" />
          <text x="85" y="68" textAnchor="middle" className="text-[4px] fill-muted-foreground font-medium">Activate</text>

          {/* Small satellite nodes */}
          <circle cx="35" cy="40" r="3" fill="hsl(var(--border))" />
          <circle cx="35" cy="60" r="3" fill="hsl(var(--border))" />
          <circle cx="65" cy="40" r="3" fill="hsl(var(--border))" />
          <circle cx="65" cy="60" r="3" fill="hsl(var(--border))" />
        </svg>
      </div>

      {/* Caption below diagram */}
      <p className="text-center text-sm text-muted-foreground/70">
        Translate exists to prevent the wrong solution being applied to the right problem.
      </p>
    </div>
  );
};

export default HeroSection;
