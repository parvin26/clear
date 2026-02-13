"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NextStepCTA } from "@/components/clear-blocks";
import { ArrowUp, ArrowDown, DollarSign, TrendingUp } from "lucide-react";

/** Case study detail template: challenge, decision, milestones, outcome, lessons */
function CaseStudyDetail({
  title,
  subtitle,
  domain,
  challenge,
  solution,
  results,
  outcomeMetrics,
}: {
  title: string;
  subtitle: string;
  domain: string;
  challenge: string;
  solution: React.ReactNode;
  results: React.ReactNode;
  outcomeMetrics: { label: string; value: string; trend?: "up" | "down"; color?: string }[];
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl md:text-2xl mb-2 text-ink">{title}</CardTitle>
            <CardDescription className="text-ink-muted">{subtitle}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">{domain}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold text-ink mb-2">Enterprise challenge</h4>
          <p className="text-sm text-ink-muted">{challenge}</p>
        </div>
        <div>
          <h4 className="font-semibold text-ink mb-2">Decision taken</h4>
          <div className="text-sm text-ink-muted">{solution}</div>
        </div>
        <div>
          <h4 className="font-semibold text-ink mb-2">Execution milestones</h4>
          <p className="text-sm text-ink-muted">Structured milestones and ownership (placeholder).</p>
        </div>
        <div>
          <h4 className="font-semibold text-ink mb-2">Outcome achieved</h4>
          <div className="text-sm text-ink-muted">{results}</div>
        </div>
        {outcomeMetrics.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="font-semibold text-ink mb-3 text-sm">Outcome metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {outcomeMetrics.map((m) => (
                <div key={m.label} className={`p-3 rounded-lg ${m.color ?? "bg-surface"}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {m.trend === "down" && <ArrowDown className="h-4 w-4 text-green-600" />}
                    {m.trend === "up" && <ArrowUp className="h-4 w-4 text-blue-600" />}
                    <span className="text-xs text-ink-muted">{m.label}</span>
                  </div>
                  <span className="font-bold text-ink">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <h4 className="font-semibold text-ink mb-2">Lessons learned</h4>
          <p className="text-sm text-ink-muted">Structured decisions and governed execution produced measurable operational improvements.</p>
        </div>
      </CardContent>
    </Card>
  );
}

const CASE_STUDIES = [
  {
    id: "retail",
    title: "Retail Turnaround: RM72K Saved",
    subtitle: "5-location retail chain | 6-month engagement",
    domain: "Ops",
    challenge: "A family-owned retail chain with 5 locations was losing RM15,000 per month. High inventory costs, inefficient operations, and lack of financial visibility were threatening the business's survival.",
    solution: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Ops diagnostic identified 12 critical operational inefficiencies</li>
        <li>Fractional COO implemented inventory optimization system</li>
        <li>Renegotiated vendor contracts and improved supplier management</li>
        <li>Streamlined operations across all locations</li>
      </ul>
    ),
    results: (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <span className="text-sm">Before (Monthly Loss)</span>
          <span className="font-bold text-red-600">-RM15,000</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm">After (Monthly Profit)</span>
          <span className="font-bold text-green-600">+RM10,000</span>
        </div>
      </div>
    ),
    outcomeMetrics: [
      { label: "Inventory costs", value: "-30%", trend: "down" as const },
      { label: "Operational efficiency", value: "+20%", trend: "up" as const },
      { label: "Total savings (6 months)", value: "RM72,000" },
    ],
  },
  {
    id: "manufacturer",
    title: "Manufacturer: Cash Flow Improved by 30%",
    subtitle: "Mid-size manufacturing company | 4-month engagement",
    domain: "Finance",
    challenge: "A manufacturing company was struggling with cash flow despite having good sales. Long payment terms, high inventory levels, and poor working capital management were constraining growth.",
    solution: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Finance diagnostic analyzed cash flow patterns</li>
        <li>Implemented invoice management and collection process</li>
        <li>Optimized inventory levels based on demand forecasting</li>
        <li>Negotiated better payment terms with suppliers</li>
      </ul>
    ),
    results: (
      <div className="space-y-2">
        <div className="p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-ink-muted">Cash Flow Improvement</span>
          <span className="font-bold text-blue-600 text-xl block">+30%</span>
        </div>
      </div>
    ),
    outcomeMetrics: [
      { label: "Collection period", value: "-15 days", trend: "down" as const },
      { label: "Inventory levels", value: "-25%", trend: "down" as const },
      { label: "Working capital", value: "RM500K improved" },
    ],
  },
  {
    id: "saas",
    title: "SaaS Platform: CAC down 20%, Leads up 35%",
    subtitle: "Tech startup | 5-month engagement",
    domain: "Growth",
    challenge: "A B2B SaaS startup was spending too much on customer acquisition with low conversion rates. Marketing channels were not optimized, and there was no clear strategy for growth.",
    solution: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Growth diagnostic analyzed marketing funnel efficiency</li>
        <li>Identified high-performing channels and optimized spend</li>
        <li>Improved messaging and targeting based on data insights</li>
        <li>Implemented marketing automation and lead nurturing</li>
      </ul>
    ),
    results: (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <span className="text-xs text-ink-muted block">CAC</span>
          <span className="font-bold text-green-600 text-xl">-20%</span>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <span className="text-xs text-ink-muted block">Leads</span>
          <span className="font-bold text-blue-600 text-xl">+35%</span>
        </div>
      </div>
    ),
    outcomeMetrics: [
      { label: "Conversion rate", value: "+15%", trend: "up" as const },
      { label: "Marketing ROI", value: "+45%", trend: "up" as const },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-4">Case Studies</h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Each case shows how structured decisions and governed execution produced measurable operational improvements.
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {CASE_STUDIES.map((cs) => (
            <CaseStudyDetail
              key={cs.id}
              title={cs.title}
              subtitle={cs.subtitle}
              domain={cs.domain}
              challenge={cs.challenge}
              solution={cs.solution}
              results={cs.results}
              outcomeMetrics={cs.outcomeMetrics}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-ink-muted mb-4">Start your own diagnostic and turn your situation into a governed decision.</p>
          <Button asChild size="lg">
            <Link href="/start">Get started</Link>
          </Button>
        </div>
      </div>

      <NextStepCTA primaryLabel="Start your own diagnostic" primaryHref="/diagnostic" heading="Next step" />
    </Shell>
  );
}
