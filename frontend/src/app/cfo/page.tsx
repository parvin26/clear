"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CFOPage() {
  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-ink">Finance advisor</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/cfo/diagnostic">
            <Card className="premium-shadow hover:border-primary/30 transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-base">Run a diagnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">Assess your financial health.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/cfo/history">
            <Card className="premium-shadow hover:border-primary/30 transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-base">View past analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">See past analyses.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/cfo/chat">
            <Card className="premium-shadow hover:border-primary/30 transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-base">Chat with the advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">Ask financial questions.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

