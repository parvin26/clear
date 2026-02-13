"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap, Users, Settings, Code } from "lucide-react";

export default function BookDiagnosticPage() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book a Diagnostic</h1>
          <p className="text-xl text-gray-600">
            Choose your assessment path
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl mb-2">Decision Diagnostic (General)</CardTitle>
              <CardDescription>Comprehensive 360° assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Perfect if you're unsure where to start. Our Virtual CEO analyzes your business across 
                all key areas: strategy, operations, marketing, finance, technology, and talent.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-6">
                <li>✓ Complete business health score</li>
                <li>✓ Recommended focus areas</li>
                <li>✓ Cross-functional insights</li>
              </ul>
              <Link href="/get-started">
                <Button className="w-full">
                  Start General Diagnostic <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl mb-2">Decision Areas (Finance, Ops, Growth, Tech)</CardTitle>
              <CardDescription>Focused diagnostics by area</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Choose a decision area if you know what needs attention. Get precise, 
                actionable recommendations for your specific challenge.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link href="/cfo/diagnostic" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Finance</span>
                </Link>
                <Link href="/cmo/diagnostic" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Growth</span>
                </Link>
                <Link href="/coo/diagnostic" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <Settings className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Ops</span>
                </Link>
                <Link href="/cto/diagnostic" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <Code className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">Tech</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Not Sure Which to Choose?</h3>
              <p className="text-gray-600 mb-4">
                Start with the Decision Diagnostic (General) for a complete overview, then 
                run focused diagnostics by area (Finance, Ops, Growth, Tech).
              </p>
              <Link href="/how-it-works">
                <Button variant="outline">
                  Learn More About How It Works
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

