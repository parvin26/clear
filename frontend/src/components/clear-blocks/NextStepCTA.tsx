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
  primaryLabel = "Start diagnostic",
  primaryHref = "/diagnostic",
  secondaryLabel,
  secondaryHref,
  heading = "Next step",
  className = "",
}: NextStepCTAProps) {
  return (
    <section className={`border-t border-border bg-muted/30 py-10 md:py-12 ${className}`}>
      <div className="content-container text-center">
        {heading && <h2 className="text-lg font-semibold text-ink mb-4">{heading}</h2>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button asChild size="lg" className="gap-2">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
