"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IMPACT_CATEGORIES,
  METRIC_FOCUS_AREAS,
  PORTFOLIO_STAGE_OPTIONS,
  INVESTOR_NEED_OPTIONS,
  INVESTOR_SDG_THEMES,
} from "@/lib/intake-constants";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  IMPACT_CATEGORIES.map((c) => [c.value, c.label])
);
const FOCUS_LABELS: Record<string, string> = Object.fromEntries(
  METRIC_FOCUS_AREAS.map((c) => [c.value, c.label])
);
const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  PORTFOLIO_STAGE_OPTIONS.map((c) => [c.value, c.label])
);
const NEED_LABELS: Record<string, string> = Object.fromEntries(
  INVESTOR_NEED_OPTIONS.map((c) => [c.value, c.label])
);

interface SocialRow {
  created_at: string | null;
  decision_id: string | null;
  organization_name: string | null;
  country: string | null;
  sector: string | null;
  impact_categories: string[];
  metric_focus_areas: string[];
  tracking_existing: boolean | null;
  seeking_impact_capital: boolean | null;
}

interface InvestorRow {
  created_at: string | null;
  sectors: string[];
  geographies: string[];
  themes: string[];
  portfolio_stage: string;
  primary_needs: string[];
}

interface FunnelData {
  days: number;
  diagnostic_intake_started: number;
  diagnostic_role_selected: Record<string, number>;
  diagnostic_intake_completed: number;
  diagnostic_legacy_wizard_clicked: Record<string, number>;
}

interface ImpactIntakeData {
  social_enterprise: {
    count: number;
    rows: SocialRow[];
    aggregations: {
      impact_categories_frequency: Record<string, number>;
      metric_focus_areas_frequency: Record<string, number>;
      seeking_impact_capital_count: number;
      seeking_impact_capital_pct: number;
    };
  };
  investor: {
    count: number;
    rows: InvestorRow[];
    aggregations: {
      themes_frequency: Record<string, number>;
      primary_needs_frequency: Record<string, number>;
      portfolio_stage_counts: Record<string, number>;
      /** SDG 1–17 counts (additive; only present when backend supports it) */
      sdg_theme_counts?: Record<string, number>;
    };
  };
}

function ImpactIntakeContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  const allowed = !!adminKey && key === adminKey;

  const [data, setData] = useState<ImpactIntakeData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/impact-intake"),
      fetch("/api/admin/funnel?days=30"),
    ])
      .then(async ([r1, r2]) => {
        if (!r1.ok) throw new Error(r1.status === 403 ? "Forbidden" : "Failed to load");
        const impactData = await r1.json();
        const funnelData = r2.ok ? await r2.json() : null;
        return [impactData, funnelData] as [ImpactIntakeData, FunnelData | null];
      })
      .then(([impactData, funnelData]) => {
        setData(impactData);
        setFunnel(funnelData ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!adminKey) {
    return (
      <div className="min-h-screen p-6 text-ink-muted">
        <p>Set NEXT_PUBLIC_ADMIN_KEY to enable this page.</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen p-6 text-ink-muted">
        <p>Add ?key=YOUR_ADMIN_KEY to the URL to view impact intake data.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-ink-muted">No data.</p>
      </div>
    );
  }

  const { social_enterprise: se, investor: inv } = data;

  return (
    <div className="min-h-screen bg-background text-ink p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Impact &amp; Investor Intake (Internal)</h1>

      {funnel && (
        <section>
          <h2 className="text-lg font-medium mb-2">Funnel (last {funnel.days} days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="border border-border rounded p-3">
              <p className="text-ink-muted">Intake started</p>
              <p className="text-xl font-semibold">{funnel.diagnostic_intake_started}</p>
            </div>
            <div className="border border-border rounded p-3">
              <p className="text-ink-muted">Role selected</p>
              <ul className="mt-1">
                {Object.entries(funnel.diagnostic_role_selected).map(([role, n]) => (
                  <li key={role}>{role}: {n}</li>
                ))}
                {Object.keys(funnel.diagnostic_role_selected).length === 0 && <li>—</li>}
              </ul>
            </div>
            <div className="border border-border rounded p-3">
              <p className="text-ink-muted">Intake completed</p>
              <p className="text-xl font-semibold">{funnel.diagnostic_intake_completed}</p>
            </div>
            <div className="border border-border rounded p-3">
              <p className="text-ink-muted">Legacy wizard clicked</p>
              <ul className="mt-1">
                {Object.entries(funnel.diagnostic_legacy_wizard_clicked).map(([label, n]) => (
                  <li key={label}>{label}: {n}</li>
                ))}
                {Object.keys(funnel.diagnostic_legacy_wizard_clicked).length === 0 && <li>—</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-2">Social Enterprise (runs with impact_profile)</h2>
        <p className="text-sm text-ink-muted mb-4">
          Count: {se.count} · Seeking impact capital: {se.aggregations.seeking_impact_capital_count} (
          {se.aggregations.seeking_impact_capital_pct}%)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-border rounded p-3 text-sm">
            <p className="font-medium mb-1">Impact categories (frequency)</p>
            <ul className="list-disc pl-4">
              {Object.entries(se.aggregations.impact_categories_frequency)
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => (
                  <li key={id}>
                    {CATEGORY_LABELS[id] ?? id}: {n}
                  </li>
                ))}
            </ul>
          </div>
          <div className="border border-border rounded p-3 text-sm">
            <p className="font-medium mb-1">Metric focus areas (frequency)</p>
            <ul className="list-disc pl-4">
              {Object.entries(se.aggregations.metric_focus_areas_frequency)
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => (
                  <li key={id}>
                    {FOCUS_LABELS[id] ?? id}: {n}
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Org</th>
                <th className="text-left p-2">Country</th>
                <th className="text-left p-2">Sector</th>
                <th className="text-left p-2">Categories</th>
                <th className="text-left p-2">Focus areas</th>
                <th className="text-left p-2">Tracking</th>
                <th className="text-left p-2">Seeking capital</th>
              </tr>
            </thead>
            <tbody>
              {se.rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{row.organization_name ?? "—"}</td>
                  <td className="p-2">{row.country ?? "—"}</td>
                  <td className="p-2">{row.sector ?? "—"}</td>
                  <td className="p-2">
                    {(row.impact_categories || []).map((c) => CATEGORY_LABELS[c] ?? c).join(", ") || "—"}
                  </td>
                  <td className="p-2">
                    {(row.metric_focus_areas || []).map((f) => FOCUS_LABELS[f] ?? f).join(", ") || "—"}
                  </td>
                  <td className="p-2">{row.tracking_existing == null ? "—" : row.tracking_existing ? "Yes" : "No"}</td>
                  <td className="p-2">
                    {row.seeking_impact_capital == null ? "—" : row.seeking_impact_capital ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Investor profiles</h2>
        <p className="text-sm text-ink-muted mb-4">Count: {inv.count}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-border rounded p-3 text-sm">
            <p className="font-medium mb-1">Themes (frequency)</p>
            <ul className="list-disc pl-4">
              {Object.entries(inv.aggregations.themes_frequency)
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => (
                  <li key={id}>
                    {CATEGORY_LABELS[id] ?? id}: {n}
                  </li>
                ))}
            </ul>
          </div>
          <div className="border border-border rounded p-3 text-sm">
            <p className="font-medium mb-1">Primary needs (frequency)</p>
            <ul className="list-disc pl-4">
              {Object.entries(inv.aggregations.primary_needs_frequency)
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => (
                  <li key={id}>
                    {NEED_LABELS[id] ?? id}: {n}
                  </li>
                ))}
            </ul>
          </div>
          <div className="border border-border rounded p-3 text-sm">
            <p className="font-medium mb-1">Portfolio stage (counts)</p>
            <ul className="list-disc pl-4">
              {Object.entries(inv.aggregations.portfolio_stage_counts).map(([id, n]) => (
                <li key={id}>
                  {STAGE_LABELS[id] ?? id}: {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {inv.aggregations.sdg_theme_counts !== undefined ? (
          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Investor SDG focus</h3>
            <div className="overflow-x-auto border border-border rounded max-w-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">SDG</th>
                    <th className="text-right p-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {[...INVESTOR_SDG_THEMES]
                    .sort((a, b) => a.sdgNumber - b.sdgNumber)
                    .map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">SDG {s.sdgNumber} – {s.shortLabel}</td>
                        <td className="p-2 text-right">{inv.aggregations.sdg_theme_counts?.[s.id] ?? 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {Object.keys(inv.aggregations.sdg_theme_counts).length === 0 && (
              <p className="text-xs text-ink-muted mt-1">No SDG selections have been captured yet.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-muted mb-4">No SDG data yet (backend may not support sdg_theme_counts).</p>
        )}
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Sectors</th>
                <th className="text-left p-2">Geographies</th>
                <th className="text-left p-2">Themes</th>
                <th className="text-left p-2">Stage</th>
                <th className="text-left p-2">Primary needs</th>
              </tr>
            </thead>
            <tbody>
              {inv.rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{(row.sectors || []).join(", ") || "—"}</td>
                  <td className="p-2">{(row.geographies || []).join(", ") || "—"}</td>
                  <td className="p-2">
                    {(row.themes || []).map((t) => CATEGORY_LABELS[t] ?? t).join(", ") || "—"}
                  </td>
                  <td className="p-2">{STAGE_LABELS[row.portfolio_stage] ?? row.portfolio_stage ?? "—"}</td>
                  <td className="p-2">
                    {(row.primary_needs || []).map((n) => NEED_LABELS[n] ?? n).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminImpactIntakePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6 text-ink-muted">Loading…</div>}>
      <ImpactIntakeContent />
    </Suspense>
  );
}
