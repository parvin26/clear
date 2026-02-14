"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DiagnosticCTASection() {
  return (
    <section id="start" className="py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink">
            Start with clarity
          </h2>
          <p className="text-ink-muted leading-relaxed">
            The diagnostic takes under 7 minutes. You receive a clear capability map and a focused decision to work on next. No advice dump, no obligation.
          </p>
          <Button size="lg" className="text-base px-8 py-6" asChild>
            <Link href="/diagnostic/run">Start capability diagnostic</Link>
          </Button>
          <p className="text-xs text-ink-muted pt-2">
            CLEAR does not chase attention. It establishes order.
          </p>
        </div>
      </div>
    </section>
  );
}
