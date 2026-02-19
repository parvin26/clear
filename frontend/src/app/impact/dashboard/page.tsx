"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getImpactProfile,
  postImpactMeasurement,
  downloadImpactReportPdf,
  emailImpactReport,
  getCompletedMilestonesReminder,
  type ImpactProfileOut,
} from "@/lib/clear-api";
import { getIndicatorById } from "@/lib/impact-indicators";
import { Loader2 } from "lucide-react";

function statusFromProgress(pct: number): "on_track" | "at_risk" | "off_track" {
  if (pct >= 80) return "on_track";
  if (pct >= 50) return "at_risk";
  return "off_track";
}

export default function ImpactDashboardPage() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decision_id");

  const [profile, setProfile] = useState<ImpactProfileOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<"idle" | "sent" | "error">("idle");
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);
  const [completedMilestonesReminder, setCompletedMilestonesReminder] = useState(0);
  const [measureInputs, setMeasureInputs] = useState<Record<number, { value: string; period: string }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!decisionId) {
      setError("Missing decision_id");
      setLoading(false);
      return;
    }
    getImpactProfile(decisionId)
      .then(setProfile)
      .catch(() => setError("No impact setup found."))
      .finally(() => setLoading(false));
  }, [decisionId]);

  useEffect(() => {
    if (!decisionId) return;
    getCompletedMilestonesReminder(decisionId).then((r) => setCompletedMilestonesReminder(r.count)).catch(() => {});
  }, [decisionId]);

  const saveMeasurement = useCallback(
    async (orgIndicatorId: number) => {
      const input = measureInputs[orgIndicatorId];
      if (!input?.value || !profile) return;
      const ind = profile.indicators.find((i) => i.id === orgIndicatorId);
      if (!ind) return;
      setSavingId(orgIndicatorId);
      try {
        let periodStart = "";
        let periodEnd = "";
        if (input.period?.trim()) {
          const parts = input.period.includes("–") ? input.period.split("–") : input.period.split("-");
          periodStart = parts[0]?.trim() ?? "";
          periodEnd = parts[1]?.trim() ?? periodStart;
        }
        if (!periodStart || !periodEnd) {
          const y = new Date().getFullYear();
          const m = new Date().getMonth() + 1;
          periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
          periodEnd = `${y}-${String(m).padStart(2, "0")}-28`;
        }
        await postImpactMeasurement({
          org_impact_indicator_id: orgIndicatorId,
          period_start: periodStart,
          period_end: periodEnd,
          value: Number(input.value),
        });
        setMeasureInputs((p) => ({ ...p, [orgIndicatorId]: { ...p[orgIndicatorId], value: "" } }));
        const updated = await getImpactProfile(decisionId!);
        setProfile(updated);
      } finally {
        setSavingId(null);
      }
    },
    [decisionId, measureInputs, profile]
  );

  if (loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </Shell>
    );
  }

  if (error || !profile) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Impact Dashboard</CardTitle>
              <p className="text-sm text-ink-muted">
                {error || "No impact setup found. Complete the setup wizard first."}
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={decisionId ? `/impact/setup?decision_id=${decisionId}` : "/diagnostic"}>
                  {decisionId ? "Complete setup" : "Go to diagnostic"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  const indicators = profile.indicators;
  const totalBeneficiariesIndicator = indicators.find(
    (i) => i.indicator_template_id === "total_beneficiaries"
  );
  const keyIndicators = indicators.slice(0, 3);
  const currentYear = new Date().getFullYear();

  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <h1 className="text-2xl font-semibold text-ink">Impact Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Tip: Start by updating 1–3 key indicators regularly. You can keep the rest simple to begin with.
        </p>
        <p className="text-sm">
          <Link
            href={decisionId ? `/impact/products?decision_id=${decisionId}` : "#"}
            className="text-primary hover:underline"
          >
            Manage impact products
          </Link>{" "}
          (link products to indicators for future accounting).
        </p>
        {completedMilestonesReminder > 0 && (
          <p className="text-sm text-amber-600">
            You have {completedMilestonesReminder} completed milestone{completedMilestonesReminder !== 1 ? "s" : ""} with no impact data logged.{" "}
            <Link href={decisionId ? `/decisions/${decisionId}` : "#"} className="underline">
              Log impact in the decision workspace
            </Link>
            .
          </p>
        )}

        {/* Hero */}
        <Card className="premium-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Your impact this year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalBeneficiariesIndicator && (
              <div>
                <p className="text-sm text-ink-muted">Total beneficiaries</p>
                <p className="text-2xl font-semibold">
                  {totalBeneficiariesIndicator.latest_value ?? 0}
                  {totalBeneficiariesIndicator.target_value != null && (
                    <span className="text-ink-muted font-normal">
                      {" "}
                      / {totalBeneficiariesIndicator.target_value} target
                    </span>
                  )}
                </p>
                {totalBeneficiariesIndicator.target_value != null &&
                  totalBeneficiariesIndicator.target_value > 0 && (
                    <div className="mt-1 h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            100,
                            (100 * (totalBeneficiariesIndicator.latest_value ?? 0)) /
                              totalBeneficiariesIndicator.target_value
                          )}%`,
                        }}
                      />
                    </div>
                  )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyIndicators.map((ind) => {
                const template = getIndicatorById(ind.indicator_template_id);
                const target = ind.target_value ?? 0;
                const value = ind.latest_value ?? 0;
                const pct = target > 0 ? (100 * value) / target : 0;
                const status = statusFromProgress(pct);
                return (
                  <div key={ind.id} className="border border-border rounded p-3">
                    <p className="text-sm font-medium">{template?.name ?? ind.indicator_template_id}</p>
                    <p className="text-lg">
                      {value} {template?.unit ?? ""}
                      {target > 0 && (
                        <span className="text-ink-muted text-sm"> / {target} target</span>
                      )}
                    </p>
                    {target > 0 && (
                      <div className="mt-1 h-1.5 bg-muted rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            status === "on_track"
                              ? "bg-green-600"
                              : status === "at_risk"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SDG tags */}
        {profile.primary_sdg_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.primary_sdg_tags.map((sdg) => (
              <span
                key={sdg}
                className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {sdg}
              </span>
            ))}
          </div>
        )}

        {/* Indicators grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {indicators.map((ind) => {
                const template = getIndicatorById(ind.indicator_template_id);
                const target = ind.target_value ?? 0;
                const value = ind.latest_value ?? 0;
                const pct = target > 0 ? (100 * value) / target : 0;
                const status = target > 0 ? statusFromProgress(pct) : null;
                return (
                  <div
                    key={ind.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{template?.name ?? ind.indicator_template_id}</p>
                      <p className="text-xs text-ink-muted">
                        Latest: {ind.latest_value ?? "—"} {template?.unit ?? ""}
                        {ind.target_value != null && ` · Target: ${ind.target_value}`}
                        {status && (
                          <span
                            className={
                              status === "on_track"
                                ? "text-green-600"
                                : status === "at_risk"
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {" "}
                            · {status === "on_track" ? "On track" : status === "at_risk" ? "At risk" : "Off track"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Value"
                        className="border border-border rounded px-2 py-1 w-24 text-sm"
                        value={measureInputs[ind.id]?.value ?? ""}
                        onChange={(e) =>
                          setMeasureInputs((p) => ({
                            ...p,
                            [ind.id]: { ...p[ind.id], value: e.target.value },
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="e.g. 2025-01–2025-03"
                        className="border border-border rounded px-2 py-1 w-32 text-sm"
                        value={measureInputs[ind.id]?.period ?? ""}
                        onChange={(e) =>
                          setMeasureInputs((p) => ({
                            ...p,
                            [ind.id]: { ...p[ind.id], period: e.target.value },
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={!measureInputs[ind.id]?.value || savingId === ind.id}
                        onClick={() => saveMeasurement(ind.id)}
                      >
                        {savingId === ind.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Report: PDF download + Email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Impact report</CardTitle>
            <p className="text-sm text-ink-muted">
              Download a PDF or email it to yourself or stakeholders.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={pdfLoading}
              onClick={async () => {
                if (!decisionId) return;
                setPdfLoading(true);
                try {
                  const blob = await downloadImpactReportPdf(decisionId);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "clear-impact-report.pdf";
                  a.click();
                  URL.revokeObjectURL(url);
                } finally {
                  setPdfLoading(false);
                }
              }}
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Download impact report (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmailModalOpen(true);
                setEmailResult("idle");
                setEmailErrorMsg(null);
              }}
            >
              Email this report
            </Button>
          </CardContent>
        </Card>

        {emailModalOpen && (
          <Card className="border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Email impact report</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEmailModalOpen(false);
                  setEmailResult("idle");
                  setEmailErrorMsg(null);
                }}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailResult === "sent" ? (
                <p className="text-sm text-green-600 font-medium">Sent! Check the recipient inbox.</p>
              ) : (
                <>
                  <div>
                    <Label htmlFor="report-email">Recipient email</Label>
                    <input
                      id="report-email"
                      type="email"
                      className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
                      placeholder="email@example.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>
                  {emailResult === "error" && emailErrorMsg && (
                    <p className="text-sm text-red-600">{emailErrorMsg}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      disabled={!emailRecipient.trim() || emailSending}
                      onClick={async () => {
                        if (!decisionId || !emailRecipient.trim()) return;
                        setEmailSending(true);
                        setEmailResult("idle");
                        setEmailErrorMsg(null);
                        try {
                          const res = await emailImpactReport(decisionId, emailRecipient.trim());
                          if (res.ok) setEmailResult("sent");
                          else {
                            setEmailResult("error");
                            setEmailErrorMsg(res.message ?? "Failed to send.");
                          }
                        } catch {
                          setEmailResult("error");
                          setEmailErrorMsg("Request failed. Try again.");
                        } finally {
                          setEmailSending(false);
                        }
                      }}
                    >
                      {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEmailModalOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
