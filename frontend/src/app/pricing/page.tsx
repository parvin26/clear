"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { NextStepCTA } from "@/components/clear-blocks";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Enterprise",
    description: "Decision workspace access, execution milestone tracking, outcome review storage.",
    features: ["Decision workspace access", "Execution milestone tracking", "Outcome review storage"],
    cta: "Choose enterprise plan",
    ctaHref: "/contact",
  },
  {
    name: "Founder",
    description: "Startup diagnostic, decision execution planning, capital readiness tools.",
    features: ["Startup diagnostic", "Decision execution planning", "Capital readiness tools"],
    cta: "Choose founder plan",
    ctaHref: "/diagnostic?role=founder",
  },
  {
    name: "Capital Partner",
    description: "Portfolio dashboards, execution visibility signals, governance reporting access.",
    features: ["Portfolio dashboards", "Execution visibility signals", "Governance reporting access"],
    cta: "Partner inquiry",
    ctaHref: "/for-partners",
  },
];

const FAQ_ITEMS = [
  { q: "What is included in the Enterprise plan?", a: "Placeholder: Enterprise plan includes decision workspace, milestone tracking, and outcome reviews." },
  { q: "How does the Founder plan work?", a: "Placeholder: Founder plan includes diagnostic, execution planning, and capital readiness tools." },
  { q: "How do Capital Partners get access?", a: "Placeholder: Access is granted through enterprise invitation. Request partner onboarding from the For Partners page." },
];

export default function PricingPage() {
  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-ink mb-4">Pricing and Plans</h1>
          <p className="text-ink-muted max-w-2xl mx-auto">
            CLEAR offers plans designed for enterprises, founders, and capital partners.
          </p>
        </div>

        {/* 3-column plan table */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="flex flex-col border-border">
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-ink-muted">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-auto">
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact sales */}
        <Card className="mb-12 border-primary/20 bg-primary-soft/20">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-ink mb-2">Contact sales</h2>
            <p className="text-sm text-ink-muted mb-4">When organizations require customized deployment.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Contact sales</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/start">Get started</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-ink mb-4">Frequently asked questions</h2>
          <Accordion className="rounded-lg border border-border bg-surface p-4">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} title={item.q} defaultOpen={i === 0}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      <NextStepCTA primaryLabel="Start diagnostic" primaryHref="/diagnostic" heading="Next step" />
    </Shell>
  );
}
