"use client";

import { Check } from "lucide-react";

const BULLETS = [
  "Enterprise chooses what to share",
  "Enterprise chooses who sees it",
  "Access revocable anytime",
  "Activity logged",
];

export interface SharingExplainerProps {
  /** Optional CTA text and href */
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function SharingExplainer({ ctaLabel = "See how sharing works", ctaHref, className = "" }: SharingExplainerProps) {
  return (
    <div className={className}>
      <ul className="space-y-2 text-sm text-ink">
        {BULLETS.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {ctaHref && (
        <p className="mt-4">
          <a href={ctaHref} className="font-medium text-primary hover:underline">
            {ctaLabel}
          </a>
        </p>
      )}
    </div>
  );
}
