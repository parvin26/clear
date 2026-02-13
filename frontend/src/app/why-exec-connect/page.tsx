"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, Target, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WhyExecConnectPage() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Why Exec Connect</h1>
          <p className="text-xl text-gray-600">
            The solution to SME leadership challenges
          </p>
        </div>

        {/* Problem */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl text-red-900">The Problem</CardTitle>
                <CardDescription className="text-base">
                  Why 70% of SMEs fail in their first 5 years (McKinsey)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Most SMEs struggle not because they lack capital or customers, but because they lack capable leadership. 
              The cost of hiring full-time CXOs is prohibitive, and founders often lack the strategic expertise needed 
              to navigate growth challenges effectively.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Can't afford full-time executive talent</li>
              <li>• Lack strategic guidance for key decisions</li>
              <li>• Struggle with operational scaling</li>
              <li>• Limited access to industry expertise</li>
            </ul>
          </CardContent>
        </Card>

        {/* Insight */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Lightbulb className="w-12 h-12 text-blue-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl text-blue-900">The Insight</CardTitle>
                <CardDescription className="text-base">
                  Capital alone isn't enough. You need capable leadership.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Successful SMEs combine funding with strategic leadership. Exec Connect bridges this gap by providing 
              decision diagnostics and optional expert review. This approach 
              delivers the strategic guidance you need at a fraction of the cost.
            </p>
          </CardContent>
        </Card>

        {/* Solution */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Target className="w-12 h-12 text-green-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl text-green-900">Our Solution</CardTitle>
                <CardDescription className="text-base">
                  Decision diagnostics + Execution tracking + Optional expert review
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Decision diagnostics</h4>
                <p className="text-sm text-gray-600">
                  Instant strategic insights across finance, marketing, operations, and technology
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Expert Review (Optional)</h4>
                <p className="text-sm text-gray-600">
                  Request expert review of your diagnostic when you need human judgment
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Ecosystem Support</h4>
                <p className="text-sm text-gray-600">
                  Tools, resources, and community to support your growth journey
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcomes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Proven Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">3–6x Faster</h3>
                <p className="text-gray-600">Decision-making speed with instant AI insights</p>
              </div>
              <div className="text-center">
                <Target className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">60–80%</h3>
                <p className="text-gray-600">Cost savings vs. full-time CXOs</p>
              </div>
              <div className="text-center">
                <Lightbulb className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Real Growth</h3>
                <p className="text-gray-600">Measurable business improvements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Study Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle>Success Story</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Retail Chain Turnaround</h4>
                <p className="text-gray-700 mb-4">
                  A struggling retail chain with 5 locations was losing RM15K per month. 
                  Through Exec Connect's Ops diagnostic and execution support, 
                  they optimized inventory, reduced costs, and returned to profitability in 3 months.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Before:</span>
                    <span className="font-semibold text-red-600">-RM15K/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">After:</span>
                    <span className="font-semibold text-green-600">+RM10K/month</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Savings:</span>
                    <span className="font-bold text-blue-600">RM72K saved (6 months)</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4">Key Improvements</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Optimized inventory management (30% reduction)</li>
                  <li>✓ Streamlined operations (20% efficiency gain)</li>
                  <li>✓ Renegotiated vendor contracts (15% cost reduction)</li>
                  <li>✓ Implemented better financial tracking</li>
                  <li>✓ Enhanced staff productivity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Link href="/get-started">
            <Button size="lg">
              Start Your Journey <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

