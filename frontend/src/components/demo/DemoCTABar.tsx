"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar, Briefcase } from "lucide-react";

export function DemoCTABar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border shadow-[0_-2px 10px rgba(0,0,0,0.06)]">
      <div className="content-container py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <Button asChild size="sm" className="flex items-center gap-1.5">
            <Link href="/start">
              <Stethoscope className="h-4 w-4" />
              Start diagnostic
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex items-center gap-1.5">
            <Link href="/start">
              <Calendar className="h-4 w-4" />
              Book guided walkthrough
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex items-center gap-1.5">
            <Link href="/for-partners">
              <Briefcase className="h-4 w-4" />
              For capital partners
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
