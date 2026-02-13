"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export interface DemoLandingCardProps {
  /** Optional custom href. Defaults to /demo */
  href?: string;
  /** Optional title. Default: "View sample workspace" */
  title?: string;
  /** Optional short description */
  description?: string;
  /** Optional CTA label. Default: "Open demo" */
  ctaLabel?: string;
  className?: string;
}

export function DemoLandingCard({
  href = "/demo",
  title = "View sample workspace",
  description = "See a read-only CLEAR workspace: situation → decision → milestones → outcome → sharing → portfolio. No sign-up.",
  ctaLabel = "Open demo",
  className,
}: DemoLandingCardProps) {
  return (
    <Card className={`premium-shadow ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold text-ink">{title}</span>
          <Badge variant="accent" className="text-xs">
            DEMO
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-ink-muted mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Button asChild size="sm" className="flex items-center gap-1 w-fit">
          <Link href={href}>
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
