"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { IMPACT_CATEGORIES, METRIC_FOCUS_AREAS } from "@/lib/intake-constants";
import type { ImpactProfileSeed, ImpactCategoryId, MetricFocusArea, StepId } from "@/lib/intake-types";
import { Check } from "lucide-react";

interface StepImpactAddOnProps {
  stepId: StepId;
  value: Partial<ImpactProfileSeed>;
  onChange: (patch: Partial<ImpactProfileSeed>) => void;
}

const MIN_CATEGORIES = 2;
const MAX_CATEGORIES = 4;

export function StepImpactAddOn({ stepId, value, onChange }: StepImpactAddOnProps) {
  const categories = value.categories ?? [];
  const toggleCategory = (id: ImpactCategoryId) => {
    const next = categories.includes(id)
      ? categories.filter((c) => c !== id)
      : categories.length >= MAX_CATEGORIES
        ? categories
        : [...categories, id];
    onChange({ ...value, categories: next });
  };

  const focusAreas = value.metric_focus_areas ?? [];
  const toggleFocusArea = (id: MetricFocusArea) => {
    const next = focusAreas.includes(id)
      ? focusAreas.filter((f) => f !== id)
      : [...focusAreas, id];
    onChange({ ...value, metric_focus_areas: next });
  };

  if (stepId === "impact_categories") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What change do you create in the world?</h2>
        <p className="text-sm text-ink-muted">Select 2–4 areas that best describe your impact focus.</p>
        <div className="grid gap-2">
          {IMPACT_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleCategory(c.value)}
              className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                categories.includes(c.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-sm font-medium">{c.label}</span>
              {categories.includes(c.value) && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
            </button>
          ))}
        </div>
        {categories.length > 0 && categories.length < MIN_CATEGORIES && (
          <p className="text-xs text-ink-muted">Select at least {MIN_CATEGORIES} categories.</p>
        )}
      </div>
    );
  }

  if (stepId === "impact_metric_focus") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What types of metrics matter most to you right now?</h2>
        <p className="text-sm text-ink-muted">We&apos;ll use this to recommend indicators later.</p>
        <div className="grid gap-2">
          {METRIC_FOCUS_AREAS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => toggleFocusArea(m.value)}
              className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                focusAreas.includes(m.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-sm font-medium">{m.label}</span>
              {focusAreas.includes(m.value) && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "impact_tracking") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Are you already tracking impact data today?</h2>
        <div className="flex gap-4">
          {([true, false] as const).map((opt) => (
            <label key={String(opt)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="impact_tracking"
                checked={(value.tracking_existing ?? false) === opt}
                onChange={() => onChange({ ...value, tracking_existing: opt })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{opt ? "Yes" : "No"}</span>
            </label>
          ))}
        </div>
        <div>
          <Label htmlFor="impact-tracking-notes">How are you tracking it? (optional)</Label>
          <div className="flex gap-2 items-start mt-1">
            <Textarea
              id="impact-tracking-notes"
              placeholder="e.g. spreadsheets, impact software, annual survey"
              value={value.tracking_notes ?? ""}
              onChange={(e) => onChange({ ...value, tracking_notes: e.target.value || undefined })}
              rows={3}
              className="resize-none flex-1"
            />
            <VoiceInputButton
              onTranscription={(text) =>
                onChange({
                  ...value,
                  tracking_notes:
                    (value.tracking_notes ?? "") + (value.tracking_notes ? " " : "") + text,
                })
              }
              beforeText={value.tracking_notes ?? ""}
              aria-label="Speak to describe how you track impact"
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "impact_capital") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">
          Are you seeking impact capital in the next 12–24 months?
        </h2>
        <div className="flex gap-4">
          {([true, false] as const).map((opt) => (
            <label key={String(opt)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="impact_capital"
                checked={(value.seeking_impact_capital ?? false) === opt}
                onChange={() => onChange({ ...value, seeking_impact_capital: opt })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{opt ? "Yes" : "No"}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
