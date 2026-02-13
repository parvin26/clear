"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WhoWeHelpPage() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">Who We Help</h1>
          <p className="text-xl text-ink-muted">
            Exec Connect is designed for SMEs at every stage of growth
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-ink">Early-Stage SMEs (0–3 years)</CardTitle>
              <CardDescription className="text-ink-muted">Building the foundation for growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink list-disc pl-5 mb-6">
                <li>Setting up financial systems and controls</li>
                <li>Establishing go-to-market strategies</li>
                <li>Building operational processes</li>
                <li>Preparing for fundraising</li>
              </ul>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Use case example</p>
              <p className="text-sm text-ink-muted">
                "We needed to understand our cash flow better before our first funding round. 
                The Finance diagnostic helped us create proper financial models and prepare investor-ready reports."
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-ink">Growth-Ready SMEs</CardTitle>
              <CardDescription className="text-ink-muted">Scaling operations and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink list-disc pl-5 mb-6">
                <li>Optimizing operations for scale</li>
                <li>Improving marketing ROI</li>
                <li>Managing growth capital efficiently</li>
                <li>Building scalable systems</li>
              </ul>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Use case example</p>
              <p className="text-sm text-ink-muted">
                "As we grew from 10 to 50 employees, operations became chaotic. 
                The Ops diagnostic helped us document processes and build systems that scale."
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-ink">Family Businesses & Legacy Firms</CardTitle>
              <CardDescription className="text-ink-muted">Modernizing and digitizing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink list-disc pl-5 mb-6">
                <li>Digital transformation initiatives</li>
                <li>Modernizing financial systems</li>
                <li>Improving operational efficiency</li>
                <li>Strategic planning for succession</li>
              </ul>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Use case example</p>
              <p className="text-sm text-ink-muted">
                "Our family business needed to digitize but didn't know where to start. 
                The Tech diagnostic provided a roadmap that fit our budget and timeline."
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-ink">Impact-Focused Entrepreneurs</CardTitle>
              <CardDescription className="text-ink-muted">Building sustainable businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink list-disc pl-5 mb-6">
                <li>Social impact measurement</li>
                <li>Sustainable growth strategies</li>
                <li>Community-focused marketing</li>
                <li>Balanced financial and impact goals</li>
              </ul>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Use case example</p>
              <p className="text-sm text-ink-muted">
                "We wanted to grow while maintaining our social mission. 
                Exec Connect helped us balance profit and purpose with strategic guidance."
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}

