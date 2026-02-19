"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  INTAKE_COUNTRIES,
  INTAKE_REGIONS,
  INVESTOR_SECTORS,
  INVESTOR_SDG_THEMES,
  PORTFOLIO_STAGE_OPTIONS,
  INVESTOR_NEED_OPTIONS,
  sdgThemesToImpactCategories,
} from "@/lib/intake-constants";
import type { InvestorProfile, InvestorNeed, InvestorThemeId, StepId } from "@/lib/intake-types";
import { Check, Search } from "lucide-react";

interface StepInvestorProfileProps {
  stepId: StepId;
  value: Partial<InvestorProfile>;
  onChange: (patch: Partial<InvestorProfile>) => void;
}

export function StepInvestorProfile({ stepId, value, onChange }: StepInvestorProfileProps) {
  const [countrySearch, setCountrySearch] = useState("");

  const sectors = value.sectors ?? [];
  const toggleSector = (s: string) => {
    const next = sectors.includes(s) ? sectors.filter((x) => x !== s) : [...sectors, s];
    onChange({ ...value, sectors: next });
  };

  const regions = value.regions ?? [];
  const toggleRegion = (r: string) => {
    const next = regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r];
    onChange({ ...value, regions: next });
  };

  const geographies = value.geographies ?? [];
  const toggleGeography = (g: string) => {
    const next = geographies.includes(g) ? geographies.filter((x) => x !== g) : [...geographies, g];
    onChange({ ...value, geographies: next });
  };

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return INTAKE_COUNTRIES;
    const q = countrySearch.trim().toLowerCase();
    return INTAKE_COUNTRIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const sdgThemes = value.sdg_themes ?? [];
  const toggleSdgTheme = (id: InvestorThemeId) => {
    const next = sdgThemes.includes(id) ? sdgThemes.filter((x) => x !== id) : [...sdgThemes, id];
    const themes = sdgThemesToImpactCategories(next);
    onChange({ ...value, sdg_themes: next, themes });
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
        <p className="text-sm text-ink-muted">Which regions, sectors, geographies, and impact themes do you focus on?</p>

        <div>
          <Label className="text-ink">Regions</Label>
          <p className="text-xs text-ink-muted mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {INTAKE_REGIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRegion(r.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  regions.includes(r.value) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-ink">Sectors</Label>
          <p className="text-xs text-ink-muted mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {INVESTOR_SECTORS.map((s) => (
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
          {sectors.includes("other") && (
            <div className="mt-2">
              <Label htmlFor="investor-other-sector" className="text-ink-muted text-xs">Other sectors (optional)</Label>
              <Input
                id="investor-other-sector"
                placeholder="e.g. specific sub-sectors"
                value={value.other_sector_notes ?? ""}
                onChange={(e) => onChange({ ...value, other_sector_notes: e.target.value || undefined })}
                className="mt-1 max-w-md"
              />
            </div>
          )}
        </div>

        <div>
          <Label className="text-ink">Geographies (countries)</Label>
          <p className="text-xs text-ink-muted mb-2">Search and select all that apply</p>
          <div className="relative rounded-lg border border-border bg-white">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden />
            <Input
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="pl-8 border-0 rounded-b-none focus-visible:ring-0"
            />
            <div className="max-h-52 overflow-y-auto p-2 space-y-1 border-t border-border">
              {filteredCountries.length === 0 ? (
                <p className="text-sm text-ink-muted py-2">No countries match your search.</p>
              ) : (
                filteredCountries.map((c) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-ink">Impact themes (select the SDGs you focus on)</Label>
          <p className="text-xs text-ink-muted mb-2">Select all that apply. Selections map to our impact categories for reporting.</p>
          <div className="grid gap-2 max-h-80 overflow-y-auto">
            {INVESTOR_SDG_THEMES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSdgTheme(s.id)}
                className={`flex items-start justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                  sdgThemes.includes(s.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="text-sm">
                  <span className="font-medium">SDG {s.sdgNumber} – {s.shortLabel}</span>
                  <span className="block text-xs text-ink-muted mt-0.5">{s.description}</span>
                </span>
                {sdgThemes.includes(s.id) && <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />}
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
