"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface NextStepCTAProps {
  /** Primary CTA: default "Start diagnostic" → /diagnostic */
  primaryLabel?: string;
  primaryHref?: string;
  /** Optional secondary CTA */
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Optional heading above CTAs */
  heading?: string;
  className?: string;
}

export function NextStepCTA({
  primaryLabel = "Start Diagnostic",
  primaryHref = "/diagnostic",
  secondaryLabel = "Become a design partner",
  secondaryHref = "/contact",
  heading = "Next step",
  className = "",
}: NextStepCTAProps) {
  return (
    <section className={`border-t border-border bg-muted/30 py-10 md:py-12 ${className}`}>
      <div className="content-container text-center w-full">
        {heading && <h2 className="text-lg font-semibold text-ink mb-4">{heading}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
          <Button asChild size="lg" className="gap-2 w-full">
            <Link href={primaryHref} className="w-full justify-center">
              {primaryLabel}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={secondaryHref} className="w-full justify-center">{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
