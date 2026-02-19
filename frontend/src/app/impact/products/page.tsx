"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getImpactProfile,
  listImpactProducts,
  createImpactProduct,
  updateImpactProduct,
  type ImpactProductOut,
  type ImpactProfileOut,
} from "@/lib/clear-api";
import { getIndicatorById } from "@/lib/impact-indicators";
import { Loader2 } from "lucide-react";

export default function ImpactProductsPage() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get("decision_id");

  const [profile, setProfile] = useState<ImpactProfileOut | null>(null);
  const [products, setProducts] = useState<ImpactProductOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formLinkedIds, setFormLinkedIds] = useState<number[]>([]);
  const [formBeneficiariesPerUnit, setFormBeneficiariesPerUnit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!decisionId) {
      setError("Missing decision_id");
      setLoading(false);
      return;
    }
    Promise.all([getImpactProfile(decisionId).catch(() => null), listImpactProducts(decisionId)])
      .then(([p, list]) => {
        setProfile(p ?? null);
        setProducts(list);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [decisionId]);

  const indicators = profile?.indicators ?? [];

  const toggleIndicator = (id: number) => {
    setFormLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)
    );
  };

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormSku("");
    setFormLinkedIds([]);
    setFormBeneficiariesPerUnit("");
  };

  const openEdit = (p: ImpactProductOut) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormSku(p.sku ?? "");
    setFormLinkedIds(p.linked_indicator_ids ?? []);
    setFormBeneficiariesPerUnit(
      p.impact_coefficients?.beneficiaries_per_unit != null
        ? String(p.impact_coefficients.beneficiaries_per_unit)
        : ""
    );
  };

  const save = async () => {
    if (!decisionId || !formName.trim()) return;
    setSaving(true);
    try {
      const bpu = formBeneficiariesPerUnit.trim()
        ? Number(formBeneficiariesPerUnit)
        : undefined;
      if (editingId != null) {
        await updateImpactProduct(editingId, {
          name: formName.trim(),
          sku: formSku.trim() || null,
          linked_indicator_ids: formLinkedIds,
          beneficiaries_per_unit: bpu ?? null,
        });
      } else {
        await createImpactProduct({
          decision_id: decisionId,
          name: formName.trim(),
          sku: formSku.trim() || null,
          linked_indicator_ids: formLinkedIds,
          beneficiaries_per_unit: bpu ?? null,
        });
      }
      const list = await listImpactProducts(decisionId);
      setProducts(list);
      setEditingId(null);
      setFormName("");
      setFormSku("");
      setFormLinkedIds([]);
      setFormBeneficiariesPerUnit("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="max-w-md mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact products</CardTitle>
              <p className="text-sm text-ink-muted">{error}</p>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={decisionId ? `/impact/dashboard?decision_id=${decisionId}` : "/impact/dashboard"}>
                  Back to dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">Impact products</h1>
          <Button variant="outline" asChild>
            <Link href={decisionId ? `/impact/dashboard?decision_id=${decisionId}` : "/impact/dashboard"}>
              Back to dashboard
            </Link>
          </Button>
        </div>
        <p className="text-sm text-ink-muted">
          Link products or services to impact indicators and set beneficiaries per unit for future accounting integration.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId != null ? "Edit product" : "Add product"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Product or service name"
              />
            </div>
            <div>
              <Label>SKU or code (optional)</Label>
              <Input
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="e.g. TRAIN-01"
              />
            </div>
            <div>
              <Label>Indicators this product affects (select 1–3)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {indicators.map((ind) => {
                  const template = getIndicatorById(ind.indicator_template_id);
                  const label = template?.name ?? ind.indicator_template_id;
                  const checked = formLinkedIds.includes(ind.id);
                  return (
                    <label key={ind.id} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleIndicator(ind.id)}
                        disabled={!checked && formLinkedIds.length >= 3}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Beneficiaries per unit</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={formBeneficiariesPerUnit}
                onChange={(e) => setFormBeneficiariesPerUnit(e.target.value)}
                placeholder="How many beneficiaries does each unit sold typically support?"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={!formName.trim() || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId != null ? "Update" : "Add"}
              </Button>
              {editingId != null && (
                <Button variant="ghost" onClick={openAdd}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Products</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-ink-muted">No products yet. Add one above.</p>
            ) : (
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.sku && <p className="text-xs text-ink-muted">SKU: {p.sku}</p>}
                      {p.impact_coefficients?.beneficiaries_per_unit != null && (
                        <p className="text-xs text-ink-muted">
                          {p.impact_coefficients.beneficiaries_per_unit} beneficiaries/unit
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
