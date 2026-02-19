"use client";

import { Label } from "@/components/ui/label";
import { INTAKE_COUNTRIES, INTAKE_SECTORS, PORTFOLIO_STAGE_OPTIONS, INVESTOR_NEED_OPTIONS } from "@/lib/intake-constants";
import type { InvestorProfile, InvestorNeed, ImpactCategoryId, StepId } from "@/lib/intake-types";
import { IMPACT_CATEGORIES } from "@/lib/intake-constants";
import { Check } from "lucide-react";

interface StepInvestorProfileProps {
  stepId: StepId;
  value: Partial<InvestorProfile>;
  onChange: (patch: Partial<InvestorProfile>) => void;
}

export function StepInvestorProfile({ stepId, value, onChange }: StepInvestorProfileProps) {
  const sectors = value.sectors ?? [];
  const toggleSector = (s: string) => {
    const next = sectors.includes(s) ? sectors.filter((x) => x !== s) : [...sectors, s];
    onChange({ ...value, sectors: next });
  };

  const geographies = value.geographies ?? [];
  const toggleGeography = (g: string) => {
    const next = geographies.includes(g) ? geographies.filter((x) => x !== g) : [...geographies, g];
    onChange({ ...value, geographies: next });
  };

  const themes = value.themes ?? [];
  const toggleTheme = (t: ImpactCategoryId) => {
    const next = themes.includes(t) ? themes.filter((x) => x !== t) : [...themes, t];
    onChange({ ...value, themes: next });
  };

  const needs = value.primary_needs ?? [];
  const toggleNeed = (n: InvestorNeed) => {
    const next = needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n];
    onChange({ ...value, primary_needs: next });
  };

  if (stepId === "investor_thesis") {
    return (
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-ink">Investment thesis</h2>
        <p className="text-sm text-ink-muted">Which sectors, geographies, and impact themes do you focus on?</p>

        <div>
          <Label className="text-ink">Sectors</Label>
          <p className="text-xs text-ink-muted mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {INTAKE_SECTORS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSector(s.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  sectors.includes(s.value) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-ink">Geographies</Label>
          <p className="text-xs text-ink-muted mb-2">Select all that apply</p>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-white p-2 space-y-1">
            {INTAKE_COUNTRIES.map((c) => (
              <label
                key={c.value}
                className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted/50 text-sm"
              >
                <input
                  type="checkbox"
                  checked={geographies.includes(c.value)}
                  onChange={() => toggleGeography(c.value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-ink">Impact themes</Label>
          <p className="text-xs text-ink-muted mb-2">Select from the 8 impact categories</p>
          <div className="grid gap-2">
            {IMPACT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleTheme(c.value)}
                className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                  themes.includes(c.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-medium">{c.label}</span>
                {themes.includes(c.value) && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "investor_stage") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Portfolio stage</h2>
        <p className="text-sm text-ink-muted">Where are you in your investment cycle?</p>
        <div className="grid gap-2">
          {PORTFOLIO_STAGE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50"
            >
              <input
                type="radio"
                name="portfolio_stage"
                checked={(value.portfolio_stage ?? "") === o.value}
                onChange={() => onChange({ ...value, portfolio_stage: o.value as InvestorProfile["portfolio_stage"] })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{o.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "investor_needs") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Primary needs from CLEAR</h2>
        <p className="text-sm text-ink-muted">What would help you most? Select all that apply.</p>
        <div className="grid gap-2">
          {INVESTOR_NEED_OPTIONS.map((o) => {
            const need = o.value as InvestorNeed;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleNeed(need)}
                className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                  needs.includes(need) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-medium">{o.label}</span>
                {needs.includes(need) && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
