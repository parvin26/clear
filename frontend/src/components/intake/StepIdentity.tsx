"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INTAKE_COUNTRIES, INTAKE_SECTORS, ORG_SIZE_BANDS } from "@/lib/intake-constants";
import type { IntakeIdentity, OrgSizeBand } from "@/lib/intake-types";

interface StepIdentityProps {
  value: Partial<IntakeIdentity>;
  onChange: (value: Partial<IntakeIdentity>) => void;
}

export function StepIdentity({ value, onChange }: StepIdentityProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">About your organization</h2>
      <p className="text-sm text-ink-muted">
        We use this to tailor your diagnostic and keep your context in one place.
      </p>

      <div>
        <Label htmlFor="intake-org-name">Organization name *</Label>
        <Input
          id="intake-org-name"
          value={value.organization_name ?? ""}
          onChange={(e) => onChange({ ...value, organization_name: e.target.value })}
          placeholder="Your company or organization"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Country *</Label>
        <Select
          value={value.country ?? ""}
          onValueChange={(v) => onChange({ ...value, country: v })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {INTAKE_COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Sector *</Label>
        <Select
          value={value.sector ?? ""}
          onValueChange={(v) => onChange({ ...value, sector: v })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            {INTAKE_SECTORS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Team size (optional)</Label>
        <Select
          value={value.org_size_band ?? ""}
          onValueChange={(v) => onChange({ ...value, org_size_band: (v || undefined) as OrgSizeBand | undefined })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {ORG_SIZE_BANDS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="intake-email">Contact email (optional)</Label>
        <Input
          id="intake-email"
          type="email"
          value={value.contact_email ?? ""}
          onChange={(e) => onChange({ ...value, contact_email: e.target.value || undefined })}
          placeholder="you@example.com"
          className="mt-1"
        />
      </div>
    </div>
  );
}
