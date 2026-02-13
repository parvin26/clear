"use client";

import { FileCheck, History, Share2, Paperclip } from "lucide-react";

const items = [
  {
    icon: FileCheck,
    title: "Finalization and sign-off",
    body: "Decisions are committed as structured artifacts so execution paths are clear and auditable.",
  },
  {
    icon: History,
    title: "Audit trail of changes",
    body: "Every change is recorded. You can see who did what and when.",
  },
  {
    icon: Paperclip,
    title: "Evidence attached to milestones",
    body: "Attach documents and metrics to milestones so decisions are backed by evidence.",
  },
  {
    icon: Share2,
    title: "Enterprise-controlled sharing",
    body: "You choose what to share and with whom. Portfolio partners see only what you allow.",
  },
];

export function HowWeProtectStrip() {
  return (
    <section className="rounded-xl border border-border bg-muted/20 p-6 md:p-8" aria-labelledby="how-we-protect-heading">
      <h2 id="how-we-protect-heading" className="text-xl font-semibold text-ink mb-6">
        How we protect your decisions
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-medium text-ink">{title}</h3>
            <p className="text-sm text-ink-muted">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
