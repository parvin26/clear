"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getImpactSeed, putImpactProfile, type ImpactProfileSeedOut } from "@/lib/clear-api";
import { IMPACT_CATEGORIES } from "@/lib/intake-constants";
import { INDICATOR_TEMPLATES, getIndicatorsByCategory } from "@/lib/impact-indicators";
import type { ImpactCategoryId } from "@/lib/intake-types";
import { Loader2 } from "lucide-react";

const SDG_OPTIONS = Array.from({ length: 17 }, (_, i) => ({
  value: `SDG ${i + 1}`,
  label: `SDG ${i + 1}`,
}));

const STEPS = ["categories", "indicators", "targets", "sdg"] as const;
type StepId = (typeof STEPS)[number];

export default function ImpactSetupPage() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decision_id");

  const [stepIndex, setStepIndex] = useState(0);
  const [seed, setSeed] = useState<ImpactProfileSeedOut | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ImpactCategoryId[]>([]);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<Record<string, { value?: number; year?: number }>>({});
  const [primarySdgTags, setPrimarySdgTags] = useState<string[]>([]);
  const [theoryOfChange, setTheoryOfChange] = useState({
    problem: "",
    solution: "",
    beneficiaries: "",
    change_sought: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!decisionId) {
      setSeedError("Missing decision_id");
      return;
    }
    getImpactSeed(decisionId)
      .then((s) => {
        setSeed(s);
        setCategories((s.categories as ImpactCategoryId[]) || []);
      })
      .catch((e) => {
        setSeedError(e?.response?.status === 404 ? "Complete the Social Enterprise diagnostic first." : "Could not load setup.");
      });
  }, [decisionId]);

  const recommendedIndicators = categories.length
    ? getIndicatorsByCategory(categories)
    : INDICATOR_TEMPLATES;
  const selectedIndicators = recommendedIndicators.filter((t) => selectedIndicatorIds.has(t.id));

  const canNextCategories = categories.length >= 2 && categories.length <= 4;
  const canNextIndicators = selectedIndicatorIds.size >= 5 && selectedIndicatorIds.size <= 10;
  const canNextSdg = primarySdgTags.length >= 2 && primarySdgTags.length <= 5;

  const handleToggleCategory = (id: ImpactCategoryId) => {
    setCategories((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      return next.length <= 4 ? next : prev;
    });
  };

  const handleToggleIndicator = (id: string) => {
    setSelectedIndicatorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!decisionId) return;
    setSubmitting(true);
    try {
      await putImpactProfile({
        decision_id: decisionId,
        impact_categories: categories,
        primary_sdg_tags: primarySdgTags,
        theory_of_change: theoryOfChange,
        indicators: selectedIndicators.map((t) => ({
          indicator_template_id: t.id,
          target_value: targets[t.id]?.value ?? null,
          target_year: targets[t.id]?.year ?? new Date().getFullYear(),
        })),
      });
      setComplete(true);
    } finally {
      setSubmitting(false);
    }
  }, [decisionId, categories, primarySdgTags, theoryOfChange, selectedIndicators, targets]);

  if (seedError || !decisionId) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Impact Setup</CardTitle>
              <p className="text-sm text-ink-muted">
                {seedError || "We'll unlock this once you complete the Social Enterprise diagnostic."}
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/diagnostic">Go to diagnostic</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  if (!seed) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </Shell>
    );
  }

  if (complete) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Your impact dashboard is ready</CardTitle>
              <p className="text-sm text-ink-muted">
                You can now track indicators and generate reports.
              </p>
              <ul className="text-sm text-ink-muted list-disc pl-4 mt-2 space-y-1">
                <li>Update metrics monthly</li>
                <li>Generate reports for your board or investors</li>
                <li>Log impact-related milestones as you execute decisions</li>
              </ul>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/impact/dashboard?decision_id=${decisionId}`}>Open dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  const step = STEPS[stepIndex];
  const currentStepLabel = stepIndex + 1;
  const totalSteps = STEPS.length;

  return (
    <Shell>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-ink">
          Pilot mode: This is the first version of CLEAR&apos;s impact setup. Your feedback helps shape the product.
        </div>
        <h1 className="text-2xl font-semibold text-ink mb-2">Impact Setup</h1>
        <p className="text-sm text-ink-muted mb-6">
          Step {currentStepLabel} of {totalSteps}
        </p>

        {step === "categories" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confirm impact categories</CardTitle>
              <p className="text-sm text-ink-muted">
                Keep or adjust your 2–4 categories from the diagnostic.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {IMPACT_CATEGORIES.map((c) => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(c.value as ImpactCategoryId)}
                    onChange={() => handleToggleCategory(c.value as ImpactCategoryId)}
                    className="rounded border-border"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
              {!canNextCategories && categories.length > 0 && (
                <p className="text-sm text-amber-600">Select between 2 and 4 categories.</p>
              )}
            </CardContent>
          </Card>
        )}

        {step === "indicators" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose indicators</CardTitle>
              <p className="text-sm text-ink-muted">
                Select 5–10 indicators (grouped by your categories). Shown: {selectedIndicatorIds.size}/10
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from(
                new Set(recommendedIndicators.map((i) => i.category_id)) as Set<ImpactCategoryId>
              ).map((catId) => {
                const label = IMPACT_CATEGORIES.find((c) => c.value === catId)?.label ?? catId;
                const list = recommendedIndicators.filter((i) => i.category_id === catId);
                return (
                  <div key={catId}>
                    <p className="font-medium text-sm text-ink-muted mb-2">{label}</p>
                    <ul className="space-y-2">
                      {list.map((t) => (
                        <li key={t.id}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIndicatorIds.has(t.id)}
                              onChange={() => handleToggleIndicator(t.id)}
                              className="rounded border-border"
                            />
                            <span className="text-sm">{t.name}</span>
                            <span className="text-xs text-ink-muted">({t.unit}, {t.default_frequency})</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!canNextIndicators && selectedIndicatorIds.size > 0 && (
                <p className="text-sm text-amber-600">Select between 5 and 10 indicators.</p>
              )}
            </CardContent>
          </Card>
        )}

        {step === "targets" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set annual targets</CardTitle>
              <p className="text-sm text-ink-muted">
                Optional: target value and year for each indicator.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedIndicators.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2">
                  <Label className="w-full md:w-48 shrink-0">{t.name} ({t.unit})</Label>
                  <input
                    type="number"
                    placeholder="Target"
                    className="border border-border rounded px-2 py-1 w-24"
                    value={targets[t.id]?.value ?? ""}
                    onChange={(e) =>
                      setTargets((prev) => ({
                        ...prev,
                        [t.id]: { ...prev[t.id], value: e.target.value ? Number(e.target.value) : undefined },
                      }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Year"
                    className="border border-border rounded px-2 py-1 w-20"
                    value={targets[t.id]?.year ?? new Date().getFullYear()}
                    onChange={(e) =>
                      setTargets((prev) => ({
                        ...prev,
                        [t.id]: { ...prev[t.id], year: e.target.value ? Number(e.target.value) : undefined },
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {step === "sdg" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SDG tags and Theory of Change</CardTitle>
              <p className="text-sm text-ink-muted">
                Select 2–5 SDGs. Optionally describe your theory of change.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary SDG tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SDG_OPTIONS.map((sdg) => (
                    <label key={sdg.value} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={primarySdgTags.includes(sdg.value)}
                        onChange={() =>
                          setPrimarySdgTags((prev) =>
                            prev.includes(sdg.value)
                              ? prev.filter((x) => x !== sdg.value)
                              : prev.length < 5
                                ? [...prev, sdg.value]
                                : prev
                          )
                        }
                        className="rounded border-border"
                      />
                      {sdg.label}
                    </label>
                  ))}
                </div>
              </div>
              {!canNextSdg && primarySdgTags.length > 0 && (
                <p className="text-sm text-amber-600">Select between 2 and 5 SDGs.</p>
              )}
              <div className="grid gap-2">
                <Label>Problem</Label>
                <textarea
                  className="border border-border rounded p-2 min-h-[80px]"
                  placeholder="Optional"
                  value={theoryOfChange.problem}
                  onChange={(e) => setTheoryOfChange((p) => ({ ...p, problem: e.target.value }))}
                />
                <Label>Solution</Label>
                <textarea
                  className="border border-border rounded p-2 min-h-[80px]"
                  placeholder="Optional"
                  value={theoryOfChange.solution}
                  onChange={(e) => setTheoryOfChange((p) => ({ ...p, solution: e.target.value }))}
                />
                <Label>Beneficiaries</Label>
                <textarea
                  className="border border-border rounded p-2 min-h-[80px]"
                  placeholder="Optional"
                  value={theoryOfChange.beneficiaries}
                  onChange={(e) => setTheoryOfChange((p) => ({ ...p, beneficiaries: e.target.value }))}
                />
                <Label>Change sought</Label>
                <textarea
                  className="border border-border rounded p-2 min-h-[80px]"
                  placeholder="Optional"
                  value={theoryOfChange.change_sought}
                  onChange={(e) => setTheoryOfChange((p) => ({ ...p, change_sought: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => i - 1)}
          >
            Back
          </Button>
          {stepIndex < totalSteps - 1 ? (
            <Button
              disabled={
                (step === "categories" && !canNextCategories) ||
                (step === "indicators" && !canNextIndicators) ||
                (step === "sdg" && !canNextSdg)
              }
              onClick={() => setStepIndex((i) => i + 1)}
            >
              Next
            </Button>
          ) : (
            <Button disabled={submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete setup"}
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}
