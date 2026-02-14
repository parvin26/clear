"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOMAIN_LABELS: Record<string, string> = {
  cfo: "Finance",
  cmo: "Growth",
  coo: "Operations",
  cto: "Technology",
};

const TYPE_LABELS: Record<string, string> = {
  checklist: "Checklist",
  article: "Article",
  template: "Template",
  video: "Video",
};

type ResourceType = "checklist" | "article" | "template" | "video";

const PLAYBOOKS: {
  id: string;
  title: string;
  domain: string;
  type: ResourceType;
  description: string;
  available: boolean;
}[] = [
  { id: "cash-flow-basics", title: "Set up a weekly cash board", domain: "cfo", type: "checklist", description: "Track and forecast cash in one place.", available: true },
  { id: "financial-controls-sme", title: "Financial controls checklist", domain: "cfo", type: "checklist", description: "Essential controls for SMEs.", available: true },
  { id: "lead-generation-sme", title: "Lead generation for SMEs", domain: "cmo", type: "article", description: "Practical lead gen tactics.", available: true },
  { id: "process-standardization", title: "Process standardization", domain: "coo", type: "template", description: "Document and standardize key processes.", available: true },
  { id: "tech-roadmap-sme", title: "Technology roadmap for SMEs", domain: "cto", type: "article", description: "Plan your tech stack step by step.", available: true },
  { id: "getting-started", title: "Getting started with CLEAR", domain: "coo", type: "checklist", description: "Overview and next steps.", available: true },
];

function ResourcesContent() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decision_id") ?? "";
  const primaryDomainParam = searchParams.get("primary_domain") ?? "";
  const [domainFilter, setDomainFilter] = useState(primaryDomainParam || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (primaryDomainParam) setDomainFilter(primaryDomainParam);
  }, [primaryDomainParam]);

  const domainLabel = DOMAIN_LABELS[primaryDomainParam] || "Operations";
  const filtered = PLAYBOOKS.filter((p) => {
    const domainOk = domainFilter === "all" || p.domain === domainFilter;
    const typeOk = typeFilter === "all" || p.type === typeFilter;
    return domainOk && typeOk;
  });

  return (
    <Shell>
      <div className="min-h-screen flex flex-col py-12 bg-background">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col space-y-6">
          <div className="flex items-center gap-4">
            {decisionId ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/diagnostic/result/${decisionId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to result
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/diagnostic"><ArrowLeft className="mr-2 h-4 w-4" /> Diagnostic</Link>
              </Button>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-ink">
            Playbooks and resources for this decision
          </h1>
          {decisionId && primaryDomainParam && (
            <p className="text-ink-muted text-sm">
              Based on your decision in {domainLabel}, we recommend starting here.
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium text-ink-muted block mb-1">Domain</label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All domains</SelectItem>
                  {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted block mb-1">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-ink-muted text-sm">
                  We&apos;re adding more resources for this type of decision. For now, use the AI advisor or human review to get contextual help.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button asChild size="sm">
                    <Link href={decisionId ? `/decisions/${decisionId}?tab=chat` : "/diagnostic"}>Open AI advisor</Link>
                  </Button>
                  {decisionId && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/human-review?decision_id=${decisionId}`}>Request human review</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {filtered.map((p) => (
                <Card key={p.id} className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <p className="text-xs text-ink-muted">
                      {TYPE_LABELS[p.type]} · {DOMAIN_LABELS[p.domain]}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-ink-muted mb-3">{p.description}</p>
                    {p.available ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href="/start">Get started</Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-muted">Coming soon</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading…</div>
        </div>
      </Shell>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
