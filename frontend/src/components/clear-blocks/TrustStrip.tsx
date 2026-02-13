"use client";

import Link from "next/link";
import { ScrollText, FileCheck, Share2 } from "lucide-react";

const ITEMS = [
  { label: "Audit trail", icon: ScrollText, href: "/governance" },
  { label: "Decision records", icon: FileCheck, href: "/how-it-works" },
  { label: "Controlled sharing", icon: Share2, href: "/governance" },
];

export interface TrustStripProps {
  /** Inline (horizontal) or stacked */
  variant?: "inline" | "stacked";
  className?: string;
}

export function TrustStrip({ variant = "inline", className = "" }: TrustStripProps) {
  if (variant === "stacked") {
    return (
      <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 ${className}`}>
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-primary"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
