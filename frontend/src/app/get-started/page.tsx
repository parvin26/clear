"use client";

import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { getOnboardingContext, setOnboardingContext } from "@/lib/onboarding-context";

/** Map "Biggest Challenge" to the diagnostic page so user can proceed with diagnosis. */
function getDiagnosticPath(challenge: string): { path: string; label: string } {
  switch (challenge) {
    case "finance":
    case "fundraising":
      return { path: "/cfo/diagnostic", label: "Finance" };
    case "marketing":
    case "scaling":
      return { path: "/cmo/diagnostic", label: "Growth" };
    case "operations":
      return { path: "/coo/diagnostic", label: "Ops" };
    case "technology":
      return { path: "/cto/diagnostic", label: "Tech" };
    default:
      return { path: "/cfo/diagnostic", label: "Finance" };
  }
}

export default function GetStartedPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [countryError, setCountryError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    country: "",
    employees: "",
    stage: "",
    challenge: "",
  });

  // Pre-fill from localStorage (device storage) when available
  useEffect(() => {
    const ctx = getOnboardingContext();
    if (!ctx) return;
    setFormData((prev) => ({
      ...prev,
      name: ctx.name ?? prev.name,
      email: ctx.email ?? prev.email,
      phone: ctx.phone ?? prev.phone,
      company: ctx.company_name ?? prev.company,
      industry: ctx.industry ?? prev.industry,
      country: ctx.country ?? prev.country,
      employees: ctx.company_size_band ?? prev.employees,
      stage: ctx.stage ?? prev.stage,
      challenge: ctx.challenge ?? prev.challenge,
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country) {
      setCountryError("Please select a country.");
      return;
    }
    setCountryError("");
    setOnboardingContext({
      name: formData.name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company_name: formData.company || undefined,
      industry: formData.industry || undefined,
      country: formData.country || undefined,
      company_size_band: formData.employees || undefined,
      stage: formData.stage || undefined,
      challenge: formData.challenge || undefined,
    });
    setSubmitted(true);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">Get Started</h1>
          <p className="text-xl text-ink-muted">
            Take the first step toward strategic leadership
          </p>
        </div>

        {/* Quick Quiz */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick assessment</CardTitle>
            <CardDescription>
              Answer a few questions to see if Exec Connect is right for you
            </CardDescription>
            <p className="text-sm text-ink-muted mt-2">
              Fill this in once.{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
              {" or "}
              <Link href="/login" className="font-medium text-primary hover:underline">log in</Link>
              {" to save your information so you don&apos;t have to re-enter it every time you start a new diagnostic. Otherwise we&apos;ll remember it on this device for a while."}
            </p>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 py-4">
                <p className="text-ink">
                  Thanks! Your information is saved on this device. Choose your diagnostic path below.
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push("/diagnostic")}
                >
                  Continue to diagnostic (choose Founder or SME)
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-sm text-ink-muted">
                  Or go straight to a specific area:
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(getDiagnosticPath(formData.challenge || "other").path)}
                >
                  {getDiagnosticPath(formData.challenge || "other").label} diagnostic
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setSubmitted(false)}>
                  Back to form
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  placeholder="Your company name"
                />
              </div>

              <div>
                <Label>Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="f&b">Food & Beverage</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, country: value });
                    setCountryError("");
                  }}
                >
                  <SelectTrigger className={countryError ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="IE">Ireland</SelectItem>
                    <SelectItem value="KE">Kenya</SelectItem>
                    <SelectItem value="NG">Nigeria</SelectItem>
                    <SelectItem value="SG">Singapore</SelectItem>
                    <SelectItem value="ZA">South Africa</SelectItem>
                    <SelectItem value="AE">United Arab Emirates</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {countryError && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{countryError}</p>
                )}
              </div>

              <div>
                <Label>Number of Employees *</Label>
                <Select
                  value={formData.employees}
                  onValueChange={(value) => setFormData({ ...formData, employees: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 employees</SelectItem>
                    <SelectItem value="6-10">6-10 employees</SelectItem>
                    <SelectItem value="11-25">11-25 employees</SelectItem>
                    <SelectItem value="26-50">26-50 employees</SelectItem>
                    <SelectItem value="50+">50+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Business Stage *</Label>
                <RadioGroup
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="survival" id="survival" />
                    <Label htmlFor="survival">Survival (0-1 years)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stability" id="stability" />
                    <Label htmlFor="stability">Stability (1-3 years)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="success" id="success" />
                    <Label htmlFor="success">Success (3-5 years)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scale" id="scale" />
                    <Label htmlFor="scale">Scale (5+ years)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Biggest Challenge *</Label>
                <Select
                  value={formData.challenge}
                  onValueChange={(value) => setFormData({ ...formData, challenge: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your main challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Financial Management & Cash Flow</SelectItem>
                    <SelectItem value="marketing">Marketing & Customer Acquisition</SelectItem>
                    <SelectItem value="operations">Operations & Efficiency</SelectItem>
                    <SelectItem value="technology">Technology & Digitalization</SelectItem>
                    <SelectItem value="fundraising">Fundraising & Investment</SelectItem>
                    <SelectItem value="scaling">Scaling & Growth</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Your Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Submit & Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Try AI Agents First</CardTitle>
              <CardDescription>Get instant insights for free</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted mb-4">
                Start with our AI-powered CXO agents to get immediate strategic insights. 
                No commitment required.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Explore decision areas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Book Expert Review</CardTitle>
              <CardDescription>Talk to our team directly</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted mb-4">
                Schedule a free 30-minute call to discuss your needs and see how Exec Connect can help.
              </p>
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Book a Call
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

