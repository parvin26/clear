"use client";

import { FileText, ListChecks, BookOpen, Database, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ARTIFACTS = [
  {
    title: "Decision record",
    description: "Structured artifact capturing the committed decision, constraints, and success criteria.",
    icon: FileText,
  },
  {
    title: "Execution milestones",
    description: "Owners, timelines, and status for each milestone.",
    icon: ListChecks,
  },
  {
    title: "Outcome review",
    description: "What worked, what didn’t, and key learnings.",
    icon: BookOpen,
  },
  {
    title: "Institutional memory",
    description: "Decisions and outcomes accumulate to improve future planning.",
    icon: Database,
  },
  {
    title: "Controlled sharing layer",
    description: "Enterprise chooses what to share and with whom.",
    icon: Share2,
  },
];

export interface WhatClearProducesProps {
  /** Layout: row of cards or compact strip */
  variant?: "cards" | "compact";
  className?: string;
}

export function WhatClearProduces({ variant = "cards", className = "" }: WhatClearProducesProps) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {ARTIFACTS.map((a) => {
          const Icon = a.icon;
          return (
            <span
              key={a.title}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink md:text-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              {a.title}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className}`}>
      {ARTIFACTS.map((a) => {
        const Icon = a.icon;
        return (
          <Card key={a.title} className="border-border bg-surface">
            <CardContent className="pt-4">
              <Icon className="mb-2 h-6 w-6 text-primary" aria-hidden />
              <h3 className="font-semibold text-ink">{a.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{a.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
