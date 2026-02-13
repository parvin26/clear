"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoOverview, type DemoEnterprise, type DemoPortfolio } from "@/lib/demo-api";
import { DemoTour } from "@/components/demo/DemoTour";
import { Building2, Briefcase, Loader2, ArrowRight } from "lucide-react";

export default function DemoPage() {
  const [enterprises, setEnterprises] = useState<DemoEnterprise[]>([]);
  const [portfolios, setPortfolios] = useState<DemoPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDemoOverview()
      .then((res) => {
        setEnterprises(res.enterprises);
        setPortfolios(res.portfolios);
      })
      .catch(() => setError("Failed to load demo data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="content-container py-10 md:py-14">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-ink">CLEAR demo</h1>
            <Badge variant="accent" className="text-xs font-semibold">
              DEMO
            </Badge>
          </div>
          <p className="text-ink-muted">
            Read-only view of the full lifecycle: situation → decision → milestones → outcome → sharing → portfolio.
          </p>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}

          <section data-demo-section="enterprises">
            <h2 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Enterprises
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {enterprises.map((ent) => (
                <Card key={ent.id} className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      <Link
                        href={`/demo/enterprise/${ent.id}`}
                        className="text-primary hover:underline"
                      >
                        {ent.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-ink-muted">
                      {ent.industry} · {ent.size} · {ent.country}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="w-fit">
                        {ent.readiness_band}
                      </Badge>
                      {ent.id === "ent-3" && (
                        <Badge variant="accent" className="w-fit text-xs">Founder-led startup</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-ink-muted">
                    <p className="line-clamp-2">{ent.summary}</p>
                    <Button variant="ghost" size="sm" className="mt-2 px-0" asChild>
                      <Link href={`/demo/enterprise/${ent.id}`}>
                        View lifecycle <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section data-demo-section="portfolios">
            <h2 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Portfolios
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolios.map((pf) => (
                <Card key={pf.id} className="premium-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      <Link
                        href="/demo/portfolio"
                        className="text-primary hover:underline"
                      >
                        {pf.portfolio_name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-ink-muted">{pf.partner_name}</p>
                  </CardHeader>
                  <CardContent className="text-sm text-ink-muted">
                    <p>
                      {pf.enterprises?.length ?? 0} enterprise
                      {(pf.enterprises?.length ?? 0) !== 1 ? "s" : ""} in portfolio
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2 px-0" asChild>
                      <Link href="/demo/portfolio">
                        View all portfolios <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-ink-muted">
            <strong className="text-ink">Read-only.</strong> This demo uses static fixtures. To create real decisions and track execution, run a diagnostic or use the main app.
          </div>
        </div>
      </div>
      <DemoTour variant="landing" />
    </Shell>
  );
}
