"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EcosystemPage() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">The Ecosystem</h1>
          <p className="text-xl text-ink-muted">
            Exec Connect is part of a comprehensive ecosystem supporting SME growth
          </p>
        </div>

        {/* Ecosystem Map */}
        <Card className="mb-8 bg-primary-soft/30 border border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-ink">Capital + Capability + Community</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-ink">Capital</CardTitle>
                  <CardDescription className="text-ink-muted">Access to Funding</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink">
                    Connect with Be Noor Capital for funding opportunities and investment access.
                  </p>
                </CardContent>
              </Card>
              <Card className="card-hover border-2 border-primary card-selected">
                <CardHeader>
                  <CardTitle className="text-ink">Capability</CardTitle>
                  <CardDescription className="text-ink-muted">Exec Connect - Strategic Leadership</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink">
                    The "Capability Node" - decision diagnostics and execution support.
                  </p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-ink">Community</CardTitle>
                  <CardDescription className="text-ink-muted">Decision Learning Library</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink">
                    SP Corporate - Tools, resources, and peer networks for SME growth.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Exec Connect's Role */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Exec Connect: The Capability Node</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink mb-4">
              Exec Connect serves as the strategic leadership bridge in the SME growth ecosystem. 
              We provide the capability layer that helps businesses:
            </p>
            <ul className="space-y-2 text-ink list-disc pl-5">
              <li>Make informed decisions about funding needs (connecting to Capital)</li>
              <li>Access tools and resources for self-led growth (connecting to Community)</li>
              <li>Build the strategic foundation needed for successful capital deployment</li>
              <li>Create value that attracts investment and supports sustainable growth</li>
            </ul>
          </CardContent>
        </Card>

        {/* Resource Centre */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Decision Learning Library</CardTitle>
            <CardDescription>Explore templates, tools, and reports for self-led execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Templates & guides</h4>
                <p className="text-sm text-ink-muted">
                  Downloadable guides, templates, and frameworks for common business challenges.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Masterclasses</h4>
                <p className="text-sm text-ink-muted">
                  Curated video content from industry experts on key business topics.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Peer Groups</h4>
                <p className="text-sm text-ink-muted">
                  Join communities of like-minded entrepreneurs for support and learning.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Tools & Calculators</h4>
                <p className="text-sm text-ink-muted">
                  Interactive tools for financial planning, marketing ROI, and more.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link href="/get-started">Explore Resources</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}

